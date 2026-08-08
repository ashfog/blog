---
title: "Hermes Agent v0.20.0 Adds Five CLI Features Worth Using on Day One"
description: "Hermes v0.20.0 headlines real-time voice, but its most immediately useful changes are direct shell commands, context inspection, project initialization, agent migration and signed webhooks."
publishedAt: 2026-08-04T05:39:00Z
category: developer-tools
tags:
  - hermes-agent
  - cli
  - coding-agent
  - developer-tools
  - webhooks
  - agent-workflows
featured: false
sources:
  - title: "Hermes Agent v0.20.0 release notes"
    url: "https://github.com/NousResearch/hermes-agent/releases/tag/v2026.8.3"
  - title: "Hermes CLI commands reference"
    url: "https://github.com/NousResearch/hermes-agent/blob/main/website/docs/reference/cli-commands.md"
  - title: "Hermes slash commands reference"
    url: "https://github.com/NousResearch/hermes-agent/blob/main/website/docs/reference/slash-commands.md"
  - title: "Import from other agents"
    url: "https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/import-from-other-agents.md"
  - title: "Hermes event hooks documentation"
    url: "https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/hooks.md"
  - title: "Hermes outbound webhook implementation"
    url: "https://github.com/NousResearch/hermes-agent/blob/main/agent/outbound_webhooks.py"
---

Hermes Agent v0.20.0 is officially the voice release.

The project now supports streaming speech, interruption while the assistant is talking, on-device wake words and voice messages across several gateway platforms. It also adds Agent-to-Agent interoperability, research with grounded citations, richer desktop artifacts and a much longer autonomous tool loop.

Those are the features that make the release look ambitious. They are not necessarily the features that will change a developer’s workflow first.

For someone installing or updating Hermes today, the highest-value changes are five smaller operations:

1. run a shell command with `!` without calling a model;
2. inspect context and code changes from inside the session;
3. generate project instructions with `/init`;
4. migrate an existing Claude Code or Codex setup;
5. push signed lifecycle events to an HTTP endpoint.

Together, they make Hermes cheaper to operate, easier to inspect and much easier to insert into an existing development environment.

