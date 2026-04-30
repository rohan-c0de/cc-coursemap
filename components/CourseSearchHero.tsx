"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

type StateOption = { slug: string; name: string; abbr: string };

const LS_KEY = "ccp:lastState";

export default function CourseSearchHero({
  states,
  geoState,
}: {
  states: StateOption[];
  geoState: string | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [isAuto, setIsAuto] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [needsState, setNeedsState] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Hydrate selected state: a previously-chosen value in localStorage wins
  // (manual choice = highest priority), then geo auto-detect, else nothing.
  // localStorage is only available client-side, so this hydration must
  // happen in an effect after mount.
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (stored && states.some((s) => s.slug === stored)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedState(stored);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAuto(false);
      return;
    }
    if (geoState && states.some((s) => s.slug === geoState)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedState(geoState);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAuto(true);
    }
  }, [states, geoState]);

  // Close picker on outside click.
  useEffect(() => {
    if (!pickerOpen) return;
    const onDown = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [pickerOpen]);

  const pickState = (slug: string) => {
    setSelectedState(slug);
    setIsAuto(false);
    localStorage.setItem(LS_KEY, slug);
    setPickerOpen(false);
    setNeedsState(false);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedState) {
      setNeedsState(true);
      setPickerOpen(true);
      return;
    }
    const q = query.trim();
    const params = q ? `?q=${encodeURIComponent(q)}` : "";
    router.push(`/${selectedState}/courses${params}`);
  };

  const current = selectedState ? states.find((s) => s.slug === selectedState) : null;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={onSubmit} className="relative">
        <div
          className="flex items-center gap-2 rounded-2xl border border-ink-300/60 dark:border-slate-700 bg-white dark:bg-slate-800 pl-5 pr-2 py-2 focus-within:border-teal-600 focus-within:ring-4 focus-within:ring-teal-100 dark:focus-within:ring-teal-900/40 transition-all"
          style={{
            boxShadow:
              "0 1px 0 rgba(15,23,42,0.04), 0 8px 24px -8px rgba(13,148,136,0.35)",
          }}
        >
          <svg
            className="w-5 h-5 text-slate-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={'Try "ENG 111", "intro biology", or "does this transfer to GMU"…'}
            className="flex-1 min-w-0 py-2 bg-transparent text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            aria-label="Search courses"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 text-sm font-medium transition-colors"
          >
            Search
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </form>

      {/* State filter pill row */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm" ref={pickerRef}>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          searching in
        </span>

        {current ? (
          <button
            type="button"
            onClick={() => setPickerOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 px-3 py-1 text-teal-800 dark:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span className="font-medium">{current.name}</span>
            {isAuto && (
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] bg-teal-200/60 dark:bg-teal-800/60 px-1.5 py-0.5 rounded">
                auto
              </span>
            )}
            <span aria-hidden>▾</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setPickerOpen((o) => !o)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 transition-colors ${
              needsState
                ? "border-teal-600 bg-teal-50 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200 ring-2 ring-teal-200 dark:ring-teal-900/40"
                : "border-dashed border-slate-400 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-teal-600 hover:text-teal-700"
            }`}
          >
            {needsState ? "pick a state to search ▾" : "select your state ▾"}
          </button>
        )}

        <span className="text-slate-400 dark:text-slate-600">·</span>

        <button
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 dark:border-slate-700 px-3 py-1 text-slate-500 dark:text-slate-400 hover:border-teal-600 hover:text-teal-700 transition-colors"
        >
          all {states.length} states
        </button>

        {pickerOpen && (
          <div className="absolute z-20 mt-2 max-w-xl w-full left-1/2 -translate-x-1/2 top-full rounded-xl border border-ink-300/60 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl p-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2 px-1">
              choose a state
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
              {states.map((s) => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => pickState(s.slug)}
                  className={`text-left rounded-lg px-2 py-1.5 text-sm hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-200 transition-colors ${
                    s.slug === selectedState
                      ? "bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200"
                      : "text-slate-700 dark:text-slate-200"
                  }`}
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mr-1.5">
                    {s.abbr}
                  </span>
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Popular searches */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mr-1">
          popular searches
        </span>
        {[
          "Does ENG 111 transfer to GMU?",
          "prereqs for BIO 256",
          "online math, summer 2026",
          "free college if I'm 65+",
        ].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setQuery(s)}
            className="rounded-full border border-ink-300/60 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-xs text-slate-600 dark:text-slate-300 hover:border-teal-600 hover:text-teal-700 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
