---
name: ashfog-daily-publisher
description: Research, draft, validate, and publish the Chinese-language ASHFOG daily AI, open-source, developer-tool, infrastructure, research, and community intelligence brief. Use for scheduled ASHFOG daily research, Preview runs, Publish runs, source verification, daily JSON generation, publication retries, or validation of src/content/daily/YYYY-MM-DD.json in ashfog/blog.
---

# ASHFOG Daily Publisher

Produce one evidence-backed daily edition as a single validated JSON file. Treat discovery, verification, writing, validation, and publication as one fail-closed transaction.

## Select a mode

- Use **Preview** when the user does not name a mode. Research, draft, and validate without an external write.
- Use **Publish** only when explicitly requested by the user or scheduled automation. Complete Preview first and publish only after every blocking check passes.

## Load repository rules

Read these files before research:

1. `editorial/editorial-policy.md`
2. `editorial/publishing-rules.json`
3. `editorial/sources.json`
4. `editorial/community-policy.md`
5. `editorial/categories.json`
6. `editorial/evidence-labels.json`
7. `editorial/image-library.json`
8. `schemas/daily.schema.json`

Treat repository files as the current source of truth. Do not copy their contents into the automation prompt or duplicate them inside this skill.

## Run the pipeline

1. Determine `editionDate` and `cutoffAt` in `Asia/Shanghai`.
2. Check whether `src/content/daily/YYYY-MM-DD.json` already exists and validates. Return `already_valid` without writing when it does.
3. Discover candidates from enabled sources, beginning with Tier A primary evidence. Use Tier C only to find stronger evidence.
4. Record every serious candidate URL in `research.collectedUrls` before drafting.
5. Merge coverage of one event under one `eventId`. Compare the previous seven editions and require `materialUpdate` for repeated events.
6. Score and select according to repository policy. Never pad an edition.
7. Perform targeted community checks according to `editorial/community-policy.md`.
8. Lock one ordered fact ledger before writing. Do not introduce facts or URLs absent from the ledger.
9. Generate one JSON document that conforms to `schemas/daily.schema.json`.
10. Count every `summary` and `whyItMatters` value and confirm each is within the schema's current minimum and maximum before validation. Do not pad text with repetition to satisfy a length limit.
11. Write the candidate to a temporary path and run:

```text
npm run validate:daily -- <candidate.json> --content-dir src/content/daily --check-links
```

Treat exit code `1` as blocking. Do not weaken validation, remove evidence, invent replacement URLs, or publish a partial edition to make a run pass.

## Assign images

Omit `imageId` and `heroImageId` by default. Astro assigns category-matched story images deterministically and guarantees that one edition does not repeat an image. Set `imageId` only for an intentional editorial override after reading `editorial/image-library.json`; the ID must be a story image in the same category and must be unique in the edition. `heroImageId` may reference any story or page image. Never invent an image ID or reuse one within a daily edition.

## Preview

Return the candidate path, counts, source-tier distribution, exclusions, unavailable sources, warnings, and validation report. Do not mutate GitHub.

## Publish

1. Re-read the current target path and default-branch head.
2. Publish exactly one file: `src/content/daily/YYYY-MM-DD.json`.
3. Create one commit. Never force-push or overwrite unrelated work.
4. If the target appeared after validation, re-read it. Return `already_valid` when valid; otherwise stop with `conflict`.
5. Re-read the file from the resulting commit and validate its date, IDs, URLs, and content hash.
6. Allow Cloudflare Pages to build Astro and Pagefind from the commit.
7. When deployment exists, verify the public edition URL before reporting `published`.

## Automation behavior

Make retries idempotent. A valid existing edition produces no new commit. An invalid or missing edition runs the complete pipeline. On any access, validation, concurrency, build, or deployment failure, report `blocked` with the exact reason and leave the previous public edition unchanged.
