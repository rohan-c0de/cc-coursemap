# Triggers — full design

The pipeline has three trigger sources. Each is a detector that returns 0..N candidate briefs. Most runs of most detectors return zero — that's the intent.

## Trigger A — Site data deltas

**Fires when:** the underlying data the blog depends on materially changes between the last snapshot and now.

### What counts as material

Material (fires a candidate):
- A new state appears in the registry (`getAllStates()` returned N+1 vs. last snapshot)
- A new sending↔receiving university pair appears in any `data/{state}/transfer-equiv.json` (a new statewide articulation pathway, not a one-course addition)
- A `StateConfig.seniorWaiver` field changes (citation, age threshold, audit-vs-credit distinction)
- A new institution (college) appears in `data/{state}/institutions.json`

Not material (ignored):
- Course catalog churn — courses added/removed/renamed within an existing college
- ZIP code refreshes
- Scraper run timestamps
- PeopleSoft enrichment summary changes
- Any change to a file the public site does not render

The split exists because course-catalog churn is constant and high-volume — wiring it to the blog would produce daily noise. Statewide articulation changes are rare and high-value.

### Snapshot location

`.blog-pipeline/snapshot.json` at repo root. Committed. Format:

```json
{
  "version": 1,
  "capturedAt": "2026-05-02T14:00:00.000Z",
  "states": ["ct", "dc", "de", "ga", "ma", "md", "me", "nc", "nh", "nj", "ny", "pa", "ri", "sc", "tn", "va", "vt", "wv"],
  "transferPairs": {
    "va": ["nvcc->gmu", "nvcc->vt", "..."],
    "nc": ["..."]
  },
  "seniorWaivers": {
    "va": {"age": 60, "auditOnly": false, "citation": "VA Code § 23.1-..."},
    "nc": {"age": 65, "auditOnly": true, "citation": "..."}
  },
  "institutions": {
    "va": ["nvcc", "tcc", "..."],
    "nc": ["..."]
  }
}
```

The detector loads this, recomputes the same shape from current code/data, and diffs.

### Candidate brief shape from Trigger A

```json
{
  "triggerSource": "data-delta",
  "deltaType": "new-state" | "new-transfer-pair" | "senior-waiver-change" | "new-institution",
  "topic": "Pennsylvania transfer pathways: how PASSHE and the state community college system work together",
  "targetReader": "PA community college student planning to transfer to a public 4-year",
  "searchIntentHypothesis": "PA student searching 'community college transfer pennsylvania' wants to know if their CCAC credits will count at Pitt or Penn State",
  "articleType": "state-spoke",
  "state": "pa",
  "cluster": "transfer-credit-guide",
  "nonDuplicateRationale": "Existing cluster has VA, NC spokes — no PA spoke. Confirmed via getClusterArticles('transfer-credit-guide').",
  "dataSlicePaths": ["data/pa/transfer-equiv.json", "lib/states/pa/config.ts"]
}
```

## Trigger C — Cluster gap detection

**Fires when:** an existing hub article has missing spokes for states that have the relevant data.

### Algorithm

For each article with `clusterRole === 'hub'`:
1. Get all spokes via `getClusterArticles(hub.cluster)`. Note which states are covered.
2. For each state in `getAllStates()` not yet covered:
   - For transfer-themed hubs: check that the state has `StateConfig.transferSupported === true` and a non-trivial `data/{state}/transfer-equiv.json`. If not, skip — there's nothing to write about yet.
   - For senior-waiver-themed hubs: check that `StateConfig.seniorWaiver` exists and is non-trivial. If not, skip.
3. Rank remaining gaps by:
   - State population (proxy for search demand) — desc
   - Number of institutions in the state — desc
   - Hub age (older hub = more PageRank to share) — desc

Return the top candidate per hub, capped at one candidate per hub per run. (Don't generate three PA-themed posts in one run because three different hubs each lack a PA spoke.)

### Why "gaps with data backing" only

A spoke without underlying data becomes filler. The reader hits "Pennsylvania transfer pathways" expecting a substantive guide and gets a thin generic restatement of the hub. That's the failure mode BRIEF.md is designed to prevent. The detector enforces it at the trigger layer.

## Trigger B — Keyword / search-intent

**Fires when:** external search demand reveals an uncovered topic.

### v1 — manual CSV

For v1, this is fully manual. Drop a file at `.blog-pipeline/keyword-candidates.csv`:

```csv
query,monthly_volume,intent_quality_0_to_5,product_alignment_0_to_5
"how to drop a class without owing tuition",1900,4,3
"can i take community college classes while in high school virginia",480,5,5
```

The detector:
1. Reads the CSV (returns zero candidates if file is missing — that's fine)
2. Filters to rows where `monthly_volume >= 200`, `intent_quality >= 3`, `product_alignment >= 3`
3. For each surviving row, runs an embedding-similarity check against existing 33 articles. Reject if cosine similarity > 0.82 against any existing post.
4. Returns surviving rows as candidate briefs

The thresholds are intentional. 200/mo is the floor where ranking is worth the effort. Intent and alignment ≥ 3 filters out vanity traffic — the visitor must plausibly use Community College Path.

### v2 — automated

Wire to DataForSEO, Ahrefs MCP, or Google Trends only after the manual flow proves which kinds of queries actually convert to good articles. Premature automation here will fill the pipeline with junk.

### Why this trigger is third-priority

Keyword candidates lack the natural product alignment that data-delta and cluster-gap candidates have built in. They're easier to write filler for. Treat them as supplementary — don't let them dominate the publishing mix.

## Output contract for all detectors

Each detector script:
- Exits 0 on success (even with zero candidates)
- Writes JSON to stdout: `{"candidates": [...]}`
- Writes diagnostics to stderr (so stdout stays clean for piping)
- Checks `.blog-pipeline/DISABLED` at startup; exits 0 with empty candidates if present
- Never modifies state — purely read-only. Snapshot updates happen in the gate-and-PR stage, not here.
