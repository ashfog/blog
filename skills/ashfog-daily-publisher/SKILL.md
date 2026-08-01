---
name: ashfog-daily-publisher
description: Collect, deduplicate, write, validate, and publish the English-language ASHFOG Daily as one thematic article with linked source signals and integrated community voices. Use for scheduled ASHFOG daily runs, preview runs, publication retries, source collection, daily JSON generation, or validation of src/content/daily/YYYY-MM-DD.json in ashfog/blog.
---

# ASHFOG Daily Publisher

Produce one English daily edition from the repository's registered sources. Keep the pipeline deterministic, concise, and tolerant of individual source and link failures.

## Load repository rules

Read `editorial/editorial-policy.md`, `editorial/publishing-rules.json`, `editorial/sources.json`, `editorial/source-access.json`, `editorial/community-policy.md`, `editorial/categories.json`, `editorial/evidence-labels.json`, `editorial/image-library.json`, and `schemas/daily.schema.json`. Treat these files as the source of truth.

## Run the pipeline

1. Set `editionDate` and `cutoffAt` to 09:30:00 in `America/New_York`. Set `windowStartAt` to exactly 24 hours earlier and use the half-open interval `(windowStartAt, cutoffAt]`. Use `schemaVersion: 3`, create a unique `runId`, and set `generatedAt` when drafting finishes.
2. Start from a blank candidate. Never copy wording, stories, counts, or research from an existing edition. A Publish retry may replace only the target date after the new candidate passes local validation.
3. Attempt all 54 registered sources, including every China and community source. Use the ordered routes in `editorial/source-access.json`. Keep at most the newest 15 in-window entries per source and never backfill outside the window.
4. Record exactly one `research.sourceScan` row per source. Use `collected` when a working route yields in-window entries, `empty` when it yields none, and `unavailable` when all routes fail. A source failure never blocks the edition after its attempt is recorded.
5. Normalize all in-window entries once. In the same pass:
   - discard only entries that are clearly outside the site's AI, open-source, developer-tool, infrastructure, research, policy, or community scope;
   - group every report about the same underlying release, model, paper, policy, repository change, or community event under one `eventId`;
   - keep one signal per event and prefer the official announcement, repository, paper, specification, or policy URL when present;
   - attach concrete in-window community reactions, tests, adoption evidence, or maintainer clarifications to the matching signal as `communityVoices` rather than duplicating its event.
6. Do not score importance, rank materiality, create an exclusion ledger, enforce regional or company quotas, or perform follow-up community searches. Treat configured community sources as normal collection sources and publish independent community events as `origin: "community"`.
7. When more than 46 independent events remain, keep the newest 46 by the event's publication or material-update timestamp. The limit is an anomaly guard, not an editorial ranking.
8. Preserve each selected entry's collected source URL exactly as supplied. Do not fetch it again, validate it, inspect its host, resolve redirects, or block publication because of a link.
9. Generate an original English headline and concise factual `brief` for every selected event. Do not generate a long per-item summary or `whyItMatters`; the article provides interpretation once, without repetition.
10. After the signal list is final, generate one `article`:
    - a 150–250 word `synthesis` with real paragraph breaks;
    - normally 4–7 thematic `sections`, each with continuous explanatory prose and the exact supporting `signalIds`;
    - `otherSignalIds` for valid events that do not fit a coherent theme.
    Reference every signal exactly once across sections and `otherSignalIds`. Integrate community voices into the relevant theme instead of creating a separate community chapter. Target 1,500–2,500 words for a normal edition without padding a quiet day.
11. Keep `research.sourceScan` and `research.warnings` only. Derive all counts from the source scan and final signals instead of duplicating link, unavailable-source, candidate, or exclusion ledgers.
12. Validate the temporary candidate locally:

`npm run validate:daily -- <candidate.json>`

Validation checks JSON structure, content lengths, the New York time window, all-source accounting, registered metadata, image assignments, and duplicate event IDs. It never makes network requests.

## Assign images

Omit `imageId` and `heroImageId` by default so Astro assigns unique registered images deterministically. Use explicit IDs only for intentional overrides found in `editorial/image-library.json`.

## Preview report

Report the candidate path, cutoff and window start, attempted/collected/empty/unavailable sources, fetched and in-window entries, discarded out-of-scope entries, merged duplicate entries, selected signals, adopted community voices, article sections, total article words, warnings, and validation result. Do not mutate GitHub.

## Publish

After local validation succeeds, replace only `src/content/daily/YYYY-MM-DD.json`, commit that file, and push without force. Allow Cloudflare Pages to build Astro and Pagefind. Do not perform a separate public-link validation step.

Return `blocked` only for an invalid JSON candidate, an incomplete 54-source attempt ledger, a concurrency conflict, or a GitHub write failure. Individual source, article-link, community-platform, build-observation, or deployment-observation failures do not invalidate an otherwise publishable edition.
