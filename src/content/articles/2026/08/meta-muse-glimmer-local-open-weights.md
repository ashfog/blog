---
title: "Meta Returns to Open Weights With Muse Glimmer, a 30B Local Agent Model Under Apache 2.0"
description: "Muse Glimmer brings Meta back to permissive open weights with a 30B dense agent model that can run locally on high-end consumer hardware, while Muse Spark 1.2 is next."
publishedAt: 2026-08-18T13:40:00Z
category: models
tags:
  - meta
  - muse-glimmer
  - muse-spark
  - open-weights
  - local-ai
  - agentic-ai
featured: false
sources:
  - title: "Introducing Muse Glimmer: An Open Agentic Model That Runs on Your Device"
    url: "https://research.meta.ai/blog/introducing-muse-glimmer-open-agentic-model"
  - title: "Meta launches new AI model as Zuckerberg champions open-weight push"
    url: "https://www.reuters.com/world/china/meta-launches-new-ai-model-zuckerberg-champions-open-weight-push-2026-08-10/"
  - title: "Zuck rekindles open weights Llama drama with Muse Glimmer"
    url: "https://assets.theregister.com/2026/08/10/202616/?td=keepreading"
  - title: "Introducing Muse Spark 1.1"
    url: "https://ai.meta.com/blog/introducing-muse-spark-meta-model-api/"
---

Meta is back in the open-weight model race, and this time the most important detail is not a benchmark score.

The company has released **Muse Glimmer**, a 30-billion-parameter dense agentic model whose weights are available under the permissive **Apache 2.0** license. Meta designed it specifically for local, always-on agents: software that can plan, call tools, inspect results, recover from failures, and keep working without sending every model request to a cloud API.

That alone makes Glimmer notable. Meta built much of its modern AI developer reputation around the Llama family, but Llama used Meta-specific community licenses rather than a standard permissive open-source license. Muse Glimmer changes that equation. Apache 2.0 gives developers a much clearer path to modification, redistribution, commercial deployment, and integration into products without inheriting the unusual licensing conditions that surrounded later Llama releases.

The second important detail is hardware. Meta has not merely published a 30B model and left local inference as an exercise for enthusiasts. It has explicitly optimized Glimmer to fit into high-end consumer machines. According to Meta's release material, quantization reduces the language model to **under 20GB**, while the broader deployment target is a system with roughly **24GB or more of usable GPU or unified memory**. That brings a serious agent model into range of a single desktop GPU and high-memory Apple Silicon laptops.

## A 30B dense model built for agents, not just chat

Muse Glimmer is a **dense** model, meaning all of its roughly 30 billion parameters participate in generation rather than activating only a small subset of experts as in a Mixture-of-Experts model.

That makes it computationally heavier per token than sparse models with similar total parameter counts, but it also gives Meta a straightforward target for local optimization. The company describes Glimmer as an agentic model capable of planning, tool calls, result verification, and failure recovery. Reuters likewise reports that it is intended for agent tasks on Macs and PCs using a single graphics card.

This distinction matters because local AI is moving beyond the old question of whether a model can answer prompts without an internet connection. The more useful question is whether a machine sitting under a desk can run an **autonomous workflow loop** locally: inspect files, write code, query local services, manage documents, call applications, and preserve private context without repeatedly uploading that context to a hosted provider.

Glimmer is aimed squarely at that use case.

Meta says the model was distilled from the larger Muse family, while retaining capabilities needed for end-to-end agent execution. That is a different optimization target from producing the highest possible score on a general reasoning leaderboard. A local agent must be small enough to load, fast enough to maintain interactive workflow continuity, and reliable enough to execute many steps without falling apart after the first failed tool call.

## Why the under-20GB quantized size matters

A 30B dense model stored in BF16 precision is roughly a 60GB-class weight set before runtime overhead. That is far outside the practical range of mainstream consumer GPUs.

Meta's local strategy depends on quantization. The company says it uses quantization to bring the language model below 20GB, and independent reporting describes a 4-bit version at roughly 16-17GB for the weights themselves. The remaining memory headroom can then be used for the KV cache, multimodal components, runtime buffers, and the lightweight drafter used for speculative decoding.

This is why simply saying “the model is under 20GB” can be misleading. A 20GB model file does not mean a 20GB GPU is automatically sufficient for every workload. Long contexts and agent loops consume additional memory. Meta's stated target of **24GB VRAM** is therefore the more useful practical number for developers planning a deployment.

