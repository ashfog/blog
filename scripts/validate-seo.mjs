import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const siteConfig = JSON.parse(await readFile(path.join(root, "site.config.json"), "utf8"));
const siteOrigin = siteConfig.site.url;
const sitePattern = siteOrigin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const rtlLanguages = new Set(["ar", "arc", "ckb", "dv", "fa", "he", "ku", "nqo", "ps", "sd", "ug", "ur", "yi"]);
const rtlScripts = new Set(["Adlm", "Arab", "Hebr", "Mand", "Nkoo", "Rohg", "Syrc", "Thaa"]);

function directionForLanguage(language) {
  try {
    const locale = new Intl.Locale(language);
    const detected = locale.getTextInfo?.().direction;
    if (detected === "rtl" || detected === "ltr") return detected;
    const script = locale.script ?? locale.maximize().script;
    if (script) return rtlScripts.has(script) ? "rtl" : "ltr";
    return rtlLanguages.has(locale.language) ? "rtl" : "ltr";
  } catch {
    return rtlLanguages.has(language.toLowerCase().split("-")[0]) ? "rtl" : "ltr";
  }
}

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
assert.match(robots, new RegExp(`Sitemap: ${sitePattern}/sitemap-index\\.xml`));
assert.match(sitemapIndex, new RegExp(`${sitePattern}/sitemap-0\\.xml`));
assert.match(sitemap, new RegExp(`${sitePattern}/articles/${articleSlug}`));
assert.doesNotMatch(sitemap, new RegExp(`${sitePattern}/search`));
assert.doesNotMatch(sitemap, new RegExp(`${sitePattern}/daily`));
assert.doesNotMatch(sitemap, new RegExp(`${sitePattern}/404`));
assert.match(rss, new RegExp(`${sitePattern}/articles/${articleSlug}`));

const htmlFiles = await listHtml();
for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const label = path.relative(dist, file);
  const languageMatch = html.match(/<html lang="([^"]+)"/);
  if (!languageMatch) {
    assert.match(html, /<meta http-equiv="refresh"/, `${label}: expected redirect document`);
    assert.match(html, /<meta name="robots" content="noindex"/, `${label}: redirect must be noindex`);
    continue;
  }
  const documentLanguage = languageMatch[1];
  assert.match(documentLanguage, /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/, `${label}: valid language declaration`);
  assert.match(html, new RegExp(`<html lang="${documentLanguage}" dir="${directionForLanguage(documentLanguage)}"`), `${label}: language direction`);
  if (!label.replaceAll("\\", "/").startsWith("articles/")) {
    assert.equal(documentLanguage, siteConfig.site.language, `${label}: site-default language declaration`);
  }
  assert.match(html, /<meta name="description" content="[^"]+"/, `${label}: description`);
  assert.match(html, new RegExp(`<link rel="canonical" href="${sitePattern}`), `${label}: canonical`);
  assert.match(html, /<meta name="robots" content="[^"]+"/, `${label}: robots`);
  assert.match(html, /<link rel="sitemap" href="\/sitemap-index\.xml"/, `${label}: sitemap link`);
  const graph = getJsonLd(html, label)["@graph"];
  assert.ok(graph.some((item) => item["@type"] === "WebSite" && item.inLanguage === siteConfig.site.language), `${label}: WebSite default language`);
  assert.ok(graph.some((item) => ["WebPage", "CollectionPage", "AboutPage"].includes(item["@type"]) && item.inLanguage === documentLanguage), `${label}: page structured-data language`);
  const structuredArticle = graph.find((item) => item["@type"] === "Article");
  if (structuredArticle) {
    assert.equal(structuredArticle.inLanguage, documentLanguage, `${label}: article structured-data language`);
  }
}

const homeGraph = getJsonLd(home, "home")["@graph"];
const expectedPublisherType = siteConfig.publisher.type === "person" ? "Person" : "Organization";
assert.ok(homeGraph.some((item) => item["@type"] === expectedPublisherType));
assert.ok(homeGraph.some((item) => item["@type"] === "WebSite"));
assert.ok(homeGraph.some((item) => item["@type"] === "WebPage"));

const articleGraph = getJsonLd(article, "article")["@graph"];
const articleSchema = articleGraph.find((item) => item["@type"] === "Article");
assert.ok(articleSchema, "article: missing Article structured data");
assert.ok(articleSchema.headline.length > 0, "article: missing headline");
assert.match(articleSchema.datePublished, /^\d{4}-\d{2}-\d{2}T/);
assert.equal(articleSchema.inLanguage, article.match(/<html lang="([^"]+)"/)[1], "article: language metadata mismatch");
assert.ok(articleGraph.some((item) => item["@type"] === "BreadcrumbList"));

assert.match(search, /<meta name="robots" content="noindex,follow"/, "search: expected noindex");

console.log(`SEO validation passed: ${htmlFiles.length} HTML pages, article schema, RSS, robots, and sitemap.`);
