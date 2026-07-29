import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  loadEditorialConfig,
  validateEdition,
} from "../scripts/validate-daily.mjs";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDir, "..");
const fixturePath = path.join(testDir, "fixtures", "2026-07-28.json");
const fixture = JSON.parse(await fs.readFile(fixturePath, "utf8"));
const config = await loadEditorialConfig(root);
const clone = () => structuredClone(fixture);
const rollingClone = () => {
  const edition = clone();
  edition.schemaVersion = 2;
  edition.timezone = "America/New_York";
  edition.windowStartAt = "2026-07-27T09:30:00-04:00";
  edition.cutoffAt = "2026-07-28T09:30:00-04:00";
  edition.generatedAt = "2026-07-28T09:45:00-04:00";
  edition.research.sourceScan = edition.research.sourceScan.map((scan) => {
    const { itemsOnEditionDay, ...rest } = scan;
    return { ...rest, itemsInWindow: itemsOnEditionDay };
  });
  edition.stories = edition.stories.map((story) => ({
    ...story,
    source: {
      ...story.source,
      publishedAt: "2026-07-28T08:00:00-04:00",
      updatedAt: null,
    },
    score: {
      ...story.score,
      evidenceStrength: Math.max(3, story.score.evidenceStrength),
      relevance: Math.max(3, story.score.relevance),
      practicalUtility: Math.max(3, story.score.practicalUtility),
    },
    windowException: "",
  }));
  edition.stories.forEach((story) => {
    story.score.total = Object.entries(story.score)
      .filter(([key]) => key !== "total")
      .reduce((total, [, value]) => total + value, 0);
  });
  edition.research.excludedCandidates = edition.research.excludedCandidates.map((candidate) =>
    candidate.reason === "low-relevance"
      ? { ...candidate, score: { evidenceStrength: 4, relevance: 2, novelty: 2, practicalUtility: 2, impact: 1, communitySignal: 0, total: 11 } }
      : candidate
  );
  edition.research.seriousCandidateCount = edition.stories.length + edition.research.excludedCandidates.length;
  return edition;
};

const validate = (edition, options = {}) =>
  validateEdition(edition, {
    config,
    file: fixturePath,
    previousEditions: [],
    linkResults: [],
    ...options,
  });

test("valid English global fixture passes", async () => {
  const report = await validate(clone());
  assert.equal(report.status, "ok");
  assert.deepEqual(report.errors, []);
});

test("global preview includes verified China signals", () => {
  const chinaStories = fixture.stories.filter((story) => story.region === "china");
  assert.ok(chinaStories.length >= 3);
  assert.ok(chinaStories.some((story) => story.source.sourceLanguage === "zh-CN"));
  assert.ok(chinaStories.every((story) => story.source.url.startsWith("https://")));
});

test("schema rejects a missing source URL", async () => {
  const edition = clone();
  delete edition.stories[0].source.url;
  const report = await validate(edition);
  assert.equal(report.status, "error");
  assert.ok(report.errors.some((error) => error.includes("missing required property url")));
});

const words = (count) => Array.from({ length: count }, (_, index) => `word${index}`).join(" ");

test("validator enforces news summary and why-it-matters word ranges", async () => {
  const shortSummary = clone();
  shortSummary.stories[0].summary = words(119);
  assert.ok((await validate(shortSummary)).errors.some((error) => error.includes("summary: 119 words")));

  const longSummary = clone();
  longSummary.stories[0].summary = words(181);
  assert.ok((await validate(longSummary)).errors.some((error) => error.includes("summary: 181 words")));

  const shortWhy = clone();
  shortWhy.stories[0].whyItMatters = words(49);
  assert.ok((await validate(shortWhy)).errors.some((error) => error.includes("whyItMatters: 49 words")));

  const longWhy = clone();
  longWhy.stories[0].whyItMatters = words(81);
  assert.ok((await validate(longWhy)).errors.some((error) => error.includes("whyItMatters: 81 words")));
});

