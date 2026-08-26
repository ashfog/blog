---
title: "OpenOPC Treats AI Agents Like Employees—and the Company Is the Runtime"
description: "OpenOPC is an open-source attempt to put organization, delegation, review, memory, and approval above interchangeable AI agents such as Codex and Claude Code."
publishedAt: 2026-08-26T06:50:00Z
category: agents
tags:
  - openopc
  - ai-agents
  - multi-agent
  - agent-orchestration
  - open-source
  - codex
  - claude-code
featured: false
sources:
  - title: "OpenOPC GitHub Repository"
    url: "https://github.com/HKUDS/OpenOPC"
  - title: "OpenOPC README"
    url: "https://github.com/HKUDS/OpenOPC/blob/main/README.md"
  - title: "OpenOPC Issue #38: Project-local configuration trust"
    url: "https://github.com/HKUDS/OpenOPC/issues/38"
  - title: "OpenOPC Issue #42: MCP scoping by company, project, and role"
    url: "https://github.com/HKUDS/OpenOPC/issues/42"
  - title: "OpenOPC commit requiring trust before loading project config"
    url: "https://github.com/HKUDS/OpenOPC/commit/802f43aaed712ad50a010349607804800d10dba7"
---

Most multi-agent systems start with the same abstraction: define several roles, give each role a prompt, connect them with a workflow, and let the language models collaborate.

