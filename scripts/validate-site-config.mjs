import { access, readdir, readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const config = JSON.parse(await readFile(new URL("site.config.json", root), "utf8"));

function fail(message) {
  throw new Error(`site.config.json: ${message}`);
}

function exactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  if (actual.join("|") !== required.join("|")) {
    fail(`${label} must contain exactly: ${required.join(", ")}`);
  }
}

function text(value, label, min = 1, max = 240) {
  if (typeof value !== "string" || value.length < min || value.length > max) {
    fail(`${label} must be a string between ${min} and ${max} characters`);
  }
}

function publicAsset(value, label) {
  text(value, label);
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("..")) {
    fail(`${label} must be a safe path inside public/`);
  }
}

function optionalWebUrl(value, label) {
  if (value === "") return;
  let url;
  try {
    url = new URL(value);
  } catch {
    fail(`${label} must be empty or a valid URL`);
  }
  if (url.protocol !== "https:") fail(`${label} must use HTTPS`);
}

exactKeys(config, ["$schema", "site", "publisher", "branding", "theme", "navigation", "social"], "root");
if (config.$schema !== "./schemas/site-config.schema.json") fail("$schema must point to ./schemas/site-config.schema.json");

exactKeys(config.site, ["name", "shortName", "headerLabel", "tagline", "description", "url", "language", "locale", "timezone"], "site");
text(config.site.name, "site.name", 1, 80);
text(config.site.shortName, "site.shortName", 1, 32);
text(config.site.headerLabel, "site.headerLabel", 0, 40);
text(config.site.tagline, "site.tagline", 1, 180);
text(config.site.description, "site.description", 40, 240);
if (!/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(config.site.language)) fail("site.language must be a language tag such as en or zh-CN");
if (!/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(config.site.locale)) fail("site.locale must be a locale such as en-US or zh-CN");
let siteUrl;
try {
  siteUrl = new URL(config.site.url);
} catch {
  fail("site.url must be a valid URL");
}
if (siteUrl.protocol !== "https:" || siteUrl.pathname !== "/" || siteUrl.search || siteUrl.hash) {
  fail("site.url must be an HTTPS origin without a path, query, hash, or trailing content");
}
try {
  new Intl.DateTimeFormat(config.site.locale, { timeZone: config.site.timezone }).format(new Date());
} catch {
  fail("site.locale or site.timezone is not supported by Intl.DateTimeFormat");
}

exactKeys(config.publisher, ["type", "name", "displayName", "email", "showEmail"], "publisher");
if (!["person", "organization"].includes(config.publisher.type)) fail("publisher.type must be person or organization");
text(config.publisher.name, "publisher.name", 1, 100);
text(config.publisher.displayName, "publisher.displayName", 1, 100);
text(config.publisher.email, "publisher.email", 0, 254);
if (config.publisher.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.publisher.email)) fail("publisher.email is invalid");
if (typeof config.publisher.showEmail !== "boolean") fail("publisher.showEmail must be a boolean");
if (config.publisher.showEmail && !config.publisher.email) fail("publisher.email is required when showEmail is true");

exactKeys(config.branding, ["mark", "markDark", "favicon"], "branding");
for (const key of ["mark", "markDark", "favicon"]) {
  publicAsset(config.branding[key], `branding.${key}`);
  await access(new URL(`public${config.branding[key]}`, root)).catch(() => fail(`branding.${key} does not exist in public/`));
}

