// AnswerCard renders a structured Answer from /api/[state]/ask above the
// course search results. One card per query.
//
// Variant routing:
//   transfer     → TransferBody (status-driven: yes / partial / no / etc.)
//   prereqs      → PrereqsBody  (status-driven: found / no-prereqs / etc.)
//   eligibility  → EligibilityBody (per-college breakdown + state summary)
//   none         → null (no card; UI just renders course search results)
//
// Every typed answer carries a SourceCitation; footer renders that as a
// trust signal so first-gen students can verify the underlying data.

"use client";

import type { Answer, SourceCitation } from "@/lib/search-intent/answer";

interface AnswerCardProps {
  answer: Answer;
  state: string;
}

export default function AnswerCard({ answer, state }: AnswerCardProps) {
  // `intent-not-supported` is the one NoAnswer reason we deliberately
  // suppress — it fires for course intents, where the existing course
  // search results below are the answer. Every other NoAnswer carries a
  // helpful message the user should see ("Which course are you asking
  // about?", "I'm not sure what you're asking", etc.). Render those as
  // a quieter info card so the user gets feedback that we understood
  // the question shape but couldn't answer it as-asked.
  if (answer.type === "none") {
    if (answer.reason === "intent-not-supported") return null;
    return <NoAnswerCard answer={answer} />;
  }

  return (
    <div
      className="mb-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
      data-testid="answer-card"
      role="region"
      aria-live="polite"
      aria-label="Answer to your question"
    >
      <div className="p-5 space-y-3">
        {answer.type === "transfer" && <TransferBody answer={answer} />}
        {answer.type === "prereqs" && <PrereqsBody answer={answer} state={state} />}
        {answer.type === "eligibility" && <EligibilityBody answer={answer} />}
      </div>
      <SourceFooter source={answer.source} />
    </div>
  );
}

// ─── NoAnswer (informational hint card) ─────────────────────────────────

