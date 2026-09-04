"use client";

import { useState } from "react";
import ResumeUpload from "@/components/ResumeUpload";
import SearchForm from "@/components/SearchForm";
import LoadingState from "@/components/LoadingState";
import JobResults from "@/components/JobResults";
import { AppStep, ParsedResume, SearchConfig, SearchResponse } from "@/types";

export default function Home() {
  const [step, setStep] = useState<AppStep>("upload");
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUploadComplete = (resume: ParsedResume) => {
    setParsedResume(resume);
    setStep("search");
  };

  const handleSearch = async (config: SearchConfig) => {
    if (!parsedResume) return;
    setError(null);
    setStep("loading");

    try {
      const remoteOnly =
        config.workArrangements.length === 1 && config.workArrangements[0] === "remote";

      const body = {
        resume_text: parsedResume.raw_text,
        job_title: config.jobTitle || undefined,
        location: remoteOnly ? undefined : config.location || undefined,
        work_arrangements:
          config.workArrangements.length > 0 ? config.workArrangements : undefined,
        min_salary: config.minSalary ?? undefined,
        job_type: config.jobType ?? undefined,
        distance: config.distance,
        hours_old: config.hoursOld,
        num_results: config.numResults,
      };

      const response = await fetch("/api/search-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Server error: ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      setSearchResponse(data);
      setStep("results");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Job search failed. Please try again."
      );
      setStep("search");
    }
  };

  const handleReset = () => {
    setStep("upload");
    setParsedResume(null);
    setSearchResponse(null);
    setError(null);
  };

  const handleNewSearch = () => {
    setStep("search");
    setSearchResponse(null);
    setError(null);
  };

  const stepNumber = step === "upload" ? 1 : step === "search" ? 2 : step === "loading" ? 3 : 3;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg
                className="w-4.5 h-4.5 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
                width="18"
                height="18"
              >
                <path
                  fillRule="evenodd"
                  d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
                <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
              </svg>
            </div>
            <span className="font-bold text-slate-100 tracking-tight">
              Job<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Match</span>
            </span>
          </div>

          {step !== "upload" && (
            <div className="flex items-center gap-1.5">
              {[
                { num: 1, label: "Resume", target: "upload" as AppStep },
                { num: 2, label: "Search", target: "search" as AppStep },
                { num: 3, label: "Results", target: "results" as AppStep },
              ].map(({ num, label }) => {
                const isCompleted = stepNumber > num;
                const isCurrent = stepNumber === num;
                return (
                  <div key={num} className="flex items-center gap-1.5">
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                        isCurrent
                          ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                          : isCompleted
                          ? "text-emerald-400"
                          : "text-slate-600"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                          isCurrent
                            ? "bg-indigo-500 text-white"
                            : isCompleted
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-700 text-slate-500"
                        }`}
                      >
                        {isCompleted ? (
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          num
                        )}
                      </span>
                      <span className="hidden sm:inline">{label}</span>
                    </div>
                    {num < 3 && (
                      <div
                        className={`w-4 h-px ${
                          isCompleted ? "bg-emerald-500/40" : "bg-slate-700"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="w-24" />
        </div>
      </header>

      <main className="flex-1">
        {step === "upload" && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-24">
            <div className="text-center mb-12 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                AI-Powered Job Matching
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-100 tracking-tight leading-tight">
                Find jobs that{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                  fit your skills
                </span>
              </h1>
              <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
                Upload your resume and let AI match you with the best opportunities across
                LinkedIn, Indeed, Glassdoor, and more.
              </p>
            </div>
            <ResumeUpload onUploadComplete={handleUploadComplete} />

            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {[
                {
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  ),
                  title: "Upload Resume",
                  desc: "PDF or DOCX, AI extracts your skills and experience",
                },
                {
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  ),
                  title: "Search Jobs",
                  desc: "We search top job boards in real time",
                },
                {
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  ),
                  title: "See Your Score",
                  desc: "Each job gets an AI match score with reasons",
                },
              ].map(({ icon, title, desc }) => (
                <div
                  key={title}
                  className="flex flex-col items-center text-center gap-2 p-4 rounded-xl bg-slate-800/30 border border-slate-700/40"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-indigo-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {icon}
                    </svg>
                  </div>
                  <p className="text-slate-200 text-sm font-semibold">{title}</p>
                  <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {(step === "search" || step === "loading") && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-24 space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-slate-100">
                Configure Your Job Search
              </h2>
              <p className="text-slate-400 text-sm">
                Resume parsed successfully. Now tell us what you&apos;re looking for.
              </p>
            </div>

            {parsedResume && (
              <div className="max-w-2xl mx-auto rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Resume ready</span>
                      {parsedResume.experience_years > 0 && (
                        <span className="text-slate-400 text-xs">{parsedResume.experience_years} yrs exp.</span>
                      )}
                      {parsedResume.job_titles[0] && (
                        <span className="text-slate-400 text-xs truncate">{parsedResume.job_titles[0]}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {parsedResume.skills.slice(0, 8).map((skill) => (
                        <span key={skill} className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs">
                          {skill}
                        </span>
                      ))}
                      {parsedResume.skills.length > 8 && (
                        <span className="text-slate-500 text-xs self-center">+{parsedResume.skills.length - 8} more</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2 flex-shrink-0"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="max-w-2xl mx-auto flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            {step === "loading" ? (
              <LoadingState />
            ) : (
              <SearchForm onSearch={handleSearch} isLoading={false} />
            )}
          </section>
        )}

        {step === "results" && searchResponse && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-24">
            <JobResults
              jobs={searchResponse.jobs}
              totalFound={searchResponse.total_found}
              onReset={handleReset}
              defaultSchool={parsedResume?.education[0]}
            />
            <div className="mt-8 text-center">
              <button
                onClick={handleNewSearch}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-300 text-sm font-medium transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Refine Search
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-slate-800 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            &copy; {new Date().getFullYear()} JobMatch. Built for your portfolio.
          </span>
          <span className="flex items-center gap-1.5">
            <svg
              className="w-3.5 h-3.5 text-violet-400"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
            </svg>
            Powered by{" "}
            <span className="text-violet-400 font-medium">Claude AI</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
