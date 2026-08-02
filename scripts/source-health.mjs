#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

export function summarizeSourceHealth(editions, sourceIds, lookback = 14) {
  const recent = [...editions]
    .sort((left, right) => right.editionDate.localeCompare(left.editionDate))
    .slice(0, lookback);

  return sourceIds.map((sourceId) => {
    const history = recent.map((edition) => ({
      editionDate: edition.editionDate,
      scan: edition.research.sourceScan.find((entry) => entry.sourceId === sourceId),
    }));
    const counts = { collected: 0, empty: 0, unavailable: 0, "not-run": 0, missing: 0 };
    let consecutiveEmpty = 0;
    let countingEmpty = true;
    let lastSuccessfulEdition = null;

    for (const { editionDate, scan } of history) {
      const status = scan?.status ?? "missing";
      counts[status] += 1;
      if (!lastSuccessfulEdition && (status === "collected" || status === "empty")) {
        lastSuccessfulEdition = editionDate;
      }
      if (countingEmpty && status === "empty") consecutiveEmpty += 1;
      else countingEmpty = false;
    }

    return {
      sourceId,
      editionsObserved: history.length,
      lastStatus: history[0]?.scan?.status ?? "missing",
      lastSuccessfulEdition,
      consecutiveEmpty,
      counts,
    };
  });
}

async function loadProductionEditions(root) {
  const contentDir = path.join(root, "src", "content", "daily");
  const names = (await fs.readdir(contentDir))
    .filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/u.test(name))
    .sort();
  return Promise.all(
    names.map(async (name) => JSON.parse(await fs.readFile(path.join(contentDir, name), "utf8"))),
  );
}

async function main() {
  const sources = JSON.parse(
    await fs.readFile(path.join(repoRoot, "editorial", "sources.json"), "utf8"),
  );
  const access = JSON.parse(
    await fs.readFile(path.join(repoRoot, "editorial", "source-access.json"), "utf8"),
  );
  const editions = await loadProductionEditions(repoRoot);
  const summary = summarizeSourceHealth(
    editions,
    sources.sources.map((source) => source.id),
    access.healthHistory.lookbackEditions,
  );

  if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(summary)}\n`);
    return;
  }

  process.stdout.write("sourceId\tlast\tcollected\tempty\tunavailable\tconsecutiveEmpty\tlastSuccessful\n");
  for (const row of summary) {
    process.stdout.write(
      `${row.sourceId}\t${row.lastStatus}\t${row.counts.collected}\t${row.counts.empty}\t${row.counts.unavailable}\t${row.consecutiveEmpty}\t${row.lastSuccessfulEdition ?? "-"}\n`,
    );
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
