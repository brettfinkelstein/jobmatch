"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "jobmatch:applied-jobs";

function readAppliedUrls(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

/**
 * Jobs are keyed by URL, not JobMatch.id — the backend generates a fresh
 * random id per search when the scraper doesn't supply one, so id isn't
 * stable across re-searches of the same posting.
 */
export function useAppliedJobs() {
  const [applied, setApplied] = useState<Set<string>>(new Set());

  // localStorage isn't available during SSR, so populate after mount.
  useEffect(() => {
    setApplied(readAppliedUrls());
  }, []);

  const isApplied = useCallback((url: string) => applied.has(url), [applied]);

  const toggleApplied = useCallback((url: string) => {
    setApplied((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  return { isApplied, toggleApplied };
}
