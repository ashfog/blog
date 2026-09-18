---
title: "Cloudflare Open-Sourced the Security Audit Skill Behind Its Vulnerability Harness"
description: "Cloudflare's security-audit-skill turns coding agents into a structured audit pipeline with coverage tracking, adversarial validation, and machine-readable findings."
publishedAt: 2026-09-18T12:22:00Z
category: security
tags:
  - cloudflare
  - security-audit
  - agent-skills
  - coding-agents
  - vulnerability-research
  - open-source
featured: false
sources:
  - title: "Cloudflare security-audit-skill GitHub Repository"
    url: "https://github.com/cloudflare/security-audit-skill"
  - title: "Security Audit Skill"
    url: "https://github.com/cloudflare/security-audit-skill/blob/main/skills/security-audit/SKILL.md"
  - title: "Build your own vulnerability harness"
    url: "https://blog.cloudflare.com/build-your-own-vulnerability-harness/"
  - title: "Validation, Reporting, and Verification"
    url: "https://github.com/cloudflare/security-audit-skill/blob/main/skills/security-audit/VALIDATION-AND-REPORTING.md"
---

Most AI security tools are presented as scanners: point them at a repository, wait, and receive a list of suspected vulnerabilities. Cloudflare's [security-audit-skill](https://github.com/cloudflare/security-audit-skill) is more interesting because it is not really a scanner at all.

It is an orchestration layer for coding agents.

The open-source skill tells a capable coding agent how to map a codebase, divide the attack surface into explicit coverage units, send isolated agents after different vulnerability classes, challenge every surviving candidate with an independent verifier, and emit both human-readable and machine-readable results.

That design came from Cloudflare's own vulnerability research work. In its June 2026 article [Build your own vulnerability harness](https://blog.cloudflare.com/build-your-own-vulnerability-harness/), Cloudflare explained that an early single-repository security skill became the seed for a much larger fleet-wide vulnerability discovery system.

The public skill is therefore useful for two reasons: it can be used directly against a repository, and it is a compact example of how a serious multi-agent security workflow can be structured.

## It is a workflow, not a prompt

The easiest way to underestimate the project is to think of it as a long security prompt.

The current [Security Audit Skill](https://github.com/cloudflare/security-audit-skill/blob/main/skills/security-audit/SKILL.md) defines a six-phase process:

1. reconnaissance;
2. coverage-led hunting;
3. candidate validation;
4. structured output;
5. independent record verification;
6. target-neutral reporting.

The parent agent coordinates the run, while delegated research and general-purpose agents investigate bounded parts of the repository. Shared state is written into artifacts such as `architecture.md`, `coverage-ledger.json`, `findings.json`, `REPORT.md`, and `NEEDS-VALIDATION.md`.

That externalized state matters. Security work rarely fits cleanly inside one model context window. A repository may contain dozens of trust boundaries, parsers, authentication decisions, protocol handlers, file operations, and privileged actions. Without explicit state, an agent can spend most of its context rediscovering what it already inspected.

Cloudflare instead treats coverage as something that can be recorded and revisited.

## The coverage ledger makes the audit measurable

One of the strongest ideas in the project is the coverage ledger.

Rather than asking an agent to "look for security bugs" and trusting that it inspected enough code, the workflow creates units of work around surfaces, boundaries, attack classes, and subsystems. Units can be marked as planned, covered, deferred, out of scope, or otherwise unresolved.

This makes gaps visible.

It also makes repeated runs useful. The repository documentation explicitly says that multiple runs are additive, carrying forward prior evidence while targeting uncovered areas and changed source. Cloudflare notes that in its own testing, a single run found roughly half of the vulnerabilities eventually found across repeated runs.

That is an important admission. The project does not pretend that one autonomous pass equals complete coverage.

## The agent that finds a bug cannot validate it

The other defining feature is adversarial validation.

A hunting agent is optimized to find suspicious behavior. That naturally creates a bias toward interpreting unusual code as exploitable. Instead of asking the same agent whether its own finding is correct, the workflow assigns a fresh agent to try to disprove it.

Cloudflare's [validation guide](https://github.com/cloudflare/security-audit-skill/blob/main/skills/security-audit/VALIDATION-AND-REPORTING.md) is explicit: the validator should read the real source path, challenge the claimed attack, and reject the candidate if the evidence does not establish a concrete security boundary failure.

Only surviving findings are promoted into the final structured output.

This separation is more important than it may appear. LLMs can generate plausible vulnerability narratives from incomplete evidence. Independent verification forces the system to distinguish between "this looks dangerous" and "this demonstrably crosses a trust boundary."

The same principle is used again after reporting: final records are independently re-verified against the source.

## Confirmed vulnerabilities need impact, not just bad-looking code

The skill also sets a relatively disciplined bar for what counts as a vulnerability.

A confirmed finding needs a lower-trust principal, an accepted input or action, an intended control, a crossed boundary, an affected resource or principal, and a concrete result. Missing hardening, suspicious deployment assumptions, or generic crashes are not automatically promoted to vulnerabilities.

The project separates `confirmed` findings from `needs_validation` records. If a decisive fact depends on infrastructure, identity configuration, proxy behavior, or another control that is not visible in the repository, the workflow is supposed to record the missing fact rather than guess.

Severity is similarly tied to demonstrated impact. A missing second layer of defense does not become a high-severity issue if another layer already prevents the attack.

That restraint is one of the most valuable parts of the design because security automation becomes expensive when engineers must manually disprove a large volume of confident false positives.

## It requires a real sandbox

The project is not designed to execute arbitrary target code without controls.

According to the skill's setup rules, builds, tests, fuzzers, browsers, emulators, and other target-controlled processes should run only inside an OS-enforced sandbox with external networking disabled, a sanitized allowlisted environment, resource limits, and writes restricted to scratch paths.

If those controls cannot be enforced, the workflow should stop short of executing target code and keep the candidate as `needs_validation`.

This makes the skill less plug-and-play than a simple static-analysis command, but the restriction is deliberate. A security agent inspecting untrusted code is itself operating at a trust boundary.

## Installation is simple; the runtime requirements are not

The repository can be installed with the Skills CLI:

```bash
npx skills add https://github.com/cloudflare/security-audit-skill \
  --skill security-audit
```

A typical request can then be as direct as:

```text
security audit this codebase
```

But the useful part is what happens behind that request. The skill expects a coding-agent environment with tool use, parallel sub-agents, Node.js for its validators, and an enforceable sandbox if local execution is required.

So the project should not be evaluated by installation friction. Its real dependency is an agent runtime capable of respecting the workflow.

## The skill is a blueprint for something larger

Cloudflare's internal experience shows where this architecture can go.

The company says the original security skill eventually evolved into a model-agnostic vulnerability harness spanning many repositories. The larger system externalized state, added persistence, cross-repository dependency tracing, deduplication, validation stages, and worker orchestration.

That evolution is the most useful lesson in the release.

A single agent can be valuable for exploration. A durable security system needs more: explicit coverage, independent judgment, persistent state, reproducible evidence, bounded execution, and outputs that downstream automation can consume.

Cloudflare's security-audit-skill packages those ideas into a repository small enough to study.

For developers already using coding agents, that makes it more than a security utility. It is also a concrete reference architecture for turning an LLM from a conversational reviewer into one component inside a controlled engineering process.