A single **RTX 5090** is an obvious fit. Its large VRAM pool and extremely high memory bandwidth are well suited to dense local inference. The Register reports that Meta's performance estimates on an RTX 5090 range from roughly 75 tokens per second to more than 200 tokens per second depending on decoding configuration, with speculative decoding responsible for the upper end.

Apple Silicon is also part of the target. High-memory **M4 Max and M5 Max MacBook Pro** configurations can hold the quantized model comfortably in unified memory, and Meta has included high-end Macs in its local performance work. The speed is lower than a 5090-class desktop GPU, but the combination of unified memory capacity, bandwidth, low noise, and battery-backed portability makes these machines unusually practical for private local agents.

The qualifier is important: not every MacBook configuration is equivalent. The model may technically fit in a lower-memory system while leaving too little room for useful context and agent state. For a persistent agent, memory headroom matters more than merely getting the weights to load.

## “Offline” is possible, but the agent may still choose the network

Muse Glimmer can run inference locally after the weights and runtime are installed. That means prompts, private documents, source code, and model state can remain on the user's machine instead of being sent to Meta or another inference provider.

That is a meaningful privacy and cost advantage.

But local inference should not be confused with a permanently air-gapped agent. If the agent is given web search, cloud APIs, GitHub access, email, remote databases, or other network tools, those tool calls still leave the machine. Developers can choose a fully offline architecture, but the degree of offline operation depends on the surrounding tool stack rather than the model alone.

For local coding agents, home automation, private document analysis, internal knowledge systems, and personal assistants, this separation is useful: **reasoning can stay local while network access becomes an explicit tool permission instead of a requirement for every model call.**

## Apache 2.0 is a bigger strategic change than the parameter count

The license may be the most consequential part of the launch.

Meta's Llama models were widely available, but they were not released under Apache 2.0. Developers had to account for Meta's own license terms, including conditions that could matter for redistribution and very large commercial deployments.

Muse Glimmer's Apache 2.0 release removes much of that ambiguity. Teams can build derivatives, quantizations, fine-tunes, local products, hosted services, and embedded agent systems under a familiar permissive license.

That puts Meta closer to the licensing posture that has helped models from Qwen and other open-weight labs spread rapidly through local inference communities. The competitive value is not only ideological. A model becomes far more useful as infrastructure when downstream developers do not need a custom legal analysis before shipping it.

It is still more precise to call Muse Glimmer an **open-weight model** rather than claim that every part of its training process is open source. The weights and license are open; that does not automatically mean the full training dataset, data pipeline, or every internal training component has been published.

## Muse Spark 1.2 is the more important promise still ahead

Glimmer is not Meta's largest or most capable Muse model. The company has also announced that it plans to release an **open-weight version of Muse Spark 1.2**, the latest flagship model in the family.

That promise changes how Glimmer should be read strategically.

If Glimmer were an isolated small-model release, it could be treated as a developer-friendly side project. Pairing it with a commitment to open Spark 1.2 suggests something broader: Meta is rebuilding an open-weight ladder, with a locally deployable 30B model at one end and a much more capable foundation model above it.

Reuters describes Spark 1.2 as Meta's most advanced model and reports that its weights are planned for release. Meta had previously moved the Muse Spark line toward hosted access through its Model API, so an open-weight Spark 1.2 would represent a meaningful reversal from the idea that Meta's strongest models would remain cloud-only.

That is why Muse Glimmer matters beyond its size. It is evidence that Meta's open-model strategy is active again, not merely inherited branding from the Llama era.

## The practical takeaway for developers

Muse Glimmer occupies a useful middle ground.

It is much larger than the small 7B-14B models commonly used for lightweight local assistants, but far smaller than frontier-scale systems that require multi-GPU servers. With 4-bit quantization, a developer with a 24GB-class GPU or a sufficiently configured Apple Silicon machine can run a serious agent model locally and avoid per-token API billing for every iteration.

That makes it particularly interesting for workloads where privacy, repeated tool use, or long-running automation would make cloud inference expensive or undesirable.

The larger story, however, is Meta's direction. **Apache 2.0 for Glimmer, consumer-hardware deployment, and a promised open-weight Muse Spark 1.2 together look less like a one-off release and more like a deliberate return to open-weight competition.**

For the local AI ecosystem, that competition is valuable. Better models matter, but so do licenses, quantization support, runtime compatibility, and whether developers can actually put the model on a machine they control. Muse Glimmer is one of the clearest recent examples of a major U.S. lab optimizing for all four at once.