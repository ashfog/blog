#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

const readJson = async (file) => JSON.parse(await fs.readFile(file, "utf8"));

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const parseDateTime = (value) => {
  if (typeof value !== "string" || !/[zZ]|[+-]\d{2}:\d{2}$/.test(value)) {
    return null;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp);
};

const zonedDateAndTime = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}:${values.second}`,
  };
};

const resolveRef = (root, ref) => {
  if (!ref.startsWith("#/")) {
    throw new Error(`Only local JSON Schema references are supported: ${ref}`);
  }
  return ref
    .slice(2)
    .split("/")
    .map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce((node, part) => node?.[part], root);
};

const matchesType = (value, type) => {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "object") return isObject(value);
  if (type === "integer") return Number.isInteger(value);
  return typeof value === type;
};

export function validateAgainstSchema(value, schema, rootSchema, at = "$", errors = []) {
  if (schema.$ref) {
    const resolved = resolveRef(rootSchema, schema.$ref);
    if (!resolved) errors.push(`${at}: unresolved schema reference ${schema.$ref}`);
    else validateAgainstSchema(value, resolved, rootSchema, at, errors);
    return errors;
  }

  if ("const" in schema && value !== schema.const) {
    errors.push(`${at}: expected constant ${JSON.stringify(schema.const)}`);
    return errors;
  }
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${at}: expected one of ${schema.enum.join(", ")}`);
    return errors;
  }

  if (schema.type) {
    const allowed = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!allowed.some((type) => matchesType(value, type))) {
      errors.push(`${at}: expected type ${allowed.join("|")}`);
      return errors;
    }
  }

  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${at}: string is shorter than ${schema.minLength}`);
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push(`${at}: string is longer than ${schema.maxLength}`);
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${at}: value does not match ${schema.pattern}`);
    }
    if (schema.format === "date-time" && value !== "" && !parseDateTime(value)) {
      errors.push(`${at}: invalid timezone-aware date-time`);
    }
  }

  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${at}: value is below ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(`${at}: value is above ${schema.maximum}`);
    }
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${at}: array has fewer than ${schema.minItems} items`);
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push(`${at}: array has more than ${schema.maxItems} items`);
    }
    if (schema.uniqueItems) {
      const keys = value.map((item) => JSON.stringify(item));
      if (new Set(keys).size !== keys.length) errors.push(`${at}: array items must be unique`);
    }
    if (schema.items) {
      value.forEach((item, index) =>
        validateAgainstSchema(item, schema.items, rootSchema, `${at}[${index}]`, errors),
      );
    }
  }

  if (isObject(value)) {
    const properties = schema.properties ?? {};
    for (const required of schema.required ?? []) {
      if (!(required in value)) errors.push(`${at}: missing required property ${required}`);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in properties)) errors.push(`${at}: unexpected property ${key}`);
      }
    }
    for (const [key, childSchema] of Object.entries(properties)) {
      if (key in value) {
        validateAgainstSchema(value[key], childSchema, rootSchema, `${at}.${key}`, errors);
      }
    }
  }

  return errors;
}

const shingles = (text, width = 3) => {
  const normalized = text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\p{P}\p{S}\s]+/gu, "");
  const result = new Set();
  for (let index = 0; index <= normalized.length - width; index += 1) {
    result.add(normalized.slice(index, index + width));
  }
  return result;
};

const similarity = (left, right) => {
  const a = shingles(left);
  const b = shingles(right);
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((item) => b.has(item)).length;
  return intersection / (a.size + b.size - intersection);
};

const countEnglishWords = (text) => {
  const segmenter = new Intl.Segmenter("en", { granularity: "word" });
  return [...segmenter.segment(text)].filter((segment) => segment.isWordLike).length;
};

export async function loadEditorialConfig(root = repoRoot) {
  const [schema, rules, sourceData, sourceAccessData, categoriesData, evidenceData, imageData] = await Promise.all([
    readJson(path.join(root, "schemas", "daily.schema.json")),
    readJson(path.join(root, "editorial", "publishing-rules.json")),
    readJson(path.join(root, "editorial", "sources.json")),
    readJson(path.join(root, "editorial", "source-access.json")),
    readJson(path.join(root, "editorial", "categories.json")),
    readJson(path.join(root, "editorial", "evidence-labels.json")),
    readJson(path.join(root, "editorial", "image-library.json")),
  ]);
  const seenSourceIds = new Set();
  for (const source of sourceData.sources) {
    if (!source.id || seenSourceIds.has(source.id)) {
      throw new Error(`editorial/sources.json contains an invalid or duplicate id: ${source.id}`);
    }
    seenSourceIds.add(source.id);
  }

  const routeTypes = new Set(sourceAccessData.routeTypes ?? []);
  if (!routeTypes.size) {
    throw new Error("editorial/source-access.json has no supported route types");
  }
  const accessPlans = sourceAccessData.plans;
  if (!isObject(accessPlans)) {
    throw new Error("editorial/source-access.json plans must be an object");
  }

  for (const sourceId of Object.keys(accessPlans)) {
    if (!seenSourceIds.has(sourceId)) {
      throw new Error("editorial/source-access.json has an unknown source plan: " + sourceId);
    }
  }

  for (const sourceId of seenSourceIds) {
    const routes = accessPlans[sourceId];
    if (!Array.isArray(routes) || routes.length === 0) {
      throw new Error("editorial/source-access.json has a missing or empty plan: " + sourceId);
    }
    routes.forEach((route, index) => {
      if (!isObject(route) || !routeTypes.has(route.type)) {
        throw new Error("editorial/source-access.json has an unsupported route at " + sourceId + "[" + index + "]");
      }
      const requiredFieldByType = { "date-archive": "urlTemplate", "indexed-search": "query", cli: "command" };
      const requiredField = requiredFieldByType[route.type] ?? "url";
      if (typeof route[requiredField] !== "string" || !route[requiredField].trim()) {
        throw new Error("editorial/source-access.json route is missing " + requiredField + " at " + sourceId + "[" + index + "]");
      }
    });
  }

  if (sourceAccessData.timezone !== rules.collection.timezone) {
    throw new Error("editorial/source-access.json timezone must match publishing rules");
  }
  if (sourceAccessData.collectionRules?.windowBoundary !== rules.collection.windowBoundary) {
    throw new Error("editorial/source-access.json window boundary must match publishing rules");
  }

  const categoryIds = categoriesData.categories.map((category) => category.id);
  if (new Set(categoryIds).size !== categoryIds.length) {
    throw new Error("editorial/categories.json contains duplicate category ids");
  }

  const allImages = [...imageData.storyImages, ...imageData.pageImages];
  const imageIds = allImages.map((image) => image.id);
  if (new Set(imageIds).size !== imageIds.length) {
    throw new Error("editorial/image-library.json contains duplicate image ids");
  }
  const storyImageCategories = new Map();
  for (const image of imageData.storyImages) {
    if (!categoryIds.includes(image.category)) {
      throw new Error(
        `editorial/image-library.json image ${image.id} has unknown category ${image.category}`,
      );
    }
    storyImageCategories.set(image.id, image.category);
  }
  const pageImageIds = new Set(imageData.pageImages.map((image) => image.id));
  for (const requiredPage of [
    "home",
    "daily",
    "analysis",
    "archive",
    "topics",
    "about",
    "search",
    "404",
  ]) {
    if (!imageData.pageImages.some((image) => image.page === requiredPage)) {
      throw new Error(`editorial/image-library.json is missing page image ${requiredPage}`);
    }
  }
  for (const image of allImages) {
    const directory = "category" in image
      ? path.join("stories", image.category)
      : "pages";
    for (const width of imageData.dimensions.renditions) {
      await fs.access(
        path.join(root, "public", "images", "library", directory, `${image.id}-${width}.webp`),
      );
    }
  }
  return {
    schema,
    rules,
    sources: new Map(sourceData.sources.map((source) => [source.id, source])),
    categories: new Set(categoryIds),
    evidenceLabels: new Set(Object.keys(evidenceData.labels)),
    imageIds: new Set(imageIds),
    storyImageCategories,
    pageImageIds,
    sourceIds: new Set(sourceData.sources.map((source) => source.id)),
    sourceAccessPlanIds: new Set(Object.keys(accessPlans)),
    storyImageCount: imageData.storyImages.length + imageData.storyReservePageIds.length,
  };
}

export async function validateEdition(
  edition,
  {
    config,
    file = "",
  },
) {
  const errors = validateAgainstSchema(edition, config.schema, config.schema);
  const warnings = [];
  if (errors.length) return { status: "error", errors, warnings };

  const {
    rules,
    sources,
    categories,
    evidenceLabels,
    imageIds,
    storyImageCategories,
    storyImageCount,
    sourceIds,
  } = config;
  const cutoff = parseDateTime(edition.cutoffAt);
  const generated = parseDateTime(edition.generatedAt);
  const expectedName = `${edition.editionDate}.json`;
  if (file && path.basename(file) !== expectedName) {
    errors.push(`$: filename must be ${expectedName}`);
  }
  if (generated < cutoff) errors.push("$.generatedAt: cannot be before cutoffAt");

  const version2RequiredFrom = rules.collection.schemaVersion2RequiredFrom;
  if (edition.editionDate >= version2RequiredFrom && edition.schemaVersion !== 2) {
    errors.push("$.schemaVersion: version 2 is required from " + version2RequiredFrom);
  }

  const isRollingWindow = edition.schemaVersion === 2;
  let collectionStart;
  if (isRollingWindow) {
    if (edition.timezone !== "America/New_York") {
      errors.push("$.timezone: schemaVersion 2 requires America/New_York");
    }
    collectionStart = parseDateTime(edition.windowStartAt);
    if (!collectionStart) {
      errors.push("$.windowStartAt: required for schemaVersion 2");
      collectionStart = cutoff;
    } else {
      const expectedWindowMs = rules.collection.windowHours * 60 * 60 * 1000;
      if (cutoff - collectionStart !== expectedWindowMs) {
        errors.push(`$.windowStartAt: must be exactly ${rules.collection.windowHours} hours before cutoffAt`);
      }
    }
    const cutoffLocal = zonedDateAndTime(cutoff, "America/New_York");
    if (cutoffLocal.date !== edition.editionDate) {
      errors.push("$.editionDate: must be the America/New_York date at cutoffAt");
    }
    if (cutoffLocal.time !== "09:30:00") {
      errors.push("$.cutoffAt: must be 09:30:00 in America/New_York");
    }
  } else {
    if (edition.timezone !== "Asia/Shanghai") {
      errors.push("$.timezone: schemaVersion 1 requires Asia/Shanghai");
    }
    collectionStart = new Date(`${edition.editionDate}T00:00:00+08:00`);
  }

  const ids = new Set();
  const eventIds = new Set();
  const sourceLinkCount = new Set(edition.stories.map((story) => story.source.url)).size;
  const kinds = { news: 0, community: 0 };
  let highlights = 0;
  let openSource = 0;
  const requestedImageIds = new Set();
  const sourceScanIds = new Set();
  let attemptedSources = 0;
  let availableSources = 0;
  let fetchedItems = 0;
  let windowItems = 0;
  let scannedDuplicates = 0;
  const isThemeFixture = file.includes(`${path.sep}tests${path.sep}fixtures${path.sep}`);

  for (const [scanIndex, scan] of edition.research.sourceScan.entries()) {
    const at = `$.research.sourceScan[${scanIndex}]`;
    if (!sourceIds.has(scan.sourceId)) errors.push(`${at}.sourceId: unknown source`);
    if (sourceScanIds.has(scan.sourceId)) errors.push(`${at}.sourceId: duplicate source`);
    sourceScanIds.add(scan.sourceId);
    if (scan.itemsFetched > rules.collection.perSourceLatestLimit) {
      errors.push(`${at}.itemsFetched: exceeds per-source limit ${rules.collection.perSourceLatestLimit}`);
    }
    const countField = isRollingWindow ? "itemsInWindow" : "itemsOnEditionDay";
    if (!Number.isInteger(scan[countField])) {
      errors.push(`${at}.${countField}: required for schemaVersion ${edition.schemaVersion}`);
    }
    if (isRollingWindow && "itemsOnEditionDay" in scan) {
      errors.push(`${at}.itemsOnEditionDay: use itemsInWindow for schemaVersion 2`);
    }
    const inWindowItems = Number.isInteger(scan[countField]) ? scan[countField] : 0;
    if (inWindowItems > scan.itemsFetched) {
      errors.push(`${at}.${countField}: cannot exceed itemsFetched`);
    }
    if (scan.duplicatesRemoved > inWindowItems) {
      errors.push(`${at}.duplicatesRemoved: cannot exceed ${countField}`);
    }
    if (scan.selectedCount > inWindowItems - scan.duplicatesRemoved) {
      errors.push(`${at}.selectedCount: exceeds available deduplicated items`);
    }
    if (scan.status === "collected" && inWindowItems === 0) {
      errors.push(`${at}.status: collected requires at least one ${countField} item`);
    }
    if (scan.status === "empty" && inWindowItems !== 0) {
      errors.push(`${at}.status: empty requires zero ${countField} items`);
    }
    if (scan.status === "not-run" && !isThemeFixture) {
      errors.push(`${at}.status: not-run is forbidden outside theme fixtures`);
    }
    if (scan.status === "unavailable" && !scan.failureReason) {
      errors.push(`${at}.failureReason: required when source is unavailable`);
    }
    if (scan.status === "unavailable") {
      if (inWindowItems !== 0) errors.push(at + ".status: unavailable requires zero " + countField + " items");
      if (scan.selectedCount !== 0) errors.push(at + ".selectedCount: unavailable source cannot select items");
    }
    if (scan.status !== "not-run") attemptedSources += 1;
    if (scan.status === "collected" || scan.status === "empty") availableSources += 1;
    fetchedItems += scan.itemsFetched;
    windowItems += inWindowItems;
    scannedDuplicates += scan.duplicatesRemoved;
  }
  if (!isThemeFixture) {
    for (const sourceId of sourceIds) {
      if (!sourceScanIds.has(sourceId)) {
        errors.push(`$.research.sourceScan: missing registered source ${sourceId}`);
      }
    }
    if (sourceScanIds.size !== sourceIds.size) {
      errors.push(
        `$.research.sourceScan: expected exactly ${sourceIds.size} registered sources; received ${sourceScanIds.size}`,
      );
    }
  }

  if (edition.heroImageId && !imageIds.has(edition.heroImageId)) {
    errors.push("$.heroImageId: unknown image ID");
  }
  if (edition.stories.length > storyImageCount) {
    errors.push(`$.stories: ${edition.stories.length} stories exceed the ${storyImageCount}-image pool`);
  }

  edition.stories.forEach((story, index) => {
    const at = `$.stories[${index}]`;
    if (story.position !== index + 1) errors.push(`${at}.position: expected ${index + 1}`);
    if (ids.has(story.id)) errors.push(`${at}.id: duplicate ${story.id}`);
    ids.add(story.id);
    if (eventIds.has(story.eventId)) errors.push(`${at}.eventId: duplicate ${story.eventId}`);
    eventIds.add(story.eventId);

    if (story.imageId) {
      if (!storyImageCategories.has(story.imageId)) {
        errors.push(`${at}.imageId: unknown story image ID`);
      } else if (storyImageCategories.get(story.imageId) !== story.category) {
        errors.push(`${at}.imageId: image category must match story.category`);
      }
      if (requestedImageIds.has(story.imageId)) {
        errors.push(`${at}.imageId: duplicate image ID in this edition`);
      }
      requestedImageIds.add(story.imageId);
    }

    if (!categories.has(story.category)) errors.push(`${at}.category: unknown category`);
    if (!evidenceLabels.has(story.source.evidenceLabel)) {
      errors.push(`${at}.source.evidenceLabel: unknown label`);
    }
    const registered = sources.get(story.source.id);
    if (!registered) errors.push(`${at}.source.id: not found in editorial/sources.json`);
    else {
      if (registered.name !== story.source.name) {
        errors.push(`${at}.source.name: expected ${registered.name}`);
      }
      if (!registered.languages?.includes(story.source.sourceLanguage)) {
        errors.push(
          `${at}.source.sourceLanguage: ${story.source.sourceLanguage} is not registered for ${story.source.id}`,
        );
      }
    }

    const publishedAt = parseDateTime(story.source.publishedAt);
    if (publishedAt > cutoff) errors.push(`${at}.source.publishedAt: after cutoffAt`);
    let updatedAt = null;
    if (story.source.updatedAt) {
      updatedAt = parseDateTime(story.source.updatedAt);
      if (updatedAt > cutoff) errors.push(`${at}.source.updatedAt: after cutoffAt`);
    }
    const currentByPublication = publishedAt > collectionStart && publishedAt <= cutoff;
    const currentByUpdate = updatedAt && updatedAt > collectionStart && updatedAt <= cutoff;
    if (!currentByPublication && !currentByUpdate) {
      errors.push(`${at}.source.publishedAt: outside collection window`);
    }

    const lengths = rules.contentLengths[story.kind];
    const summaryWords = countEnglishWords(story.summary);
    const whyWords = countEnglishWords(story.whyItMatters);
    if (
      summaryWords < lengths.summaryWords.min ||
      summaryWords > lengths.summaryWords.max
    ) {
      errors.push(
        `${at}.summary: ${summaryWords} words; expected ${lengths.summaryWords.min}-${lengths.summaryWords.max} for ${story.kind}`,
      );
    }
    if (
      whyWords < lengths.whyItMattersWords.min ||
      whyWords > lengths.whyItMattersWords.max
    ) {
      errors.push(
        `${at}.whyItMatters: ${whyWords} words; expected ${lengths.whyItMattersWords.min}-${lengths.whyItMattersWords.max} for ${story.kind}`,
      );
    }

    if (story.highlight) highlights += 1;
    if (story.openSource) openSource += 1;
    kinds[story.kind] += 1;
  });

  for (let left = 0; left < edition.stories.length; left += 1) {
    for (let right = left + 1; right < edition.stories.length; right += 1) {
      const score = similarity(edition.stories[left].headline, edition.stories[right].headline);
      if (score >= 0.82) {
        warnings.push(
          `highly similar headlines at positions ${left + 1} and ${right + 1} (${score.toFixed(2)})`,
        );
      }
    }
  }

  const highlightTarget = rules.presentation.highlights;
  if (highlights > highlightTarget.max) {
    errors.push(`$.stories: highlight count ${highlights} exceeds ${highlightTarget.max}`);
  }
  if (highlights < highlightTarget.min) {
    errors.push(`$.stories: at least ${highlightTarget.min} highlight is required`);
  }

  const analysisIds = new Set(edition.dailyAnalysis.signalIds);
  const requiredAnalysisIds = Math.min(edition.stories.length, rules.analysis.minSignalIds);
  if (analysisIds.size < requiredAnalysisIds) {
    errors.push("$.dailyAnalysis.signalIds: expected at least " + requiredAnalysisIds + " current story IDs");
  }
  for (const signalId of analysisIds) {
    if (!ids.has(signalId)) errors.push(`$.dailyAnalysis.signalIds: unknown story ID ${signalId}`);
  }
  const analysisParagraphs = edition.dailyAnalysis.body.trim().split(/\n\s*\n/).filter(Boolean);
  if (analysisParagraphs.length < rules.analysis.minParagraphs) {
    errors.push("$.dailyAnalysis.body: expected at least " + rules.analysis.minParagraphs + " paragraphs");
  }
  const analysisWords = countEnglishWords(edition.dailyAnalysis.body);
  if (analysisWords < rules.analysis.minWords) {
    errors.push(
      `$.dailyAnalysis.body: ${analysisWords} words is below ${rules.analysis.minWords}`,
    );
  } else if (
    analysisWords < rules.analysis.targetWords.min ||
    analysisWords > rules.analysis.targetWords.max
  ) {
    warnings.push(`daily analysis has ${analysisWords} words`);
  }

  return {
    status: errors.length ? "error" : "ok",
    editionDate: edition.editionDate,
    counts: {
      total: edition.stories.length,
      news: kinds.news,
      community: kinds.community,
      highlights,
      openSource,
      sourceLinks: sourceLinkCount,
      attemptedSources,
      availableSources,
      fetchedItems,
      inWindowItems: windowItems,
      scannedDuplicates,
    },
    errors,
    warnings,
  };
}

const parseArgs = (argv) => {
  const result = { file: "" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") continue;
    if (!result.file && !arg.startsWith("--")) result.file = path.resolve(arg);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!result.file) throw new Error("Usage: validate-daily.mjs <edition.json>");
  return result;
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [edition, config] = await Promise.all([
    readJson(args.file),
    loadEditorialConfig(),
  ]);
  const report = await validateEdition(edition, {
    config,
    file: args.file,
  });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exitCode = report.status === "ok" ? 0 : 1;
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
