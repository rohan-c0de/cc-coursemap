/**
 * Cost & outcomes section for /[state]/college/[id], driven by federal
 * College Scorecard data. See issue #392.
 *
 * Server component — pure render, no client JS. The data is loaded
 * synchronously from disk via `getScorecard()`; if it's missing (the two
 * unmapped colleges, or any future case where ingest failed), the section
 * renders nothing rather than blocking the page.
 */

import {
  getScorecard,
  formatDollar,
  formatPercent,
  type ScorecardRecord,
} from "@/lib/scorecard";

interface Props {
  state: string;
  collegeId: string;
  collegeName: string;
}

function StatCard({
  label,
  value,
  sub,
  tooltip,
}: {
  label: string;
  value: string;
  sub?: string;
  /**
   * Optional explanatory text. Rendered as a small "ⓘ" next to the label
   * with a native `title` attribute — works without client JS (the section
   * is a server component) and surfaces on hover on desktop. Mobile users
   * who tap-and-hold also get the tooltip via the OS-level long-press menu.
   */
  tooltip?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
        <span>{label}</span>
        {tooltip && (
          <span
            title={tooltip}
            aria-label={tooltip}
            className="cursor-help text-gray-400 dark:text-slate-500"
          >
            ⓘ
          </span>
        )}
      </div>
      <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-slate-100">
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
          {sub}
        </div>
      )}
    </div>
  );
}

function IncomeRow({
  band,
  amount,
}: {
  band: string;
  amount: number | null;
}) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 py-2 last:border-0">
      <span className="text-sm text-gray-700 dark:text-slate-300">{band}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-slate-100 tabular-nums">
        {formatDollar(amount)}
      </span>
    </div>
  );
}

/**
 * Bridge between sticker tuition and average net price: itemize the
 * federal cost-of-attendance components, then subtract average aid to
 * show how the two cost numbers (often surprisingly far apart) actually
 * reconcile. Renders nothing if there's not enough Scorecard data to
 * tell a coherent story — at minimum we need the average net price plus
 * at least one COA line item.
 */