[OpenOPC](https://github.com/HKUDS/OpenOPC), an open-source project under HKUDS, is trying something more ambitious. Its central idea is not merely to run several agents at once, but to treat the **organization itself as a runtime**.

The project calls this a “One-Person Company.” A human owner provides the goal; OpenOPC constructs an organization, recruits AI employees, assigns work, routes handoffs, manages reviews and approvals, records experience, and can delegate execution to external agents such as Codex, Claude Code, Cursor, or OpenCode.

That makes OpenOPC interesting even if the current implementation is still early. It suggests a different layer in the agent stack: not a better worker, but a system for managing many workers over time.

## The Company Sits Above the Agent

The most important design choice in OpenOPC is that its execution agents are replaceable.

In Task mode, the project can use its own native agent or select an external worker such as Codex, Claude Code, Cursor, or OpenCode. In Company mode, individual roles can also prefer a particular external agent or let the runtime choose automatically. The official [README](https://github.com/HKUDS/OpenOPC/blob/main/README.md) documents these as execution backends rather than as the organizational model itself.

That distinction changes the architecture.

A coding agent such as Codex can be excellent at editing a repository, running tests, or implementing a feature. It is still primarily a worker focused on a task. OpenOPC tries to provide the layer above that worker: who should do the task, what depends on it, who must review the result, what happens when the task is blocked, and which lessons should survive after the session ends.

Conceptually, the stack starts to look like this:

```text
Human owner
    |
OpenOPC company runtime
    |
    +-- Product Manager
    +-- Engineering Manager
    +-- Researcher
    +-- Developer -> Codex
    +-- Reviewer  -> Claude Code
```

The value is not that the labels resemble a real company. The value is that the labels carry runtime behavior.

## Organization Is Implemented as a Real Coordination Layer

The repository structure makes the project’s intent unusually explicit. The Python package is divided into layers for interaction, perception, organization, agents, tools, memory, and observability.

The organization layer contains modules for company runtime behavior, collaboration policy, approvals, communication, escalation, role identity, and work-item coordination. This is a stronger foundation than a prompt that simply tells one model to act as a manager.

OpenOPC’s documented workflow revolves around five recurring actions: **execute, delegate, review, integrate, and rework**. Managers can decompose work into dependent items, independent items can run in parallel, and blocked work can be routed through the hierarchy or escalated to the human owner.

This is where the project starts to resemble a lightweight operating system for agents.

A software task, for example, does not have to be represented as one long conversation. A product manager can produce requirements, an engineering manager can split implementation into dependent work items, developers can execute in parallel, and a reviewer can reject or accept results before integration.

The runtime also enforces parts of the hierarchy. Delegation is not intended to be an unrestricted broadcast mechanism where every role can command every other role. That introduces overhead, but it also creates a place to express authority, responsibility, escalation, and review as explicit system rules.

## “Self-Grown” Is More Important Than the Office Metaphor

OpenOPC presents three ideas: **Self-Built**, **Self-Run**, and **Self-Grown**.

Self-Built assembles the organization. Self-Run coordinates the work. Self-Grown is the more consequential idea because it addresses a common weakness in agent systems: every new session tends to behave like a new employee with amnesia.

The repository contains dedicated memory components for history compaction, employee evolution, skills, preferences, and persistent Markdown memory. The README describes a process in which feedback is attributed to the employees responsible for particular work, lessons are distilled from execution traces, and recurring lessons can be promoted into shared playbooks.

That is closer to organizational learning than ordinary chat history.

If a backend agent repeatedly learns that a particular project requires a migration check before deployment, that lesson should not remain buried in a transcript. It should become reusable knowledge for that employee or the wider organization.

Whether OpenOPC can make this reliable at scale is still an open question, but the abstraction is valuable. Persistent employee identity plus accumulated experience is a more useful long-term model than spawning anonymous agents for every task.

## Tools Turn the Organization Into an Operating Environment

The company abstraction would be mostly cosmetic without tools. OpenOPC includes native file, shell, Python, Git, browser, collaboration, and execution-context tooling, and it can register MCP servers.

It also has a risk-based approval system. The project documents configurable autonomy levels in which ordinary low-risk commands can proceed while destructive or sensitive operations are escalated. This matters because an “AI company” that can only produce text is a simulation; an agent organization that can edit repositories, browse the web, run code, and communicate with external systems begins to operate on real assets.

OpenOPC also exposes external communication channels including Slack, Telegram, Discord, Feishu, DingTalk, email, Matrix, QQ, and others. In principle, this allows the company runtime to continue existing outside a single browser tab.

The direction is clear: the Office UI is not supposed to be the whole product. It is one control surface over a persistent runtime.

## The Current Limits Are Not Small

The architecture is more mature than a simple multi-agent demo, but OpenOPC is still a young system and its open issues show where the abstraction meets difficult engineering problems.

One important limitation is MCP isolation. [Issue #42](https://github.com/HKUDS/OpenOPC/issues/42) points out that MCP servers are currently registered globally rather than being cleanly scoped to individual companies, projects, or roles. For a serious multi-company setup, that matters. A research team and a production engineering team should not automatically receive the same tools or access to the same data.

Security boundaries have also been evolving quickly. [Issue #38](https://github.com/HKUDS/OpenOPC/issues/38) documented a project-local configuration path that could influence MCP process startup and LLM routing without a workspace-trust decision. The maintainers responded on August 24 with a commit that explicitly [requires trust before loading project configuration](https://github.com/HKUDS/OpenOPC/commit/802f43aaed712ad50a010349607804800d10dba7).

That response is encouraging, but the episode illustrates the larger problem. Once agents can launch tools, inherit credentials, select endpoints, and act through organizational delegation, trust and capability boundaries become part of the core runtime—not optional security polish.

There have also been user reports around approval flow, runtime recovery, and MCP compatibility. Those are exactly the areas that must become boring and predictable before a company runtime can be trusted with long unattended jobs.

## A Better Way to Use OpenOPC Today

The practical way to think about OpenOPC today is not “replace a company with AI.” It is “place a structured coordination layer above capable specialist agents.”

For software work, that could mean using OpenOPC to maintain the organization and task graph while Codex handles implementation and Claude Code handles selected reviews. For research, a native agent could browse and assemble evidence while another role checks sources and integrates the final report.

The human remains the final authority for high-risk actions and ambiguous decisions.

That is less dramatic than a fully autonomous one-person corporation, but it is also a much more credible near-term use case.

## The Important Abstraction May Be the Company Runtime

The agent ecosystem has spent years improving the worker: better models, longer context windows, stronger coding tools, richer browser control, and increasingly capable agent harnesses.

OpenOPC asks what comes after the worker becomes good enough.

If one developer can operate five, ten, or twenty specialized agents, the bottleneck shifts from raw model capability to coordination. Someone—or something—must maintain goals, dependencies, permissions, communication, memory, review, cost, and accountability.

OpenOPC is an early open-source attempt to make that coordination layer explicit.

Its current implementation should not be mistaken for a production-ready autonomous company. The unresolved runtime and security work is too important for that. But its architecture points toward a plausible next stage for agent software: **coding agents as employees, and an organization runtime as the control plane that keeps them working together.**
