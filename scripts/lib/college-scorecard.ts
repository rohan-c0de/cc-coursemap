/**
 * College Scorecard API client.
 *
 * Federal data source for per-institution cost, aid, completion, and earnings
 * metrics. Free, public, requires an `api.data.gov` key (sign up at
 * https://api.data.gov/signup — instant). Documented at
 * https://collegescorecard.ed.gov/data/api-documentation/.
 *
 * This file (PR 1 of issue #392) only provides the API client and the
 * persisted-record schema. The per-college ingest, IPEDS unitid mapping,
 * and library helpers land in follow-up PRs.
 *
 * Field selection rationale:
 *   The issue (#392) originally listed `completion.completion_rate_4yr_150nt`
 *   as the canonical completion metric. Empirically that field is null for
 *   community colleges (it's a 4-year-institution metric). The correct CC
 *   equivalent is `completion.completion_rate_less_than_4yr_150nt`. This
 *   client picks the less-than-4-year variants where they exist.
 */

import { fetchJsonWithRetry } from "@/scripts/lib/http-retry";
import { loadEnv } from "@/scripts/lib/load-env";

const API_BASE = "https://api.data.gov/ed/collegescorecard/v1/schools";

// Fields to request from the API. Comma-joined into the `fields` query param.
// Keeping this narrow keeps response payloads small (~2 KB per school vs.
// ~500 KB for the full record).
const FIELDS = [
  "id",
  "school.name",
  "school.state",
  "school.city",
  "school.school_url",
  "school.ownership",
  "school.degrees_awarded.predominant",
  "latest.student.size",
  "latest.student.share_firstgeneration",
  "latest.cost.tuition.in_state",
  "latest.cost.tuition.out_of_state",
  "latest.cost.attendance.academic_year",
  "latest.cost.avg_net_price.public",
  "latest.cost.booksupply",
  "latest.cost.roomboard.offcampus",
  "latest.cost.net_price.public.by_income_level.0-30000",
  "latest.cost.net_price.public.by_income_level.30001-48000",
  "latest.cost.net_price.public.by_income_level.48001-75000",
  "latest.cost.net_price.public.by_income_level.75001-110000",
  "latest.cost.net_price.public.by_income_level.110001-plus",
  "latest.aid.pell_grant_rate",
  "latest.aid.federal_loan_rate",
  "latest.aid.median_debt.completers.overall",
  "latest.completion.completion_rate_less_than_4yr_150nt",
  "latest.completion.completion_rate_less_than_4yr_200nt",
  "latest.completion.transfer_rate.less_than_4yr.full_time",
  "latest.earnings.10_yrs_after_entry.median",
];

const FIELDS_PARAM = FIELDS.join(",");

/**
 * Canonical persisted shape. This is what gets written to
 * `data/{state}/scorecard/{college}.json` once per ingest cycle.
 *
 * Every number-valued field is nullable because Scorecard suppresses values
 * with small cohorts and not every metric applies to every institution.
 * Consumers must handle null gracefully (don't show "$null tuition").
 */
export interface ScorecardRecord {
  /** IPEDS unitid — the federal institution ID. */
  unitid: number;
  schoolName: string;
  state: string;
  city: string;
  schoolUrl: string | null;
  /**
   * 1 = public, 2 = private nonprofit, 3 = private for-profit.
   * Community colleges in this codebase should all be ownership === 1.
   */
  ownership: number | null;
  /**
   * Predominant degree awarded: 1 = certificate, 2 = associate's,
   * 3 = bachelor's, 4 = graduate. Used during the unitid-mapping flow
   * to filter to two-year institutions.
   */
  predominantDegree: number | null;
  /** When this record was fetched, ISO 8601. Used for freshness checks. */
  fetchedAt: string;

  /** Enrollment headcount. */
  size: number | null;
  /** Share of first-generation students (0–1). */
  shareFirstGeneration: number | null;

