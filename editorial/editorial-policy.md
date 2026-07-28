# AshFog Daily editorial policy

## Mission

Publish one concise Chinese-language daily intelligence brief covering material AI, open-source, developer-tool, infrastructure, research, and policy developments. Reduce noise, link every publishable claim to collected evidence, and explain practical consequences.

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

1. Official announcement, repository, release, specification, model card, paper, or maintainer statement.
2. Reproducible benchmark, issue thread, practitioner report, or respected technical analysis.
3. Media report with original reporting.
4. Aggregator, newsletter, social post, or community discussion used only to discover stronger evidence.

Use the highest available evidence and link the primary source even when a lower-tier source discovered it.

## Selection

- Use an explicit `cutoffAt` in `Asia/Shanghai`.
- Default to the 48 hours preceding the cutoff.
- Merge coverage of the same event under one `eventId`.
- Compare the previous seven editions and repeat an event only for a documented material update.
- Prefer quality over quota and provide `qualityShortfallReason` whenever minimum targets are not met.
- Apply the numeric limits in `editorial/publishing-rules.json`.

## Writing

For every selected item:

- State what changed without marketing language.
- Write an original concise summary.
- Explain why it matters to developers, researchers, operators, founders, or open-source users.
- Preserve uncertainty and configuration-specific caveats.
- Attribute benchmarks and community findings with their conditions.
- Keep all published URLs inside `research.collectedUrls`.

Write the daily analysis only after the final story order is locked. Synthesize at least three current story IDs into one edition-specific thesis with a practical implication. Do not reuse prior analysis.

## Copyright and privacy

- Paraphrase sources and quote only a short fragment when wording itself matters.
- Do not reproduce full posts, newsletters, paywalled analysis, or long community comments.
- Do not publish usernames unless identity is material to credibility.
- Do not bypass authentication, paywalls, access controls, robots restrictions, or rate limits.
