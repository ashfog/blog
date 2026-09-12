---
title: "YOINK Turns an Obsidian Vault Into a Second Brain That Grades Your Predictions"
description: "YOINK keeps notes as plain Markdown, adds falsifiable claims with confidence scores, and uses scoring to show whether your second brain is improving your judgment."
publishedAt: 2026-09-12T11:30:00Z
category: open-source
tags:
  - yoink
  - obsidian
  - second-brain
  - forecasting
  - python
  - claude-code
  - open-source
featured: false
sources:
  - title: "YOINK GitHub Repository"
    url: "https://github.com/DefiLeoo/YOINK"
  - title: "YOINK README"
    url: "https://github.com/DefiLeoo/YOINK/blob/main/README.md"
  - title: "YOINK Claims Documentation"
    url: "https://github.com/DefiLeoo/YOINK/blob/main/docs/CLAIMS.md"
  - title: "YOINK Scoring Documentation"
    url: "https://github.com/DefiLeoo/YOINK/blob/main/docs/SCORING.md"
  - title: "YOINK 0.1.0 Initial Commit"
    url: "https://github.com/DefiLeoo/YOINK/commit/762e9fb55c10249b24e0799969a110cf8fc72576"
  - title: "YOINK pyproject.toml"
    url: "https://github.com/DefiLeoo/YOINK/blob/main/pyproject.toml"
---

Most "second brain" software is very good at proving that you saved something. It can count notes, visualize links, index documents, and help you find an idea from six months ago.

[YOINK](https://github.com/DefiLeoo/YOINK) asks a less comfortable question: **were your ideas actually right?**

The open-source Python project stores ordinary Markdown notes in an Obsidian-compatible vault, but it adds a small forecasting layer on top. A note can contain a falsifiable claim, a settlement date, a data source, a test, and a confidence level. When the date arrives, YOINK can read the source, evaluate the claim, write the outcome back into the note, and update a score that tracks how calibrated your judgment has been.

That changes the purpose of a personal knowledge base. Instead of measuring only how much you remember, YOINK tries to measure whether your thinking survives contact with reality.

## A second brain with an answer key

At the storage layer, YOINK is deliberately boring. According to its [README](https://github.com/DefiLeoo/YOINK/blob/main/README.md), the vault is simply a folder of Markdown files with YAML frontmatter and `[[wikilinks]]`. The same folder can be opened directly in Obsidian, so the graph, tags, and links remain usable without converting the data into a proprietary format.

YOINK adds a terminal interface over that folder. It can capture a thought from a command-line argument, a pipe, a file, or a URL; search notes; follow links; inspect the vault graph; and show a "pulse" summarizing the health of the collection.

There is no database and no persistent search index. The project recomputes its views from the files. That is less sophisticated than a vector database, but it has a useful property: the Markdown remains the source of truth, and editing a note in Obsidian does not require a synchronization layer.

## Claims turn notes into bets

The distinctive feature is the claim format.

A normal note becomes gradeable when its frontmatter includes fields such as:

```yaml
claim: monthly users will exceed 100000
settles: 2026-12-01
reads: csv:metrics.csv#users@2026-12-01
test: gte 100000
confidence: 0.7
```

The [claims documentation](https://github.com/DefiLeoo/YOINK/blob/main/docs/CLAIMS.md) makes the design constraint explicit: a claim must be reducible to a number and a deterministic test. Vague predictions such as "it will probably take off" are rejected because they cannot be settled consistently.

YOINK currently supports four source styles: JSON files, CSV files, public EVM-chain reads over JSON-RPC, and manual values tied to a recorded URL. Its supported tests are intentionally small—greater than, less than, equal, not equal, and an inclusive range.

When settlement succeeds, the reading, outcome, time, and source are written back into the note. If the source cannot be read, the claim remains open rather than receiving a guessed result.

The blockchain reader is deliberately read-only: there is no signing, key handling, wallet logic, or transaction sending. It also checks the chain ID before accepting a reading.

## The score measures judgment, not productivity

This is where YOINK becomes more than a Markdown utility.

Its [scoring system](https://github.com/DefiLeoo/YOINK/blob/main/docs/SCORING.md) tracks both the health of the vault and the calibration of settled predictions.

A note is considered "alive" if it participates in the link graph, is revisited after its capture day, or still contains an unresolved claim. Otherwise it is counted as dead. The point is not to delete forgotten notes, but to expose how much of a supposedly useful knowledge base has become inert.

Forecasts receive a second set of numbers: the confidence the user expressed, how often the chosen side was correct, the gap between those two, and a Brier score.

The Brier score is the mean of `(p - outcome)^2`. A perfect forecast scores 0; repeatedly assigning 50% produces 0.25; being completely confident and wrong approaches 1. This punishes performative certainty. If you routinely write "90%" and are correct only half the time, the record eventually makes that visible.

Writing more notes cannot improve the forecasting score. Only better predictions—or more realistic confidence—can.

That is a rare design choice in knowledge-management software, where most metrics reward accumulation.

## The implementation is unusually small

YOINK 0.1.0 requires Python 3.10 or newer and declares [no runtime dependencies](https://github.com/DefiLeoo/YOINK/blob/main/pyproject.toml). The vault parser, graph, terminal UI, search, ledger, claim engine, and JSON-RPC reader are implemented with the Python standard library.

The initial commit also describes a 201-test suite, and the repository includes tests for claims, chain reads, the CLI, ledger behavior, scoring, search, the terminal UI, and vault handling. Its CI configuration runs across multiple supported Python versions on Linux and macOS.

That does not make a one-day-old 0.1.0 project mature, but it is a materially stronger starting point than a typical demonstration repository.

The project also keeps a hash-chained ledger and correctly describes it as tamper-evident rather than an external trust system.

## Yes, Claude is explicitly in the commit history

There is another reason this repository is interesting.

YOINK currently has a single public initial commit, and that [commit message](https://github.com/DefiLeoo/YOINK/commit/762e9fb55c10249b24e0799969a110cf8fc72576) includes both:

```text
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_...
```

That is direct evidence that Claude was used as a development collaborator. It is **not** evidence that Claude independently designed every feature or wrote every line; commit metadata cannot tell us the percentage generated by the model. What it does show is a contemporary AI-assisted development pattern: an initial release arriving with a coherent concept, documentation, terminal UI, CI, and a substantial test suite.

Just as importantly, Claude is not required to run YOINK. The application itself is a conventional local Python program. There is no Claude API dependency in `pyproject.toml`.

## Who is YOINK actually for?

YOINK is most relevant to people who already keep hypothesis-driven notes: researchers, product builders, forecasters, and engineers making architectural bets.

It is less compelling if your main requirement is semantic retrieval over thousands of documents. There is no embedding model, vector index, RAG pipeline, or LLM-powered synthesis layer. That is not an omission so much as a different product thesis.

YOINK is trying to make a second brain more accountable, not more intelligent.

The project is still version 0.1.0, so the usual early-stage caveats apply: the interface can change, edge cases will emerge, and the current single-commit history gives us almost no evidence about long-term maintenance.

But the core idea is strong because it attacks a real weakness in personal knowledge systems. Saving a thought feels productive. Linking it to ten other notes feels even better. Neither tells you whether the thought was true.

YOINK adds the missing feedback loop: **write what you believe, attach a probability, define what would prove it, and let the future mark the answer.**
