---
name: blog-pipeline
description: Run the trigger-based blog generation pipeline for Community College Path — detect signals (cluster gaps, data deltas, keyword demand), pick the highest-value candidate, draft an MDX article that conforms to BRIEF.md, run quality gates, and open a draft PR. Use whenever the user wants to publish a new blog post, asks "what should we write next", checks the blog backlog, mentions blog cadence, or wants to evaluate whether the corpus has gaps. Also use when scheduled invocation triggers blog work, or when the user asks to audit existing posts for staleness.
---

# Blog pipeline

Programmatic blog generation for Community College Path. The system is **trigger-based, not cadence-based**: most invocations should produce zero PRs. A post ships only when a real signal fires. Output is always a **draft PR** — a human reviews and merges.

The editorial constitution lives at `content/blog/BRIEF.md`. This skill is the *pipeline* around BRIEF.md — when to write, what to write, and how to enforce quality. It does not replace BRIEF.md; it operationalizes it.

## When to invoke this skill

- "Time to write a new post" / "draft the next blog article" / "what should we publish?"
- "Audit the blog corpus" / "what's missing?" / "any stale posts?"
- A scheduled GitHub Action trigger fires the pipeline
- After adding a new state, transfer agreement, or senior-waiver rule (data-delta trigger may have fired)

## When NOT to invoke

- A user asks to *edit* an existing post — that's a regular edit task, not a pipeline run.
- A user asks for general blog/SEO advice — answer directly; the pipeline is for shipping concrete drafts.
- Cross-state transfer content. Per the user's standing memory, transfer mappings are in-state only.

## The four-stage flow

Every invocation follows this sequence. Don't skip stages — silent failures here ship bad posts.

```
1. DETECT     → run all three trigger detectors, collect candidates
2. PRIORITIZE → rank candidates, skip already-drafted slugs, keep ALL qualifying
3. DRAFT      → for each candidate in priority order, call the LLM
4. GATE & PR  → for each draft, run quality gates and open a draft PR
```

Stages 3 and 4 loop per candidate. A single invocation can produce N draft PRs where N is the number of qualifying candidates returned by the detectors.

### Stage 1 — Detect

Run the detectors in parallel. Each returns 0..N candidate briefs. See `references/triggers.md` for the full design of each trigger source.

```bash
npx tsx .claude/skills/blog-pipeline/scripts/detect-cluster-gaps.ts > /tmp/blog-candidates-c.json
npx tsx .claude/skills/blog-pipeline/scripts/detect-data-deltas.ts > /tmp/blog-candidates-a.json
npx tsx .claude/skills/blog-pipeline/scripts/detect-prereq-bottlenecks.ts > /tmp/blog-candidates-d.json
# Trigger B (keyword/search) is manual-input for now — see references/triggers.md
```

A candidate brief is JSON with: `triggerSource`, `topic`, `targetReader`, `searchIntentHypothesis`, `articleType` (`general` | `state-spoke` | `college-spoke` | `hub`), `state` (or `null`), optional `college` (slug), `cluster` (or `null`), `nonDuplicateRationale`, `dataSlicePaths` (file paths whose contents the drafter must read).

**College-spoke articles** are pinned to a specific institution within a covered state (e.g., Germanna Community College, Wake Tech, Brookdale Community College). They draft from that institution's `audit_policy` data — costs, contact email, application steps — and target search-intent tail like "[college name] audit class." The hub is general; the spoke is institutional. The renderer still routes the article under its `state` for navigation; the `college` field ties it to the institution for cluster-gap detection and cross-linking. Word-count range: 800–1500.

If all detectors return zero candidates, **stop and report "no triggers fired this run"**. This is the expected outcome most of the time.

**Data-driven detectors write precomputed slice files** (under `.blog-pipeline/slices/`) and reference them in `dataSlicePaths`. The drafter consumes those slices verbatim — every numeric claim in the article must come from a slice file, not LLM speculation. The prereq-bottleneck detector is the first such detector; future ones (course-availability, instructor-density, transfer-mapping patterns) follow the same convention.

### Stage 2 — Prioritize

Sort candidates by the priority bands below (high to low). The pipeline drafts every qualifying candidate, in priority order, in the same invocation. The ordering matters because: (a) each draft consumes context budget, so the highest-value posts should be drafted while the model is freshest, and (b) if you abort the run mid-batch, you want the most important PRs to already exist.

1. Data-delta candidates from a brand-new state (registry just gained an entry)
2. Cluster-gap candidates for a hub with ≥2 existing spokes (proves the cluster has demand)
3. Data-delta candidates from a new transfer agreement or senior-waiver rule change
4. Cluster-gap candidates for hubs with 0–1 spokes
5. Keyword candidates (only when both intent quality and product alignment are high)

