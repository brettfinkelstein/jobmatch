"use client";

import { useState } from "react";
import { buildLinkedInPeopleSearchUrl } from "@/lib/linkedin";

interface AlumniPanelProps {
  organization: string;
  onOrganizationChange: (value: string) => void;
  school: string;
  onSchoolChange: (value: string) => void;
}

export default function AlumniPanel({
  organization,
  onOrganizationChange,
  school,
  onSchoolChange,
}: AlumniPanelProps) {
  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState("");
  const [keyword, setKeyword] = useState("");
  const [hiringSignal, setHiringSignal] = useState(true);

  const canSearch = organization.trim().length > 0 || school.trim().length > 0;
  const searchUrl = canSearch
    ? buildLinkedInPeopleSearchUrl({ organization, school, company, keyword, hiringSignal })
    : undefined;

  return (
    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0">
            <svg className="w-4.5 h-4.5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">Find alumni &amp; fraternity connections</p>
            <p className="text-xs text-slate-400">
              Search LinkedIn by fraternity, school, or both — e.g. {organization || "Theta Chi"}
              {school ? ` or ${school}` : ""} alumni at companies you&apos;re targeting
            </p>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-blue-500/10 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-slate-400">Organization (fraternity, club, etc.)</span>
              <input
                type="text"
                value={organization}
                onChange={(e) => onOrganizationChange(e.target.value)}
                placeholder="Theta Chi"
                className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">College / University</span>
              <input
                type="text"
                value={school}
                onChange={(e) => onSchoolChange(e.target.value)}
                placeholder="e.g. Penn State"
                className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">Company (optional)</span>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Google"
                className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">Other keyword (optional)</span>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. recruiter"
                className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hiringSignal}
              onChange={(e) => setHiringSignal(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 accent-blue-500"
            />
            <span className="text-xs text-slate-300">
              Bias toward people who might be hiring (adds &quot;hiring&quot;, &quot;we&apos;re
              hiring&quot;, &quot;recruiting&quot;, etc. to the search)
            </span>
          </label>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-slate-500">
              Fill in Organization, College/University, or both. Opens LinkedIn people search in a
              new tab — filter further with LinkedIn&apos;s own Company / Location filters once
              results load.
            </p>
            <a
              href={searchUrl ?? "#"}
              target={canSearch ? "_blank" : undefined}
              rel="noopener noreferrer"
              aria-disabled={!canSearch}
              onClick={(e) => {
                if (!canSearch) e.preventDefault();
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 text-xs font-semibold transition-all flex-shrink-0 ${
                canSearch ? "" : "opacity-40 cursor-not-allowed pointer-events-none"
              }`}
            >
              Search LinkedIn
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
      )}
    </div>
  );
}
