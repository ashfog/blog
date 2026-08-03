---
name: ashfog-article-publisher
description: Research, write, validate, update, and publish English ASHFOG articles about AI models, agents, open source, developer tools, infrastructure, hardware, research, security, or policy. Use when the user asks to write, revise, preview, or publish an article to ashfog/blog.
---

# ASHFOG Article Publisher

Create one durable, source-linked article without daily windows, source quotas, automated feed collection, or OpenAI API calls.

## Load the publication contract

Read `editorial/article-policy.md`, `src/content.config.ts`, `editorial/image-library.json`, and `README.md`. Treat them as the source of truth.

## Research and draft

1. Start from the current `main` branch and inspect existing `src/content/articles/` entries before choosing a slug. Update an existing article when the requested subject already has a canonical page.
2. Browse when the topic is current, factual, product-specific, technical, or otherwise benefits from verification. Prefer official documentation, model cards, repositories, releases, papers, specifications, and policy texts. Add credible independent evidence only when useful.
3. Decide the article's angle from the request. If the user supplies only a subject, write a balanced explainer covering what it is, what changed, how it works, practical implications, limitations, and unresolved questions as appropriate.
4. Write original English Markdown at `src/content/articles/<slug>.md`. Follow the schema exactly. Use a stable non-date slug, one category, focused tags, inline source links, and an essential `sources` list.
5. Use an evidence-led title and description. Do not copy marketing language or present inference as fact. Use the length the subject requires rather than padding to a fixed word count.
6. Omit `heroImageId` by default so Astro chooses a stable image from the matching category pool. Use an existing library ID only for an intentional override. Do not generate an image unless the user separately asks.

## Validate and publish

Run `pnpm run build`. Resolve schema, rendering, Pagefind, RSS, sitemap, canonical, and structured-data failures before publication.

In Preview mode, report the candidate path, angle, sources, word count, image behavior, and build result without changing GitHub.

In Publish mode, confirm that the target branch still matches the revision used to draft the article, commit only the intended article and required site files, and push without force. Never overwrite unrelated work. Cloudflare Pages publishes the resulting `main` update automatically.

Return the article title, path, canonical URL, sources used, word count, commit, and deployment handoff status.