**Already-drafted check:** read `.blog-pipeline/cooldown.json` (kept as a ledger of what's already been drafted) and skip any candidate whose slug appears there. The original 2-per-7-days rate cap was removed in favor of relying on the quality gates: G1 word-count, G3 banned-phrase, and G4 embedding similarity already block thin or near-duplicate output, which is what a rate cap was a crude proxy for. Reviewer throughput is the real bottleneck — the human can ignore unreviewed PRs without skill changes.

The ledger file name is preserved (`cooldown.json`) for backward compatibility with existing entries, even though it no longer enforces a cooldown.

### Stage 3 — Draft

The drafter is a single LLM call. Read `references/prompt-template.md` for the exact prompt structure — it wraps `content/blog/BRIEF.md` verbatim with the candidate brief and data slice.

The drafter must produce, in this order:
1. The full BRIEF.md "Output expectations" block (title, type, target reader, search intent, strategic rationale, review-cadence flag, full draft, suggested links, follow-up companions)
2. The exact `ArticleMeta` object to insert into `content/blog/index.ts`
3. The full `.mdx` file body to write to `content/blog/<slug>.mdx`

Cluster spokes must be drafted only after reading the existing hub article — pass the hub's full text into the prompt. Spokes that don't reference their hub fail the quality gates.

### Stage 4 — Gate and PR

Run the quality gates against the draft. See `references/quality-gates.md` for the full gate list and the banned-phrase set.

```bash
npx tsx .claude/skills/blog-pipeline/scripts/quality-gates.ts \
  --draft /tmp/blog-draft.json \
  --slug <slug>
```

If any gate fails for a given candidate, **do not open a PR for that candidate**. Report which gate failed, mark that candidate as skipped in the run summary, and continue to the next candidate in priority order. Do not "fix and retry" silently — a gate failure means the drafter produced something the brief wouldn't accept, and that signal is worth surfacing to the human even if other candidates in the same batch ship cleanly.

A failed candidate does NOT abort the rest of the batch. Each candidate is drafted and gated independently.

If all gates pass:

1. Branch: `claude/blog-<trigger-source>-<slug>` (e.g., `claude/blog-cluster-gap-pa-senior-waivers`)
2. Apply the edit: insert the `ArticleMeta` into `content/blog/index.ts` and write `content/blog/<slug>.mdx`
3. Run `npm run build` locally to prove the edit compiles. If the build fails, do not open the PR.
4. Update `.blog-pipeline/cooldown.json` with the new entry (slug + ISO timestamp)
5. Update `.blog-pipeline/snapshot.json` if a data-delta trigger fired (so the same delta doesn't refire)
6. `gh pr create --draft` with the body from the BRIEF.md output block, plus the reviewer checklist below

Reviewer checklist (paste into PR body):

```markdown
## Reviewer checklist
- [ ] Read for fluff. Any "Top N tips" energy? Any generic education-blog filler?
- [ ] Verify factual claims (cite the data slice paths the drafter used)
- [ ] Click every internal link — do they resolve to existing posts/tools?
- [ ] State-specific posts: confirm StateToolsCTA renders top + bottom
- [ ] Cluster spokes: confirm the hub link is present and a sibling spoke is referenced
- [ ] If review-cadence flag is true, add a calendar reminder for annual review
```

## Kill switch

If a bad post ships, disable the pipeline immediately by creating an empty file at the repo root:

```bash
touch .blog-pipeline/DISABLED
```

Every detector script checks for this file at startup and exits 0 if present. Remove the file to re-enable. The scheduled GitHub Action also checks for this file before running.

## Snapshot management

The data-delta detector compares current registry/data state against `.blog-pipeline/snapshot.json`. To bootstrap or rebuild the snapshot (e.g., after a corpus rewrite):

```bash
npx tsx .claude/skills/blog-pipeline/scripts/snapshot-state.ts > .blog-pipeline/snapshot.json
```

Commit the snapshot — it's the source of truth for "what was the world like last time we ran." A missing snapshot makes every state and every transfer agreement look new, which would flood the pipeline.

## Scheduled invocation

The pipeline is wired to run on a cron via `.github/workflows/blog-pipeline.yml`. The workflow runs the detectors on a schedule (default: weekly Mondays at 14:00 UTC) and invokes Claude Code with this skill if any candidates surface. Most weeks: zero PRs. That's the design.

If you (Claude) are invoked from inside the workflow, behave identically to a manual invocation — the four stages don't change.

## Bundled scripts

| Script | Purpose |
|---|---|
| `scripts/detect-cluster-gaps.ts` | Trigger C — find hubs with missing state spokes; for the `audit-at-college-guide` cluster, surfaces per-college spokes for institutions with rich `audit_policy` data |
| `scripts/detect-data-deltas.ts` | Trigger A — diff current data against last snapshot |
| `scripts/detect-prereq-bottlenecks.ts` | Trigger D — mine `data/{state}/prereqs.json` for chain depth and blocker courses; emits a candidate per state with ≥5 chains of depth ≥3, plus a precomputed stats slice the drafter must consume |
| `scripts/snapshot-state.ts` | Capture current registry/data state |
| `scripts/quality-gates.ts` | Run all quality gates against a draft |

Trigger B (keyword/search-intent) is intentionally manual for v1: drop a CSV at `.blog-pipeline/keyword-candidates.csv` with columns `query,monthly_volume,intent_quality_0_to_5,product_alignment_0_to_5`. The pipeline reads it during the detect stage. Wire to DataForSEO or similar later when the manual flow proves valuable.

## References

- `references/triggers.md` — full design of each trigger source, including detector algorithms and "what counts as material"
- `references/quality-gates.md` — gate definitions, thresholds, banned-phrase list, and rationale for each
- `references/prompt-template.md` — the exact LLM prompt template that wraps BRIEF.md
- `content/blog/BRIEF.md` (in repo) — editorial constitution. Read this before drafting, every time.
- `CLAUDE.md` (in repo) — architectural invariants, especially the no-hardcoded-state-lists rule
