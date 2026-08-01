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
  const collectionStart = parseDateTime(edition.windowStartAt);
  const expectedName = `${edition.editionDate}.json`;
  if (file && path.basename(file) !== expectedName) {
    errors.push(`$: filename must be ${expectedName}`);
  }
  if (generated < cutoff) errors.push("$.generatedAt: cannot be before cutoffAt");

  const version3RequiredFrom = rules.collection.schemaVersion3RequiredFrom;
  if (edition.editionDate >= version3RequiredFrom && edition.schemaVersion !== 3) {
    errors.push("$.schemaVersion: version 3 is required from " + version3RequiredFrom);
  }

  const expectedWindowMs = rules.collection.windowHours * 60 * 60 * 1000;
  if (cutoff - collectionStart !== expectedWindowMs) {
    errors.push(`$.windowStartAt: must be exactly ${rules.collection.windowHours} hours before cutoffAt`);
  }
  const cutoffLocal = zonedDateAndTime(cutoff, "America/New_York");
  if (cutoffLocal.date !== edition.editionDate) {
    errors.push("$.editionDate: must be the America/New_York date at cutoffAt");
  }
  if (cutoffLocal.time !== "09:30:00") {
    errors.push("$.cutoffAt: must be 09:30:00 in America/New_York");
  }

  const ids = new Set();
  const eventIds = new Set();
  const sectionIds = new Set();
  const sourceLinks = new Set();
  const origins = { news: 0, community: 0 };
  let communityVoices = 0;
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
    const countField = "itemsInWindow";
    const inWindowItems = scan.itemsInWindow;
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
  if (edition.signals.length > storyImageCount) {
    errors.push(`$.signals: ${edition.signals.length} signals exceed the ${storyImageCount}-image pool`);
  }

  const validateSource = (source, at) => {
    sourceLinks.add(source.url);
    if (!evidenceLabels.has(source.evidenceLabel)) {
      errors.push(`${at}.evidenceLabel: unknown label`);
    }
    const registered = sources.get(source.id);
    if (!registered) errors.push(`${at}.id: not found in editorial/sources.json`);
    else {
      if (registered.name !== source.name) {
        errors.push(`${at}.name: expected ${registered.name}`);
      }
      if (!registered.languages?.includes(source.sourceLanguage)) {
        errors.push(`${at}.sourceLanguage: ${source.sourceLanguage} is not registered for ${source.id}`);
      }
    }
    const publishedAt = parseDateTime(source.publishedAt);
    if (publishedAt > cutoff) errors.push(`${at}.publishedAt: after cutoffAt`);
    const updatedAt = source.updatedAt ? parseDateTime(source.updatedAt) : null;
    if (updatedAt > cutoff) errors.push(`${at}.updatedAt: after cutoffAt`);
    const currentByPublication = publishedAt > collectionStart && publishedAt <= cutoff;
    const currentByUpdate = updatedAt && updatedAt > collectionStart && updatedAt <= cutoff;
    if (!currentByPublication && !currentByUpdate) {
      errors.push(`${at}.publishedAt: outside collection window`);
    }
  };

  edition.signals.forEach((signal, index) => {
    const at = `$.signals[${index}]`;
    if (signal.position !== index + 1) errors.push(`${at}.position: expected ${index + 1}`);
    if (ids.has(signal.id)) errors.push(`${at}.id: duplicate ${signal.id}`);
    ids.add(signal.id);
    if (eventIds.has(signal.eventId)) errors.push(`${at}.eventId: duplicate ${signal.eventId}`);
    eventIds.add(signal.eventId);

    if (signal.imageId) {
      if (!storyImageCategories.has(signal.imageId)) {
        errors.push(`${at}.imageId: unknown story image ID`);
      } else if (storyImageCategories.get(signal.imageId) !== signal.category) {
        errors.push(`${at}.imageId: image category must match signal.category`);
      }
      if (requestedImageIds.has(signal.imageId)) {
        errors.push(`${at}.imageId: duplicate image ID in this edition`);
      }
      requestedImageIds.add(signal.imageId);
    }

    if (!categories.has(signal.category)) errors.push(`${at}.category: unknown category`);
    validateSource(signal.source, `${at}.source`);

    const briefWords = countEnglishWords(signal.brief);
    const briefRange = rules.contentLengths.signalBriefWords;
    if (briefWords < briefRange.min || briefWords > briefRange.max) {
      errors.push(`${at}.brief: ${briefWords} words; expected ${briefRange.min}-${briefRange.max}`);
    }

    for (const [voiceIndex, voice] of signal.communityVoices.entries()) {
      const voiceAt = `${at}.communityVoices[${voiceIndex}]`;
      const voiceWords = countEnglishWords(voice.summary);
      const voiceRange = rules.contentLengths.communityVoiceWords;
      if (voiceWords < voiceRange.min || voiceWords > voiceRange.max) {
        errors.push(`${voiceAt}.summary: ${voiceWords} words; expected ${voiceRange.min}-${voiceRange.max}`);
      }
      validateSource(voice.source, `${voiceAt}.source`);
      communityVoices += 1;
    }

    if (signal.openSource) openSource += 1;
    origins[signal.origin] += 1;
  });

  for (let left = 0; left < edition.signals.length; left += 1) {
    for (let right = left + 1; right < edition.signals.length; right += 1) {
      const score = similarity(edition.signals[left].headline, edition.signals[right].headline);
      if (score >= 0.82) {
        warnings.push(
          `highly similar headlines at positions ${left + 1} and ${right + 1} (${score.toFixed(2)})`,
        );
      }
    }
  }

  const synthesis = edition.article.synthesis;
  const synthesisIds = new Set(synthesis.signalIds);
  const requiredSynthesisIds = Math.min(edition.signals.length, rules.article.synthesis.minSignalIds);
  if (synthesisIds.size < requiredSynthesisIds) {
    errors.push("$.article.synthesis.signalIds: expected at least " + requiredSynthesisIds + " current signal IDs");
  }
  for (const signalId of synthesisIds) {
    if (!ids.has(signalId)) errors.push(`$.article.synthesis.signalIds: unknown signal ID ${signalId}`);
  }
  const synthesisParagraphs = synthesis.body.trim().split(/\n\s*\n/).filter(Boolean);
  if (synthesisParagraphs.length < rules.article.synthesis.minParagraphs) {
    errors.push("$.article.synthesis.body: expected at least " + rules.article.synthesis.minParagraphs + " paragraphs");
  }
  const synthesisWords = countEnglishWords(synthesis.body);
  if (synthesisWords < rules.article.synthesis.minWords) {
    errors.push(`$.article.synthesis.body: ${synthesisWords} words is below ${rules.article.synthesis.minWords}`);
  } else if (
    synthesisWords < rules.article.synthesis.targetWords.min ||
    synthesisWords > rules.article.synthesis.targetWords.max
  ) {
    warnings.push(`editor synthesis has ${synthesisWords} words`);
  }

  const assignmentCounts = new Map([...ids].map((id) => [id, 0]));
  let sectionWords = 0;
  edition.article.sections.forEach((section, index) => {
    const at = `$.article.sections[${index}]`;
    if (section.position !== index + 1) errors.push(`${at}.position: expected ${index + 1}`);
    if (sectionIds.has(section.id)) errors.push(`${at}.id: duplicate ${section.id}`);
    sectionIds.add(section.id);
    const paragraphs = section.body.trim().split(/\n\s*\n/).filter(Boolean);
    if (paragraphs.length < rules.article.sectionMinParagraphs) {
      errors.push(`${at}.body: expected at least ${rules.article.sectionMinParagraphs} paragraphs`);
    }
    const words = countEnglishWords(section.body);
    sectionWords += words;
    if (words < rules.article.sectionWords.min || words > rules.article.sectionWords.max) {
      errors.push(`${at}.body: ${words} words; expected ${rules.article.sectionWords.min}-${rules.article.sectionWords.max}`);
    }
    for (const signalId of section.signalIds) {
      if (!ids.has(signalId)) errors.push(`${at}.signalIds: unknown signal ID ${signalId}`);
      else assignmentCounts.set(signalId, assignmentCounts.get(signalId) + 1);
    }
  });

  for (const signalId of edition.article.otherSignalIds) {
    if (!ids.has(signalId)) errors.push(`$.article.otherSignalIds: unknown signal ID ${signalId}`);
    else assignmentCounts.set(signalId, assignmentCounts.get(signalId) + 1);
  }
  for (const [signalId, count] of assignmentCounts) {
    if (count !== 1) {
      errors.push(`$.article: signal ${signalId} must be assigned exactly once; received ${count}`);
    }
  }

  const articleWords = synthesisWords + sectionWords;
  if (
    articleWords < rules.article.targetTotalWords.min ||
    articleWords > rules.article.targetTotalWords.max
  ) {
    warnings.push(`article has ${articleWords} words; target is ${rules.article.targetTotalWords.min}-${rules.article.targetTotalWords.max}`);
  }

  return {
    status: errors.length ? "error" : "ok",
    editionDate: edition.editionDate,
    counts: {
      total: edition.signals.length,
      news: origins.news,
      community: origins.community,
      communityVoices,
      sections: edition.article.sections.length,
      articleWords,
      openSource,
      sourceLinks: sourceLinks.size,
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