  cost: {
    tuitionInState: number | null;
    tuitionOutOfState: number | null;
    attendanceAcademicYear: number | null;
    avgNetPricePublic: number | null;
    bookSupply: number | null;
    roomBoardOffCampus: number | null;
    /**
     * Net price after aid, banded by family income. The dollar value is
     * what a student in that band would actually pay per year.
     */
    netPriceByIncome: {
      "0_30000": number | null;
      "30001_48000": number | null;
      "48001_75000": number | null;
      "75001_110000": number | null;
      "110001_plus": number | null;
    };
  };

  aid: {
    /** Share of students receiving Pell grants (0–1). */
    pellGrantRate: number | null;
    /** Share receiving federal loans (0–1). */
    federalLoanRate: number | null;
    /** Median cumulative debt for completers, $. */
    medianDebtCompleters: number | null;
  };

  completion: {
    /** 150%-of-normal-time completion rate for <4yr institutions (0–1). */
    completionRate150nt: number | null;
    /** 200%-of-normal-time completion rate for <4yr institutions (0–1). */
    completionRate200nt: number | null;
    /** Transfer-out rate for full-time <4yr students (0–1). */
    transferRate: number | null;
  };

  earnings: {
    /** Median earnings 10 years after enrollment entry, $. */
    median10YrsAfterEntry: number | null;
  };
}

/** Raw Scorecard API response row. We map this into ScorecardRecord. */
interface ScorecardApiRow {
  id?: number;
  "school.name"?: string | null;
  "school.state"?: string | null;
  "school.city"?: string | null;
  "school.school_url"?: string | null;
  "school.ownership"?: number | null;
  "school.degrees_awarded.predominant"?: number | null;
  "latest.student.size"?: number | null;
  "latest.student.share_firstgeneration"?: number | null;
  "latest.cost.tuition.in_state"?: number | null;
  "latest.cost.tuition.out_of_state"?: number | null;
  "latest.cost.attendance.academic_year"?: number | null;
  "latest.cost.avg_net_price.public"?: number | null;
  "latest.cost.booksupply"?: number | null;
  "latest.cost.roomboard.offcampus"?: number | null;
  "latest.cost.net_price.public.by_income_level.0-30000"?: number | null;
  "latest.cost.net_price.public.by_income_level.30001-48000"?: number | null;
  "latest.cost.net_price.public.by_income_level.48001-75000"?: number | null;
  "latest.cost.net_price.public.by_income_level.75001-110000"?: number | null;
  "latest.cost.net_price.public.by_income_level.110001-plus"?: number | null;
  "latest.aid.pell_grant_rate"?: number | null;
  "latest.aid.federal_loan_rate"?: number | null;
  "latest.aid.median_debt.completers.overall"?: number | null;
  "latest.completion.completion_rate_less_than_4yr_150nt"?: number | null;
  "latest.completion.completion_rate_less_than_4yr_200nt"?: number | null;
  "latest.completion.transfer_rate.less_than_4yr.full_time"?: number | null;
  "latest.earnings.10_yrs_after_entry.median"?: number | null;
}

interface ScorecardApiResponse {
  metadata: { page: number; total: number; per_page: number };
  results: ScorecardApiRow[];
}

function requireApiKey(): string {
  loadEnv();
  const key = process.env.COLLEGE_SCORECARD_API_KEY;
  if (!key) {
    throw new Error(
      "COLLEGE_SCORECARD_API_KEY is not set. Sign up free at https://api.data.gov/signup and add the key to .env.local."
    );
  }
  return key;
}

