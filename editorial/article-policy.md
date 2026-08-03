# ASHFOG article policy

## Purpose

Publish independent English-language articles that help readers understand an AI model, system, tool, research result, infrastructure change, security issue, or policy decision. Publish when a subject deserves explanation; never create content to satisfy a calendar quota.

## Research

- Prefer primary sources: official documentation, model cards, repositories, release notes, papers, specifications, and policy texts.
- Use credible independent testing and reporting when it adds evidence the primary source cannot provide.
- Distinguish announced claims, measured results, community experience, and inference.
- Link material sources in the article and list the essential references in frontmatter.
- Never invent facts, quotes, dates, benchmarks, capabilities, prices, or source URLs.

## Writing

- Write a specific, informative title and a self-contained description.
- Open with the question or change the article will explain.
- Build one coherent argument with descriptive section headings.
- Explain limitations, uncertainty, and practical consequences where relevant.
- Use the length the subject requires. A normal article is roughly 1,000–2,200 English words; concise releases may be shorter and deep profiles may be longer.
- Paraphrase sources. Keep quotations brief and necessary.
- Avoid launch-copy language, empty superlatives, generic conclusions, and artificial urgency.

## Publishing

- Store one article per Markdown file in `src/content/articles/`.
- Use a stable lowercase hyphenated slug and never include a date unless it is part of the subject.
- Set one primary category and useful tags. Do not create near-duplicate tags.
- Omit `heroImageId` unless an intentional image from `editorial/image-library.json` is required; Astro otherwise chooses a stable category image.
- Update an existing article when the same subject changes materially instead of creating a duplicate URL.
- Run the complete production build before publication.
