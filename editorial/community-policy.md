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
