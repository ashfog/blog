---
title: "Claude of Duty Turns Game Prototyping Labor Into Token Spend"
description: "Claude Opus 5 generated a playable browser FPS through a multi-agent critique loop, showing how AI can compress prototype work without replacing full AAA production."
publishedAt: 2026-08-03T13:05:00Z
category: agents
tags:
  - claude-opus-5
  - claude-code
  - gauntlet-loop
  - game-development
  - multi-agent
  - threejs
featured: false
sources:
  - title: "Claude of Duty source repository"
    url: "https://github.com/mshumer/Claude-of-Duty"
  - title: "The complete Claude of Duty prompt"
    url: "https://github.com/mshumer/Claude-of-Duty/blob/main/prompt.md"
  - title: "Claude of Duty architecture contract"
    url: "https://github.com/mshumer/Claude-of-Duty/blob/main/ARCHITECTURE.md"
  - title: "Matt Shumer’s Gauntlet Loop explanation"
    url: "https://somethingbig.ai/gauntlet-loop"
  - title: "Anthropic documentation for Claude Opus 5"
    url: "https://platform.claude.com/docs/en/about-claude/models/whats-new-opus-5"
  - title: "Anthropic Claude API pricing"
    url: "https://platform.claude.com/docs/en/about-claude/pricing"
---

A browser-based first-person shooter called **Claude of Duty** has become one of the clearest demonstrations of how far autonomous coding agents have moved beyond autocomplete.

The public repository contains roughly 55,000 lines of JavaScript spread across 11 subsystems. It includes a navigable 3D environment, weapons, enemies, physics, procedural materials, synthesized audio, post-processing, a HUD and performance tooling. According to the project documentation, a fleet of Claude Opus 5 agents produced the code under orchestration from one short top-level prompt.

The viral interpretation is that an AI created a “AAA game” for a few hundred dollars. That is too broad. Claude of Duty is a technically ambitious playable prototype, not a commercial game comparable with Call of Duty. Its own README says so directly and publishes the evidence: human-independent critics never preferred its frames to the real reference game, most screenshots remained in the “amateur” range, and the optimized build ran at roughly 28–30 frames per second on the tested high-resolution laptop configuration.

The project is still important. It shows that a large block of early game-development labor can now be purchased as model inference rather than assembled through a conventional team. The change is not that complete studios have become unnecessary. It is that the cost and speed of turning an idea into a substantial interactive prototype are moving onto a different curve.

## “One prompt” does not mean one response

The entire public prompt is only a few paragraphs. It asks for a modern military shooter in Three.js, tells the lead agent to divide the work among subagents, assigns separate critics to inspect the results, and instructs the system to continue iterating against real Call of Duty imagery.

That qualifies as one initial prompt. It does not describe a single model completion.

The prompt launches an internal production process: planners divide the project, builders implement separate systems, visual critics judge rendered output, and repeated loops send weak work back for revision. The repository’s architecture contract gives those agents strict ownership boundaries and a shared interface so that independent changes can coexist.

Calling this “one-shot game generation” is therefore accurate only at the user-interface layer. The human entered one high-level request. Behind that request, the model performed many calls, delegated work, inspected screenshots, ran tests, modified code and repeated the cycle.

This distinction matters because it identifies the real breakthrough. The impressive part is not that a model can emit 55,000 lines in one answer. It is that an agent harness can keep a large software artifact coherent while many model instances work on it over an extended run.

## The Gauntlet Loop is an evaluation system, not a magic phrase

Matt Shumer calls the method behind the project the **Gauntlet Loop**. Its structure is simple:

1. Set an ambitious goal and a concrete external quality bar.
2. Let a lead agent split the artifact into parts that can be improved independently.
3. Give each important part to a builder.
4. Use a fresh critic that did not participate in the implementation.
5. Make the critic inspect the actual output, identify the largest gap and send it back.
6. Continue until the operator stops the run or the output clears the bar.

The separation between builder and critic is the important mechanism. A builder knows why it made each compromise and can explain away defects. A fresh critic has less attachment to those decisions. It can compare pixels, tests or performance measurements without inheriting the builder’s narrative.

The reference bar does not need to be reachable. Shumer acknowledges that Claude of Duty did not become better than Call of Duty. The commercial game served as a direction and prevented the agents from stopping at “surprisingly good for AI.”

That makes the method closer to automated production management than to traditional prompting. The top-level instruction supplies intent and acceptance criteria. The agent system supplies decomposition, implementation, inspection and repeated revision.

## What the agents actually built

Claude of Duty is more than a visual mock-up. The repository describes a functioning browser FPS built with Three.js and WebGL2, with Three.js as its only runtime dependency.

Its rendering system includes shadows, ambient occlusion, temporal anti-aliasing, motion blur, bloom, exposure control and color grading. A procedural texture system generates surfaces such as concrete, brick, metal, wood, fabric and glass. The world contains enterable buildings and instanced props.

The project also includes:

- a custom collision and physics implementation;
- player movement with sprinting, crouching, sliding, mantling and leaning;
- weapon recoil, aiming, reload animations and projectile behavior;
- enemy perception, navigation, cover behavior and ragdolls;
- GPU particles, decals, tracers, muzzle flashes and explosions;
- spatialized Web Audio synthesis without imported sound files;
- scripted play tests, visual captures, image-difference checks and frame-time profiling.

