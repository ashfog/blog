import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

async function read(relativePath) {
  return readFile(path.join(dist, relativePath), "utf8");
}

async function listHtml(directory = dist) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listHtml(entryPath) : entry.name.endsWith(".html") ? [entryPath] : [];
  }));
  return files.flat();
}

function getJsonLd(html, label) {
  const match = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
  assert.ok(match, `${label}: missing JSON-LD`);
  return JSON.parse(match[1]);
}

const articleDirectories = (await readdir(path.join(dist, "articles"), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

assert.ok(articleDirectories.length > 0, "missing generated article");
const articleSlug = articleDirectories[0];

const [robots, sitemapIndex, sitemap, home, article, search, rss] = await Promise.all([
  read("robots.txt"),
  read("sitemap-index.xml"),
  read("sitemap-0.xml"),
  read("index.html"),
  read(path.join("articles", articleSlug, "index.html")),
  read(path.join("search", "index.html")),
  read("rss.xml")
]);

assert.match(robots, /^User-agent: \*\r?\nAllow: \//);
assert.match(robots, /Sitemap: https:\/\/ashfog\.com\/sitemap-index\.xml/);
assert.match(sitemapIndex, /https:\/\/ashfog\.com\/sitemap-0\.xml/);
assert.match(sitemap, new RegExp(`https://ashfog\\.com/articles/${articleSlug}`));
assert.doesNotMatch(sitemap, /https:\/\/ashfog\.com\/search/);
assert.doesNotMatch(sitemap, /https:\/\/ashfog\.com\/daily/);
assert.doesNotMatch(sitemap, /https:\/\/ashfog\.com\/404/);
assert.match(rss, new RegExp(`https://ashfog\\.com/articles/${articleSlug}`));

const htmlFiles = await listHtml();
for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const label = path.relative(dist, file);
  if (!html.includes('<html lang="en"')) {
    assert.match(html, /<meta http-equiv="refresh"/, `${label}: expected redirect document`);
    assert.match(html, /<meta name="robots" content="noindex"/, `${label}: redirect must be noindex`);
    continue;
  }
  assert.match(html, /<html lang="en"/, `${label}: English language declaration`);
  assert.match(html, /<meta name="description" content="[^"]+"/, `${label}: description`);
  assert.match(html, /<link rel="canonical" href="https:\/\/ashfog\.com/, `${label}: canonical`);
  assert.match(html, /<meta name="robots" content="[^"]+"/, `${label}: robots`);
  assert.match(html, /<link rel="sitemap" href="\/sitemap-index\.xml"/, `${label}: sitemap link`);
  getJsonLd(html, label);
}

const homeGraph = getJsonLd(home, "home")["@graph"];
assert.ok(homeGraph.some((item) => item["@type"] === "Organization"));
assert.ok(homeGraph.some((item) => item["@type"] === "WebSite"));
assert.ok(homeGraph.some((item) => item["@type"] === "WebPage"));

const articleGraph = getJsonLd(article, "article")["@graph"];
const articleSchema = articleGraph.find((item) => item["@type"] === "Article");
assert.ok(articleSchema, "article: missing Article structured data");
assert.ok(articleSchema.headline.length > 0, "article: missing headline");
assert.match(articleSchema.datePublished, /^\d{4}-\d{2}-\d{2}T/);
assert.ok(articleGraph.some((item) => item["@type"] === "BreadcrumbList"));

assert.match(search, /<meta name="robots" content="noindex,follow"/, "search: expected noindex");

console.log(`SEO validation passed: ${htmlFiles.length} HTML pages, article schema, RSS, robots, and sitemap.`);
