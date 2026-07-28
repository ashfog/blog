# ASHFOG Daily editorial policy

## Mission

Publish one concise English-language global intelligence brief covering material AI, open-source, developer-tool, infrastructure, research, policy, and community developments. Reduce noise, link every publishable claim to collected evidence, and explain practical consequences.

## Global coverage

- Scan every enabled source inside the 48-hour candidate window, including all enabled China sources.
- Treat China as a permanent part of global AI coverage, not as an occasional special section.
- Write the final edition in English while preserving the original source URL.
- Record each story's region and each primary source's language.
- Do not retain or publish a separate original-language headline.
- Apply the same materiality and evidence standards to every region; regional coverage is never a reason to pad an edition.

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
- Old items newly discovered outside the candidate window unless a documented material update makes them current.
- Community popularity, votes, stars, or repost counts presented as proof.

## Evidence hierarchy

1. Official announcement, repository, release, specification, model card, paper, policy text, or maintainer statement.
2. Reproducible benchmark, issue thread, practitioner report, or respected technical analysis.
3. Media report with original reporting.
4. Aggregator, newsletter, social post, or community discussion used only to discover stronger evidence.

Use the highest available evidence and link the primary source even when a lower-tier source discovered it. A vendor benchmark must be identified as vendor-reported unless independently reproduced.

## Selection

- Use an explicit `cutoffAt` in `Asia/Shanghai`.
- Default to the 48 hours preceding the cutoff.
- Collect every serious candidate; there is no global candidate-count cap.
- Merge coverage of the same event under one `eventId`.
- Compare the previous seven editions and repeat an event only for a documented material update.
- Publish every material event that passes the evidence and relevance standard.
- Never add an item to satisfy a quota and never exclude a material event merely because a routine story target was reached.
- The 30-story Schema maximum is an anomaly guard, not an editorial target. If more than 30 events qualify, publish the 30 most material and record the remainder as `lower-priority`.

## Writing

For every selected item:

- State what changed without marketing language.
- Write an original, self-contained English summary within the exact word limits in `editorial/publishing-rules.json`.
- Explain why it matters to developers, researchers, operators, founders, or open-source users without repeating the summary.
- Preserve uncertainty and configuration-specific caveats.
- Attribute benchmarks and community findings with their conditions.
- Use `could`, `may`, `suggests`, or equivalent wording for inference.
- Keep all published URLs inside `research.collectedUrls`.

Write the daily analysis only after the final story order is locked. Synthesize at least three current story IDs into one edition-specific thesis with a practical implication. Do not reuse prior analysis.

## Copyright and privacy

- Paraphrase sources and quote only a short fragment when wording itself matters.
- Do not reproduce full posts, newsletters, paywalled analysis, or long community comments.
- Do not publish usernames unless identity is material to credibility.
- Do not bypass authentication, paywalls, access controls, robots restrictions, or rate limits.
