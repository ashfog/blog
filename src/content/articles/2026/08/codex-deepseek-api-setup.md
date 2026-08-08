---
title: "Run Codex with DeepSeek API: A Cheaper AI Coding Agent Setup"
description: "A practical guide to connecting OpenAI Codex with DeepSeek API, keeping Codex workflows and MCP tools while reducing API costs."
publishedAt: 2026-08-04T12:34:00Z
category: developer-tools
tags:
  - codex
  - deepseek
  - ai-coding
  - mcp
  - developer-tools
featured: false
sources:
  - title: "DeepSeek API Documentation"
    url: "https://api-docs.deepseek.com/"
---

AI coding agents have changed how developers build software. Tools like Codex, Claude Code and Cursor are no longer just autocomplete assistants—they can understand projects, call tools, edit files and operate inside development environments.

But there is a practical problem: long coding sessions consume a large amount of model usage. For developers who already have their own API budget, connecting a lower-cost model provider can make these workflows much more affordable.

One interesting combination is **Codex + DeepSeek API**.

Instead of replacing Codex, developers can keep the Codex desktop experience, project workflows and MCP integrations, while routing model requests through DeepSeek's API.

## Why connect DeepSeek to Codex?

Codex provides the agent workflow:

- project understanding
- file editing
- terminal operations
- MCP tool integration
- development environment interaction

DeepSeek provides another model backend option.

The result is a different cost structure:

| Component | Responsibility |
| --- | --- |
| Codex | Agent interface and tool workflow |
| DeepSeek API | Model inference |
| MCP | External tools and services |
| Local project | Code and context |

For developers running many experiments, prototypes or personal projects, separating the agent interface from the model provider can significantly reduce costs.

## Before starting

You need:

1. A DeepSeek API account
2. An API key
3. Codex installed on your machine
4. A backup of your current Codex configuration

Never share your API key publicly. Treat it like a password.

## Configure Codex to use DeepSeek

On Windows, open PowerShell and run the DeepSeek Codex configuration script:

```powershell
irm https://cdn.deepseek.com/api-docs/codex-deepseek-setup-en.ps1 | iex
```

The setup process will guide you through:

- selecting the DeepSeek model
- entering your API key
- updating Codex configuration
- preserving existing settings

After configuration, restart Codex completely.

Closing only the window may not reload the new provider settings. Exit the application from the system tray if necessary, then launch it again.

## Check whether it works

Open Codex and verify the active model/provider information.

You can also run:

```text
/status
```

A successful configuration should show DeepSeek as the current provider rather than the default OpenAI backend.

## Keeping MCP and SSH workflows

The biggest advantage of this setup is that the agent workflow remains unchanged.

A typical architecture looks like this:

```
Codex Desktop
      |
      v
DeepSeek API
      |
      v
Codex Agent Runtime
      |
      +---- MCP Servers
      |
      +---- SSH Tools
      |
      +---- Local Projects
```

For example, a developer can still use MCP tools to access a VPS, inspect logs, modify configuration files or deploy applications.

The model changes, but the working environment does not.

## When this setup makes sense

This configuration is especially useful for:

### Learning and experimentation

If you are testing many small projects, a lower-cost model backend allows more iteration.

### Personal infrastructure projects

For homelabs, VPS management, automation scripts and open-source projects, keeping costs low matters more than maximum model capability.

### Long coding sessions

Large refactors, documentation generation and debugging sessions can consume significant tokens. A cheaper provider can make these workflows sustainable.

## Things to consider

A cheaper model is not always the best model.

For highly complex tasks—large architecture decisions, security reviews or difficult debugging—developers may still prefer stronger frontier models.

A practical workflow is often:

- use lower-cost models for routine coding
- use stronger models for critical decisions
- keep the same agent environment

The future of AI coding tools will likely become more modular. The agent, model, tools and memory layer will increasingly become separate components that developers can combine based on cost and capability requirements.

## Conclusion

Connecting Codex with DeepSeek API shows an important trend: AI development tools are moving away from closed ecosystems.

Developers increasingly want control over which models power their workflows, how much they spend and where their data goes.

The ideal coding agent may not be one single model. It may be an open workflow where the best model for each task can be selected dynamically.

Codex provides the agent experience. DeepSeek provides another inference option. MCP connects the tools.

Together, they create a more flexible and affordable AI development environment.
