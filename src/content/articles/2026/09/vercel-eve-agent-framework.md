---
title: "Vercel eve Makes the Filesystem the Interface for Durable AI Agents"
description: "Vercel's open-source eve framework turns agents into inspectable directories, then supplies durable execution, sandboxes, approvals, channels, subagents, and schedules."
publishedAt: 2026-09-18T12:42:00Z
category: agents
tags:
  - vercel
  - eve
  - ai-agents
  - agent-framework
  - durable-execution
  - agent-skills
  - open-source
featured: false
heroImageUrl: "https://blog.logrocket.com/wp-content/uploads/2026/08/Vercel-eve.png"
heroImageAlt: "LogRocket cover image for its guide to Vercel eve and filesystem-first AI agents"
sources:
  - title: "Introducing eve"
    url: "https://vercel.com/blog/introducing-eve"
  - title: "eve — The Agent Framework"
    url: "https://vercel.com/eve"
  - title: "vercel/eve GitHub Repository"
    url: "https://github.com/vercel/eve"
  - title: "eve Skills Documentation"
    url: "https://github.com/vercel/eve/blob/main/docs/skills.mdx"
  - title: "How to use Vercel eve: The Next.js framework for AI agents"
    url: "https://blog.logrocket.com/vercel-eve-ai-agents/"
  - title: "Vercel eve: the Open-Source Next.js for AI Agents"
    url: "https://pasqualepillitteri.it/en/news/5338/vercel-eve-open-source-framework-ai-agents"
  - title: "Vercel eve video"
    url: "https://youtu.be/48QRnEiyM74"
---

Most agent projects do not become difficult because the model cannot call a tool. They become difficult because everything around the model starts multiplying.

A production agent needs session state, retries, human approval, credentials, sandboxing, channels, schedules, subagents, tracing, and a way to keep all of that understandable six months later.

