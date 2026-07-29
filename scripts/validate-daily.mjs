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

const normalizeUrl = (value) => {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString();
  } catch {
    return value;
  }
};

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
    if (schema.format === "uri") {
      try {
        new URL(value);
      } catch {
        errors.push(`${at}: invalid URI`);
      }
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

const scoreTotal = (score) =>
  [
    "evidenceStrength",
    "relevance",
    "novelty",
    "practicalUtility",
    "impact",
    "communitySignal",
  ].reduce((total, key) => total + score[key], 0);

const publishedUrls = (edition) => {
  const urls = new Set();
  for (const story of edition.stories ?? []) {
    if (story.source?.url) urls.add(normalizeUrl(story.source.url));
    for (const claim of story.factualClaims ?? []) {
      if (claim.evidenceUrl) urls.add(normalizeUrl(claim.evidenceUrl));
    }
    for (const signal of story.communityCheck?.signals ?? []) {
      if (signal.adopted && signal.url) urls.add(normalizeUrl(signal.url));
    }
  }
  return [...urls];
};

const checkOneLink = async (url, timeoutMs) => {
  const request = async (method) => {
    const response = await fetch(url, {
      method,
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "user-agent": "ASHFOG-Editorial-Validator/1.0",
        accept: "text/html,application/json,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    return { status: response.status, finalUrl: response.url };
  };

  try {
    let result = await request("HEAD");
    if (result.status === 405 || result.status >= 500) result = await request("GET");
    return { url, ...result };
  } catch (headError) {
    try {
      return { url, ...(await request("GET")) };
    } catch (getError) {
      return { url, error: getError.message || headError.message };
    }
  }
};

export async function checkLinks(urls, rules) {
  const queue = [...urls];
  const results = [];
  const worker = async () => {
    while (queue.length) {
      const url = queue.shift();
      results.push(await checkOneLink(url, rules.links.timeoutMs));
    }
  };
  const count = Math.min(rules.links.maxConcurrentChecks, queue.length);
  await Promise.all(Array.from({ length: count }, () => worker()));
  return results;
}

const loadPreviousEditions = async (contentDir, currentFile, limit) => {
  try {
    const names = (await fs.readdir(contentDir))
      .filter((name) => name.endsWith(".json"))
      .filter((name) => path.resolve(contentDir, name) !== path.resolve(currentFile))
      .sort()
      .reverse()
      .slice(0, limit);
    const editions = [];
    for (const name of names) {
      try {
        editions.push(await readJson(path.join(contentDir, name)));
      } catch {
        // An invalid previous edition should not hide errors in the current candidate.
      }
    }
    return editions;
  } catch {
    return [];
  }
};

export async function loadEditorialConfig(root = repoRoot) {
  const [schema, rules, sourceData, categoriesData, evidenceData, imageData] = await Promise.all([
    readJson(path.join(root, "schemas", "daily.schema.json")),
    readJson(path.join(root, "editorial", "publishing-rules.json")),
    readJson(path.join(root, "editorial", "sources.json")),
    readJson(path.join(root, "editorial", "categories.json")),
    readJson(path.join(root, "editorial", "evidence-labels.json")),
    readJson(path.join(root, "editorial", "image-library.json")),
  ]);
  const sourceUrlFields = ["url", "api", "repository", "releases_api", "endpoint"];
  const allowedHosts = new Set();
  const sourceHosts = new Map();
  const seenSourceIds = new Set();
  for (const source of sourceData.sources) {
    if (!source.id || seenSourceIds.has(source.id)) {
      throw new Error(`editorial/sources.json contains an invalid or duplicate id: ${source.id}`);
    }
    seenSourceIds.add(source.id);
    if (!["A", "B", "C"].includes(source.tier)) {
      throw new Error(`editorial/sources.json source ${source.id} has invalid tier ${source.tier}`);
    }
    const hosts = new Set();
    for (const field of sourceUrlFields) {
      if (!source[field]) continue;
      try {
        const host = new URL(source[field]).hostname.toLowerCase();
        allowedHosts.add(host);
        hosts.add(host);
      } catch {
        throw new Error(`editorial/sources.json source ${source.id} has invalid ${field}`);
      }
    }
    if (!hosts.size) throw new Error(`editorial/sources.json source ${source.id} has no valid URL`);
    sourceHosts.set(source.id, hosts);
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
    allowedHosts,
    sourceHosts,
    categories: new Set(categoryIds),
    evidenceLabels: new Set(Object.keys(evidenceData.labels)),
    imageIds: new Set(imageIds),
    storyImageCategories,
    pageImageIds,
    sourceIds: new Set(sourceData.sources.map((source) => source.id)),
    storyImageCount: imageData.storyImages.length + imageData.storyReservePageIds.length,
  };
}

export async function validateEdition(
  edition,
  {
    config,
    file = "",
    previousEditions = [],
    linkResults = [],
  },
) {
  const errors = validateAgainstSchema(edition, config.schema, config.schema);
  const warnings = [];
  if (errors.length) return { status: "error", errors, warnings };

  const {
    rules,
    sources,
    allowedHosts,
    sourceHosts,
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
  const sourceUrls = new Set();
  const companies = new Map();
  const ecosystems = new Map();
  const collected = new Set(edition.research.collectedUrls.map(normalizeUrl));
  const kinds = { news: 0, community: 0 };
  let highlights = 0;
  let openSource = 0;
  let mediaOnly = 0;
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

  if (isRollingWindow) {
    const expectedCandidateCount = edition.stories.length + edition.research.excludedCandidates.length;
    if (!Number.isInteger(edition.research.seriousCandidateCount)) {
      errors.push("$.research.seriousCandidateCount: required for schemaVersion 2");
    } else if (edition.research.seriousCandidateCount !== expectedCandidateCount) {
      errors.push(`$.research.seriousCandidateCount: expected ${expectedCandidateCount} selected plus excluded candidates`);
    }
    edition.research.excludedCandidates.forEach((candidate, index) => {
      const at = `$.research.excludedCandidates[${index}]`;
      if (!collected.has(normalizeUrl(candidate.url))) {
        errors.push(`${at}.url: URL is absent from research.collectedUrls`);
      }
      if (candidate.reason === "low-relevance") {
        if (!candidate.score) {
          errors.push(`${at}.score: required for a low-relevance exclusion`);
        } else {
          const floor = rules.selection.materialityFloor;
          const qualifies = candidate.score.total >= floor.minimumTotalScore &&
            candidate.score.evidenceStrength >= floor.minimumEvidenceStrength &&
            candidate.score.relevance >= floor.minimumRelevance &&
            Math.max(candidate.score.impact, candidate.score.practicalUtility) >= floor.minimumImpactOrPracticalUtility;
          if (qualifies) errors.push(`${at}.reason: candidate meets the materiality floor and cannot be excluded as low-relevance`);
        }
      }
      if (candidate.reason === "lower-priority" && edition.stories.length < rules.selection.safetyMaxStories) {
        errors.push(`${at}.reason: lower-priority is allowed only after the safety maximum is reached`);
      }
    });
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

    const normalizedSource = normalizeUrl(story.source.url);
    if (sourceUrls.has(normalizedSource)) {
      errors.push(`${at}.source.url: duplicate primary URL; merge duplicate coverage`);
    }
    sourceUrls.add(normalizedSource);

    if (!categories.has(story.category)) errors.push(`${at}.category: unknown category`);
    if (!evidenceLabels.has(story.source.evidenceLabel)) {
      errors.push(`${at}.source.evidenceLabel: unknown label`);
    }
    const registered = sources.get(story.source.id);
    if (!registered) errors.push(`${at}.source.id: not found in editorial/sources.json`);
    else {
      if (registered.tier !== story.source.tier) {
        errors.push(`${at}.source.tier: expected ${registered.tier}`);
      }
      if (registered.name !== story.source.name) {
        errors.push(`${at}.source.name: expected ${registered.name}`);
      }
      if (!registered.languages?.includes(story.source.sourceLanguage)) {
        errors.push(
          `${at}.source.sourceLanguage: ${story.source.sourceLanguage} is not registered for ${story.source.id}`,
        );
      }
      const sourceHost = new URL(story.source.url).hostname.toLowerCase();
      if (!sourceHosts.get(story.source.id)?.has(sourceHost)) {
        errors.push(`${at}.source.url: host does not match registered source ${story.source.id}`);
      }
    }
    if (story.kind === "news" && story.source.tier === "C") {
      errors.push(`${at}.source.tier: Tier C cannot be the primary source for a news item`);
    }
    if (!collected.has(normalizedSource)) {
      errors.push(`${at}.source.url: URL is absent from research.collectedUrls`);
    }
    if (!allowedHosts.has(new URL(story.source.url).hostname.toLowerCase())) {
      errors.push(`${at}.source.url: host is absent from editorial/sources.json`);
    }

    const publishedAt = parseDateTime(story.source.publishedAt);
    if (publishedAt > cutoff) errors.push(`${at}.source.publishedAt: after cutoffAt`);
    let updatedAt = null;
    if (story.source.updatedAt) {
      updatedAt = parseDateTime(story.source.updatedAt);
      if (updatedAt > cutoff) errors.push(`${at}.source.updatedAt: after cutoffAt`);
    }
    const currentByPublication = publishedAt >= collectionStart && publishedAt <= cutoff;
    const currentByUpdate = updatedAt && updatedAt >= collectionStart && updatedAt <= cutoff;
    if (!currentByPublication && !currentByUpdate && !story.windowException) {
      errors.push(`${at}.source.publishedAt: outside collection window without windowException`);
    }

    story.factualClaims.forEach((claim, claimIndex) => {
      if (!evidenceLabels.has(claim.evidenceLabel)) {
        errors.push(`${at}.factualClaims[${claimIndex}].evidenceLabel: unknown label`);
      }
      if (!collected.has(normalizeUrl(claim.evidenceUrl))) {
        errors.push(
          `${at}.factualClaims[${claimIndex}].evidenceUrl: URL is absent from research.collectedUrls`,
        );
      }
      if (!allowedHosts.has(new URL(claim.evidenceUrl).hostname.toLowerCase())) {
        errors.push(
          `${at}.factualClaims[${claimIndex}].evidenceUrl: host is absent from editorial/sources.json`,
        );
      }
    });
    story.communityCheck.signals.forEach((signal, signalIndex) => {
      if (!evidenceLabels.has(signal.evidenceLabel)) {
        errors.push(`${at}.communityCheck.signals[${signalIndex}].evidenceLabel: unknown label`);
      }
      if (signal.adopted && !collected.has(normalizeUrl(signal.url))) {
        errors.push(
          `${at}.communityCheck.signals[${signalIndex}].url: adopted URL is absent from research.collectedUrls`,
        );
      }
      if (
        signal.adopted &&
        !allowedHosts.has(new URL(signal.url).hostname.toLowerCase())
      ) {
        errors.push(
          `${at}.communityCheck.signals[${signalIndex}].url: host is absent from editorial/sources.json`,
        );
      }
      if (
        signal.adopted &&
        /(benchmark|tokens?\/s|latency|throughput|vram|显存|延迟|吞吐)/iu.test(signal.finding) &&
        !signal.configuration
      ) {
        errors.push(
          `${at}.communityCheck.signals[${signalIndex}].configuration: benchmark evidence requires configuration`,
        );
      }
    });

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

    const total = scoreTotal(story.score);
    if (story.score.total !== total) errors.push(`${at}.score.total: expected ${total}`);
    if (isRollingWindow) {
      const floor = rules.selection.materialityFloor;
      if (total < floor.minimumTotalScore) errors.push(`${at}.score.total: below materiality floor ${floor.minimumTotalScore}`);
      if (story.score.evidenceStrength < floor.minimumEvidenceStrength) errors.push(`${at}.score.evidenceStrength: below materiality floor`);
      if (story.score.relevance < floor.minimumRelevance) errors.push(`${at}.score.relevance: below materiality floor`);
      if (Math.max(story.score.impact, story.score.practicalUtility) < floor.minimumImpactOrPracticalUtility) {
        errors.push(`${at}.score: impact or practicalUtility must meet the materiality floor`);
      }
    }
    if (story.highlight) highlights += 1;
    if (story.openSource) openSource += 1;
    if (story.mediaOnly) mediaOnly += 1;
    kinds[story.kind] += 1;
    if (story.company) companies.set(story.company, (companies.get(story.company) ?? 0) + 1);
    ecosystems.set(story.ecosystem, (ecosystems.get(story.ecosystem) ?? 0) + 1);
  });

  for (let left = 0; left < edition.stories.length; left += 1) {
    for (let right = left + 1; right < edition.stories.length; right += 1) {
      const score = similarity(edition.stories[left].headline, edition.stories[right].headline);
      if (score >= 0.82) {
        errors.push(
          `$.stories: highly similar headlines at positions ${left + 1} and ${right + 1} (${score.toFixed(2)})`,
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

  if (edition.stories.length && mediaOnly / edition.stories.length > rules.caps.mediaOnlyShare) {
    errors.push("$.stories: media-only share exceeds configured cap");
  }
  for (const [company, count] of companies) {
    if (count > rules.caps.itemsPerCompany) {
      errors.push(`$.stories: company ${company} exceeds ${rules.caps.itemsPerCompany} items`);
    }
  }
  if (edition.stories.length >= rules.caps.applyEcosystemShareAt) {
    for (const [ecosystem, count] of ecosystems) {
      if (count / edition.stories.length > rules.caps.ecosystemShare) {
        errors.push(`$.stories: ecosystem ${ecosystem} exceeds configured share cap`);
      }
    }
  }

  const analysisIds = new Set(edition.dailyAnalysis.signalIds);
  for (const signalId of analysisIds) {
    if (!ids.has(signalId)) errors.push(`$.dailyAnalysis.signalIds: unknown story ID ${signalId}`);
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

  const previousEvents = new Set();
  for (const previous of previousEditions) {
    for (const story of previous.stories ?? []) previousEvents.add(story.eventId);
    if (previous.dailyAnalysis?.body) {
      const score = similarity(edition.dailyAnalysis.body, previous.dailyAnalysis.body);
      if (score >= rules.analysis.maxPriorSimilarity) {
        errors.push(`$.dailyAnalysis.body: similarity ${score.toFixed(2)} exceeds prior-edition cap`);
      }
    }
  }
  edition.stories.forEach((story, index) => {
    if (previousEvents.has(story.eventId) && !story.materialUpdate) {
      errors.push(
        `$.stories[${index}].materialUpdate: repeated event requires a material update`,
      );
    }
  });

  for (const result of linkResults) {
    if (result.error) errors.push(`link: ${result.url} failed: ${result.error}`);
    else if ([401, 403, 429].includes(result.status)) {
      warnings.push(`link: ${result.url} returned restricted status ${result.status}`);
    } else if (result.status >= 400) {
      errors.push(`link: ${result.url} returned ${result.status}`);
    }
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
      mediaOnly,
      collectedUrls: collected.size,
      checkedLinks: linkResults.length,
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
  const result = {
    file: "",
    contentDir: path.join(repoRoot, "src", "content", "daily"),
    checkLinks: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") continue;
    if (!result.file && !arg.startsWith("--")) result.file = path.resolve(arg);
    else if (arg === "--content-dir") result.contentDir = path.resolve(argv[++index]);
    else if (arg === "--check-links") result.checkLinks = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!result.file) throw new Error("Usage: validate-daily.mjs <edition.json> [--content-dir DIR] [--check-links]");
  return result;
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [edition, config] = await Promise.all([
    readJson(args.file),
    loadEditorialConfig(),
  ]);
  const previousEditions = await loadPreviousEditions(
    args.contentDir,
    args.file,
    config.rules.previousEditionLookback,
  );
  const linkResults = args.checkLinks
    ? await checkLinks(publishedUrls(edition), config.rules)
    : [];
  const report = await validateEdition(edition, {
    config,
    file: args.file,
    previousEditions,
    linkResults,
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
