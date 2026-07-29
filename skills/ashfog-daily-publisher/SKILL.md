---
name: ashfog-daily-publisher
description: Research, draft, validate, and publish the English-language ASHFOG global daily AI, open-source, developer-tool, infrastructure, research, policy, and community intelligence brief. Use for scheduled ASHFOG daily research, Preview runs, Publish runs, source verification, daily JSON generation, publication retries, or validation of src/content/daily/YYYY-MM-DD.json in ashfog/blog.
---

# ASHFOG Daily Publisher

Produce one evidence-backed global daily edition as a single validated JSON file. Treat discovery, verification, writing, validation, and publication as one fail-closed transaction.

## Select a mode

Use Preview when the user does not name a mode. Use Publish only when explicitly requested or in the scheduled automation. A Publish run completes Preview first and writes only after every blocking check passes.

## Load repository rules

Read, in order, `editorial/editorial-policy.md`, `editorial/publishing-rules.json`, `editorial/sources.json`, `editorial/source-access.json`, `editorial/community-policy.md`, `editorial/categories.json`, `editorial/evidence-labels.json`, `editorial/image-library.json`, and `schemas/daily.schema.json`. Repository files are the source of truth; do not duplicate them in the automation prompt.

## Run the pipeline

1. Determine `editionDate` at 09:30:00 in `America/New_York`. Set `cutoffAt` to that timezone-aware instant and `windowStartAt` to exactly 24 hours earlier. Use `schemaVersion: 2`. Set `generatedAt` to the actual instant after research and drafting finish; never copy `cutoffAt` into it.
2. If `src/content/daily/YYYY-MM-DD.json` already exists, inspect only its version and cutoff metadata. Return `already_valid` only when it is already a valid v2 New York edition for that cutoff. Otherwise treat the target as obsolete output, never as a migration template: do not copy its title, description, analysis, stories, candidates, source scans, counts, timestamps, or wording. Start a blank v2 candidate, run the complete collection and editorial pipeline from source data, validate it before touching the target, then atomically replace only that target.
3. Reconcile enabled sources with access plans. Missing, unknown, duplicate, empty, or unsupported plans are blocking defects.
4. Attempt all enabled sources, including all China sources. Date-based routes run once for every New York calendar date intersecting the window. Merge, canonicalize, deduplicate, sort by publication or material-update time, filter to `(windowStartAt, cutoffAt]`, and keep at most the newest 15 per source.
5. Record one `research.sourceScan` row per source using `itemsInWindow`. Use `collected` for one or more in-window entries, `empty` for a working route covering the window with none, and `unavailable` only after all routes fail. Missing rows and `not-run` are blocking.
6. Start verification with Tier A evidence and use Tier C only for discovery. Record every serious candidate and URL before drafting.
7. Merge one event under one `eventId`, compare the previous seven editions, and require `materialUpdate` for a repeated event.
8. Score every serious candidate. Publish every verified event meeting the repository materiality floor. Every unselected serious candidate must appear in the exclusion ledger with a reason. Set `research.seriousCandidateCount` to selected stories plus excluded candidates, and include the full score on every `low-relevance` exclusion. Do not use a story quota; 46 is only an anomaly guard.
9. Perform targeted community checks. Deep-check every highlight on at least two applicable surfaces when available and every repository, model, paper, runtime, or developer-tool candidate on at least one project-attached surface.
10. Treat every adopted nested `communityCheck` signal as a published community finding. Use a standalone community story only for an independent event. Never report community count by standalone stories alone.
11. Lock one fact ledger before writing. Generate one English JSON document with original source URLs, story regions, source languages, exact word limits, and no facts absent from the ledger.
12. Write real paragraph breaks in `dailyAnalysis.body`, then validate a temporary candidate with:

`npm run validate:daily -- <candidate.json> --content-dir src/content/daily --check-links`

Exit code 1 blocks publication. Do not weaken validation, invent replacement evidence, or publish a partial edition.

## Assign images

Omit `imageId` and `heroImageId` by default so Astro assigns unique registered images deterministically. Use explicit IDs only for intentional overrides found in `editorial/image-library.json`; never invent or repeat an ID.

## Preview report

Report candidate path, cutoff and window start, attempted/collected/empty/unavailable/not-run sources, successful fallbacks and route failures, fetched and in-window entries, duplicates, serious candidates, exclusions, selected news, standalone community stories, adopted nested community findings, regional and tier distributions, surfaces attempted, warnings, and validation result. Do not mutate GitHub.

## Publish

Re-read the target and default-branch head. Publish exactly one daily JSON file in one commit without force-pushing or overwriting unrelated work. Handle races idempotently. Re-read and validate the committed file, allow Cloudflare Pages to build Astro and Pagefind, and verify the public edition URL before reporting `published`.

On any access, validation, concurrency, build, or deployment failure, return `blocked` with the exact reason and leave the previous public edition unchanged.