[Vercel eve](https://vercel.com/blog/introducing-eve) is an attempt to make that surrounding machinery the framework instead of the application.

Released as an open-source project in June 2026, eve uses a filesystem-first model: an agent is a directory, and where a file lives determines what role it plays. Markdown is used for instructions and skills; TypeScript is used where typed runtime behavior matters.

The idea sounds simple. Its significance is that Vercel is trying to standardize the **shape of an agent**, not merely provide another abstraction over an LLM API.

## An agent is a directory

A minimal eve project is immediately readable:

```text
agent/
├── agent.ts
├── instructions.md
├── tools/
├── skills/
├── connections/
├── channels/
├── subagents/
└── schedules/
```

The [official eve page](https://vercel.com/eve) describes this as the framework's core authoring model. The directory is not just organization for humans; eve compiles those conventional locations into the runtime.

`instructions.md` contains the always-on system instructions. A TypeScript file under `tools/` becomes a callable tool without a separate registration layer. Skills are procedures that the model can load only when they are relevant. A folder under `subagents/` becomes a specialist agent. A file under `schedules/` can turn an agent into a recurring job.

That shifts complexity away from a central configuration file and into a tree that can be inspected at a glance.

![Illustration of Vercel eve as a directory-based agent framework with durable execution and isolated sandboxes](https://pasqualepillitteri.it/uploads/img/news/vercel-eve-framework-agenti-ai-open-source-cover.webp)

The analogy Vercel uses is deliberate: **"Like Next.js for web apps, but for agents."** The useful part of that comparison is not branding. Next.js made conventions such as file-based routing carry runtime meaning. eve applies the same idea to agent capabilities.

## Skills and tools are deliberately different

One of eve's better design choices is that it does not collapse every capability into the same abstraction.

A tool is executable behavior. It belongs in TypeScript, has a schema, and can produce side effects.

A skill is guidance. According to the [eve skills documentation](https://github.com/vercel/eve/blob/main/docs/skills.mdx), skills follow the `SKILL.md` convention and are loaded on demand. The model sees their descriptions first and pulls the full instructions into context only when needed.

That avoids turning the system prompt into an encyclopedia.

For example, a financial analyst agent might keep database access in `tools/run_sql.ts`, while a team's accounting rules live in `skills/revenue-definitions.md`. One gives the model an execution surface; the other tells it how the organization expects that surface to be used.

This distinction is becoming increasingly important as Agent Skills spread across coding and automation systems. Procedures do not need to become APIs just because an LLM is consuming them.

## Durable execution changes the meaning of a conversation

A chat request normally lives for seconds or minutes. Real agents often do not.

They may wait for a human, call a slow external system, run a long analysis, or continue after a deployment. Vercel says eve treats every conversation as a durable workflow and checkpoints its steps using the open-source Workflow SDK.

That means a run can pause and resume instead of assuming one uninterrupted request-response cycle.

Human approval is built around the same model. A sensitive or expensive action can be marked as requiring approval; the workflow stops at that point and continues after the decision rather than forcing the application to invent its own waiting state.

This is a larger architectural shift than tool calling. Once an agent can survive time, interruptions, and people entering the loop, it starts behaving more like a backend process than a chatbot.

## The sandbox is part of the agent boundary

Vercel also treats model-generated code as untrusted.

The [launch documentation](https://vercel.com/blog/introducing-eve) says each agent receives an isolated sandbox for shell commands, scripts, and file operations. On Vercel, the deployed backend uses Vercel Sandbox; local development can use Docker, microsandbox, or other adapters.

That separation matters because agents increasingly write code that did not exist when the application was deployed.

Without isolation, "let the model run a quick script" can mean executing dynamically generated code inside the same environment that holds application secrets and production state. eve makes the sandbox a first-class runtime component rather than an afterthought.

Connections follow a similar principle. An eve connection can point to MCP or OpenAPI services, while authentication is brokered outside the model context. The goal is to let the model use a service without making raw credentials part of the prompt.

## Channels, subagents, and schedules turn one agent into a system

The filesystem model extends beyond tools.

A channel lets the same agent appear in places such as Slack, Discord, Teams, or the web. A subagent can have its own instructions, tools, model configuration, and sandbox. A schedule can start work without an inbound user message.

That creates a useful composition pattern:

```text
channel / schedule
       ↓
   root agent
    ↙     ↘
tools   subagents
  ↓        ↓
APIs    specialist work
       ↓
durable workflow
```

The agent definition remains local and inspectable even as the runtime becomes distributed across models, tools, services, people, and time.

For further viewing, the supplied [eve video on YouTube](https://youtu.be/48QRnEiyM74) provides a companion reference.

## The strongest part of eve is also its biggest tradeoff

eve is open source under the Apache 2.0 license, but its most polished production path is closely integrated with Vercel's Agent Stack: AI Gateway, Workflows, Sandbox, Connect, Chat SDK, and Vercel Observability.

That can be a major advantage if those are already your infrastructure choices.

It also means eve should not be confused with a tiny, vendor-neutral agent loop that can be dropped into any runtime with no architectural consequences. The repository itself currently labels eve as a beta or preview product, and its APIs and behavior may still change before general availability.

Vercel designed adapters into several layers, including sandbox backends, and the project is developed in public. Even so, teams should evaluate the runtime coupling rather than looking only at the Apache license.

## Why eve is worth watching

The important idea in eve is not that Markdown is easier than JSON.

It is that agent engineering is starting to develop **conventions**.

Instructions have a place. Procedures have a place. Executable tools have a place. Sandboxes, schedules, channels, connections, and subagents have places. The framework can then compile those conventions into durable behavior.

That is exactly what mature software frameworks tend to do: they replace repeated architecture decisions with a structure developers can recognize before reading every line of code.

Vercel says hundreds of its own agents already run on eve. Whether eve itself becomes a dominant framework is still an open question, especially while it remains in beta.

But the design direction is likely to outlast any single implementation.

The next generation of agent frameworks will not be judged only by how elegantly they call a model. They will be judged by how clearly they define, secure, operate, and evolve the entire system around that model.
