import json
import logging
import os
import re
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List

import anthropic

from models import JobMatch

logger = logging.getLogger(__name__)

# Number of jobs to send per Claude API call. Larger batches mean fewer calls,
# which amortizes the repeated system-prompt/resume overhead across more jobs.
BATCH_SIZE = 10

# Output budget per batch call. Each job needs ~150-200 tokens for its score,
# reasons, and missing skills, so this scales with BATCH_SIZE.
MAX_OUTPUT_TOKENS = 4096

# Model used for job scoring. Haiku 4.5 is ~3x cheaper than Sonnet 4.6 on both
# input and output for this kind of structured classification task. Override
# via env var to A/B against a different model without a code change.
MATCHING_MODEL = os.getenv("JOB_MATCHING_MODEL", "claude-haiku-4-5-20251001")

# Truncate job descriptions to keep token usage manageable
MAX_DESCRIPTION_CHARS = 2000

SYSTEM_PROMPT = """You are an expert technical recruiter and career coach specializing in matching
candidates to software engineering and technology roles. Your task is to analyze a candidate's
resume against job postings and rate how well each job fits the candidate.

Evaluate based on:
- Technical skills alignment (programming languages, frameworks, tools) — weight required/core
  skills much more heavily than "nice to have" or preferred extras
- Years of experience match — a reasonable range around the target level counts as a match, not
  only an exact match
- Job title/seniority alignment — related or adjacent titles should score well, not just identical
  titles
- Industry or domain relevance
- Educational requirements — treat as a soft signal unless the posting explicitly requires it

Score the way an optimistic recruiter would when deciding whether to pass a resume along, not the
way a strict gatekeeper would. Use this rubric as your anchor:
- 85-100: Excellent fit — strong alignment on required skills, experience level, and role
- 70-84: Good fit — meets most requirements; gaps are limited to nice-to-haves
- 50-69: Moderate fit — meets some core requirements but has real gaps
- Below 50: Poor fit — wrong discipline, wildly mismatched seniority, or missing multiple required
  skills

A candidate missing a few preferred (non-required) skills but otherwise strong should still land in
the 70-90 range — don't let individual missing keywords drag down an otherwise good match. Give
credit for transferable and adjacent experience rather than requiring an exact keyword match. Focus
on technical and professional fit, not soft skills."""


def _truncate_description(description: str) -> str:
    """Truncate job description to MAX_DESCRIPTION_CHARS characters."""
    if not description:
        return ""
    description = description.strip()
    if len(description) <= MAX_DESCRIPTION_CHARS:
        return description
    return description[:MAX_DESCRIPTION_CHARS] + "..."


def _build_batch_prompt(resume_text: str, jobs_batch: List[dict]) -> str:
    """Build the user prompt for a batch of jobs."""
    jobs_text = ""
    for i, job in enumerate(jobs_batch, 1):
        title = job.get("title", "Unknown Title")
        company = job.get("company", "Unknown Company")
        location = job.get("location", "Unknown Location")
        description = _truncate_description(job.get("description", ""))
        salary_info = ""
        if job.get("min_amount") or job.get("max_amount"):
            salary_info = f"\nSalary: ${job.get('min_amount', '?'):,} - ${job.get('max_amount', '?'):,}"

        jobs_text += f"""
JOB {i}:
Title: {title}
Company: {company}
Location: {location}{salary_info}
Description:
{description}
---
"""

    prompt = f"""Given the following candidate resume, rate each job's fit on a scale of 0-100.

CANDIDATE RESUME:
{resume_text[:3000]}

{jobs_text}

For each job, respond with a JSON array where each element has:
- "index": the job number (1-based)
- "score": integer 0-100 representing fit percentage
- "reasons": array of exactly 3 strings explaining why this job is a good match
- "missing": array of up to 3 strings listing key skills or requirements the candidate lacks

Respond ONLY with a valid JSON array, no other text. Example format:
[
  {{
    "index": 1,
    "score": 85,
    "reasons": ["Strong Python experience matches job requirements", "5 years experience aligns with senior role", "AWS experience directly relevant"],
    "missing": ["Kubernetes experience preferred", "Go language listed as nice-to-have"]
  }}
]"""
    return prompt


def _parse_claude_response(response_text: str, jobs_batch: List[dict]) -> List[dict]:
    """Parse Claude's JSON response and return list of match data dicts."""
    # Strip markdown code fences if present
    text = response_text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    text = text.strip()

    try:
        results = json.loads(text)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse Claude response as JSON: %s\nResponse was: %s", exc, text[:500])
        # Return neutral defaults so the job still appears in results
        return [
            {"index": i + 1, "score": 50, "reasons": ["Unable to analyze"], "missing": []}
            for i in range(len(jobs_batch))
        ]

    if not isinstance(results, list):
        logger.error("Claude returned non-list JSON: %s", type(results))
        return [
            {"index": i + 1, "score": 50, "reasons": ["Unable to analyze"], "missing": []}
            for i in range(len(jobs_batch))
        ]

    return results


