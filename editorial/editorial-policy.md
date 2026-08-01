# ASHFOG Daily editorial policy

## Mission

Publish one clear English-language daily brief covering AI, open source, developer tools, infrastructure, research, policy, and relevant community activity. Preserve breadth and let readers decide what matters to them.

## Time and source coverage

- Run at 09:30 in `America/New_York`.
- Use the exact half-open 24-hour window `(windowStartAt, cutoffAt]`.
- Attempt every registered source on every run, including every China and community source.
- Follow a source's ordered fallbacks until a route yields in-scope entries or every route has been attempted. A working broad feed with zero in-scope entries does not suppress a narrower fallback.
- Keep at most the newest 15 in-window entries per source and never backfill outside the window.
- Record one `research.sourceScan` row per source. A failed source is recorded as `unavailable` and does not block publication.
- Write in English while preserving each selected entry's collected source URL, region, and source language.

## One-pass relevance and event deduplication

Process all in-window entries once:

1. Discard only entries clearly outside AI, open source, developer tools, infrastructure, research, policy, or relevant community activity.
2. Group reports about the same underlying event by content, not by URL.
3. Publish one signal per event under one `eventId`.
4. Prefer the official announcement, repository, paper, specification, model card, or policy page when the event group contains one.
5. Attach useful reactions, tests, adoption reports, or maintainer clarifications to that signal as `communityVoices` instead of duplicating the event.

Do not score importance or materiality. Do not exclude a valid independent event because it is small, marketing-oriented, regionally concentrated, or less useful to a particular reader. Do not enforce company, ecosystem, media, regional, or story-count quotas.

If more than 46 independent events remain, keep the newest 46 by the timestamp that placed the event inside the window.

## Article structure

After the signal list is locked, turn the edition into one coherent article:

1. Write an original 6–14 word edition `title` that summarizes the common direction across the day's selected events. Never use `ASHFOG Daily`, a date, or an issue number as the title. Do not reduce a multi-event edition to one company's announcement.
2. Write a 150–250 word editor's synthesis of the day's overall direction. Its title may be more interpretive, but it must support the same central theme as the edition title.
3. Group related signals into 4–7 internal sections when the day's volume supports it. A quiet day may use fewer sections. These are article subheadings, never separate homepage entries or separate articles.
4. Write the sections as one continuous editorial article. Explain what changed, connect related events, and describe the practical consequence without ranking events by importance.
5. Reference every theme's supporting signal IDs. Place community voices with the theme they illuminate.
6. Put valid signals that do not fit a coherent theme in `otherSignalIds`; they remain visible with their source links.
7. Target 1,500–2,500 English words for a normal edition. Treat this as a readability target, not a reason to invent padding on a quiet day.

Every selected signal must appear exactly once, either in one article section or in `otherSignalIds`.

Each edition uses exactly one editorial image. Astro selects it from the committed article-image library using a stable date-based rotation, so rebuilds do not change the image and consecutive editions do not repeat until the pool cycles. Do not assign images to individual signals or internal sections.

## Links

Preserve the collected source URL exactly as supplied after confirming offline that it is an absolute HTTP or HTTPS URL. Do not make a second request, validate reachability, inspect the host, resolve redirects, or block an edition because a remote server is slow or unavailable.

## Writing

For every selected event, write an original English headline and concise factual `brief`. The article carries the explanation and practical consequences, so do not repeat a separate long summary and `whyItMatters` for every signal. Paraphrase collected sources and preserve uncertainty without inventing facts.

Do not generate importance scores, factual-claim ledgers, exclusion ledgers, or materiality explanations. Generate the article only after the final signal list is locked, use real paragraph breaks, and reference current signal IDs.

## Copyright and privacy

Paraphrase sources, quote only brief wording when necessary, do not reproduce full or paywalled works, avoid unnecessary usernames, and never bypass authentication, paywalls, access controls, robots restrictions, or rate limits.