function rowToRecord(row: ScorecardApiRow): ScorecardRecord {
  if (typeof row.id !== "number") {
    throw new Error("Scorecard row is missing `id` — likely a bad API response.");
  }
  return {
    unitid: row.id,
    schoolName: row["school.name"] ?? "",
    state: row["school.state"] ?? "",
    city: row["school.city"] ?? "",
    schoolUrl: row["school.school_url"] ?? null,
    ownership: row["school.ownership"] ?? null,
    predominantDegree: row["school.degrees_awarded.predominant"] ?? null,
    fetchedAt: new Date().toISOString(),
    size: row["latest.student.size"] ?? null,
    shareFirstGeneration: row["latest.student.share_firstgeneration"] ?? null,
    cost: {
      tuitionInState: row["latest.cost.tuition.in_state"] ?? null,
      tuitionOutOfState: row["latest.cost.tuition.out_of_state"] ?? null,
      attendanceAcademicYear: row["latest.cost.attendance.academic_year"] ?? null,
      avgNetPricePublic: row["latest.cost.avg_net_price.public"] ?? null,
      bookSupply: row["latest.cost.booksupply"] ?? null,
      roomBoardOffCampus: row["latest.cost.roomboard.offcampus"] ?? null,
      netPriceByIncome: {
        "0_30000": row["latest.cost.net_price.public.by_income_level.0-30000"] ?? null,
        "30001_48000": row["latest.cost.net_price.public.by_income_level.30001-48000"] ?? null,
        "48001_75000": row["latest.cost.net_price.public.by_income_level.48001-75000"] ?? null,
        "75001_110000": row["latest.cost.net_price.public.by_income_level.75001-110000"] ?? null,
        "110001_plus": row["latest.cost.net_price.public.by_income_level.110001-plus"] ?? null,
      },
    },
    aid: {
      pellGrantRate: row["latest.aid.pell_grant_rate"] ?? null,
      federalLoanRate: row["latest.aid.federal_loan_rate"] ?? null,
      medianDebtCompleters: row["latest.aid.median_debt.completers.overall"] ?? null,
    },
    completion: {
      completionRate150nt:
        row["latest.completion.completion_rate_less_than_4yr_150nt"] ?? null,
      completionRate200nt:
        row["latest.completion.completion_rate_less_than_4yr_200nt"] ?? null,
      transferRate:
        row["latest.completion.transfer_rate.less_than_4yr.full_time"] ?? null,
    },
    earnings: {
      median10YrsAfterEntry:
        row["latest.earnings.10_yrs_after_entry.median"] ?? null,
    },
  };
}

/**
 * Fetch a single institution by IPEDS unitid. Returns null if not found.
 * Throws on transport errors or auth failures.
 */
export async function fetchScorecardByUnitid(
  unitid: number
): Promise<ScorecardRecord | null> {
  const key = requireApiKey();
  const url = `${API_BASE}?id=${unitid}&fields=${encodeURIComponent(FIELDS_PARAM)}&api_key=${key}`;
  const data = await fetchJsonWithRetry<ScorecardApiResponse>(url, undefined, {
    label: `scorecard:${unitid}`,
  });
  if (!data.results || data.results.length === 0) return null;
  return rowToRecord(data.results[0]);
}

/**
 * Search Scorecard for institutions matching a name and state. Useful for
 * the unitid-mapping work (PR 2) — given a college name from
 * institutions.json, find candidate IPEDS matches. Returns up to 20 results.
 *
 * Caller is responsible for disambiguating: a query like "Northern Virginia"
 * matches both NVCC and a massage school. Real CC ingest should filter to
 * results with non-null `latest.cost.tuition.in_state` and large
 * enrollment.
 */
export async function searchScorecardByName(
  name: string,
  state: string
): Promise<ScorecardRecord[]> {
  const key = requireApiKey();
  const url =
    `${API_BASE}?school.name=${encodeURIComponent(name)}` +
    `&school.state=${encodeURIComponent(state.toUpperCase())}` +
    `&fields=${encodeURIComponent(FIELDS_PARAM)}` +
    `&api_key=${key}`;
  const data = await fetchJsonWithRetry<ScorecardApiResponse>(url, undefined, {
    label: `scorecard-search:${name}/${state}`,
  });
  return (data.results ?? []).map(rowToRecord);
}