def _score_batch(client: anthropic.Anthropic, resume_text: str, jobs_batch: List[dict]) -> List[JobMatch]:
    """Send a batch of jobs to Claude and return scored JobMatch objects."""
    prompt = _build_batch_prompt(resume_text, jobs_batch)

    try:
        response = client.messages.create(
            model=MATCHING_MODEL,
            max_tokens=MAX_OUTPUT_TOKENS,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        response_text = ""
        for block in response.content:
            if block.type == "text":
                response_text = block.text
                break
    except anthropic.APIError as exc:
        logger.error("Claude API error for batch: %s", exc)
        response_text = "[]"

    parsed_results = _parse_claude_response(response_text, jobs_batch)

    # Build a lookup by 1-based index
    results_by_index = {r.get("index"): r for r in parsed_results if isinstance(r, dict)}

    job_matches = []
    for i, job in enumerate(jobs_batch, 1):
        result = results_by_index.get(i, {})
        score = float(result.get("score", 50))
        # Clamp to 0-100
        score = max(0.0, min(100.0, score))

        reasons = result.get("reasons", [])
        if not isinstance(reasons, list):
            reasons = []
        reasons = [str(r) for r in reasons[:3]]

        missing = result.get("missing", [])
        if not isinstance(missing, list):
            missing = []
        missing = [str(m) for m in missing[:3]]

        # Convert salary fields
        salary_min = job.get("min_amount")
        salary_max = job.get("max_amount")
        if salary_min is not None:
            try:
                salary_min = float(salary_min)
            except (TypeError, ValueError):
                salary_min = None
        if salary_max is not None:
            try:
                salary_max = float(salary_max)
            except (TypeError, ValueError):
                salary_max = None

        job_match = JobMatch(
            id=str(job.get("id") or uuid.uuid4()),
            title=str(job.get("title") or ""),
            company=str(job.get("company") or ""),
            location=str(job.get("location") or ""),
            description=str(job.get("description") or "")[:5000],
            url=str(job.get("url") or ""),
            source=str(job.get("source") or ""),
            work_arrangement=str(job.get("arrangement") or "onsite"),
            date_posted=str(job.get("date_posted")) if job.get("date_posted") else None,
            salary_min=salary_min,
            salary_max=salary_max,
            match_score=score,
            match_reasons=reasons,
            missing_skills=missing,
        )
        job_matches.append(job_match)

    return job_matches


def match_jobs(resume_text: str, jobs: List[dict]) -> List[JobMatch]:
    """
    Score each job's fit against the resume using Claude AI.

    Processes jobs in batches of BATCH_SIZE, using a thread pool to send
    multiple batches concurrently.

    Args:
        resume_text: The raw text of the candidate's resume.
        jobs: List of job dicts from the scraper.

    Returns:
        List of JobMatch objects sorted by match_score descending.
    """
    if not jobs:
        logger.info("No jobs to match.")
        return []

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable is not set.")

    client = anthropic.Anthropic(api_key=api_key)

    # Split jobs into batches
    batches = []
    for i in range(0, len(jobs), BATCH_SIZE):
        batches.append(jobs[i : i + BATCH_SIZE])

    logger.info("Matching %d jobs in %d batches of up to %d", len(jobs), len(batches), BATCH_SIZE)

    all_matches: List[JobMatch] = []

    # Use a thread pool to process batches concurrently (max 3 concurrent requests)
    max_workers = min(3, len(batches))
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_batch = {
            executor.submit(_score_batch, client, resume_text, batch): batch
            for batch in batches
        }
        for future in as_completed(future_to_batch):
            batch = future_to_batch[future]
            try:
                matches = future.result()
                all_matches.extend(matches)
                logger.info("Batch of %d jobs scored successfully.", len(matches))
            except Exception as exc:
                logger.error("Batch scoring failed: %s", exc)
                # Add neutral fallbacks so the jobs still appear
                for job in batch:
                    all_matches.append(
                        JobMatch(
                            id=str(job.get("id") or uuid.uuid4()),
                            title=str(job.get("title") or ""),
                            company=str(job.get("company") or ""),
                            location=str(job.get("location") or ""),
                            description=str(job.get("description") or "")[:5000],
                            url=str(job.get("url") or ""),
                            source=str(job.get("source") or ""),
                            work_arrangement=str(job.get("arrangement") or "onsite"),
                            date_posted=str(job.get("date_posted")) if job.get("date_posted") else None,
                            salary_min=None,
                            salary_max=None,
                            match_score=50.0,
                            match_reasons=["Analysis unavailable"],
                            missing_skills=[],
                        )
                    )

    # Sort by match_score descending
    all_matches.sort(key=lambda m: m.match_score, reverse=True)
    logger.info("Returning %d scored job matches.", len(all_matches))
    return all_matches
