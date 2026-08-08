import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const requiredFiles = [
  "SKILL.md",
  "AGENTS.md",
  "CLAUDE.md",
  ".github/workflows/publish-article.yml",
  ".github/workflows/promote-article.yml",
  "site.config.json",
  "schemas/site-config.schema.json",
  "scripts/validate-site-config.mjs",
  "scripts/validate-articles.mjs",
  "package.json",
  "src/config/site.ts",
  "src/components/SiteMark.astro",
  "src/themes/registry.ts",
  "src/themes/ashfog-editorial/theme.json",
  "src/themes/ashfog-editorial/theme.css",
  "src/themes/ashfog-humanist/theme.json",
  "src/themes/ashfog-humanist/theme.css",
  "src/styles/global.css",
  "src/layouts/BaseLayout.astro",
  "src/pages/articles/[...slug].astro",
  "skills/ashfog-article-publisher/SKILL.md",
  "skills/ashfog-article-publisher/agents/openai.yaml",
  "editorial/article-policy.md",
  "editorial/image-library.json",
  "src/content.config.ts",
  "README.md"
];

async function read(relativePath) {
  try {
    return await readFile(new URL(relativePath, root), "utf8");
  } catch (error) {
    throw new Error(`Missing workbench file: ${relativePath}`, { cause: error });
  }
}

function validateSkillFrontmatter(contents, expectedName, relativePath) {
  const match = contents.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`${relativePath} has no YAML frontmatter`);

  const keys = [...match[1].matchAll(/^([a-z][a-z0-9-]*):/gm)].map((entry) => entry[1]);
  if (keys.join(",") !== "name,description") {
    throw new Error(`${relativePath} frontmatter must contain only name and description`);
  }
  if (!match[1].includes(`name: ${expectedName}`)) {
    throw new Error(`${relativePath} must declare name: ${expectedName}`);
  }
}

const files = Object.fromEntries(
  await Promise.all(requiredFiles.map(async (path) => [path, await read(path)]))
);

validateSkillFrontmatter(files["SKILL.md"], "ashfog-publishing-workbench", "SKILL.md");
validateSkillFrontmatter(
  files["skills/ashfog-article-publisher/SKILL.md"],
  "ashfog-article-publisher",
  "skills/ashfog-article-publisher/SKILL.md"
);

for (const adapter of ["AGENTS.md", "CLAUDE.md"]) {
  if (!files[adapter].includes("root `SKILL.md`")) {
    throw new Error(`${adapter} must delegate article work to the root SKILL.md`);
  }
}

const rootSkill = files["SKILL.md"];
const publisherSkill = files["skills/ashfog-article-publisher/SKILL.md"];
const contentSchema = files["src/content.config.ts"];
if (!rootSkill.includes("site.config.json")) {
  throw new Error("The root skill must load site.config.json");
}

for (const requiredText of [
  "complete portable article contract",
  "src/content/articles/YYYY/MM/<slug>.md",
  "publishedAt:",
  "A user-requested article language takes precedence over `site.language`",
  "language: zh-CN",
  "category: research",
  "heroImageId",
  "heroImageUrl",
  "heroImageAlt",
  "normal GPT or Claude chat",
  "about 1,000 English words",
  "Do not force every candidate into the article",
  "sources:",
  "publish/<slug>",
  "pnpm run build",
  "not a blocker"
]) {
  if (!rootSkill.includes(requiredText)) {
    throw new Error(`The self-contained root publishing contract must contain ${requiredText}`);
  }
}

if (!contentSchema.includes("language: z.string()")) {
  throw new Error("The article schema must support an optional article language override");
}
if (!contentSchema.includes("}).strict().superRefine")) {
  throw new Error("The article schema must reject unknown or misspelled Frontmatter fields");
}
if (!contentSchema.includes('pattern: "**/*.md"')) {
  throw new Error("The article loader must expose the same Markdown-only contract as publishing workflows");
}
if (
  !contentSchema.includes("Article tags must be unique lowercase hyphenated slugs")
  || !contentSchema.includes("heroImageId must reference editorial/image-library.json")
  || !contentSchema.includes("External image URLs must use HTTPS")
  || !contentSchema.includes("heroImageUrl and heroImageAlt must be provided together")
  || !contentSchema.includes("Use either heroImageId or heroImageUrl, not both")
) {
  throw new Error("The article schema must validate topic slugs, image-library overrides, and external hero images");
}
if (
  !contentSchema.includes('url.startsWith("https://")')
  || !files["scripts/validate-articles.mjs"].includes("raw HTML is not allowed")
  || !files["scripts/validate-articles.mjs"].includes("article images must use a direct HTTPS URL")
  || !files["scripts/validate-articles.mjs"].includes("article images require meaningful alt text")
) {
  throw new Error("Article validation must reject unsafe source protocols and active Markdown HTML");
}

const baseLayout = files["src/layouts/BaseLayout.astro"];
if (!baseLayout.includes("lang={language}") || !baseLayout.includes("inLanguage: language")) {
  throw new Error("BaseLayout must apply the resolved page language to HTML and structured data");
}

const articlePage = files["src/pages/articles/[...slug].astro"];
if (!articlePage.includes("const articleLanguage = article.data.language ?? siteConfig.site.language") || !articlePage.includes("language={articleLanguage}")) {
  throw new Error("Article pages must fall back from the article language to site.language");
}

const validationWorkflow = files[".github/workflows/publish-article.yml"];
for (const requiredText of [
  '"publish/**"',
  "contents: read",
  "src/content/articles/",
  "pnpm run build",
  "--name-status --no-renames",
  '"100644"',
  "actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803",
  "pnpm/action-setup@f520eceda224fe1a4aed5a2a27a194379a409996",
  "actions/setup-node@820762786026740c76f36085b0efc47a31fe5020"
]) {
  if (!validationWorkflow.includes(requiredText)) {
    throw new Error(`The article validation workflow must contain ${requiredText}`);
  }
}

const promotionWorkflow = files[".github/workflows/promote-article.yml"];
for (const requiredText of [
  "workflow_run:",
  '"Validate article candidate"',
  "contents: write",
  "src/content/articles/",
  "refs/heads/main",
  "--name-status --no-renames",
  '"100644"',
  "actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803"
]) {
  if (!promotionWorkflow.includes(requiredText)) {
    throw new Error(`The article promotion workflow must contain ${requiredText}`);
  }
}

if (!files["package.json"].includes('"build:articles": "node scripts/validate-articles.mjs"')) {
  throw new Error("The complete build must execute article safety and storage validation");
}

for (const contractFile of [
  "site.config.json",
  "editorial/article-policy.md",
  "src/content.config.ts",
  "editorial/image-library.json",
  "README.md"
]) {
  if (!publisherSkill.includes(contractFile)) {
    throw new Error(`The article publisher skill must load ${contractFile}`);
  }
}

for (const contractFile of [
  "skills/ashfog-article-publisher/SKILL.md",
  "editorial/article-policy.md",
  "README.md"
]) {
  if (!files[contractFile].includes("about 1,000 English words")) {
    throw new Error(`${contractFile} must preserve the default article-length target`);
  }
}

const openAiYaml = files["skills/ashfog-article-publisher/agents/openai.yaml"];
if (!openAiYaml.includes("$ashfog-article-publisher")) {
  throw new Error("The OpenAI skill prompt must invoke $ashfog-article-publisher");
}

console.log(`Workbench validation passed: ${requiredFiles.length} required files and delegation contracts.`);
