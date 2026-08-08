---
title: "Cloudflare Wallets and Microsoft’s 30 Million Copilot Seats Give Agents Real Authority"
description: "Cloudflare is giving agents delegated wallets and stable identities while Microsoft scales Copilot, Cowork and Scout, showing why governed authority now matters more than another model."
publishedAt: 2026-08-05T04:21:00Z
category: agents
tags:
  - cloudflare-wallets
  - agentic-payments
  - cloudflare-pay
  - x402
  - microsoft-365-copilot
  - copilot-cowork
  - microsoft-scout
  - enterprise-ai
featured: false
sources:
  - title: "Announcing Cloudflare Wallets"
    url: "https://blog.cloudflare.com/wallets/"
  - title: "Cloudflare Agentic Payments documentation"
    url: "https://developers.cloudflare.com/agents/tools/payments/"
  - title: "Cloudflare Web Bot Auth documentation"
    url: "https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/"
  - title: "Cloudflare Monetization Gateway announcement"
    url: "https://blog.cloudflare.com/monetization-gateway/"
  - title: "Microsoft FY26 fourth-quarter earnings call"
    url: "https://www.microsoft.com/en-us/investor/events/fy-2026/earnings-fy-2026-q4"
  - title: "Copilot Cowork is now generally available"
    url: "https://www.microsoft.com/en-us/microsoft-365/blog/2026/06/16/copilot-cowork-is-now-generally-available/"
  - title: "Introducing Microsoft Scout"
    url: "https://www.microsoft.com/en-us/microsoft-365/blog/2026/06/02/introducing-microsoft-scout-your-always-on-personal-agent/"
---

AI agents are beginning to receive something more consequential than better reasoning scores: identities, budgets and permission to act without asking a human at every step.

