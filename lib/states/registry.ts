/**
 * State registry — central configuration for multi-state expansion.
 *
 * Each state is defined by a StateConfig that encapsulates all state-specific
 * data: college system details, policies, branding, and external URLs.
 * Shared library code uses the state slug to load the right config + data.
 */

export interface SeniorWaiverConfig {
  ageThreshold: number;
  legalCitation: string;
  description: string;
  bannerTitle: string;
  bannerSummary: string;
  bannerDetail: string;
}

/**
 * One scrape job unit: a group of scripts run on the same runner.
 * A state can have multiple jobs per data type when scrapers target
 * different platforms (e.g. VA courses splits across VCCS-HTTP and
 * PeopleSoft-Playwright).
 *
 * `scripts` are repo-relative tsx paths, e.g. "scripts/va/scrape-vccs.ts".
 * `runner` controls whether the scheduled workflow needs Playwright installed.
 */
export interface ScrapeJob {
  scripts: string[];
  runner: "http" | "playwright";
}

/**
 * Declares which scheduled-scrape coverage a state has. Issue #59: this
 * registry field — not YAML — is the source of truth for what gets
 * re-scraped on cron. A unified workflow (PR 2) reads these entries to
 * build its matrix. A CI check (PR 1, this PR) fails any change that
 * registers a new state without populating this field or explicitly
 * opting out.
 */
export interface ScraperCoverage {
  /** Course-section scrapers, writing data/{state}/courses/**. */
  courses?: ScrapeJob[];
  /** Transfer-equivalency scrapers, writing data/{state}/transfer-equiv.json. */
  transfers?: ScrapeJob[];
  /**
   * Prereq coverage. Either dedicated scrape jobs writing data/{state}/prereqs.json,
   * or `aggregate-from-courses` for states where prereqs are flattened out of
   * the course scrape (prerequisite_text field on each section) rather than
   * scraped independently.
   */
  prereqs?: ScrapeJob[] | { source: "aggregate-from-courses" };
}

export interface StateConfig {
  /** Two-letter lowercase state slug, e.g. "va", "md", "nc" */
  slug: string;
  /** Full state name, e.g. "Virginia" */
  name: string;
  /** Name of the community college system, e.g. "VCCS" */
  systemName: string;
  /** Full name of the system, e.g. "Virginia Community College System" */
  systemFullName: string;
  /** System website URL */
  systemUrl: string;
  /** Number of colleges in the system */
  collegeCount: number;
  /** Senior tuition waiver config, or null if no waiver exists */
  seniorWaiver: SeniorWaiverConfig | null;
  /** Whether transfer equivalency data is available */
  transferSupported: boolean;
  /** Popular CC courses for transfer compare presets (e.g. ["ENGL 1101", "MATH 1111"]) */
  popularCourses: string[];
  /** Build the external course discovery URL for a specific course */
  courseDiscoveryUrl: (collegeSlug: string, prefix: string, number: string, term?: string) => string;
  /** Build the external URL for a college's course listing page */
  collegeCoursesUrl: (collegeSlug: string) => string;
  /** Default zip code placeholder for search forms */
  defaultZip: string;
  /** Default city for the search form placeholder (paired with defaultZip), e.g. "Atlanta" */
  defaultZipCity: string;
  /** Branding and SEO */
  branding: {
    siteName: string;
    tagline: string;
    footerText: string;
    disclaimer: string;
    metaKeywords: string[];
  };
  /**
   * Scheduled-scrape coverage. Declarative source of truth for cron
   * orchestration — see issue #59. Leaving this `undefined` requires a
   * `// manual-only: <reason>` marker in the config file (enforced by
   * scripts/check-scraper-coverage.ts).
   */
  scrapers?: ScraperCoverage;
}

// ---------------------------------------------------------------------------
// Registry — static imports so this module is safe on the edge runtime.
// `require()` only works on Node; static `import` gets statically analyzed
// and bundled by Turbopack/Next for both Node and edge.
// ---------------------------------------------------------------------------

import vaConfig from "./va/config";
import ncConfig from "./nc/config";
import scConfig from "./sc/config";
import dcConfig from "./dc/config";
import mdConfig from "./md/config";
import gaConfig from "./ga/config";
import deConfig from "./de/config";
import tnConfig from "./tn/config";
import nyConfig from "./ny/config";
import riConfig from "./ri/config";
import vtConfig from "./vt/config";
import ctConfig from "./ct/config";
import meConfig from "./me/config";
import paConfig from "./pa/config";
import njConfig from "./nj/config";
import nhConfig from "./nh/config";
import maConfig from "./ma/config";

const ALL_CONFIGS: StateConfig[] = [
  vaConfig,
  ncConfig,
  scConfig,
  dcConfig,
  mdConfig,
  gaConfig,
  deConfig,
  tnConfig,
  nyConfig,
  riConfig,
  vtConfig,
  ctConfig,
  meConfig,
  paConfig,
  njConfig,
  nhConfig,
  maConfig,
];

const configs: Record<string, StateConfig> = Object.fromEntries(
  ALL_CONFIGS.map((c) => [c.slug, c])
);

/** Get the config for a specific state. Throws if unknown. */
export function getStateConfig(slug: string): StateConfig {
  const cfg = configs[slug];
  if (!cfg) {
    throw new Error(`Unknown state: "${slug}". Available: ${Object.keys(configs).join(", ")}`);
  }
  return cfg;
}

/** Get all registered state configs. */
export function getAllStates(): StateConfig[] {
  return ALL_CONFIGS;
}

/** Check if a state slug is valid. */
export function isValidState(slug: string): boolean {
  return slug in configs;
}

/** Get the default state slug (used for redirects / single-state mode). */
export function getDefaultState(): string {
  return "va";
}
