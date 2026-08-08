# Article policy

## Purpose

Publish independent articles that help readers understand a technology, project, website, piece of media, cultural signal, place, person, product, or useful idea. Use the language explicitly requested by the user; when the user does not specify one, use the default configured in `site.config.json`. Publish when a subject deserves explanation; never create content to satisfy a calendar quota.

## Research

- Prefer primary sources: official pages, documentation, repositories, release notes, original media, papers, specifications, and policy texts.
- Use credible independent testing and reporting when it adds evidence the primary source cannot provide.
- Distinguish announced claims, measured results, community experience, and inference.
- Link material sources in the article and list the essential references in frontmatter.
- Never invent facts, quotes, dates, benchmarks, capabilities, prices, or source URLs.

## Writing

- Write a specific, informative title and a self-contained description.
- Open with the question or change the article will explain.
- Build one coherent argument with descriptive section headings.
- Explain limitations, uncertainty, and practical consequences where relevant.
- Unless the user requests another length, aim for about 1,000 English words (normally 800–1,200), or equivalent depth in another language. Be shorter for a narrow subject. Go longer only when the user asks for depth or the evidence and complexity genuinely require it; never expand an article merely to resemble long-form publishing.
- Paraphrase sources. Keep quotations brief and necessary.
- Avoid launch-copy language, empty superlatives, generic conclusions, and artificial urgency.
- Use portable Markdown without raw HTML or active content. External source and body links must use HTTP or HTTPS; repository-relative internal links and fragments are allowed. User-hosted body images may use direct Markdown image syntax only when the URL is HTTPS and the alt text is meaningful; reference-style images are not allowed.

## Publishing

- Store one article per Markdown file at `src/content/articles/YYYY/MM/<slug>.md`, using the UTC year and month from `publishedAt`.
- Keep the public URL stable at `/articles/<slug>` regardless of the storage directory.
- Use a stable lowercase hyphenated slug and never include a date unless it is part of the subject.
- Set one primary category and unique lowercase hyphenated tags. Do not create near-duplicate tags.
- Omit image fields unless an intentional override is required; Astro otherwise chooses a stable category image. Use `heroImageId` for an existing image-library asset, or use `heroImageUrl` together with `heroImageAlt` for a user-hosted HTTPS thumbnail, never both.
- Treat user-supplied image URLs as candidates: inspect their actual contents, retain only accessible and relevant images, generate accurate concise alt text when needed, and place selected body images where they clarify the surrounding argument. Omit weak, inaccessible, or unsuitable candidates instead of forcing every URL into the article.
- Compare a new subject only with articles published during the newest three calendar days in the configured timezone. Do not scan the full archive for editorial similarity.
- Check the intended slug path for a technical collision before creating a file, without reading unrelated older article bodies.
- Update an existing article when a recently published article covers the same subject materially; otherwise publish a new article.
- Run the complete production build before publication.
