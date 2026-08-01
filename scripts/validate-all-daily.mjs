#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { loadEditorialConfig, validateEdition } from "./validate-daily.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const contentDir = path.join(repoRoot, "src", "content", "daily");

const files = (await fs.readdir(contentDir))
  .filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/u.test(name))
  .sort();

if (!files.length) {
  throw new Error("No production daily JSON files found in src/content/daily");
}

const config = await loadEditorialConfig(repoRoot);
const seenRunIds = new Map();
let failed = false;

for (const name of files) {
  const file = path.join(contentDir, name);
  try {
    const edition = JSON.parse(await fs.readFile(file, "utf8"));
    const report = await validateEdition(edition, { config, file });
    const priorFile = seenRunIds.get(edition.runId);
    if (priorFile) {
      report.errors.push(`$.runId: duplicate of ${priorFile}`);
      report.status = "error";
    } else {
      seenRunIds.set(edition.runId, name);
    }

    if (report.status !== "ok") failed = true;
    process.stdout.write(`${name}: ${report.status}`);
    if (report.warnings.length) process.stdout.write(` (${report.warnings.join("; ")})`);
    process.stdout.write("\n");
    for (const error of report.errors) process.stderr.write(`  ${error}\n`);
  } catch (error) {
    failed = true;
    process.stderr.write(`${name}: ${error.message}\n`);
  }
}

if (failed) process.exitCode = 1;
