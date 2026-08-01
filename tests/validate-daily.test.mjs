import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { loadEditorialConfig, validateEdition } from "../scripts/validate-daily.mjs";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDir, "..");
const fixturePath = path.join(testDir, "fixtures", "2026-07-28.json");
const fixture = JSON.parse(await fs.readFile(fixturePath, "utf8"));
const productionFixturePath = path.join(root, "src", "content", "daily", "2026-07-28.json");
const productionFixture = JSON.parse(await fs.readFile(productionFixturePath, "utf8"));
const config = await loadEditorialConfig(root);
const clone = () => structuredClone(fixture);
const words = (count) => Array.from({ length: count }, (_, index) => `word${index}`).join(" ");
const validate = (edition, options = {}) =>
  validateEdition(edition, { config, file: fixturePath, ...options });

test("valid editorial fixture passes", async () => {
  const report = await validate(clone());
  assert.equal(report.status, "ok", report.errors.join("\n"));
  assert.equal(report.counts.sections, fixture.article.sections.length);
});

test("edition title must summarize the day instead of repeating the brand or date", async () => {
  const templated = clone();
  templated.title = "ASHFOG Daily — July 28, 2026";
  assert.ok((await validate(templated)).errors.some((error) => error.includes("editorial summary headline")));

  const short = clone();
  short.title = "AI Changes Today";
  assert.ok((await validate(short)).errors.some((error) => error.includes("expected 6-14")));

  const dateWithoutYear = clone();
  dateWithoutYear.title = "AI Systems Shift Across Markets on July 28";
  assert.ok((await validate(dateWithoutYear)).errors.some((error) => error.includes("editorial summary headline")));

  const issueNumber = clone();
  issueNumber.title = "New Models and Infrastructure Define Edition 28";
  assert.ok((await validate(issueNumber)).errors.some((error) => error.includes("editorial summary headline")));
});

test("global preview includes China signals", () => {
  const chinaSignals = fixture.signals.filter((signal) => signal.region === "china");
  assert.ok(chinaSignals.length >= 3);
  assert.ok(chinaSignals.some((signal) => signal.source.sourceLanguage === "zh-CN"));
});

test("schema rejects a missing source URL", async () => {
  const edition = clone();
  delete edition.signals[0].source.url;
  assert.ok((await validate(edition)).errors.some((error) => error.includes("missing required property url")));
});

test("validator enforces concise signal brief word ranges", async () => {
  const short = clone();
  short.signals[0].brief = words(34);
  assert.ok((await validate(short)).errors.some((error) => error.includes("brief: 34 words")));

  const long = clone();
  long.signals[0].brief = words(91);
  assert.ok((await validate(long)).errors.some((error) => error.includes("brief: 91 words")));
});

test("validator enforces community voice word ranges", async () => {
  const short = clone();
  short.signals[0].communityVoices = [{ summary: words(24), source: short.signals[0].source }];
  assert.ok((await validate(short)).errors.some((error) => error.includes("summary: 24 words")));

  const long = clone();
  long.signals[0].communityVoices = [{ summary: words(81), source: long.signals[0].source }];
  assert.ok((await validate(long)).errors.some((error) => error.includes("summary: 81 words")));
});

test("article sections enforce length and paragraph structure", async () => {
  const short = clone();
  short.article.sections[0].body = `${words(90)}\n\n${words(89)}`;
  assert.ok((await validate(short)).errors.some((error) => error.includes("body: 179 words")));

  const oneParagraph = clone();
  oneParagraph.article.sections[0].body = words(200);
  assert.ok((await validate(oneParagraph)).errors.some((error) => error.includes("expected at least 2 paragraphs")));
});

test("editor synthesis requires real paragraph breaks", async () => {
  const edition = clone();
  edition.article.synthesis.body = words(200);
  assert.ok((await validate(edition)).errors.some((error) => error.includes("synthesis.body")));
});

test("every signal must be assigned exactly once", async () => {
  const missing = clone();
  const id = missing.article.sections[0].signalIds.shift();
  assert.ok((await validate(missing)).errors.some((error) => error.includes(`signal ${id} must be assigned exactly once`)));

  const duplicate = clone();
  const duplicateId = duplicate.article.sections[0].signalIds[0];
  duplicate.article.otherSignalIds.push(duplicateId);
  assert.ok((await validate(duplicate)).errors.some((error) => error.includes(`signal ${duplicateId} must be assigned exactly once`)));
});

test("article references only current signal IDs", async () => {
  const edition = clone();
  edition.article.sections[0].signalIds[0] = "invented-signal";
  const report = await validate(edition);
  assert.ok(report.errors.some((error) => error.includes("unknown signal ID invented-signal")));
});

test("domain rules reject an unknown source", async () => {
  const edition = clone();
  edition.signals[0].source.id = "invented-source";
  assert.ok((await validate(edition)).errors.some((error) => error.includes("not found in editorial/sources.json")));
});

test("domain rules reject an unregistered source language", async () => {
  const edition = clone();
  edition.signals[0].source.sourceLanguage = "zh-CN";
  assert.ok((await validate(edition)).errors.some((error) => error.includes("sourceLanguage")));
});

test("production validation requires all registered source attempts", async () => {
  const edition = clone();
  const report = await validate(edition, { file: path.join(root, "src", "content", "daily", edition.editionDate + ".json") });
  assert.ok(report.errors.some((error) => error.includes("not-run is forbidden")));
});