The scale of the release is unusual. According to the [official v0.20.0 notes](https://github.com/NousResearch/hermes-agent/releases/tag/v2026.8.3), the window since v0.19.0 contained roughly 3,650 commits, 1,400 merged pull requests, 5,200 changed files and contributions from more than 650 people. The useful way to read that volume is not as a feature count. It is as a shift from “an agent that can do many things” toward “an agent environment that can be operated deliberately.”

## 1. `!command` separates shell work from model work

Inside an interactive Hermes CLI session, a line beginning with `!` is executed directly in the current working directory:

```bash
!git status
!git diff --stat
!pytest tests/unit -q
!pnpm lint
```

The important detail is what does **not** happen.

Hermes does not send the command to the model. It does not create a user message, assistant message or tool result in the conversation history. The command therefore consumes no model tokens and does not disturb the prompt cache or role sequence.

This solves a common source of waste in coding-agent sessions. Developers frequently need to check state rather than ask for reasoning:

- Did the formatter change anything?
- Which branch is active?
- Is the test process still passing?
- What files are staged?
- What is the current directory?

Sending each of those questions through an LLM adds latency, cost and transcript noise. The bang command turns Hermes’ input area into a lightweight terminal when no intelligence is required.

It is not a security bypass. Hermes routes a bang command through the same dangerous-command approval gate used by its terminal tool. A destructive command can still be blocked or require confirmation. The implementation also sanitizes the subprocess environment so Hermes-managed provider keys are not automatically exposed to a third-party script.

There are two limits worth knowing. Bang mode is intentionally restricted to the local interactive CLI, not gateway, API or cron sessions. It also uses a 120-second default timeout, so it is best for checks and bounded commands rather than unattended long-running services.

The practical rule is simple: use `!` when the command is already known; use the agent when deciding **which** command to run or interpreting a complicated result requires reasoning.

## 2. `/context`, `/diff` and `/focus` make long sessions inspectable

Coding agents become difficult to supervise when three different states are hidden:

- what the model currently knows;
- what the agent changed on disk;
- what the interface is suppressing or displaying.

Hermes v0.20.0 addresses each state with a dedicated command.

### `/context`

`/context` produces a local breakdown of the active context window. It estimates how much space is occupied by the system prompt, tool definitions, rules, skills, MCP configuration, subagents, memory and conversation history.

```text
/context
/context all
```

The `all` form adds per-skill and per-toolset costs. Because the calculation is local and read-only, it does not spend a model turn.

This is more useful than a single “72% context used” number. A session can be large for very different reasons. The conversation may be too long, one skill may be expensive, or a large tool catalog may consume substantial schema tokens before the first user message. `/context` tells the user which intervention is appropriate.

A conversation-heavy session may need `/compress`. A tool-heavy profile may need fewer enabled toolsets. An oversized skill may need to be split or loaded only when required.

### `/diff`

`/diff` brings repository inspection into the same control surface:

```text
/diff
/diff staged
/diff all
/diff session
/diff --stat
```

The normal view shows unstaged changes and untracked files. Other modes can show staged changes, everything since `HEAD`, or the cumulative set of changes made during the Hermes session when checkpoints are enabled.

This reduces one of the most dangerous habits in agentic coding: accepting the final explanation without checking the actual patch.

### `/focus`

`/focus on` hides intermediate tool chatter and shows mainly the user prompt and final answer. It is a display setting, not context deletion. Hermes keeps a recovery line showing how much output was hidden, and `/focus off` restores the fuller view.

That distinction matters. Reduced output is useful during routine execution, but a user should not confuse a quieter interface with a smaller model context or less agent activity.

The three commands form a useful inspection loop:

```text
/context
/diff --stat
/focus on
```

Use `/context` to inspect the model budget, `/diff` to inspect filesystem consequences and `/focus` to control interface density.

## 3. `/init` creates the project contract agents usually lack

A coding agent can inspect a repository on every session, but repeatedly rediscovering the same conventions is slow and inconsistent.

The new `/init` command scans the project with read-only tools and generates an `AGENTS.md` file:

```text
/init
/init emphasize tests, release commands, and files the agent must not edit
```

Hermes examines manifests, directory structure and toolchain configuration, then writes concise project instructions. When `AGENTS.md` already exists, the command merge-updates it rather than blindly replacing the file.

The value is not the Markdown file itself. It is the conversion of implicit repository knowledge into a durable contract.

A useful `AGENTS.md` can define:

- package and build commands;
- test expectations;
- directory ownership;
- formatting and naming conventions;
- generated files that must not be edited;
- required validation before a task is complete;
- deployment or release constraints.

Without that file, the agent must infer policy from scattered configuration and previous conversation. With it, a new session or a different compatible agent starts from the same operating assumptions.

`/init` still needs review. Repository scanning can identify structure and commands, but it cannot reliably infer every organizational rule. The first generated file should be treated as a draft that maintainers tighten, especially around destructive operations, migrations and deployment.

## 4. `hermes import-agent` lowers the cost of switching tools

Agent migration is often harder than model migration.

A developer may be willing to try another coding agent but unwilling to recreate months of project instructions, permission rules, MCP servers and skills. Hermes v0.20.0 adds a preview-first importer for Claude Code and OpenAI Codex CLI:

```bash
hermes import-agent
hermes import-agent claude-code
hermes import-agent codex
hermes import-agent claude-code --dry-run
```

For Claude Code, the importer maps global `CLAUDE.md` instructions into Hermes memory, converts supported Bash allow and deny rules, imports MCP server definitions and copies `SKILL.md` directories into a namespaced Hermes skills folder.

For Codex CLI, it can import global `AGENTS.md`, MCP configuration, memories and skills.

The safety behavior is more important than the feature list:

- the command shows a per-item plan before writing;
- `--dry-run` never modifies disk;
- existing items are merged or skipped by default;
- conflicts require an explicit `--overwrite`;
- malformed files are reported without aborting the entire import;
- credentials are never imported.

Claude and Codex authentication files are not read. Environment variables or headers that look like secrets are stripped from imported MCP definitions and listed so the user can restore them deliberately.

This is the right migration boundary. Instructions and tool topology are portable configuration; API keys should not move silently between agent environments.

The importer will not produce behavioral identity between tools. Hermes has its own command model, memory system, approval behavior and runtime. It does, however, remove the most tedious setup barrier and makes side-by-side evaluation realistic.

## 5. Signed outbound webhooks turn Hermes into an event source

Hermes can now push lifecycle events to external HTTP endpoints without requiring a polling loop.

A minimal configuration looks like this:

```yaml
hooks:
  outbound:
    - name: session-notify
      url: https://example.com/hermes-events
      events:
        - on_session_end
      secret_env: HERMES_OUTBOUND_WEBHOOK_SECRET
      timeout: 10
```

The webhook system can subscribe to session, turn, subagent, approval and tool lifecycle hooks. Tool-scoped events can also use a regular-expression matcher so an endpoint receives only selected operations.

Deliveries are queued and processed by a background worker. The agent loop serializes the event and returns immediately; a slow endpoint cannot hold a tool call open or inject data back into the running agent.

When a secret is configured, Hermes signs the raw request body with HMAC-SHA256 and sends a GitHub-style header:

```text
X-Hermes-Signature-256: sha256=<hex digest>
```

Other headers identify the event and delivery:

```text
X-Hermes-Event: on_session_end
X-Hermes-Delivery: <uuid>
```

This makes it straightforward to connect Hermes to CI, a personal dashboard, a notification service or another agent system while still verifying that the request came from a configured Hermes instance.

One naming detail can cause confusion. In the plugin lifecycle, `on_session_end` fires at the end of every `run_conversation()` call, including failed or interrupted turns. It is closer to a turn-finalization event than “the user permanently closed this chat.” Receivers should inspect the `completed` and `interrupted` fields instead of assuming every delivery represents a fully completed project.

Webhook payloads can contain operational context, including tool inputs for some events. HTTPS should be mandatory, subscriptions should be narrow and the signing secret should come from an environment variable rather than a literal value in `config.yaml`.

## The headline features still matter

The five changes above are the fastest to adopt, but v0.20.0 is much broader.

Real-time voice now streams speech clause by clause, supports barge-in and can listen for configurable wake phrases on-device. Hermes can receive and answer voice notes across supported messaging gateways. This is a meaningful interaction change, although it requires microphone, speech-to-text and text-to-speech configuration before it becomes part of a daily workflow.

A bundled A2A v1.0 plugin allows Hermes to discover and communicate with other compatible agents through a standard protocol. The new grounded-citations skill checks quotes against source pages and can apply the same machinery as a fact-checking mode.

The desktop application now renders versioned artifacts in a sandboxed live-preview panel, adds a plugin SDK, supports global quick entry and can connect to a remote Hermes backend over SSH.

Long autonomous runs also have more room. The default maximum tool-calling iterations per turn increased from 90 to 500. Context compression gained per-model and absolute-token thresholds, recent-message retention and smaller incremental compaction steps.

A higher limit does not make an agent more reliable by itself. It mainly removes an artificial ceiling. Approvals, checkpoints, verification and explicit completion criteria remain necessary when a run can execute hundreds of tool steps.

## v0.20.0 is an operability release disguised as a voice release

Voice is the most visible change in Hermes Agent v0.20.0. The deeper improvement is operability.

A productive agent environment needs more than a capable model. It needs a way to distinguish deterministic commands from model work, show where context is being spent, expose the actual patch, persist repository instructions, migrate existing configuration and emit trustworthy events to other systems.

Hermes now covers each of those requirements with a direct command or configuration surface.

The recommended first-day sequence is therefore modest:

```bash
hermes update
hermes import-agent claude-code --dry-run
```

Then, inside a project:

```text
/init
/context all
!git status
/diff --stat
```

Finally, add one narrowly scoped outbound webhook only after the local workflow is understood.

That sequence will not demonstrate every feature in the release. It will do something more useful: make Hermes easier to understand before giving it more autonomy.
