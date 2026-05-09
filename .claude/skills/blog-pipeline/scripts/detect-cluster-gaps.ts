#!/usr/bin/env tsx
/**
 * Trigger C — cluster gap detection.
 * See ../references/triggers.md §"Trigger C"
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { articles, type ArticleMeta } from "../../../../content/blog/index";
import { getAllStates } from "../../../../lib/states/registry";

const REPO_ROOT = resolve(__dirname, "../../../..");
const DISABLED = resolve(REPO_ROOT, ".blog-pipeline/DISABLED");

type Candidate = {
  triggerSource: "cluster-gap";
  topic: string;
  targetReader: string;
  searchIntentHypothesis: string;
  articleType: "state-spoke";
  state: string;
  cluster: string;
  nonDuplicateRationale: string;
  dataSlicePaths: string[];
  rankScore: number;
};

function transferEquivCount(stateSlug: string): number {
  const path = resolve(REPO_ROOT, `data/${stateSlug}/transfer-equiv.json`);
  if (!existsSync(path)) return 0;
  try {
    const data = JSON.parse(readFileSync(path, "utf-8"));
    return Array.isArray(data) ? data.length : 0;
  } catch {
    return 0;
  }
}

function institutionCount(stateSlug: string): number {
  const path = resolve(REPO_ROOT, `data/${stateSlug}/institutions.json`);
  if (!existsSync(path)) return 0;
  try {
    const data = JSON.parse(readFileSync(path, "utf-8"));
    return Array.isArray(data) ? data.length : 0;
  } catch {
    return 0;
  }
}

function detect(): Candidate[] {
  const hubs = articles.filter((a) => a.clusterRole === "hub");
  const states = getAllStates();
  const candidates: Candidate[] = [];

  for (const hub of hubs) {
    const cluster = hub.cluster;
    if (!cluster) continue;

    const spokes = articles.filter(
      (a) => a.cluster === cluster && a.clusterRole === "spoke"
    );
    const coveredStates = new Set(
      spokes.map((s) => s.state).filter((s): s is string => s !== null)
    );

    // Theme detection drives whether a state has the data backing required
    // to support this hub's spoke. Hubs without a clear theme don't get
    // gap candidates — they need editorial judgment, not automation.
    const isTransferTheme =
      hub.category === "transfer-confusion" ||
      hub.tags.includes("transfer");
    const isSeniorTheme =
      hub.category === "senior-waivers" ||
      hub.tags.includes("seniors");
    const isSessionTheme =
      hub.category === "session-timing" ||
      hub.tags.includes("session-timing");

    if (!isTransferTheme && !isSeniorTheme && !isSessionTheme) continue;

    const gaps = states.filter((s) => {
      if (coveredStates.has(s.slug)) return false;
      if (isTransferTheme) {
        return s.transferSupported && transferEquivCount(s.slug) >= 5;
      }
      if (isSeniorTheme) {
        return Boolean(s.seniorWaiver);
      }
      if (isSessionTheme) {
        // Session-timing spokes only make sense for states where we have
        // real course data — the spoke needs to cite actual session codes
        // and start dates from the schedule. Use institution count as the
        // proxy for "we have data here."
        return institutionCount(s.slug) >= 1;
      }
      return false;
    });

    if (gaps.length === 0) continue;

    // Pick the single best gap per hub. Ranking proxies are crude on
    // purpose — institution count and transfer-equiv volume are the only
    // signals the repo has natively without external data.
    gaps.sort((a, b) => {
      const aScore =
        institutionCount(a.slug) * 2 + transferEquivCount(a.slug);
      const bScore =
        institutionCount(b.slug) * 2 + transferEquivCount(b.slug);
      return bScore - aScore;
    });

    const top = gaps[0];
    const stateName = top.name;
    const slicePaths = isTransferTheme
      ? [`data/${top.slug}/transfer-equiv.json`, `lib/states/${top.slug}/config.ts`]
      : isSessionTheme
        ? [`data/${top.slug}/courses`, `lib/states/${top.slug}/config.ts`]
        : [`lib/states/${top.slug}/config.ts`];

    const topic = isTransferTheme
      ? `${stateName} community college transfer: state-specific spoke for "${hub.title}"`
      : isSessionTheme
        ? `${stateName} community college sessions and calendar timing: state-specific spoke for "${hub.title}"`
        : `${stateName} senior tuition waivers: state-specific spoke for "${hub.title}"`;
    const targetReader = isTransferTheme
      ? `${stateName} community college student planning to transfer`
      : isSessionTheme
        ? `${stateName} community college student planning a schedule across full-term, 8-week, mini-mester, and summer sessions`
        : `${stateName} resident 60+ considering free or reduced-cost classes`;
    const searchIntentHypothesis = isTransferTheme
      ? `User searching "${stateName.toLowerCase()} community college transfer" wants to know how the in-state articulation works and what their credits will count for`
      : isSessionTheme
        ? `User searching "${stateName.toLowerCase()} community college 8-week classes" or "${stateName.toLowerCase()} mini-mester" wants to know what session formats local colleges actually offer and when they run`
        : `User searching "${stateName.toLowerCase()} senior tuition waiver" wants to know if they qualify and what restrictions apply`;

    candidates.push({
      triggerSource: "cluster-gap",
      topic,
      targetReader,
      searchIntentHypothesis,
      articleType: "state-spoke",
      state: top.slug,
      cluster,
      nonDuplicateRationale: `Cluster "${cluster}" has ${spokes.length} spoke(s), none for ${stateName}. Verified by querying articles[].cluster.`,
      dataSlicePaths: slicePaths,
      rankScore:
        institutionCount(top.slug) * 2 + transferEquivCount(top.slug),
    });
  }

  return candidates;
}

function main() {
  if (existsSync(DISABLED)) {
    process.stdout.write(JSON.stringify({ candidates: [], disabled: true }));
    process.exit(0);
  }

  try {
    const candidates = detect();
    process.stderr.write(
      `[detect-cluster-gaps] found ${candidates.length} candidate(s)\n`
    );
    process.stdout.write(JSON.stringify({ candidates }, null, 2));
    process.exit(0);
  } catch (err) {
    process.stderr.write(`[detect-cluster-gaps] error: ${String(err)}\n`);
    process.stdout.write(JSON.stringify({ candidates: [], error: String(err) }));
    process.exit(1);
  }
}

main();
