# ASHFOG Daily editorial policy

## Mission

Publish one concise English-language global intelligence brief covering material AI, open-source, developer-tool, infrastructure, research, policy, and community developments. Reduce noise, link every publishable claim to collected evidence, and explain practical consequences.

## Global coverage and time window

- Run at 09:30 in `America/New_York`; daylight-saving changes are handled by the named timezone, never by a fixed UTC or Shanghai offset.
- Set `cutoffAt` to that instant and `windowStartAt` to exactly 24 hours earlier. Use the half-open interval `(windowStartAt, cutoffAt]` so an event exactly on a boundary belongs to only one edition.
- Attempt every enabled source on every run, including all enabled China sources.
- From each source, collect at most its 15 newest entries whose publication or material-update timestamp falls inside the window. Use fewer when fewer exist and never backfill outside the window.
- Date-based routes must run for every New York calendar date touched by the window, then merge, deduplicate, sort, apply the exact timestamp filter, and take at most 15.
- Treat China as a permanent part of global AI coverage, not as an occasional special section.
- Write the final edition in English, preserve the original source URL, record the story region and source language, and do not publish a separate original-language headline.
- Apply the same materiality and evidence standards to every region; regional coverage is never a publication quota.

## Include

- Models, agents, training, inference, evaluation, safety, and governance.
- Open models, active repositories, coding agents, local AI, self-hosted tools, and developer infrastructure.
- Material research with plausible engineering or industry impact.
- Hardware, runtimes, protocols, standards, and policies that materially affect AI or open-source work.
- Community findings that change confidence, compatibility, maturity, licensing, performance, or adoption advice.

## Exclude

- Funding-only stories, generic SaaS launches, marketing partnerships, trivial version bumps, listicles, and duplicated media rewrites.
- Stories whose only relevance is that a product contains an AI feature.
- Rumors without accountable sourcing.
- Items outside the trailing 24-hour window without a documented material update inside the window.
- Community popularity, votes, stars, or repost counts presented as proof.

## Evidence hierarchy

1. Official announcement, repository, release, specification, model card, paper, policy text, or maintainer statement.
2. Reproducible benchmark, issue thread, practitioner report, or respected technical analysis.
3. Media report with original reporting.
4. Aggregator, newsletter, social post, or community discussion used only to discover stronger evidence.

Use the highest available evidence and link the primary source even when a lower-tier source discovered it. Identify vendor benchmarks as vendor-reported unless independently reproduced.

## Deterministic selection

- Attempt every registered source and record exactly one `research.sourceScan` row per source.
- Resolve ordered routes from `editorial/source-access.json`, prefer structured access, and continue through fallbacks after failure.
- Mark a source `collected` when a working route has in-window entries, `empty` when a trustworthy route covering the window has none, and `unavailable` only after every configured route fails.
- Collect every serious candidate; there is no global candidate-count cap before selection.
- Merge coverage of the same event under one `eventId` and compare the previous seven editions.
- Publish every verified candidate that has total score at least 16, evidence strength at least 3, relevance at least 3, and either impact or practical utility at least 3.
- Record every serious candidate. Every unselected candidate requires an explicit exclusion reason; never silently discard a candidate after scoring. Record `research.seriousCandidateCount` as exactly selected stories plus excluded candidates, and preserve the full score for every `low-relevance` exclusion.
- Never add an item to satisfy a quota and never exclude a qualifying event because a routine story target was reached.
- The 46-story Schema maximum is an anomaly guard. If more than 46 events qualify, publish the 46 highest-scoring events and record the remainder as `lower-priority`.

## Writing

For every selected item, state what changed without marketing language, write an original English summary and distinct practical consequence within repository word limits, preserve uncertainty, attribute benchmarks and community findings with their conditions, and keep every published URL inside `research.collectedUrls`.

Write the daily analysis only after final story order is locked. Synthesize every current story when the edition has fewer than three, otherwise at least three current story IDs, into one edition-specific thesis, use real paragraph breaks, and do not reuse prior analysis.

## Copyright and privacy

Paraphrase sources, quote only brief wording when necessary, do not reproduce full or paywalled works, avoid unnecessary usernames, and never bypass authentication, paywalls, access controls, robots restrictions, or rate limits.