test("unavailable sources cannot contain or select in-window items", async () => {
  const edition = clone();
  const scan = edition.research.sourceScan[0];
  scan.status = "unavailable";
  scan.itemsFetched = 1;
  scan.itemsInWindow = 1;
  scan.selectedCount = 1;
  scan.failureReason = "Synthetic route failure";
  const report = await validate(edition);
  assert.ok(report.errors.some((error) => error.includes("unavailable requires zero")));
  assert.ok(report.errors.some((error) => error.includes("unavailable source cannot select")));
});

test("source scan counts obey the per-source maximum", async () => {
  const edition = clone();
  edition.research.sourceScan[0].status = "collected";
  edition.research.sourceScan[0].itemsFetched = 16;
  edition.research.sourceScan[0].itemsInWindow = 16;
  assert.ok((await validate(edition)).errors.some((error) => error.includes("itemsFetched")));
});

test("source scan selected counts must match final signals and community voices", async () => {
  const edition = structuredClone(productionFixture);
  const scan = edition.research.sourceScan.find((entry) => entry.selectedCount > 0);
  scan.selectedCount = 0;
  const report = await validate(edition, { file: productionFixturePath });
  assert.ok(report.errors.some((error) => error.includes("expected 1 from final signals")));
});

test("article image library is available", () => {
  assert.ok(config.storyImageCount >= 40);
});

test("every registered source has a validated access plan", () => {
  assert.equal(config.sourceAccessPlanIds.size, config.sourceIds.size);
  assert.deepEqual([...config.sourceAccessPlanIds].sort(), [...config.sourceIds].sort());
});

test("source access plans use only deterministic configured variables", async () => {
  const access = JSON.parse(await fs.readFile(path.join(root, "editorial", "source-access.json"), "utf8"));
  const serialized = JSON.stringify(access.plans);
  assert.ok(!serialized.includes("{candidateHandle}"));
  assert.ok(!serialized.includes("{candidateTerms}"));
  assert.ok(serialized.includes("{configuredHandle}"));

  const sources = JSON.parse(await fs.readFile(path.join(root, "editorial", "sources.json"), "utf8"));
  const xSource = sources.sources.find((source) => source.id === "x-curated-experts");
  assert.ok(xSource.collectionHandles.length >= 1);
});

test("domain rules reject a future publication time", async () => {
  const edition = clone();
  edition.signals[0].source.publishedAt = "2026-07-28T10:00:00-04:00";
  assert.ok((await validate(edition)).errors.some((error) => error.includes("after cutoffAt")));
});

test("domain rules reject an item outside the trailing window", async () => {
  const edition = clone();
  edition.signals[0].source.publishedAt = "2026-07-27T09:29:59-04:00";
  edition.signals[0].source.updatedAt = null;
  assert.ok((await validate(edition)).errors.some((error) => error.includes("outside collection window")));
});

test("schemaVersion 3 accepts the exact New York trailing 24-hour window", async () => {
  assert.equal((await validate(clone())).status, "ok");
});

test("schemaVersion 3 rejects a window that is not exactly 24 hours", async () => {
  const edition = clone();
  edition.windowStartAt = "2026-07-27T10:30:00-04:00";
  assert.ok((await validate(edition)).errors.some((error) => error.includes("exactly 24 hours")));
});

test("schemaVersion 3 rejects a cutoff that is not 09:30 New York time", async () => {
  const edition = clone();
  edition.windowStartAt = "2026-07-27T10:00:00-04:00";
  edition.cutoffAt = "2026-07-28T10:00:00-04:00";
  assert.ok((await validate(edition)).errors.some((error) => error.includes("must be 09:30:00")));
});

test("the exact left window boundary is excluded", async () => {
  const edition = clone();
  edition.signals[0].source.publishedAt = edition.windowStartAt;
  assert.ok((await validate(edition)).errors.some((error) => error.includes("outside collection window")));
});

test("source scans require itemsInWindow", async () => {
  const edition = clone();
  delete edition.research.sourceScan[0].itemsInWindow;
  assert.ok((await validate(edition)).errors.some((error) => error.includes("itemsInWindow")));
});

test("domain rules reject duplicate events", async () => {
  const edition = clone();
  edition.signals[1].eventId = edition.signals[0].eventId;
  assert.ok((await validate(edition)).errors.some((error) => error.includes("eventId: duplicate")));
});

test("valid manual hero image ID passes", async () => {
  const edition = clone();
  edition.heroImageId = [...config.imageIds][0];
  assert.equal((await validate(edition)).status, "ok");
});

test("unknown hero image ID is rejected", async () => {
  const edition = clone();
  edition.heroImageId = "invented-image";
  assert.ok((await validate(edition)).errors.some((error) => error.includes("unknown image ID")));
});

test("source URLs require only offline absolute HTTP or HTTPS syntax", async () => {
  const relative = clone();
  relative.signals[0].source.url = "collected-link-as-supplied";
  assert.ok((await validate(relative)).errors.some((error) => error.includes("absolute http or https URL")));

  const executable = clone();
  executable.signals[0].source.url = "javascript:alert(1)";
  assert.ok((await validate(executable)).errors.some((error) => error.includes("only http and https")));

  const valid = clone();
  valid.signals[0].source.url = "https://example.com/source";
  assert.equal((await validate(valid)).status, "ok");
});

test("duplicate event content blocks distinct event IDs", async () => {
  const edition = clone();
  edition.signals[1].headline = edition.signals[0].headline;
  edition.signals[1].brief = edition.signals[0].brief;
  const report = await validate(edition);
  assert.equal(report.status, "error");
  assert.ok(report.errors.some((error) => error.includes("duplicate event content")));
});