test("validator enforces shorter community word ranges", async () => {
  const communityIndex = clone().stories.findIndex((story) => story.kind === "community");
  const tooLong = clone();
  tooLong.stories[communityIndex].summary = words(131);
  assert.ok((await validate(tooLong)).errors.some((error) => error.includes("summary: 131 words")));

  const tooShort = clone();
  tooShort.stories[communityIndex].whyItMatters = words(34);
  assert.ok((await validate(tooShort)).errors.some((error) => error.includes("whyItMatters: 34 words")));
});

test("adaptive selection accepts a concise edition without a story quota", async () => {
  for (const storyCount of [1, 2, 3]) {
    const edition = clone();
    edition.stories = edition.stories.slice(0, storyCount).map((story, index) => ({ ...story, position: index + 1 }));
    edition.dailyAnalysis.signalIds = edition.stories.map((story) => story.id);
    const report = await validate(edition);
    assert.equal(report.status, "ok", report.errors.join("\n"));
    assert.ok(!report.errors.some((error) => error.includes("signalIds")));
  }
});

test("daily analysis requires real paragraph breaks", async () => {
  const edition = clone();
  edition.dailyAnalysis.body = words(200);
  const report = await validate(edition);
  assert.equal(report.status, "error");
  assert.ok(report.errors.some((error) => error.includes("expected at least 2 paragraphs")));
});

test("domain rules reject an unknown source", async () => {
  const edition = clone();
  edition.stories[0].source.id = "invented-source";
  const report = await validate(edition);
  assert.equal(report.status, "error");
  assert.ok(report.errors.some((error) => error.includes("not found in editorial/sources.json")));
});

test("domain rules reject an unregistered source language", async () => {
  const edition = clone();
  edition.stories[0].source.sourceLanguage = "zh-CN";
  const report = await validate(edition);
  assert.equal(report.status, "error");
  assert.ok(report.errors.some((error) => error.includes("sourceLanguage")));
});

test("production validation requires all registered source attempts", async () => {
  const edition = clone();
  const report = await validate(edition, {
    file: path.join(root, "src", "content", "daily", "2026-07-28.json"),
  });
  assert.equal(report.status, "error");
  assert.ok(report.errors.some((error) => error.includes("not-run is forbidden")));
});

test("unavailable source ledger must match source scan statuses", async () => {
  const edition = rollingClone();
  const scan = edition.research.sourceScan[0];
  scan.status = "unavailable";
  scan.failureReason = "Synthetic route failure";
  edition.research.unavailableSources = [];
  const report = await validate(edition, {
    file: path.join(root, "src", "content", "daily", "2026-07-28.json"),
  });
  assert.ok(report.errors.some((error) => error.includes("unavailableSources: missing")));
});

test("unavailable sources cannot contain or select in-window items", async () => {
  const edition = rollingClone();
  const scan = edition.research.sourceScan[0];
  scan.status = "unavailable";
  scan.itemsFetched = 1;
  scan.itemsInWindow = 1;
  scan.selectedCount = 1;
  scan.failureReason = "Synthetic route failure";
  edition.research.unavailableSources = [scan.sourceId];
  const report = await validate(edition, {
    file: path.join(root, "src", "content", "daily", "2026-07-28.json"),
  });
  assert.ok(report.errors.some((error) => error.includes("unavailable requires zero")));
  assert.ok(report.errors.some((error) => error.includes("unavailable source cannot select")));
});

test("source scan counts obey the per-source maximum", async () => {
  const edition = clone();
  edition.research.sourceScan[0].status = "collected";
  edition.research.sourceScan[0].itemsFetched = 16;
  edition.research.sourceScan[0].itemsOnEditionDay = 16;
  const report = await validate(edition);
  assert.equal(report.status, "error");
  assert.ok(report.errors.some((error) => error.includes("itemsFetched")));
});

test("image pool provides 46 unique story slots", () => {
  assert.equal(config.storyImageCount, 46);
});

test("every registered source has a validated access plan", () => {
  assert.equal(config.sourceAccessPlanIds.size, config.sourceIds.size);
  assert.deepEqual([...config.sourceAccessPlanIds].sort(), [...config.sourceIds].sort());
});

