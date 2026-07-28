# AshFog

AshFog is a static Astro publication for one verified AI, open-source, and
developer-ecosystem intelligence brief per day.

## Content contract

Published editions live at:

```text
src/content/daily/YYYY-MM-DD.json
```

Every edition must pass:

```text
pnpm run validate:daily -- src/content/daily/YYYY-MM-DD.json \
  --content-dir src/content/daily \
  --check-links
```

When the formal content directory is empty, the site uses
`tests/fixtures/2026-07-28.json` as a theme preview. The preview fixture is not
part of the publication directory. As soon as a formal edition exists, only
formal editions are rendered.

## Local development

```text
pnpm install
pnpm run dev
```

## Production build

```text
pnpm run build
```

The build creates the Astro site, then generates the Pagefind search index.
It also verifies canonical links, crawl directives, Sitemap output, and
structured data. A missing SEO artifact fails the deployment build.

## Search indexing

Astro generates:

- `/robots.txt`
- `/sitemap-index.xml`
- `/sitemap-0.xml`
- `/rss.xml`

Daily pages include `NewsArticle` and breadcrumb JSON-LD. Collection and about
pages declare their corresponding Schema.org page types. Search and 404 pages
are marked `noindex`; search is also excluded from the Sitemap.

After the production domain is online, verify `ashfog.com` in Google Search
Console and submit:

```text
https://ashfog.com/sitemap-index.xml
```

If Search Console provides an HTML verification token, set this Cloudflare
Pages build variable:

```text
PUBLIC_GOOGLE_SITE_VERIFICATION=your-token
```

## Cloudflare Pages

- Build command: `pnpm run build`
- Output directory: `dist`
- Node.js: `22.22.2` or newer
- Production branch: `main`

Cloudflare Pages does not need a database or server runtime. A daily task writes
one validated JSON file, commits it to GitHub, and the resulting `main` update
triggers the static build.