The absence of external art assets is genuine according to the repository. Textures, geometry, animation and sound are generated procedurally from code at load time. There are no imported models, image textures, HDR environments or audio files.

That constraint makes the result more technically interesting, but it also explains some of the visual ceiling. Procedural materials can look repetitive or synthetic at close range. Character anatomy, weapon handling and authored environmental detail are among the areas where specialist artists still create a large advantage.

## The public project does not verify the $423 figure

A widely shared version of the story attaches two precise numbers to Claude of Duty: approximately $423 and 690 million tokens. Those numbers are not documented in the public repository, its prompt file or Shumer’s Gauntlet Loop explanation.

They may come from a private usage export, a later run or a different game generated with the same method. Without a primary cost record that separates input, output, cache writes and cache reads, they should not be treated as an audited bill for this repository.

The distinction is material because token totals do not translate into cost through one flat rate. Anthropic currently prices Claude Opus 5 at $5 per million base input tokens and $25 per million output tokens, while cached input is much cheaper and cache creation has its own rate. A run dominated by cache reads can process an enormous nominal token count without paying the same price as an equivalent number of newly generated output tokens.

The reliable economic claim is narrower: the direct model expense of producing a sophisticated prototype can be orders of magnitude below the payroll required to assign the same exploratory task to a multidisciplinary studio team. The exact multiplier depends on the run, the harness, the amount of human cleanup and what is counted as “finished.”

## The repository’s failures are as informative as its features

The project documents its own weaknesses unusually well.

An early static-camera benchmark reported 94 frames per second even though real gameplay suffered severe stalls. Once the profiler measured movement, firing and the actual device pixel ratio, performance fell to 12–17 frames per second, with individual stalls lasting more than a second. Shader pre-warming and other optimization work improved the median to roughly 28–30 frames per second and removed runtime shader compilation.

Visual evaluation also exposed the distance between a prototype and a AAA reference. Eleven adversarial critics scored the output across several rounds. The best aggregate score reached 5.05 out of 10. Every blind comparison still selected the real Call of Duty image. Hands remained blocky, characters looked mannequin-like, materials lacked photographed richness and indirect lighting remained approximate.

The multi-agent process itself was not automatically efficient. Parallel agents working on coupled rendering systems frequently broke one another’s assumptions. The repository reports that sequential passes with a single owner for each tightly connected concern improved the score more than several rounds of broad parallel fan-out.

This is an important correction to the popular idea that more agents always produce more progress. Parallelism works when boundaries are real. Lighting, tone mapping, materials and atmosphere are coupled systems; assigning them to isolated agents can create local improvements and global regressions.

## Prototype economics are changing faster than production economics

Traditional game development is expensive because interactive worlds require many forms of labor to converge: engineering, animation, environment art, sound, game design, writing, testing, optimization, accessibility, localization, networking, security, platform certification and production management.

Claude of Duty compresses a meaningful subset of that work:

| Production task | What the project demonstrates |
| --- | --- |
| Engine and gameplay scaffolding | Agents can create a substantial playable browser implementation |
| Procedural visual assets | Code can generate usable geometry, materials and effects without an art library |
| Audio prototyping | Web Audio can synthesize a complete temporary sound layer |
| Iterative visual review | Screenshot capture and critics can drive repeated improvement |
| Performance investigation | Agents can build profilers, locate stalls and implement optimizations |
| Full commercial production | Not demonstrated |

The last row is the boundary that headlines often remove.

A commercial shooter needs more than a technically dense demo. It needs a coherent art direction, compelling level design, progression, balancing, multiplayer infrastructure, anti-cheat systems, accessibility, localization, legal review, content pipelines, live operations and months of repeated playtesting. It must work across hardware configurations and remain maintainable after launch.

AI has not compressed all of those requirements into one prompt. It has made the first playable version dramatically cheaper.

That alone changes who can experiment. An independent creator can test a game concept before raising money. A studio can explore several visual directions before committing an art team. Designers can build interactive references rather than static documents. Small teams can spend more time selecting and refining ideas because the cost of discarding a prototype is lower.

## Game labor is becoming a hybrid of human judgment and token budgets

It is tempting to describe the transition as labor being replaced by tokens. A more accurate description is that labor is being reorganized.

The model supplies implementation volume, repeated attempts and tireless inspection. The human chooses the goal, sets the reference bar, decides what risks matter, watches spending and determines when the artifact is useful. As generation becomes cheaper, selection becomes more valuable.

The Claude of Duty prompt is short because the harness is thick. It depends on subagents, visual capture, architecture rules, profiling, deterministic tests and a loop that refuses to accept the builder’s own confidence as evidence. The apparent simplicity at the top is supported by substantial machinery underneath.

That pattern will extend beyond games. Animation, architectural visualization, interactive education, simulation and product design all contain stages where many hours are spent converting a concept into something concrete enough to judge. Agent loops can increasingly buy those iterations with compute.

Claude of Duty is not a $423 replacement for a AAA studio. It is a signal that the prototype stage has entered the token economy. A small team can now purchase an amount of exploratory implementation that recently required far more time, coordination and specialized labor.

The competitive question for game creators is therefore changing. It is no longer only who can build the first version. It is who can define the right experience, evaluate generated work honestly and turn a fast prototype into a game people continue to play.