test("domain rules reject a future publication time", async () => {
  const edition = clone();
  edition.stories[0].source.publishedAt = "2026-07-28T15:00:00+08:00";
  const report = await validate(edition);
  assert.equal(report.status, "error");
  assert.ok(report.errors.some((error) => error.includes("after cutoffAt")));
});

test("domain rules reject an unexceptional prior-day item", async () => {
  const edition = clone();
  edition.stories[0].source.publishedAt = "2026-07-27T10:00:00+08:00";
  edition.stories[0].source.updatedAt = null;
  edition.stories[0].windowException = "";
  const report = await validate(edition);
  assert.equal(report.status, "error");
  assert.ok(report.errors.some((error) => error.includes("outside collection window")));
});

test("schemaVersion 2 accepts the exact New York trailing 24-hour window", async () => {
  const report = await validate(rollingClone());
  assert.equal(report.status, "ok");
});

test("new editions cannot fall back to schemaVersion 1 or Shanghai time", async () => {
  const edition = clone();
  edition.editionDate = "2026-07-30";
  const report = await validate(edition);
  assert.equal(report.status, "error");
  assert.ok(report.errors.some((error) => error.includes("version 2 is required")));
});

test("schemaVersion 2 rejects a window that is not exactly 24 hours", async () => {
  const edition = rollingClone();
  edition.windowStartAt = "2026-07-27T10:30:00-04:00";
  const report = await validate(edition);
  assert.ok(report.errors.some((error) => error.includes("exactly 24 hours")));
});

test("schemaVersion 2 rejects a cutoff that is not 09:30 New York time", async () => {
  const edition = rollingClone();
  edition.windowStartAt = "2026-07-27T10:00:00-04:00";
  edition.cutoffAt = "2026-07-28T10:00:00-04:00";
  const report = await validate(edition);
  assert.ok(report.errors.some((error) => error.includes("must be 09:30:00")));
});

test("schemaVersion 2 includes the prior New York calendar date inside the rolling window", async () => {
  const edition = rollingClone();
  edition.stories[0].source.publishedAt = "2026-07-27T18:00:00-04:00";
  const report = await validate(edition);
  assert.ok(!report.errors.some((error) => error.includes("outside collection window")));
});

test("schemaVersion 2 rejects an item older than the rolling window", async () => {
  const edition = rollingClone();
  edition.stories[0].source.publishedAt = "2026-07-27T09:29:59-04:00";
  const report = await validate(edition);
  assert.ok(report.errors.some((error) => error.includes("outside collection window")));
});

test("schemaVersion 2 excludes the exact left window boundary", async () => {
  const edition = rollingClone();
  edition.stories[0].source.publishedAt = edition.windowStartAt;
  const report = await validate(edition);
  assert.ok(report.errors.some((error) => error.includes("outside collection window")));
});

test("schemaVersion 2 requires itemsInWindow instead of itemsOnEditionDay", async () => {
  const edition = rollingClone();
  edition.research.sourceScan[0].itemsOnEditionDay = edition.research.sourceScan[0].itemsInWindow;
  delete edition.research.sourceScan[0].itemsInWindow;
  const report = await validate(edition);
  assert.ok(report.errors.some((error) => error.includes("itemsInWindow")));
});

test("schemaVersion 2 rejects a serious candidate ledger that silently drops candidates", async () => {
  const edition = rollingClone();
  edition.research.seriousCandidateCount += 1;
  const report = await validate(edition);
  assert.ok(report.errors.some((error) => error.includes("seriousCandidateCount")));
});

test("schemaVersion 2 cannot exclude a qualifying event as low-relevance", async () => {
  const edition = rollingClone();
  const candidate = edition.research.excludedCandidates.find((item) => item.reason === "low-relevance");
  candidate.score = { evidenceStrength: 4, relevance: 4, novelty: 3, practicalUtility: 4, impact: 3, communitySignal: 1, total: 19 };
  const report = await validate(edition);
  assert.ok(report.errors.some((error) => error.includes("meets the materiality floor")));
});

