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
3. When code execution is available, run `npm run source:health -- --json` to summarize the previous 14 production editions. Use it only to prefer recently successful machine-readable routes and avoid expensive fallbacks after an authoritative empty result. Never skip a registered source because of history.
4. Attempt all registered sources, including every China and community source, using the adapters and ordered routes in `editorial/source-access.json`. Prefer RSS, JSON APIs, sitemaps, date archives, connected GitHub, and CLI routes over rendered pages and indexed search. Stop after an authoritative dated route covers the window or a route yields in-scope entries; continue after a broad or discovery route returns none. Expand only fixed configured account lists, never candidate-derived handles or terms. Treat X as best-effort and never request credentials or rely on a local login. Keep at most the newest 15 in-window entries per source and never backfill outside the window.
5. Run collection in two phases. First collect only source ID, title, canonical URL, `publishedAt`, and `updatedAt`; apply the exact window, basic scope filter, and cheap URL/title deduplication without reading article bodies. Then fetch full content only for retained candidates and likely representatives of distinct events.
6. Record exactly one `research.sourceScan` row per source. Use `collected` when a working route yields in-window entries, `empty` when an authoritative dated route covers the window but yields none, and `unavailable` when all routes fail or none exposes trustworthy dates. A source failure never blocks the edition after its attempt is recorded.
7. Normalize retained in-window entries once. In the same pass:
   - discard only entries that are clearly outside the site's AI, open-source, developer-tool, infrastructure, research, policy, or community scope;
   - group every report about the same underlying release, model, paper, policy, repository change, or community event under one `eventId`;
   - keep one signal per event and prefer the official announcement, repository, paper, specification, or policy URL when present;
   - attach concrete in-window community reactions, tests, adoption evidence, or maintainer clarifications to the matching signal as `communityVoices` rather than duplicating its event.
8. Do not score importance, rank materiality, create an exclusion ledger, enforce regional or company quotas, or perform follow-up community searches. Treat configured community sources as normal collection sources and publish independent community events as `origin: "community"`.
9. When more than 46 independent events remain, keep the newest 46 by the event's publication or material-update timestamp. The limit is an anomaly guard, not an editorial ranking.
10. Preserve each selected entry's collected source URL exactly as supplied after confirming offline that it is an absolute HTTP or HTTPS URL. Do not fetch it again, test reachability, inspect its host, resolve redirects, or block publication because a remote server is slow or unavailable.
11. Generate an original English headline and concise factual `brief` for every selected event. Do not generate a long per-item summary or `whyItMatters`; the article provides interpretation once, without repetition.
12. After the signal list is final, generate one `article`:
    - an original 6–14 word edition `title` summarizing the common direction across the selected events; never use `ASHFOG Daily`, a date, or an issue number as the title, and do not headline one company when multiple independent events are present;
    - a 150–250 word `synthesis` with real paragraph breaks;
    - normally 4–7 internal `sections`, each with continuous explanatory prose and the exact supporting `signalIds`;
    - `otherSignalIds` for valid events that do not fit a coherent theme.
    Reference every signal exactly once across sections and `otherSignalIds`. Treat sections only as subheadings inside the single daily article, never as separate homepage entries or separate articles. Integrate community voices into the relevant section instead of creating a separate community chapter. Target 1,500–2,500 words for a normal edition without padding a quiet day.
13. Keep `research.sourceScan` and `research.warnings` only. Derive all counts from the source scan and final signals instead of duplicating link, unavailable-source, candidate, or exclusion ledgers.
14. Validate the temporary candidate locally:

`npm run validate:daily -- <candidate.json>`

Validation checks JSON structure, content lengths, the New York time window, all-source accounting, selected-source totals, registered metadata, offline source URL syntax, the optional article-image override, duplicate event IDs, and duplicate event content. It never makes network requests.

## Assign images

Do not assign images to signals or sections. Omit `heroImageId` by default so Astro selects exactly one article image using the edition date and a stable shuffled rotation of the 40-image article pool. Consecutive editions use different images until the pool cycles. Use `heroImageId` only for an intentional override found in `editorial/image-library.json`.

## Preview report

Report the candidate path, cutoff and window start, attempted/collected/empty/unavailable sources, fetched and in-window entries, discarded out-of-scope entries, merged duplicate entries, selected signals, adopted community voices, article sections, total article words, warnings, and validation result. Do not mutate GitHub.

## Publish

After local validation succeeds, replace only `src/content/daily/YYYY-MM-DD.json`, commit that file, and push without force. Cloudflare Pages runs all-edition validation, editorial tests, Astro, Pagefind, and SEO checks through `pnpm run build`. Do not perform a separate public-link validation step.

Return `blocked` only for an invalid JSON candidate, an incomplete all-registered-source attempt ledger, a concurrency conflict, or a GitHub write failure. Individual source, article-link, community-platform, build-observation, or deployment-observation failures do not invalidate an otherwise publishable edition.