exactKeys(config.theme, ["id", "defaultColorMode", "allowColorModeToggle", "accentColor", "accentColorDark"], "theme");
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(config.theme.id)) fail("theme.id must use lowercase hyphenated text");
if (!["system", "light", "dark"].includes(config.theme.defaultColorMode)) fail("theme.defaultColorMode must be system, light, or dark");
if (typeof config.theme.allowColorModeToggle !== "boolean") fail("theme.allowColorModeToggle must be a boolean");
for (const key of ["accentColor", "accentColorDark"]) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(config.theme[key])) fail(`theme.${key} must be a six-digit hex color`);
}
const themeRoot = new URL(`src/themes/${config.theme.id}/`, root);
const manifest = JSON.parse(await readFile(new URL("theme.json", themeRoot), "utf8").catch(() => fail(`theme ${config.theme.id} has no theme.json`)));
exactKeys(manifest, ["id", "name", "version", "supportsColorModes", "themeColors"], "theme manifest");
if (manifest.id !== config.theme.id) fail(`theme manifest id must equal ${config.theme.id}`);
text(manifest.name, "theme manifest name", 1, 80);
if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) fail("theme manifest version must use semantic versioning");
if (!Array.isArray(manifest.supportsColorModes) || !manifest.supportsColorModes.includes("light") || !manifest.supportsColorModes.includes("dark")) {
  fail("theme manifest must support light and dark color modes");
}
exactKeys(manifest.themeColors, ["light", "dark"], "theme manifest themeColors");
for (const key of ["light", "dark"]) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(manifest.themeColors[key])) fail(`theme manifest themeColors.${key} must be a six-digit hex color`);
}
await access(new URL("theme.css", themeRoot)).catch(() => fail(`theme ${config.theme.id} has no theme.css`));
const [globalStyles, themeRegistry] = await Promise.all([
  readFile(new URL("src/styles/global.css", root), "utf8"),
  readFile(new URL("src/themes/registry.ts", root), "utf8")
]);
if (!globalStyles.includes(`../themes/${config.theme.id}/theme.css`)) fail(`theme ${config.theme.id} is not imported by src/styles/global.css`);
if (!themeRegistry.includes(`./${config.theme.id}/theme.json`)) fail(`theme ${config.theme.id} is not registered by src/themes/registry.ts`);

if (!Array.isArray(config.navigation) || config.navigation.length < 1 || config.navigation.length > 8) fail("navigation must contain 1 to 8 links");
const navigationLabels = new Set();
const navigationTargets = new Set();
for (const [index, link] of config.navigation.entries()) {
  exactKeys(link, ["label", "href"], `navigation[${index}]`);
  text(link.label, `navigation[${index}].label`, 1, 32);
  if (!/^\/(?!\/)/.test(link.href) || link.href.includes("..")) fail(`navigation[${index}].href must be a safe internal path`);
  if (navigationLabels.has(link.label) || navigationTargets.has(link.href)) fail("navigation labels and targets must be unique");
  navigationLabels.add(link.label);
  navigationTargets.add(link.href);
}

exactKeys(config.social, ["github", "x", "youtube"], "social");
for (const key of ["github", "x", "youtube"]) optionalWebUrl(config.social[key], `social.${key}`);

async function sourceFiles(directory) {
  const entries = await readdir(new URL(directory, root), { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const relative = `${directory}${entry.name}`;
    if (entry.isDirectory()) return sourceFiles(`${relative}/`);
    return /\.(?:astro|ts|css)$/.test(entry.name) ? [relative] : [];
  }));
  return files.flat();
}

const templateFiles = [
  "astro.config.mjs",
  ...(await sourceFiles("src/components/")),
  ...(await sourceFiles("src/layouts/")),
  ...(await sourceFiles("src/lib/")),
  ...(await sourceFiles("src/pages/"))
];
for (const relativePath of templateFiles) {
  const contents = await readFile(new URL(relativePath, root), "utf8");
  for (const [label, value] of [
    ["site URL", config.site.url],
    ["publisher email", config.publisher.email]
  ]) {
    if (value && contents.includes(value)) fail(`${relativePath} hard-codes the configured ${label}; import site.config.json through src/config/site.ts instead`);
  }
}

console.log(`Site configuration passed: ${config.site.name}, ${config.site.url}, theme ${config.theme.id}.`);
