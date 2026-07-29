# Targeted community research

Community research is evidence work performed after serious news candidates are identified, not a general social-media crawl.

## Community findings versus stories

- An adopted signal inside a news story's `communityCheck.signals` is a published community finding. It must be counted and displayed in the Community Findings section with its stable source link.
- A standalone `kind: "community"` story is reserved for an independent in-window event that changes adoption advice, compatibility, reproducibility, licensing, maturity, or confidence.
- Discussion attached to a news event normally remains nested under that news event. Do not duplicate it as a standalone story.
- Zero standalone community stories is valid. Zero displayed findings is valid only when no nested signal or standalone story passes the adoption rule.

## Light and deep checks

Record every applicable check as `checked`, `no_relevant_signal`, `unavailable`, or `not_applicable`. An unavailable platform is not a publication failure.

For every highlight, attempt at least two relevant surfaces when two exist. For every repository, model, paper, runtime, or developer-tool candidate, attempt at least one project-attached surface. Prefer GitHub Issues or Discussions for repositories, Hugging Face discussions for models and papers, then Hacker News, LocalLLaMA, and targeted X checks.

Use connected GitHub search for exact repository or release references. Search Hacker News by canonical URL, repository, model name, or paper title. Use LocalLLaMA's newest-post RSS route before its web page. Use X only for named accountable accounts around an identified candidate. Continue to the next applicable route after a blocked platform.

A successfully searched surface with no relevant discussion inside the trailing 24-hour window is `no_relevant_signal`, not `unavailable`. Record checked surfaces and exclusion reasons; never manufacture a finding to reach a count.

## Adoption rule

Adopt a community signal only when it changes confidence in an official claim, operational or hardware requirements, compatibility, maturity, licensing or governance interpretation, or a recommendation about who should test, adopt, or wait.

Every adopted signal requires a stable HTTPS URL, retrieval timestamp, author role, evidence label, concise paraphrase, and configuration when applicable. Performance evidence must include the model, quantization, hardware, software version, context length, concurrency, commands, and retrieval time needed to interpret the result. Popularity alone is not evidence.
