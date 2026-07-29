# Targeted community research

Use communities after serious news candidates have been identified. Community research is evidence work, not a general social-media crawl.

## Light checks

Check community discussion when it can expose compatibility, reproducibility, maintainer clarification, licensing, operational limits, or credible disagreement. Record one of:

- `checked`
- `no_relevant_signal`
- `unavailable`
- `not_applicable`

An unavailable platform is not a publication failure. Record it and continue.

## Deep checks

Deep-check highlight stories when relevant. Prefer:

- Maintainer-confirmed GitHub Issues or Discussions.
- Reproducible commands, logs, benchmark code, or public configurations.
- At least two independent reports when making a broader community claim.
- Hacker News threads that lead back to primary evidence.
- Hugging Face discussions attached to the relevant model, dataset, Space, or paper.
- Targeted Reddit or X checks when access is available and permitted.

For performance evidence, capture model, quantization, hardware, software version, context length, concurrency, commands, and retrieval time. A number without its configuration is not reusable evidence.

## Coverage minimum

- For every highlight candidate, attempt at least two relevant community surfaces when two exist.
- For every repository, model, paper, runtime, or developer-tool candidate, attempt at least one project-attached surface.
- Prefer project-attached evidence over general social discussion: GitHub Issues or Discussions first for repositories, Hugging Face discussions first for models and papers, then Hacker News, Reddit, and targeted X checks.
- A successfully searched surface with no relevant edition-day discussion is `no_relevant_signal`, not `unavailable`.
- Do not manufacture a community story to satisfy a count. If no standalone community event passes the adoption rule, publish zero community stories and report the attempted surfaces and exclusion reasons.

## Access order

1. Use connected GitHub access to search current Issues, Discussions, release comments, and maintainer replies for the exact repository or release.
2. For a Hugging Face model, dataset, Space, or paper, inspect its attached discussion and linked project resources.
3. Search Hacker News by exact canonical URL, repository, model name, or paper title. Use the Firebase API for newest threads and targeted Algolia search for candidate checks; preserve the canonical Hacker News thread URL.
4. Read the LocalLLaMA newest-post RSS route before trying the Reddit page. Restrict checks to candidate names and reproducible configurations.
5. Use X only for named official, maintainer, researcher, or founder accounts around an identified candidate. Never scan the general feed.

Continue to the next applicable route when one platform is blocked. Reddit or X unavailability never prevents GitHub, Hugging Face, or Hacker News checks.

## Standalone community stories

A community finding may become a `kind: "community"` story only when it is an edition-day event with a stable canonical URL and it independently changes adoption advice, compatibility, reproducibility, licensing, maturity, or confidence. Discussion attached to a news event normally belongs in that news story's `communityCheck` instead of becoming a duplicate story.

## Evidence labels

Use labels from `editorial/evidence-labels.json`. Never turn one comment into a general benchmark or consensus.

## Adoption rule

Publish a community signal only when it changes at least one of:

- confidence in the official claim;
- hardware or operational requirements;
- compatibility assessment;
- maturity or readiness judgment;
- licensing or governance interpretation;
- recommendation about who should test, adopt, or wait.

Every adopted signal requires a stable HTTPS URL, retrieval timestamp, author role, evidence label, concise paraphrase, and configuration when applicable.
