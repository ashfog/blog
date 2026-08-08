---
title: "DeepSeek V4 Flash 0731 Turns a Preview Into an Agent Model"
description: "DeepSeek's official V4 Flash release sharply improves coding and tool-use scores, adds DSpark decoding, and reveals the trade-offs behind its agent-first design."
publishedAt: 2026-08-03T08:00:00Z
category: models
tags:
  - deepseek
  - deepseek-v4
  - coding-agents
  - open-weights
  - inference
featured: false
sources:
  - title: "DeepSeek-V4-Flash-0731 model card"
    url: "https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-0731"
  - title: "DeepSeek-V4 technical report"
    url: "https://arxiv.org/abs/2606.19348"
  - title: "DSpark technical paper"
    url: "https://arxiv.org/abs/2607.05147"
  - title: "DeepSeek API model and pricing documentation"
    url: "https://api-docs.deepseek.com/quick_start/pricing"
---

DeepSeek has released **DeepSeek-V4-Flash-0731**, a new checkpoint that turns the V4 Flash preview into the official release. The distinction matters. DeepSeek-V4 itself first appeared in April 2026; the July 31 checkpoint is not a new generation called V4.1 or V5. It is a focused upgrade to the smaller Flash branch, aimed squarely at coding agents, tool use, and faster production inference.

The most important change is not a larger context window or a new parameter count. Those were central to the original V4 announcement. This release instead combines stronger agent-oriented post-training with an attached speculative decoding module called DSpark. DeepSeek's own results show large gains over both the V4 Flash preview and, on several agent benchmarks, the much larger V4 Pro preview.

That makes V4 Flash 0731 an unusually revealing release. It shows how much of an agent model's usefulness can come from post-training, tool protocol design, inference engineering, and evaluation conditions - not simply from making the base model larger.

## What DeepSeek actually released

The [official model card](https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash-0731) describes 0731 as the official DeepSeek-V4-Flash release and says it supersedes the preview checkpoint. The weights are published under the MIT license, and DeepSeek provides instructions for serving them with vLLM and SGLang.

The release remains part of the V4 architecture described in DeepSeek's [technical report](https://arxiv.org/abs/2606.19348). V4 was designed around efficient long-context operation, using a hybrid attention system to reduce the computation and memory normally required as prompts grow. The 0731 update does not present a new base architecture. Its emphasis is the behavior of the trained model in agent workflows and the speed at which that behavior can be served.

DeepSeek also introduces three reasoning-effort levels: `low`, `high`, and `max`. These settings control how much deliberation the model performs before producing an answer. For local deployment, the company recommends a maximum output allowance of 384,000 tokens when using the high or max settings. That is an upper operational recommendation, not a promise that every task benefits from extremely long reasoning traces.

There is another implementation detail developers should notice. The checkpoint does not ship with a conventional Jinja chat template. DeepSeek instead provides an encoding package that translates OpenAI-compatible messages into the model's native prompt format and parses the model's text output. That gives the format room to represent multi-turn conversation, reasoning content, and tool calls, but it also means integrations should not assume that an older V4 template can be swapped in without testing.

## The benchmark gains are large - and conditional

DeepSeek reports substantial improvements across a set of coding and agent evaluations. Selected results from the model card are shown below.

| Benchmark | V4 Flash 0731 | V4 Flash preview | V4 Pro preview |
| --- | ---: | ---: | ---: |
| Terminal Bench 2.1 | 82.7 | 61.8 | 72.1 |
| NL2Repo | 54.2 | 39.4 | 38.5 |
| Cybergym | 76.7 | 38.7 | 52.7 |
| Toolathlon-Verified | 70.3 | 49.7 | 55.9 |
| Agents' Last Exam | 25.2 | 15.8 | 16.5 |

These are company-reported results, not a complete independent verdict. DeepSeek says its code-agent tests used the minimal mode of a model-specific framework called DeepSeek Harness, with `reasoning_effort=max`, `temperature=1.0`, and `top_p=0.95`. The harness had not been released when the model card was published. Two additional DSBench results in the card come from internal test sets.

Those qualifications do not make the results meaningless. They define what the results actually demonstrate: under DeepSeek's chosen agent scaffold and a generous reasoning budget, the new Flash checkpoint is far more capable than the preview on the listed tasks. They do not yet show that every coding tool, prompt format, or inference provider will reproduce the same improvement.

The comparison with V4 Pro preview is still significant. DeepSeek says Flash 0731 has a far smaller activated parameter count, yet it beats the Pro preview on every benchmark in the table above. This is evidence that the release is more than a serving optimization. The target model itself has received meaningful agent-focused training. It is not evidence that Flash is universally better than Pro across knowledge, writing, reasoning, or every software task.

