import { lstat, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const articlesRoot = path.join(root, "src", "content", "articles");
const markdownParser = unified().use(remarkParse);

async function listMarkdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Article content must not be a symbolic link: ${path.relative(root, absolutePath)}`);
    }
    if (entry.isDirectory()) files.push(...await listMarkdownFiles(absolutePath));
    else if (entry.name.endsWith(".md")) files.push(absolutePath);
    else throw new Error(`Only Markdown article files are allowed: ${path.relative(root, absolutePath)}`);
  }
  return files;
}

function parseArticleDocument(contents, relativePath) {
  const match = contents.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`Article has no complete YAML Frontmatter: ${relativePath}`);
  return {
    frontmatter: match[1],
    body: contents.slice(match[0].length)
  };
}

function frontmatterDate(frontmatter, field, relativePath, required = false) {
  const match = frontmatter.match(new RegExp(`^${field}:\\s*(.+?)\\s*$`, "m"));
  if (!match) {
    if (required) throw new Error(`${relativePath}: missing ${field}`);
    return undefined;
  }
  const rawValue = match[1].replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, "$1$2");
  const date = new Date(rawValue);
  if (Number.isNaN(date.getTime())) throw new Error(`${relativePath}: ${field} must be a valid date-time`);
  return date;
}

function validateMarkdown(body, relativePath) {
  const tree = markdownParser.parse(body);
  visit(tree, (node) => {
    if (node.type === "html") {
      throw new Error(`${relativePath}: raw HTML is not allowed in article Markdown`);
    }
    if (node.type === "imageReference") {
      throw new Error(`${relativePath}: reference-style images are not supported; use direct Markdown image syntax with an HTTPS URL`);
    }
    if (node.type === "image") {
      const destination = node.url.trim();
      if (!destination.startsWith("https://") || /[\u0000-\u001f\u007f]/u.test(destination)) {
        throw new Error(`${relativePath}: article images must use a direct HTTPS URL`);
      }
      if (!node.alt?.trim() || node.alt.trim().length < 3) {
        throw new Error(`${relativePath}: article images require meaningful alt text`);
      }
      return;
    }
    if (node.type !== "link" && node.type !== "definition") return;

    const destination = node.url.trim();
    if (/[\u0000-\u001f\u007f]/u.test(destination)) {
      throw new Error(`${relativePath}: article link destinations must not contain control characters`);
    }
    if (destination.startsWith("//")) {
      throw new Error(`${relativePath}: protocol-relative article links are not allowed`);
    }
    const scheme = destination.match(/^([A-Za-z][A-Za-z0-9+.-]*):/u)?.[1]?.toLowerCase();
    if (scheme && scheme !== "http" && scheme !== "https") {
      throw new Error(`${relativePath}: article links must use HTTP, HTTPS, or a repository-relative destination`);
    }
  });
}

for (const [label, markdown] of [
  ["raw script", "<script>alert(1)</script>"],
  ["unsafe URL", "[link](javascript:alert(1))"],
  ["entity-obfuscated URL", "[link](javascript&colon;alert(1))"],
  ["control-character URL", "[link](jav&#x09;ascript:alert(1))"],
  ["mismatched code delimiters", "`<script>alert(1)</script>``"],
  ["insecure body image", "![remote image](http://example.com/tracker.png)"],
  ["active body image", "![remote image](data:image/svg+xml;base64,PHN2Zz4=)"],
  ["body image without alt", "![](https://example.com/image.webp)"],
  ["reference body image", "![remote image][image]\n\n[image]: https://example.com/image.webp"]
]) {
  let rejected = false;
  try {
    validateMarkdown(markdown, `security regression: ${label}`);
  } catch {
    rejected = true;
  }
  if (!rejected) throw new Error(`Article safety regression was not rejected: ${label}`);
}

validateMarkdown([
  "[external](https://example.com)",
  "[internal](/articles/example)",
  "![descriptive remote image](https://images.example.com/article.webp)",
  "`<script>shown as code</script>`",
  "```html",
  "<script>shown as fenced code</script>",
  "```"
].join("\n\n"), "security regression: safe Markdown");

const articleFiles = await listMarkdownFiles(articlesRoot);
const slugs = new Set();
for (const absolutePath of articleFiles) {
  const relativePath = path.relative(root, absolutePath).replaceAll("\\", "/");
  const articleRelativePath = path.relative(articlesRoot, absolutePath).replaceAll("\\", "/");
  const pathMatch = articleRelativePath.match(/^([0-9]{4})\/([0-9]{2})\/([a-z0-9][a-z0-9-]*)\.md$/);
  if (!pathMatch) {
    throw new Error(`${relativePath}: article path must match YYYY/MM/lowercase-hyphenated-slug.md`);
  }
  const [, pathYear, pathMonth, slug] = pathMatch;
  if (slugs.has(slug)) throw new Error(`${relativePath}: duplicate public article slug ${slug}`);
  slugs.add(slug);

  const stats = await lstat(absolutePath);
  if (!stats.isFile()) throw new Error(`Article content must be a regular file: ${relativePath}`);

  const contents = await readFile(absolutePath, "utf8");
  const document = parseArticleDocument(contents, relativePath);
  const publishedAt = frontmatterDate(document.frontmatter, "publishedAt", relativePath, true);
  const utcYear = String(publishedAt.getUTCFullYear()).padStart(4, "0");
  const utcMonth = String(publishedAt.getUTCMonth() + 1).padStart(2, "0");
  if (pathYear !== utcYear || pathMonth !== utcMonth) {
    throw new Error(`${relativePath}: storage month must match publishedAt UTC month ${utcYear}/${utcMonth}`);
  }
  const updatedAt = frontmatterDate(document.frontmatter, "updatedAt", relativePath);
  if (updatedAt && updatedAt < publishedAt) {
    throw new Error(`${relativePath}: updatedAt must not be earlier than publishedAt`);
  }

  validateMarkdown(document.body, relativePath);
}

console.log(`Article safety validation passed: AST regression checks and ${articleFiles.length} regular Markdown files with no active HTML or unsafe link protocols.`);