function NoAnswerCard({
  answer,
}: {
  answer: Extract<Answer, { type: "none" }>;
}) {
  // No source citation (NoAnswer has no SourceCitation). Visually softer
  // than typed answers — slate background, no colored accent — to signal
  // "this is a hint, not an authoritative answer."
  return (
    <div
      className="mb-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4"
      data-testid="answer-card"
      role="region"
      aria-live="polite"
      aria-label="Hint about your question"
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-0.5 text-slate-500 dark:text-slate-400"
          aria-hidden="true"
        >
          💭
        </span>
        <div className="flex-1">
          <p className="text-sm text-slate-700 dark:text-slate-200">
            {answer.message}
          </p>
          {answer.suggestions && answer.suggestions.length > 0 && (
            <ul className="mt-2 text-sm text-slate-600 dark:text-slate-300 space-y-0.5">
              {answer.suggestions.map((s) => (
                <li key={s}>• {s}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Transfer ───────────────────────────────────────────────────────────

function TransferBody({
  answer,
}: {
  answer: Extract<Answer, { type: "transfer" }>;
}) {
  const courseLabel = `${answer.course.prefix} ${answer.course.number}`;

  switch (answer.status) {
    case "yes": {
      const eq = answer.equivalency!;
      return (
        <>
          <Headline tone="success" icon="✓">
            Yes — {courseLabel} transfers to {answer.university!.name} as{" "}
            <strong>{eq.univ_course}</strong>
            {eq.univ_credits ? ` (${eq.univ_credits} credits)` : ""}
          </Headline>
          {eq.univ_title && (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {eq.univ_title}
            </p>
          )}
          {eq.notes && <Note>{eq.notes}</Note>}
        </>
      );
    }
    case "partial": {
      const eq = answer.equivalency!;
      const reason = eq.no_credit
        ? "but receives no credit at the university"
        : "as elective credit only";
      return (
        <>
          <Headline tone="warning" icon="⚠">
            {courseLabel} transfers to {answer.university!.name} as{" "}
            <strong>{eq.univ_course || "(elective)"}</strong>, {reason}.
          </Headline>
          {eq.notes && <Note>{eq.notes}</Note>}
        </>
      );
    }
    case "no": {
      return (
        <>
          <Headline tone="neutral" icon="✗">
            We don&apos;t have a transfer agreement on file for {courseLabel} →{" "}
            {answer.university!.name}.
          </Headline>
          {answer.alternatives && answer.alternatives.length > 0 && (
            <AlternativesList
              label={`${courseLabel} does transfer to:`}
              items={answer.alternatives}
            />
          )}
        </>
      );
    }
    case "no-destination": {
      return (
        <>
          <Headline tone="info" icon="↪">
            {courseLabel} transfers to several universities:
          </Headline>
          {answer.alternatives && (
            <AlternativesList items={answer.alternatives} />
          )}
        </>
      );
    }
    case "unknown-course":
      return (
        <Headline tone="neutral" icon="?">
          We couldn&apos;t find {courseLabel} in this state&apos;s catalog. Try
          a course code from the search below.
        </Headline>
      );
    case "unknown-university":
      return (
        <>
          <Headline tone="neutral" icon="?">
            We don&apos;t have transfer data for that university.
          </Headline>
          {answer.suggestions && answer.suggestions.length > 0 && (
            <SuggestionList
              label="Did you mean:"
              items={answer.suggestions.map((s) => s.name)}
            />
          )}
        </>
      );
    case "no-data":
      return (
        <Headline tone="neutral" icon="—">
          Transfer data isn&apos;t available for this state yet.
        </Headline>
      );
  }
}

// ─── Prereqs ────────────────────────────────────────────────────────────

function PrereqsBody({
  answer,
  state,
}: {
  answer: Extract<Answer, { type: "prereqs" }>;
  state: string;
}) {
  if (answer.status === "no-course-named") {
    return (
      <Headline tone="neutral" icon="?">
        Which course&apos;s prerequisites are you asking about? Try &ldquo;prereqs for BIO 256&rdquo;.
      </Headline>
    );
  }

  const courseLabel = answer.course
    ? `${answer.course.prefix} ${answer.course.number}`
    : "this course";

  switch (answer.status) {
    case "found": {
      // Top-level prereq courses from the chain (one level deep).
      // Multi-level rendering is intentionally deferred; the deepest
      // info isn't usually what the user wants on the answer card.
      const chain = answer.chain;
      const topLevel = chain?.children ?? [];
      const groups = chain?.groups;
      return (
        <>
          <Headline tone="info" icon="📋">
            To take <strong>{courseLabel}</strong>, you need:
          </Headline>
          {chain?.text && (
            <p className="text-sm text-slate-700 dark:text-slate-200">
              {chain.text}
            </p>
          )}
          {groups && groups.length > 0 ? (
            <div className="space-y-1.5">
              {groups.map((group, i) => (
                <div key={i} className="flex flex-wrap items-center gap-1.5">
                  {i > 0 && (
                    <span className="text-xs font-medium uppercase text-slate-400">
                      and
                    </span>
                  )}
                  {group.map((c, j) => (
                    <span key={c.course} className="flex items-center gap-1.5">
                      {j > 0 && (
                        <span className="text-xs uppercase text-slate-400">
                          or
                        </span>
                      )}
                      <CoursePill course={c.course} state={state} />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            topLevel.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {topLevel.map((c) => (
                  <CoursePill key={c.course} course={c.course} state={state} />
                ))}
              </div>
            )
          )}
        </>
      );
    }
    case "no-prereqs":
      return (
        <Headline tone="success" icon="✓">
          {courseLabel} has no prerequisites — you can take it directly.
        </Headline>
      );
    case "unknown-course":
      return (
        <Headline tone="neutral" icon="?">
          We couldn&apos;t find {courseLabel} in this state&apos;s catalog.
        </Headline>
      );
    case "no-data":
      return (
        <Headline tone="neutral" icon="—">
          Prerequisite data isn&apos;t available for this state yet.
        </Headline>
      );
  }
}

// ─── Eligibility ────────────────────────────────────────────────────────

function EligibilityBody({
  answer,
}: {
  answer: Extract<Answer, { type: "eligibility" }>;
}) {
  // Cap to first 5 colleges to keep the card from dominating the page.
  const visible = answer.colleges.slice(0, 5);
  const remaining = answer.colleges.length - visible.length;

  return (
    <>
      <Headline tone="info" icon="🎓">
        {answer.summary}
      </Headline>
      {visible.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden">
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {visible.map((c) => (
              <li
                key={c.slug}
                className="flex items-start justify-between gap-3 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                    {c.name}
                  </div>
                  {c.notes && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {c.notes}
                    </div>
                  )}
                </div>
                <div className="text-right whitespace-nowrap">
                  <span
                    className={`text-xs font-medium ${
                      c.eligible
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {c.eligible ? "Eligible" : "Not available"}
                  </span>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    {c.cost}
                    {c.ageThreshold ? ` · ${c.ageThreshold}+` : ""}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {remaining > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          + {remaining} more college{remaining === 1 ? "" : "s"} not shown.
        </p>
      )}
    </>
  );
}

// ─── Shared bits ────────────────────────────────────────────────────────

function Headline({
  tone,
  icon,
  children,
}: {
  tone: "success" | "warning" | "neutral" | "info";
  icon: string;
  children: React.ReactNode;
}) {
  const toneClass = {
    success: "text-emerald-700 dark:text-emerald-400",
    warning: "text-amber-700 dark:text-amber-400",
    neutral: "text-slate-700 dark:text-slate-300",
    info: "text-teal-700 dark:text-teal-400",
  }[tone];
  return (
    <div className="flex items-start gap-2">
      <span className={`mt-0.5 ${toneClass}`} aria-hidden="true">
        {icon}
      </span>
      <p className={`text-base font-medium ${toneClass}`}>{children}</p>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
      {children}
    </p>
  );
}

function AlternativesList({
  label,
  items,
}: {
  label?: string;
  items: Array<{
    slug: string;
    name: string;
    univ_course: string;
    is_elective: boolean;
    no_credit: boolean;
  }>;
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <p className="text-sm text-slate-600 dark:text-slate-300">{label}</p>
      )}
      <ul className="space-y-1 text-sm">
        {items.map((m) => (
          <li
            key={m.slug}
            className="flex items-baseline justify-between gap-3 border-b border-slate-100 dark:border-slate-800 last:border-0 pb-1 last:pb-0"
          >
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {m.name}
            </span>
            <span className="text-slate-600 dark:text-slate-300 text-xs">
              {m.univ_course || "—"}
              {m.is_elective ? " (elective)" : ""}
              {m.no_credit ? " (no credit)" : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SuggestionList({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  return (
    <div>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">{label}</p>
      <ul className="text-sm text-slate-700 dark:text-slate-200">
        {items.map((s) => (
          <li key={s}>• {s}</li>
        ))}
      </ul>
    </div>
  );
}

function CoursePill({ course, state }: { course: string; state: string }) {
  // Course code format: "PREFIX NUMBER". Encode for URL safety.
  const q = encodeURIComponent(course);
  return (
    <a
      href={`/${state}/courses?q=${q}`}
      className="inline-flex items-center rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-800 dark:text-slate-200 hover:border-teal-500 hover:text-teal-700 transition-colors"
    >
      {course}
    </a>
  );
}

function SourceFooter({ source }: { source: SourceCitation }) {
  const SOURCE_LABEL: Record<SourceCitation["source"], string> = {
    "transfer-equiv": "transfer agreements",
    prereqs: "prerequisite catalog",
    institutions: "audit policies",
    "supabase-courses": "course catalog",
  };
  const label = SOURCE_LABEL[source.source];
  return (
    <div className="px-5 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Based on {label} for{" "}
        <span className="font-mono uppercase">{source.state}</span>
        {source.lastUpdated ? ` · last verified ${source.lastUpdated}` : ""}
        {source.upstreamUrl ? (
          <>
            {" "}·{" "}
            <a
              href={source.upstreamUrl}
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-teal-700"
            >
              source
            </a>
          </>
        ) : null}
      </p>
    </div>
  );
}
