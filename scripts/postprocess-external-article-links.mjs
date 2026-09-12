import assert from "node:assert/strict";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transformExternalArticleLinks } from "./lib/external-article-links.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const articlesDirectory = path.join(root, "dist", "articles");
const siteConfig = JSON.parse(await readFile(path.join(root, "site.config.json"), "utf8"));
const articleDirectories = (await readdir(articlesDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory());

let articlePageCount = 0;
let externalLinkCount = 0;

for (const directory of articleDirectories) {
  const articlePath = path.join(articlesDirectory, directory.name, "index.html");
  const source = await readFile(articlePath, "utf8");
  const transformed = transformExternalArticleLinks(source, siteConfig.site.url);
  assert.ok(transformed.articleProseFound, `${directory.name}: missing article prose`);

  articlePageCount += 1;
  externalLinkCount += transformed.externalLinkCount;
  if (transformed.html !== source) await writeFile(articlePath, transformed.html, "utf8");
}

assert.ok(articlePageCount > 0, "missing generated article pages");
assert.ok(externalLinkCount > 0, "missing external article-body link regression coverage");

console.log(`Article-link postprocessing passed: ${externalLinkCount} external links across ${articlePageCount} article pages.`);
