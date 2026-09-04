"use client";

import { useState } from "react";
import { JobMatch, WorkArrangement } from "@/types";
import JobCard from "./JobCard";
import AlumniPanel from "./AlumniPanel";

interface JobResultsProps {
  jobs: JobMatch[];
  totalFound: number;
  onReset: () => void;
  defaultSchool?: string;
}

type SortOption = "score" | "date" | "salary";

const ARRANGEMENT_FILTER_OPTIONS: { value: WorkArrangement; label: string }[] = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

export default function JobResults({ jobs, totalFound, onReset, defaultSchool }: JobResultsProps) {
  const [sortBy, setSortBy] = useState<SortOption>("score");
  const [filterScore, setFilterScore] = useState(0);
  const [filterArrangements, setFilterArrangements] = useState<WorkArrangement[]>([]);
  const [alumniOrg, setAlumniOrg] = useState("Theta Chi");
  const [alumniSchool, setAlumniSchool] = useState(defaultSchool ?? "");

  const toggleArrangementFilter = (value: WorkArrangement) => {
    setFilterArrangements((current) =>
      current.includes(value)
        ? current.filter((a) => a !== value)
        : [...current, value]
    );
  };

  const filtered = jobs.filter(
    (j) =>
      j.match_score >= filterScore &&
      (filterArrangements.length === 0 ||
        filterArrangements.includes(j.work_arrangement))
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "score") return b.match_score - a.match_score;
    if (sortBy === "salary") {
      const aMax = a.salary_max ?? a.salary_min ?? 0;
      const bMax = b.salary_max ?? b.salary_min ?? 0;
      return bMax - aMax;
    }
    if (sortBy === "date") {
      if (!a.date_posted && !b.date_posted) return 0;
      if (!a.date_posted) return 1;
      if (!b.date_posted) return -1;
      return a.date_posted > b.date_posted ? -1 : 1;
    }
    return 0;
  });

  const avgScore =
    jobs.length > 0
      ? Math.round(jobs.reduce((sum, j) => sum + j.match_score, 0) / jobs.length)
      : 0;
  const topMatches = jobs.filter((j) => j.match_score >= 80).length;

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Jobs Found",
            value: totalFound,
            sub: `${jobs.length} analyzed`,
            color: "indigo",
          },
          {
            label: "Top Matches",
            value: topMatches,
            sub: "Score 80+",
            color: "emerald",
          },
          {
            label: "Avg Match Score",
            value: `${avgScore}%`,
            sub: "Across all jobs",
            color: "violet",
          },
          {
            label: "Showing",
            value: sorted.length,
            sub: "after filters",
            color: "amber",
          },
        ].map(({ label, value, sub, color }) => (
          <div
            key={label}
            className={`rounded-xl border bg-slate-800/60 px-4 py-3 border-${color}-500/20`}
          >
            <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
            <p
              className={`text-2xl font-bold mt-0.5 text-${color}-400`}
            >
              {value}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <AlumniPanel
        organization={alumniOrg}
        onOrganizationChange={setAlumniOrg}
        school={alumniSchool}
        onSchoolChange={setAlumniSchool}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2">
          <span className="text-xs text-slate-400 whitespace-nowrap">Sort by:</span>
          {(["score", "salary", "date"] as SortOption[]).map((opt) => (
            <button
              key={opt}
              onClick={() => setSortBy(opt)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all capitalize ${
                sortBy === opt
                  ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {opt === "score" ? "Best Match" : opt === "salary" ? "Salary" : "Newest"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <span className="text-xs text-slate-400 whitespace-nowrap">Min score:</span>
          <input
            type="range"
            min={0}
            max={90}
            step={10}
            value={filterScore}
            onChange={(e) => setFilterScore(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs font-semibold text-indigo-400 w-6 text-right">
            {filterScore}+
          </span>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2">
          <span className="text-xs text-slate-400 whitespace-nowrap">Arrangement:</span>
          {ARRANGEMENT_FILTER_OPTIONS.map(({ value, label }) => {
            const isSelected = filterArrangements.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleArrangementFilter(value)}
                aria-pressed={isSelected}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-indigo-500/20 border border-indigo-500/60 text-indigo-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <button
          onClick={onReset}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 text-xs font-medium transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          New Search
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-slate-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-lg font-semibold text-slate-300">No results match your filters</p>
          <p className="text-sm mt-1">Try lowering the minimum score filter</p>
          <button
            onClick={() => {
              setFilterScore(0);
              setFilterArrangements([]);
            }}
            className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm underline underline-offset-2"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sorted.map((job, index) => (
            <div
              key={job.id}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <JobCard job={job} alumniOrg={alumniOrg} alumniSchool={alumniSchool} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
