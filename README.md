# ASHFOG

ASHFOG is a static Astro publication for independent, source-linked articles about AI models, agents, open source, developer tools, infrastructure, research, hardware, security, and policy.

## Content

Articles are Markdown files in:

```text
src/content/articles/<slug>.md
```

Frontmatter is validated by `src/content.config.ts`. Each article has a title, description, publication date, category, tags, optional image override, featured state, and an essential source list. The Markdown body contains the complete article and inline links.

Astro chooses one stable image from the matching category pool in `editorial/image-library.json` when `heroImageId` is omitted. Existing articles keep the same image across rebuilds.

## Publishing workflow

Use `skills/ashfog-article-publisher/SKILL.md` when researching, drafting, updating, or publishing an article. There is no scheduled daily collection task and no OpenAI API dependency. Publication begins when the user requests a subject.

The normal workflow is:

1. research the requested topic from primary sources;
2. write or update one Markdown article;
3. run the production build;
4. commit and push the validated change to GitHub;
5. let Cloudflare Pages build and publish `ashfog.com`.

## Local development

```text
pnpm install
pnpm run dev
```

## Production build

```text
pnpm run build
```

The build validates the content collection, generates the static Astro site, creates the Pagefind search index, and verifies article structured data, canonical links, RSS, robots directives, and Sitemap output.

## Search and SEO

The site generates:

- `/robots.txt`
- `/sitemap-index.xml`
- `/sitemap-0.xml`
- `/rss.xml`

Article pages include Schema.org `Article` and breadcrumb data. Search and 404 pages are excluded from indexing. Legacy `/daily` URLs redirect to `/articles` and are excluded from the Sitemap.

Submit this Sitemap to Google Search Console:

```text
https://ashfog.com/sitemap-index.xml
```

## Cloudflare Pages

- Build command: `pnpm run build`
- Output directory: `dist`
- Node.js: `22.22.2` or newer
- Production branch: `main`

Cloudflare Pages needs no database or server runtime. Every validated article commit to `main` triggers a static deployment.