Two announcements make that transition unusually visible. [Cloudflare introduced Cloudflare Wallets](https://blog.cloudflare.com/wallets/), a planned payment and identity layer that will let account owners delegate limited stablecoin spending to agents. Separately, Microsoft disclosed that paid Microsoft 365 Copilot seats have passed 30 million while expanding Copilot from chat into long-running work through Cowork and the always-on Scout agent.

The products operate at different layers. Cloudflare is building Internet infrastructure for an agent that needs to identify itself and buy an API call. Microsoft is building an enterprise environment in which an agent can read organizational context, execute work and remain accountable to corporate policy.

Together, they point to the same conclusion: the next phase of agent adoption will not be decided only by which model reasons best. It will depend on whether an agent can prove who it represents, receive narrowly defined authority, spend within a budget and leave an audit trail.

## Cloudflare Wallets is an identity launch before it is a payment launch

The headline can make Cloudflare Wallets sound like a complete product that agents can immediately use for autonomous purchases. The current release is more limited.

Starting August 4, Cloudflare users can claim a human-readable wallet handle through `cloudflare.pay`. The actual wallet capabilities—holding stablecoins, creating agent-controlled Virtual Wallets and paying for services—are described as coming soon.

That distinction matters. The available feature today is the identity namespace. The announced architecture is the larger product.

Cloudflare plans two wallet types:

| Wallet type | Owner | Intended role |
| --- | --- | --- |
| Account Wallet | A human or organization controlling a Cloudflare account | Add and remove funds, create policies and delegate spending |
| Virtual Wallet | An AI agent operating through an API key | Purchase approved APIs, MCP tools, content and other resources within imposed limits |

An Account Wallet will be able to create multiple Virtual Wallets. Each agent wallet can receive an allowance while remaining constrained by an allow list, a maximum transaction size and an overall spending cap. When an agent reaches a limit, the system can require an authorized human to approve an override or add more funds.

This is not equivalent to handing an autonomous process a corporate credit card. The wallet is designed around bounded delegation: enough freedom to complete a task, but not enough authority to expose the account’s entire balance.

Cloudflare gives a useful example. An organization could assign every employee’s agent a weekly inference budget. The agent could compare multiple model or data providers without repeatedly requesting approval for purchases measured in cents, while a central Account Wallet would continue to control total exposure.

The spending limit is not merely a restriction. It is what makes autonomy operationally tolerable.

## x402 turns an HTTP request into a purchase

The payment mechanism is built around [x402 and other HTTP 402 payment flows](https://developers.cloudflare.com/agents/tools/payments/). Instead of creating an account with every API vendor, adding a card, copying an API key and managing another subscription, an agent can encounter payment requirements directly in the protocol it already uses.

The simplified flow is:

1. An agent requests an API, dataset, page or MCP tool.
2. The server responds with `402 Payment Required` and machine-readable payment terms.
3. The agent creates a signed payment credential.
4. It retries the request with proof of payment.
5. The server verifies settlement and returns the resource with a receipt.

Cloudflare’s Agents SDK already supports x402 and the Machine Payments Protocol. Its [Monetization Gateway](https://blog.cloudflare.com/monetization-gateway/) is intended to give sellers the opposite side of the market: a way to charge for a page, dataset, API or MCP tool without building a complete payment stack.

Wallets supply the buyer.

This model is especially suited to small, immediate transactions. An agent may not want an annual subscription to test a translation API, a geocoding endpoint or a specialist research database. It may want to spend three cents, evaluate the result and move on. Traditional onboarding costs more attention than the transaction is worth. A payment attached to the request removes that mismatch.

Stablecoins are a practical rail for these transactions because they are programmable, globally transferable and suitable for small settlement amounts. Cloudflare says it will offer funding and withdrawal methods in supported geographies, with direct stablecoin funding as an alternative for eligible users.

That does not eliminate financial complexity. Geographic eligibility, custody, key security, screening, tax treatment and stablecoin risk still exist. The innovation is narrower: the purchase can be expressed and completed in a format software understands.

## `cloudflare.pay` gives the wallet a name

A payment credential answers whether funds moved. It does not necessarily answer who initiated the transaction or whose authority the agent carried.

Cloudflare is linking Wallets to human-readable `cloudflare.pay` handles. An organization could assign an agent an identifier such as:

```text
research.example.cloudflare.pay
```

The handle is intended to represent an agent delegated by a particular Cloudflare account. Merchants can then recognize a persistent counterparty rather than treating every request as an unrelated anonymous bot.

Underneath the readable name, Cloudflare plans to build on [Web Bot Auth](https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/), which uses cryptographic HTTP message signatures and registered public keys to verify automated requests. The wallet handle makes the underlying key-based identity easier for humans and services to interpret.

The identity declaration will be optional. A merchant may accept anonymous paid requests, give better terms to identified agents or require identification for higher-risk actions.

A handle should not be confused with a universal trust certificate. It does not by itself prove that an agent is competent, that its owner is solvent or that a requested action is legitimate. It creates continuity and attribution. Reputation, compliance and authorization still need additional layers.

That is nevertheless a meaningful change. Free trials, rate limits, fraud controls and customer support all become easier when a service can distinguish one persistent agent from thousands of disposable processes.

## Microsoft’s 30 million seats show that enterprise distribution is no longer hypothetical

Cloudflare is constructing infrastructure for an emerging machine economy. Microsoft is showing how quickly agents are entering existing organizations.

During its [fiscal 2026 fourth-quarter earnings call](https://www.microsoft.com/en-us/investor/events/fy-2026/earnings-fy-2026-q4), Microsoft said it had more than 30 million paid Microsoft 365 Copilot seats. One quarter earlier, it reported more than 20 million. Microsoft also said net paid seat additions more than doubled sequentially.

The metric needs to be read precisely.

It refers to paid Microsoft 365 Copilot licenses, not every consumer Copilot user, every GitHub Copilot account or 30 million people actively running autonomous agents each day. A purchased seat is a commercial adoption signal, not a usage measurement.

Even with that qualification, the scale is substantial. Microsoft 365 already sits inside the email, calendar, document, meeting and identity systems of large organizations. Expanding Copilot through this installed base is different from asking companies to adopt a standalone agent platform from scratch.

The more important shift is what Microsoft is attaching to those seats.

## Cowork changes Copilot from a response surface into an execution system

[Copilot Cowork became generally available](https://www.microsoft.com/en-us/microsoft-365/blog/2026/06/16/copilot-cowork-is-now-generally-available/) in June. Microsoft describes it as an agentic system for complex, long-running, multi-tool work rather than a single conversational assistant.

A user can specify an outcome, and Cowork can plan and execute work across Microsoft 365: searching organizational information, creating documents, managing files, posting in Teams, scheduling meetings and sending messages. Work IQ supplies context from the organization’s emails, meetings, messages, files and data.

Cowork also reflects a broader architectural change. It uses a multi-model design rather than binding the product to one model family. Microsoft says it can select models according to task capability and cost, add partner plugins and use a local Edge browser in supported scenarios.

The business model is changing with the architecture. Cowork requires a Microsoft 365 Copilot user license, but complex tasks are billed separately through usage-based Copilot Credits. Microsoft calculates task cost from model use, context retrieval, tool calls and runtime. Administrators can set tenant, group and user budgets.

This is the enterprise version of the same principle behind Cloudflare’s Virtual Wallets: autonomy becomes acceptable when spending is visible, attributable and capped.

A seat license gives a person access to the system. Consumption pricing measures the work the system performs. Microsoft is therefore moving from software sold only per user toward a combination of seats and delegated machine activity.

## Scout gives an autonomous agent its own corporate identity

Cowork still begins with a user delegating a task. Microsoft Scout goes further.

Microsoft introduced Scout as its first “Autopilot,” a category of always-on agents designed to continue working without a fresh prompt for every action. Scout can operate across cloud, desktop and web environments and connect to Teams, Outlook, OneDrive, SharePoint, browser resources, local resources and MCP servers.

The most important detail is not its list of integrations. It is that [Scout receives its own governed Microsoft Entra identity](https://www.microsoft.com/en-us/microsoft-365/blog/2026/06/02/introducing-microsoft-scout-your-always-on-personal-agent/).

That means the agent does not need to hide behind a shared service account or impersonate a human for every operation. Its access can be scoped through existing directory policy, its actions can be attributed to a known non-human principal and sensitive operations can require human approval. Microsoft also says Purview controls such as sensitivity labels and data-loss prevention policies can apply when the agent acts.

Scout is powered by OpenClaw open-source technology, with Microsoft adding the identity, credential, access and compliance layers expected by enterprise customers.

It is another form of delegated authority:

- the agent has an identity separate from the employee;
- permissions define the resources it can reach;
- policy determines which actions require approval;
- logs establish what it did and under whose authority;
- the runtime allows work to continue in the background.

Scout was introduced as a new product category, not reported as having 30 million active users. The Copilot seat number demonstrates Microsoft’s distribution base; it should not be presented as Scout adoption.

## The common architecture is identity, policy, budget and audit

Cloudflare Wallets and Microsoft Scout appear to solve different problems, but their control models are converging.

| Control layer | Cloudflare | Microsoft |
| --- | --- | --- |
| Identity | `cloudflare.pay` handle linked to an account and cryptographic agent identity | Governed Entra identity for each agent |
| Authority | Virtual Wallet permissions and merchant interaction rules | Resource access, organizational policy and approval requirements |
| Budget | Allowance, allow list and transaction caps | Copilot Credits, tenant/group/user budgets and usage reporting |
| Execution | Agents SDK, APIs, MCP tools and x402 requests | Cowork workflows and Scout across Microsoft 365, desktop and web |
| Accountability | Persistent wallet identity and payment receipts | Directory attribution, audit logs and Purview controls |

This stack matters because a capable model without governance is difficult to deploy. An agent that can reason but cannot authenticate remains a demo. An agent that can authenticate but has unrestricted access is a security incident waiting to happen. An agent that can act but has no budget can create unpredictable bills. An agent with no distinct identity leaves investigators unable to determine whether a person, service account or model performed an action.

Agent infrastructure is therefore beginning to resemble the systems built for employees and companies:

- names and credentials;
- roles and permissions;
- budgets and expense policies;
- records and accountability;
- escalation to a responsible human.

The agent is becoming a non-human economic and organizational actor.

## What changes for API vendors and software companies

For API businesses, machine-native payments could replace part of the conventional funnel. A service may no longer need every prospective user to create an account before trying one request. Pricing, terms and payment instructions can be returned directly to an agent.

That favors products that expose clear machine-readable capabilities and granular pricing. A small specialist API could be discovered and purchased by agents without building a sales-led onboarding process. Conversely, services that require a long dashboard workflow, manual approval and annual contracts may become invisible to autonomous buyers.

For enterprise software, the shift from seats to seats plus consumption changes product design and procurement. Companies will need to answer questions that did not exist for ordinary software licenses:

- Which agents may spend?
- Which models and tools may they select?
- Who owns the budget?
- What transaction requires approval?
- How is value measured per completed task?
- Who is responsible when an autonomous action is wrong?

The winning control plane may be as important as the winning model.

## Financial authority increases the cost of agent mistakes

Giving agents money and persistent access also raises the stakes of familiar failure modes.

Prompt injection could attempt to redirect an agent toward an attacker-controlled paid endpoint. A leaked Virtual Wallet API key could consume its allowance. A compromised organizational account could create apparently legitimate agent identities. An agent might repeatedly purchase a low-quality service because its evaluation loop is flawed. A merchant could return misleading payment terms or exploit a weak payment verifier.

Spending caps limit the blast radius; they do not make the action correct.

Organizations will still need transaction logs, anomaly detection, revocation, merchant controls, key rotation and approval thresholds. For higher-value purchases, a human may remain part of the authorization chain. Stablecoin settlement can also reduce the consumer protections associated with cards, including familiar dispute and chargeback processes.

Microsoft faces the corresponding enterprise risk. An agent with access to email, files and browsers can move information or initiate consequential actions at machine speed. Separate identities, scoped access and Purview controls are therefore not optional administrative extras. They are the prerequisites for allowing the agent to remain active.

## Agent autonomy is becoming an infrastructure problem

The first generation of AI products asked whether a model could answer well. The next asks whether software can be trusted to continue acting after the user looks away.

Cloudflare and Microsoft are approaching that question from opposite ends of the network. Cloudflare is building a public Internet layer in which agents can identify themselves, pay per request and transact with independent services. Microsoft is building a governed enterprise layer in which agents can operate across organizational data and applications.

Neither has finished the problem. Cloudflare Wallet payments are still forthcoming, even though handles can be claimed now. Microsoft’s paid-seat milestone does not prove that autonomous agents are producing reliable returns in every organization. Identity systems can be compromised, budget policies can be badly designed and audit logs only help after actions are recorded correctly.

But the direction is clear.

An agent is no longer being designed merely as a model behind a chat box. It is being given a durable name, a constrained account, a budget, tools, permissions and responsibility for work that continues over time.

The companies that make those boundaries understandable may determine how much autonomy people are willing to grant.