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
const fixturePath = path.join(testDir, "fixtures", "2026-07-27.json");
const fixture = JSON.parse(await fs.readFile(fixturePath, "utf8"));
const config = await loadEditorialConfig(root);
const clone = () => structuredClone(fixture);

const validate = (edition, options = {}) =>
  validateEdition(edition, {
    config,
    file: fixturePath,
    previousEditions: [],
    linkResults: [],
    ...options,
  });

test("valid fixture passes with only documented shortfall warnings", async () => {
  const report = await validate(clone());
  assert.equal(report.status, "ok");
  assert.deepEqual(report.errors, []);
  assert.ok(report.warnings.some((warning) => warning.includes("below target")));
});

test("schema rejects a missing source URL", async () => {
  const edition = clone();
  delete edition.stories[0].source.url;
  const report = await validate(edition);
  assert.equal(report.status, "error");
  assert.ok(report.errors.some((error) => error.includes("missing required property url")));
});

test("domain rules reject an unknown source", async () => {
  const edition = clone();
  edition.stories[0].source.id = "invented-source";
  const report = await validate(edition);
  assert.equal(report.status, "error");
  assert.ok(report.errors.some((error) => error.includes("not found in editorial/sources.json")));
});

test("domain rules reject a future publication time", async () => {
  const edition = clone();
  edition.stories[0].source.publishedAt = "2026-07-28T10:00:00+08:00";
  const report = await validate(edition);
  assert.equal(report.status, "error");
  assert.ok(report.errors.some((error) => error.includes("after cutoffAt")));
});

test("domain rules reject duplicate events", async () => {
  const edition = clone();
  edition.stories[1].eventId = edition.stories[0].eventId;
  const report = await validate(edition);
  assert.equal(report.status, "error");
  assert.ok(report.errors.some((error) => error.includes("eventId: duplicate")));
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
    ...edition.stories[3].source,
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