## DSpark makes speed part of the checkpoint

V4 Flash 0731 has the same model structure as DeepSeek's DSpark variant, with speculative decoding weights attached to the checkpoint. Speculative decoding uses a smaller drafting component to propose several future tokens, then asks the full model to verify them together. When the guesses are accepted, the system produces multiple tokens for the cost of fewer full-model decoding steps.

The difficulty is choosing how many speculative tokens to verify. Long draft blocks can be efficient when the guesses are good, especially in structured code. They can waste compute when later tokens are likely to be rejected. DeepSeek's [DSpark paper](https://arxiv.org/abs/2607.05147) addresses that problem with two linked ideas.

First, a semi-autoregressive drafter combines a parallel backbone with a lightweight sequential stage. The parallel part proposes a block quickly; the sequential stage adds information about relationships among tokens inside that block. Second, a confidence-aware scheduler estimates how much of each proposed prefix is likely to survive verification, then adapts the verification length to the request and the current engine load.

DeepSeek reports that DSpark increased per-user generation speed by 60 to 85 percent for V4 Flash at matched throughput in production traffic, compared with its earlier MTP-1 baseline. This figure comes from DeepSeek's own deployment and should be read as a systems result under its measured hardware, traffic, and serving configuration. It should not be treated as a guaranteed speedup on every local machine.

The practical improvement is that DSpark is no longer merely a separate research artifact that deployers must assemble around the model. V4 Flash 0731 includes the relevant speculative module in the release. vLLM can enable it through a `dspark` speculative configuration, while SGLang exposes a dedicated `DSPARK` serving option. The checkpoint still demands serious hardware: DeepSeek's vLLM example uses a single node with four GB300 GPUs. "Open weights" here means inspectable and self-hostable, not lightweight.

## Why this release is aimed at agents

Coding agents place different pressure on a model than ordinary chat. They need to keep state across long tool traces, interpret repository structure, issue valid tool calls, recover from failed commands, and continue working after large blocks of logs or source code enter the context. Latency also compounds: a small delay repeated across dozens of model-tool cycles becomes a slow workflow.

V4's million-token design addresses context capacity and memory efficiency. The 0731 post-training addresses behavior inside the workflow. DSpark addresses decoding speed between tool calls. The three layers fit together more coherently than a benchmark-only model upgrade:

1. The architecture makes long histories less expensive to retain.
2. Agent-focused training improves decisions made within those histories.
3. Speculative decoding reduces the time spent generating each step.

This combination is why the update may matter more to developers building terminal agents, repository assistants, and autonomous research tools than to people using a chatbot for short questions. Its central claim is operational: a smaller open model can remain capable and responsive over a long sequence of actions.

## What is available, and what remains unclear

The open checkpoint is unambiguous: DeepSeek-V4-Flash-0731 is available from DeepSeek's verified Hugging Face organization under the MIT license. Its model card documents the encoding format and local serving paths.

The hosted API picture is less explicit. DeepSeek's public [API model page](https://api-docs.deepseek.com/quick_start/pricing) currently lists the general `deepseek-v4-flash` and `deepseek-v4-pro` identifiers rather than a dated `deepseek-v4-flash-0731` identifier. The 0731 model card does not state that the public API alias has been moved to this exact checkpoint. Developers who require version-level reproducibility should therefore avoid assuming that the generic hosted alias and the downloadable 0731 weights are identical until DeepSeek documents that mapping.

Independent evaluations are the other missing piece. The reported gains are large enough to deserve attention, but the most useful next tests will run the checkpoint in common open agent frameworks, control for reasoning-token budgets, measure task completion cost rather than headline accuracy alone, and compare DSpark-on with DSpark-off on realistic hardware. Error analysis matters as much as average scores: an agent that succeeds more often but becomes harder to stop, more verbose, or less reliable in tool formatting may not be an upgrade for every production system.

## The larger lesson from V4 Flash 0731

DeepSeek V4 Flash 0731 is best understood as an agent systems release, not a new model generation. It strengthens the Flash checkpoint, packages an inference accelerator with it, and provides a tool-oriented encoding path. The result challenges the simple assumption that the largest available model should automatically occupy the agent tier.

If independent testing supports DeepSeek's numbers, the release could make V4 Flash the more practical default for many coding-agent workloads: cheaper to activate than Pro, faster to serve with DSpark, and trained specifically for multi-step tool use. But the most defensible conclusion today is narrower. DeepSeek has published a serious official successor to its V4 Flash preview, and it has made agent performance - not general chat novelty - the defining measure of the upgrade.