test("excluded low-relevance candidates cannot falsify score totals", async () => {
  const edition = rollingClone();
  const candidate = edition.research.excludedCandidates.find((item) => item.reason === "low-relevance");
  candidate.score.total = 0;
  const report = await validate(edition);
  assert.equal(report.status, "error");
  assert.ok(report.errors.some((error) => error.includes("score.total: expected")));
});

test("domain rules reject duplicate events", async () => {
  const edition = clone();
  edition.stories[1].eventId = edition.stories[0].eventId;
  const report = await validate(edition);
  assert.equal(report.status, "error");
  assert.ok(report.errors.some((error) => error.includes("eventId: duplicate")));
});

test("valid manual image IDs pass", async () => {
  const edition = clone();
  edition.stories[0].imageId = "policy-main-a";
  edition.stories[1].imageId = "security-main-a";
  const report = await validate(edition);
  assert.equal(report.status, "ok");
});

test("image rules reject unknown, mismatched, and duplicate story images", async () => {
  const unknown = clone();
  unknown.stories[0].imageId = "invented-image";
  const unknownReport = await validate(unknown);
  assert.ok(unknownReport.errors.some((error) => error.includes("unknown story image ID")));

  const mismatched = clone();
  mismatched.stories[0].imageId = "agents-main-a";
  const mismatchedReport = await validate(mismatched);
  assert.ok(mismatchedReport.errors.some((error) => error.includes("image category must match")));

  const duplicate = clone();
  duplicate.stories[0].imageId = "models-main-a";
  duplicate.stories[1].category = "models";
  duplicate.stories[1].imageId = "models-main-a";
  const duplicateReport = await validate(duplicate);
  assert.ok(duplicateReport.errors.some((error) => error.includes("duplicate image ID")));
});

test("image rules reject an unknown hero image", async () => {
  const edition = clone();
  edition.heroImageId = "invented-image";
  const report = await validate(edition);
  assert.ok(report.errors.some((error) => error.includes("heroImageId: unknown image ID")));
});

test("domain rules reject evidence URLs absent from the collected ledger", async () => {
  const edition = clone();
  edition.stories[0].factualClaims[0].evidenceUrl = "https://example.com/invented";
  const report = await validate(edition);
  assert.equal(report.status, "error");
  assert.ok(report.errors.some((error) => error.includes("absent from research.collectedUrls")));
});

test("domain rules reject unregistered evidence hosts", async () => {
  const edition = clone();
  const invented = "https://example.com/invented";
  edition.stories[0].factualClaims[0].evidenceUrl = invented;
  edition.research.collectedUrls.push(invented);
  const report = await validate(edition);
  assert.equal(report.status, "error");
  assert.ok(report.errors.some((error) => error.includes("host is absent")));
});

test("domain rules reject inconsistent score totals", async () => {
  const edition = clone();
  edition.stories[0].score.total = 30;
  const report = await validate(edition);
  assert.equal(report.status, "error");
  assert.ok(report.errors.some((error) => error.includes("score.total")));
});

test("Tier C cannot be the primary source for news", async () => {
  const edition = clone();
  edition.stories[0].source = {
    ...edition.stories.find((story) => story.kind === "community").source,
    publishedAt: edition.stories[0].source.publishedAt,
  };
  const report = await validate(edition);
  assert.equal(report.status, "error");
  assert.ok(report.errors.some((error) => error.includes("Tier C cannot")));
});

test("link-check failures block publication", async () => {
  const report = await validate(clone(), {
    linkResults: [{ url: "https://example.com/missing", status: 404 }],
  });
  assert.equal(report.status, "error");
  assert.ok(report.errors.some((error) => error.includes("returned 404")));
});

test("a repeated prior event requires materialUpdate", async () => {
  const edition = clone();
  const previous = clone();
  previous.editionDate = "2026-07-26";
  const report = await validate(edition, { previousEditions: [previous] });
  assert.equal(report.status, "error");
  assert.ok(report.errors.some((error) => error.includes("repeated event requires")));
});
