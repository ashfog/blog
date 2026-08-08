---
title: "ASHFOG Turns a Git Repository Into an AI Publishing Workbench"
description: "ASHFOG combines Astro, repository-owned editorial rules, GitHub Actions validation, static search, and Cloudflare deployment into a chat-driven publishing workflow."
publishedAt: 2026-08-08T15:30:00Z
category: developer-tools
tags:
  - ashfog
  - ai-publishing
  - astro
  - github-actions
  - cloudflare-pages
featured: false
sources:
  - title: "ASHFOG blog repository"
    url: "https://github.com/ashfog/blog"
  - title: "ASHFOG portable publishing contract"
    url: "https://github.com/ashfog/blog/blob/main/SKILL.md"
  - title: "Validate article candidate workflow"
    url: "https://github.com/ashfog/blog/blob/main/.github/workflows/publish-article.yml"
  - title: "Promote validated article workflow"
    url: "https://github.com/ashfog/blog/blob/main/.github/workflows/promote-article.yml"
  - title: "Astro content collections"
    url: "https://docs.astro.build/en/guides/content-collections/"
  - title: "Pagefind documentation"
    url: "https://pagefind.app/docs/"
  - title: "Cloudflare Pages Git integration"
    url: "https://developers.cloudflare.com/pages/configuration/git-integration/"
---

What would a blog look like if the publishing system lived inside the repository rather than inside a CMS dashboard?

That is the more interesting idea behind [ashfog/blog](https://github.com/ashfog/blog). The repository serves the ASHFOG website, but it also defines an AI-assisted publishing workflow designed to accept a short request in a capable GPT or Claude chat, turn that request into one validated Markdown article, and move the result toward production without giving the conversational agent unrestricted control over the site.

The implementation is deliberately conservative. AI does the research and drafting; the repository defines what counts as a valid article and what is allowed to reach `main`.

## The repository is the publishing contract

The center of the system is not an API integration. It is the root [SKILL.md](https://github.com/ashfog/blog/blob/main/SKILL.md), a portable instruction contract that tells a repository-capable AI how to interpret a publishing request.

That contract specifies the source hierarchy, article language rules, Frontmatter schema, allowed categories, slug format, research expectations, image behavior, validation paths, and the distinction between preview and publish modes. Public site identity is kept separately in `site.config.json`, which defines the ASHFOG name, canonical URL, language, timezone, publisher details, navigation, branding, and theme.

This separation matters. A model can change, and the chat interface can change, but the publication rules remain versioned with the site. Instead of copying a long prompt into every AI product, the user can tell the agent to read the repository's current contract.

The idea resembles infrastructure as code applied to editorial operations: the workflow is reviewable, diffable, and tied to the same Git history as the content it governs.

## Astro supplies a strict content layer

The site uses Astro and its content collection system rather than treating Markdown as arbitrary files. Astro's [content collections](https://docs.astro.build/en/guides/content-collections/) are designed for structured content with schemas and type safety, and ASHFOG builds additional constraints on top.

The repository's `src/content.config.ts` requires titles and descriptions within defined lengths, a valid publication time, one approved category, unique lowercase tags, controlled image metadata, and HTTP or HTTPS source URLs. The schema is strict, so unknown Frontmatter fields are rejected.

A second validation layer, `scripts/validate-articles.mjs`, checks the filesystem and Markdown itself. Article paths must follow `YYYY/MM/lowercase-hyphenated-slug.md`; the directory must match the UTC month in `publishedAt`; public slugs must be unique; symbolic links are rejected; raw HTML is prohibited; and unsafe link protocols are blocked. The script even contains regression cases for script tags, `javascript:` links, insecure remote images, and missing image alt text.

This is more defensive than a typical personal blog because the intended author is sometimes an AI agent. The repository assumes generated content should be treated as untrusted input until it passes deterministic checks.

## The unusual part is the two-stage GitHub Actions path

The most distinctive design appears when the chat environment can write to GitHub but cannot run the full site locally.

In that case, the publishing contract instructs the agent to create a `publish/<slug>` branch containing exactly one article commit. The [validation workflow](https://github.com/ashfog/blog/blob/main/.github/workflows/publish-article.yml) runs with `contents: read`. Before building anything, it verifies that the candidate is exactly one commit ahead of current `main`, changes exactly one Markdown article, uses the required path pattern, and stores that article as a normal Git blob. It then installs the pinned toolchain and runs the complete production build.

A separate [promotion workflow](https://github.com/ashfog/blog/blob/main/.github/workflows/promote-article.yml) receives write permission only after validation succeeds. It checks that the candidate branch still points to the exact validated commit, verifies again that the commit is exactly one ahead of current `main`, rechecks the single-article scope, and then performs a non-forced fast-forward to `main`.

The security boundary is subtle but useful: the workflow that executes candidate content does not have permission to publish it, while the workflow that can update `main` does not execute candidate code. The candidate is also constrained to Markdown, reducing the attack surface compared with allowing an agent to modify workflows, dependencies, templates, or scripts in the same publication transaction.

## Static publishing keeps the runtime small

The production stack is intentionally simple. The package configuration builds site configuration checks, workbench checks, article checks, Astro output, Pagefind search, and SEO validation as one `pnpm run build` pipeline.

Search is generated with [Pagefind](https://pagefind.app/docs/), which indexes the built static HTML and produces a browser-side search bundle. That avoids adding a search server or database. The repository likewise has no model SDK dependency in its application package: the AI runs outside the site, in the user's chosen assistant, while the published result remains ordinary static content.

After validated content reaches `main`, deployment is handed to Cloudflare Pages. Cloudflare's [Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/) can automatically build and deploy a connected production branch, which fits the repository's model: Git remains the handoff point between authoring, validation, and hosting.

## What this approach is good at

ASHFOG's architecture is strongest for independent publishers and developers who want AI-assisted output without introducing a permanent AI backend.

There is no CMS server to maintain, no database migration path, and no requirement to give a public website access to an OpenAI or Anthropic key. Content stays portable Markdown. The editorial policy can be reviewed like code. A broken article can fail CI before it reaches production. A future AI tool only needs enough repository access to understand and follow the same contract.

It also creates a useful division of labor. Ordinary article publication is intentionally narrow and automatable, while configuration, themes, dependencies, workflows, and other code changes remain jobs for a build-capable development environment.

## The trade-offs are real

This is not a general replacement for a collaborative CMS. GitHub permissions, Actions availability, branch-write access, and Cloudflare configuration become part of the publishing infrastructure. Editors who prefer a visual dashboard may find a repository-centered workflow less approachable.

The project is also public, but at the time of this review there is no root `LICENSE` file visible in the repository. That matters if the workbench is intended for reuse beyond ASHFOG: a public GitHub repository is not automatically an open-source license. Adding an explicit license would make the reuse terms clearer.

The larger experiment, though, is already concrete. ASHFOG treats the AI model as a replaceable authoring client and the repository as the durable authority. That reverses the common pattern of building a CMS around an AI API. Here, the AI can disappear after each request; the content, rules, tests, Git history, and deploy path remain.

For small technical publications, that may be the more durable architecture.
