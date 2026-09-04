"use client";

import { useState } from "react";
import { JobMatch } from "@/types";
import { buildLinkedInPeopleSearchUrl } from "@/lib/linkedin";
import { useAppliedJobs } from "@/lib/appliedJobs";

interface JobCardProps {
  job: JobMatch;
  alumniOrg?: string;
  alumniSchool?: string;
}

function ScoreGauge({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const color =
    score >= 80
      ? { stroke: "#34d399", text: "text-emerald-400", bg: "bg-emerald-400/10" }
      : score >= 60
      ? { stroke: "#fbbf24", text: "text-amber-400", bg: "bg-amber-400/10" }
      : { stroke: "#f87171", text: "text-red-400", bg: "bg-red-400/10" };

  return (
    <div
      className={`relative flex-shrink-0 w-16 h-16 rounded-full ${color.bg} flex items-center justify-center`}
    >
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 72 72">
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-slate-700"
        />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke={color.stroke}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <div className="relative z-10 text-center">
        <span className={`text-sm font-bold leading-none ${color.text}`}>{score}</span>
      </div>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const normalized = source.toLowerCase();
  let style = "bg-slate-700/60 text-slate-400 border-slate-600";

  if (normalized.includes("linkedin")) {
    style = "bg-blue-500/10 text-blue-400 border-blue-500/30";
  } else if (normalized.includes("indeed")) {
    style = "bg-violet-500/10 text-violet-400 border-violet-500/30";
  } else if (normalized.includes("glassdoor")) {
    style = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  } else if (normalized.includes("ziprecruiter")) {
    style = "bg-orange-500/10 text-orange-400 border-orange-500/30";
  }

  return (
    <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${style}`}>
      {source}
    </span>
  );
}

export default function JobCard({ job, alumniOrg, alumniSchool }: JobCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { isApplied, toggleApplied } = useAppliedJobs();
  const applied = isApplied(job.url);

  const hasAlumniSearch = Boolean(alumniOrg?.trim() || alumniSchool?.trim());
  const alumniLabel = alumniOrg?.trim() || alumniSchool?.trim() || "";

  const descriptionPreview =
    job.description.length > 150 && !expanded
      ? job.description.slice(0, 150).trimEnd() + "..."
      : job.description;

  const hasSalary = job.salary_min != null || job.salary_max != null;

  const formatSalary = (val: number) => {
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}`;
  };

  return (
    <div
      className={`group rounded-2xl border transition-all duration-200 hover:shadow-lg hover:shadow-black/20 overflow-hidden animate-slide-up ${
        applied
          ? "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/60"
          : "border-slate-700 bg-slate-800/60 hover:bg-slate-800 hover:border-slate-600"
      }`}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <ScoreGauge score={job.match_score} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="text-slate-100 font-semibold text-base leading-tight group-hover:text-indigo-300 transition-colors">
                  {job.title}
                </h3>
                <p className="text-slate-300 text-sm mt-0.5 font-medium">{job.company}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {applied && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 text-xs font-medium">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Applied
                  </span>
                )}
                <SourceBadge source={job.source} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
              <div className="flex items-center gap-1 text-slate-400 text-xs">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {job.location}
              </div>

              <span className="text-slate-400 text-xs">
                {job.work_arrangement === "onsite"
                  ? "On-site"
                  : job.work_arrangement.charAt(0).toUpperCase() +
                    job.work_arrangement.slice(1)}
              </span>

              {hasSalary && (
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {job.salary_min && job.salary_max
                    ? `${formatSalary(job.salary_min)} – ${formatSalary(job.salary_max)}`
                    : job.salary_min
                    ? `From ${formatSalary(job.salary_min)}`
                    : `Up to ${formatSalary(job.salary_max!)}`}
                </div>
              )}

              {job.date_posted && (
                <span className="text-slate-500 text-xs">{job.date_posted}</span>
              )}
            </div>
          </div>
        </div>

        {job.description && (
          <div className="mt-4">
            <p className="text-slate-400 text-sm leading-relaxed">{descriptionPreview}</p>
            {job.description.length > 150 && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-indigo-400 hover:text-indigo-300 text-xs font-medium mt-1"
              >
                {expanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}

        {job.match_reasons.length > 0 && (
          <div className="mt-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3.5 space-y-1.5">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              Why you&apos;re a match
            </p>
            {job.match_reasons.map((reason, i) => (
              <div key={i} className="flex items-start gap-2">
                <svg
                  className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-slate-300 text-xs leading-snug">{reason}</span>
              </div>
            ))}
          </div>
        )}

        {job.missing_skills.length > 0 && (
          <div className="mt-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3.5 space-y-1.5">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              Skills to develop
            </p>
            <div className="flex flex-wrap gap-1.5">
              {job.missing_skills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block flex-shrink-0" />
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-3.5 border-t border-slate-700/60 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          Match score:{" "}
          <span
            className={`font-semibold ${
              job.match_score >= 80
                ? "text-emerald-400"
                : job.match_score >= 60
                ? "text-amber-400"
                : "text-red-400"
            }`}
          >
            {job.match_score}/100
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          <button
            type="button"
            onClick={() => toggleApplied(job.url)}
            aria-pressed={applied}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              applied
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
                : "bg-slate-700/40 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
            }`}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {applied ? "Applied" : "Mark as Applied"}
          </button>
          {hasAlumniSearch && (
            <a
              href={buildLinkedInPeopleSearchUrl({
                organization: alumniOrg,
                school: alumniSchool,
                company: job.company,
              })}
              target="_blank"
              rel="noopener noreferrer"
              title={`Search LinkedIn for ${alumniLabel} connections at ${job.company}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 hover:text-blue-200 text-xs font-semibold transition-all"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              Find {alumniLabel}
            </a>
          )}
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 hover:text-indigo-200 text-xs font-semibold transition-all"
          >
            View Job
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