function CostBreakdown({ record }: { record: ScorecardRecord }) {
  const netPrice = record.cost.avgNetPricePublic;
  const tuition = record.cost.tuitionInState;
  const roomBoard = record.cost.roomBoardOffCampus;
  const books = record.cost.bookSupply;
  const totalCOA = record.cost.attendanceAcademicYear;

  // Need enough to be useful — net price plus at least one line item.
  if (netPrice == null) return null;
  const lineItems: Array<{ label: string; amount: number | null; note?: string }> = [
    { label: "Tuition & fees (in-state)", amount: tuition },
    { label: "Room & board", amount: roomBoard, note: "off-campus, estimate" },
    { label: "Books & supplies", amount: books },
  ];
  const hasAnyLine = lineItems.some((l) => l.amount != null);
  if (!hasAnyLine && totalCOA == null) return null;

  // "Other" = total COA - sum of broken-out lines (transportation + personal
  // expenses + anything else IPEDS rolled into COA). Only shown if we have
  // the total *and* at least one line item, so subtraction makes sense.
  const knownSum = lineItems.reduce((s, l) => s + (l.amount ?? 0), 0);
  const knownAnyNonNull = lineItems.some((l) => l.amount != null);
  const other =
    totalCOA != null && knownAnyNonNull && totalCOA > knownSum
      ? totalCOA - knownSum
      : null;

  // Net aid is COA - net price. Only render if both knowns.
  const avgAid = totalCOA != null && netPrice != null ? totalCOA - netPrice : null;

  return (
    <div className="mt-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
        How cost adds up to net price
      </h3>
      <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
        Sticker tuition only covers tuition and fees. Federal &ldquo;average
        net price&rdquo; adds the full cost of attendance and subtracts
        average aid — which is why it&rsquo;s usually larger.
      </p>
      <dl className="mt-3 divide-y divide-gray-100 dark:divide-slate-700 text-sm">
        {lineItems.map(
          (l) =>
            l.amount != null && (
              <div
                key={l.label}
                className="flex items-baseline justify-between py-2"
              >
                <dt className="text-gray-700 dark:text-slate-300">
                  {l.label}
                  {l.note && (
                    <span className="ml-1 text-xs text-gray-400 dark:text-slate-500">
                      ({l.note})
                    </span>
                  )}
                </dt>
                <dd className="font-medium text-gray-900 dark:text-slate-100 tabular-nums">
                  {formatDollar(l.amount)}
                </dd>
              </div>
            ),
        )}
        {other != null && (
          <div className="flex items-baseline justify-between py-2">
            <dt className="text-gray-700 dark:text-slate-300">
              Other (transportation, personal)
              <span className="ml-1 text-xs text-gray-400 dark:text-slate-500">
                (estimate)
              </span>
            </dt>
            <dd className="font-medium text-gray-900 dark:text-slate-100 tabular-nums">
              {formatDollar(other)}
            </dd>
          </div>
        )}
        {totalCOA != null && (
          <div className="flex items-baseline justify-between py-2 font-semibold">
            <dt className="text-gray-900 dark:text-slate-100">
              Total cost of attendance
            </dt>
            <dd className="text-gray-900 dark:text-slate-100 tabular-nums">
              {formatDollar(totalCOA)}
            </dd>
          </div>
        )}
        {avgAid != null && avgAid > 0 && (
          <div className="flex items-baseline justify-between py-2 text-teal-700 dark:text-teal-300">
            <dt>Less: average grants &amp; scholarships</dt>
            <dd className="font-medium tabular-nums">
              &minus;{formatDollar(avgAid)}
            </dd>
          </div>
        )}
        <div className="flex items-baseline justify-between py-2 text-base font-bold">
          <dt className="text-gray-900 dark:text-slate-100">
            Average net price after aid
          </dt>
          <dd className="text-gray-900 dark:text-slate-100 tabular-nums">
            {formatDollar(netPrice)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * Returns true if the record has enough non-null fields to be worth
 * rendering. A record with everything null (rare but possible) would render
 * a wall of "—" — we'd rather omit the whole section.
 */
function hasUsefulData(r: ScorecardRecord): boolean {
  return (
    r.cost.tuitionInState != null ||
    r.cost.avgNetPricePublic != null ||
    r.aid.pellGrantRate != null ||
    r.completion.completionRate150nt != null
  );
}

export default function CollegeScorecardSection({
  state,
  collegeId,
  collegeName,
}: Props) {
  const record = getScorecard(state, collegeId);
  if (!record || !hasUsefulData(record)) return null;

  const incomes: Array<{ band: string; amount: number | null }> = [
    { band: "$0 – $30,000", amount: record.cost.netPriceByIncome["0_30000"] },
    { band: "$30,001 – $48,000", amount: record.cost.netPriceByIncome["30001_48000"] },
    { band: "$48,001 – $75,000", amount: record.cost.netPriceByIncome["48001_75000"] },
    { band: "$75,001 – $110,000", amount: record.cost.netPriceByIncome["75001_110000"] },
    { band: "$110,001+", amount: record.cost.netPriceByIncome["110001_plus"] },
  ];
  const anyIncome = incomes.some((i) => i.amount != null);

  // Format fetchedAt → "Fall 2025" or just the year, depending on month.
  const fetched = new Date(record.fetchedAt);
  const year = fetched.getUTCFullYear();
  const reportedYear = fetched.getUTCMonth() >= 9 ? year : year - 1; // Scorecard refreshes in October

  return (
    <section className="mt-8" aria-labelledby="scorecard-heading">
      <h2
        id="scorecard-heading"
        className="text-xl font-semibold text-gray-900 dark:text-slate-100"
      >
        Cost &amp; outcomes
      </h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
        Federal data on tuition, financial aid, and student outcomes at{" "}
        {collegeName}.
      </p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label="In-state tuition"
          value={formatDollar(record.cost.tuitionInState)}
          sub="per year (sticker)"
          tooltip="Published tuition and required fees for in-state students. Does not include books, transportation, or living expenses."
        />
        <StatCard
          label="Receive Pell"
          value={formatPercent(record.aid.pellGrantRate)}
          sub="federal grant"
        />
        <StatCard
          label="Completion rate"
          value={formatPercent(record.completion.completionRate150nt)}
          sub="150% of normal time"
        />
      </div>

      <CostBreakdown record={record} />

      {anyIncome && (
        <div className="mt-6 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
            Net price by family income
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            What students actually paid per year, after grants and scholarships,
            grouped by household income.
          </p>
          <div className="mt-3">
            {incomes.map((row) => (
              <IncomeRow key={row.band} band={row.band} amount={row.amount} />
            ))}
          </div>
        </div>
      )}

      {(record.completion.transferRate != null ||
        record.earnings.median10YrsAfterEntry != null ||
        record.aid.medianDebtCompleters != null) && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {record.completion.transferRate != null && (
            <StatCard
              label="Transfer rate"
              value={formatPercent(record.completion.transferRate)}
              sub="full-time students"
            />
          )}
          {record.aid.medianDebtCompleters != null && (
            <StatCard
              label="Median debt at completion"
              value={formatDollar(record.aid.medianDebtCompleters)}
              sub="federal loans"
            />
          )}
          {record.earnings.median10YrsAfterEntry != null && (
            <StatCard
              label="Median earnings"
              value={formatDollar(record.earnings.median10YrsAfterEntry)}
              sub="10 years after entry"
            />
          )}
        </div>
      )}

      <p className="mt-4 text-xs text-gray-500 dark:text-slate-400">
        Source:{" "}
        <a
          href={`https://collegescorecard.ed.gov/school/?${record.unitid}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-700 dark:hover:text-slate-300"
        >
          U.S. Department of Education College Scorecard
        </a>
        , reporting year ~{reportedYear}.
      </p>
    </section>
  );
}
