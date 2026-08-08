---
title: "AnyDoc Turns Office Files Into Fast, Local Markdown for AI Pipelines"
description: "Firecrawl’s Rust-based AnyDoc converts fourteen office and document formats into consistent Markdown, creating a fast local ingestion layer for RAG and AI agents."
publishedAt: 2026-08-05T04:08:00Z
category: open-source
tags:
  - anydoc
  - firecrawl
  - rust
  - document-parsing
  - markdown
  - rag
  - llm-data
  - agent-skills
featured: false
sources:
  - title: "Firecrawl AnyDoc repository"
    url: "https://github.com/firecrawl/anydoc"
  - title: "AnyDoc Python package"
    url: "https://pypi.org/project/firecrawl-anydoc/"
  - title: "Firecrawl Parse documentation"
    url: "https://docs.firecrawl.dev/features/parse"
  - title: "Introducing Firecrawl Parse"
    url: "https://www.firecrawl.dev/blog/introducing-parse"
  - title: "Firecrawl pdf-inspector repository"
    url: "https://github.com/firecrawl/pdf-inspector"
---

The most visible parts of the AI stack are models, agents and vector databases. One of the least glamorous parts is also one of the most expensive to get wrong: turning ordinary business documents into text that a model can actually use.

A company may have useful knowledge spread across `.docx` contracts, old `.doc` files, PowerPoint decks, Excel workbooks, EPUB manuals, CSV exports and PDFs. Each format stores structure differently. A parser that extracts only plain text can lose table relationships, list hierarchy, speaker notes, footnotes and reading order. A pipeline that depends on a collection of heavyweight converters can become slow, inconsistent and difficult to deploy.

[Firecrawl’s AnyDoc](https://github.com/firecrawl/anydoc) is an attempt to make that ingestion layer boring. It is a local, MIT-licensed Rust library that converts a broad set of office and document formats into GitHub-Flavored Markdown, with Node.js and Python bindings, a CLI and an Agent Skill. The first Python releases appeared on August 4, 2026; by the following day, the GitHub repository displayed roughly 1,100 stars.

That attention is not really about another Markdown converter. It is about a growing recognition that document normalization is becoming core infrastructure for retrieval-augmented generation, enterprise search and tool-using agents.

## “Any document” means a defined set of formats

The name is deliberately broad, but AnyDoc does not literally parse every binary file. Its current format matrix covers the document types most likely to appear in office workflows:

| Family | Supported extensions |
| --- | --- |
| Word | `.doc`, `.docx`, `.docm` |
| PowerPoint | `.ppt`, `.pps`, `.pot`, `.pptx`, `.pptm`, `.ppsx`, `.ppsm` |
| Excel | `.xls`, `.xlsx`, `.xlsm`, `.xlsb` |
| OpenDocument | `.odt`, `.ods`, `.odp` |
| Rich text | `.rtf` |
| Books | `.epub` |
| Tabular text | `.csv` |
| Documents | `.pdf` |

This coverage matters because many document tools are strongest on one modern format and weaker on legacy files. A team can parse DOCX with one library, XLSX with another, presentations with a third and PDFs through a separate OCR service, but every added engine creates different output conventions and operational failure modes.

AnyDoc’s proposition is not merely that it recognizes fourteen format variants. It is that they converge on one internal representation and one Markdown renderer.

## The shared document model is the important design decision

AnyDoc first detects the format, then sends the bytes to a format-specific parser. Word, PowerPoint, spreadsheet, OpenDocument, RTF, EPUB and CSV inputs are converted into a shared `Document` model containing blocks, inline elements, tables, footnotes and embedded assets. A single serializer then produces GitHub-Flavored Markdown.

Conceptually, the pipeline looks like this:

```text
document bytes
  |
  +--> content-based format detection
  |
  +--> format-specific parser
           |
           +--> shared Document model
                    |
                    +--> one GFM serializer
```

Text-based PDFs take a related path through Firecrawl’s open-source [pdf-inspector](https://github.com/firecrawl/pdf-inspector), which extracts positioned text and converts it to Markdown without OCR.

The benefit of the shared model is consistency. Markdown escaping, heading anchors, nested lists, table formatting and footnotes are implemented once rather than independently in every parser. A fix to the serializer can improve output across DOCX, RTF, ODT and other formats at the same time.

This sounds like an implementation detail, but it directly affects RAG quality. If the same conceptual table is serialized differently depending on whether it came from Excel or Word, downstream chunking and retrieval behavior becomes format-dependent. A normalized intermediate representation reduces that variance.

## Markdown has become the practical interchange format for LLM context

Markdown is not a lossless archival format. It cannot preserve every layout decision, animation, formula object or workbook behavior found in the source file. Its advantage is that it preserves enough visible hierarchy while remaining compact, readable and easy to split.

For an AI pipeline, that is often the right trade-off. Headings can become chunk boundaries. Lists retain relationships among steps. Tables preserve row and column associations. Links, code blocks, quotations and footnotes remain explicit. The output can be stored in Git, sent to an embedding model, indexed for search or inserted directly into an agent’s context window.

AnyDoc claims support for more structure than a basic text extractor, including:

- heading anchors and inline formatting;
- numbered, nested and task lists;
- tables with merged cells and header rows;
- internal links and cross-references;
- block quotes, footnotes and endnotes;
- PowerPoint speaker notes;
- embedded asset metadata.

Embedded images deserve a qualification. Local AnyDoc does not visually understand an image. An embedded image is represented by its available alternative text, while the original bytes remain accessible through the document model. Images with external URLs can become normal Markdown images. Extracting meaning from diagrams, screenshots or scanned pages still requires a vision or OCR stage.

## Why Rust changes the economics of ingestion

AnyDoc is written in Rust and runs locally without a model call or external conversion service. Firecrawl reports a median conversion time below five milliseconds per document in its benchmark, with a measured median of 4.7 milliseconds across the tested corpus.

The language choice is only useful if the bindings integrate cleanly into existing systems. The Node.js package runs conversion work on the libuv thread pool rather than blocking the event loop. The Python extension releases the Global Interpreter Lock during conversion, allowing other Python threads to continue. The packages also include TypeScript declarations and Python type stubs.

That makes AnyDoc suitable for more than a command-line utility. It can sit inside an upload service, a background ingestion worker or a local agent without forcing the entire application to be written in Rust.

The basic interfaces are intentionally small.

### CLI

```bash
npx @firecrawl/anydoc report.docx -o report.md
```

### Node.js

```js
import { toMarkdown } from "@firecrawl/anydoc";

const markdown = await toMarkdown("report.docx");
```

### Python

```python
import anydoc

markdown = anydoc.to_markdown("report.docx")
```

The library can also return the shared document model rather than immediately serializing Markdown, which is useful when an application needs to inspect embedded assets or implement its own downstream transformation.

## The benchmark is impressive, but it is still a vendor benchmark

The repository compares AnyDoc with LibreOffice, Unstructured, MarkItDown, Pandoc, Docling and Mammoth on 100 real-world documents covering fourteen formats. Its headline table reports:

| Tool | Format coverage | Median conversion time | Quality score |
| --- | ---: | ---: | ---: |
| AnyDoc | 14/14 | 4.7 ms | 80 |
| Pandoc | 5/14 | 102.1 ms | 57 |
| MarkItDown | 6/14 | 134.8 ms | 65 |
| Docling | 4/14 | 513.6 ms | 57 |
| Unstructured | 8/14 | 572.9 ms | 65 |
| LibreOffice | 12/14 | 1,129.5 ms | 40 |

The reported advantage is substantial: the widest format coverage, the highest aggregate quality score and an order-of-magnitude speed lead over the next-fastest listed converter.

Those results should be read with their methodology attached. The benchmark was designed and published by the AnyDoc maintainers, not an independent lab. A Claude Sonnet 5 judge compared outputs against images of the first six pages of each source document. The private corpus cannot be redistributed, so outside teams cannot reproduce the exact test set. Timing also excludes process startup for AnyDoc and the Python libraries, while command-line tools include startup because that is how they were invoked.

The repository is unusually explicit about these limitations, which makes the numbers more useful, not less. They support the conclusion that AnyDoc is fast and broad on the maintainer’s workload. They do not prove it will outperform every competitor on every document, especially files with unusual layouts, formulas, charts or damaged internal structures.

A serious adoption test should use an organization’s own documents and score the output that matters to its retrieval system: table fidelity, section boundaries, metadata retention, chunk quality and downstream answer accuracy.

## Where AnyDoc fits in a RAG pipeline

A typical retrieval pipeline has several separate stages:

```text
files
  -> format detection
  -> document parsing
  -> normalized Markdown
  -> chunking and metadata
  -> embeddings or lexical index
  -> retrieval
  -> model context
```

AnyDoc addresses the first three stages. It does not decide the optimal chunk size, generate embeddings, choose a vector database or evaluate retrieval quality. That narrow scope is part of its appeal. It can be combined with whichever indexing and model stack a team already uses.

The most obvious users are systems that receive a mixed collection of documents:

- enterprise knowledge-base ingestion;
- email attachment processing;
- contract and policy search;
- research-paper libraries;
- customer-uploaded RAG applications;
- agent workspaces that need to read local files;
- migration of document archives into Markdown repositories.

Because conversion is local and deterministic, teams can normalize documents before deciding whether any content should be sent to an external model. That is useful for privacy-sensitive workflows and for high-volume ingestion where paying for a model-assisted parser on every ordinary text document would be wasteful.

## The Agent Skill turns parsing into an agent capability

AnyDoc also ships with an Agent Skill. Installing it with:

```bash
npx skills add firecrawl/anydoc
```

teaches compatible coding agents to call the AnyDoc CLI when they encounter a supported file. The repository lists Claude Code, Codex, Cursor and OpenCode among the compatible clients.

This is a small packaging decision with larger implications. Agents are increasingly expected to work across repositories, terminals, documents and web sources. A skill gives the agent a repeatable local procedure rather than asking the model to improvise a new conversion approach for every file.

It also avoids putting the full document into a model merely to extract its text. The agent can first run a deterministic parser, inspect the smaller Markdown output and use expensive reasoning only where it adds value.

## Local AnyDoc and hosted Firecrawl Parse solve different problems

AnyDoc is also the local conversion engine behind [Firecrawl Parse](https://docs.firecrawl.dev/features/parse), but the two products are not interchangeable.

Local AnyDoc is designed for speed, offline use and deterministic extraction. It has no ML model and no external service dependency. For PDFs, that means it handles text-based files through `pdf-inspector`; it does not perform OCR on scanned pages.

The hosted Parse API adds the surrounding production service:

- file upload through an API;
- OCR fallback or forced OCR for scanned PDFs;
- Markdown, HTML, summary or schema-based JSON output;
- preservation of reading order and tables;
- files up to 50 MB per request;
- optional Zero Data Retention support.

This split creates a sensible routing strategy. Parse ordinary office documents and text PDFs locally with AnyDoc. Escalate scanned, image-heavy or layout-complex files to an OCR-capable service. The cheapest and fastest path handles the common case, while the expensive path is reserved for documents that need it.

## The limits matter as much as the speed

AnyDoc is most compelling when its boundaries are accepted.

It is not a universal file interpreter. It does not run Office macros, reproduce presentation animations or understand workbook business logic. Markdown conversion necessarily compresses visual layout. Embedded diagrams remain assets rather than fully interpreted content. Scanned PDFs need OCR elsewhere. CSV detection needs an extension or explicit format because CSV bytes have no reliable signature.

Security also deserves attention. Any parser processing untrusted binary documents becomes part of an application’s attack surface. The project uses snapshot tests, mutation tests and format-specific fuzzing targets, which are positive signs, but public upload systems should still apply file-size limits, timeouts, resource isolation and normal dependency patching.

The right comparison is therefore not “Can AnyDoc perfectly reproduce every document?” It is “Can it create sufficiently structured, predictable text for the next stage of an AI system at lower operational cost?”

## Why this project is attracting attention

AnyDoc arrived at the right point in the AI infrastructure cycle. Models have become better at using long context, but larger context windows do not eliminate the need for clean input. RAG systems still fail when headings disappear, tables are flattened incorrectly or irrelevant XML and layout noise consume tokens. Agents still need a reliable way to inspect the files sitting beside the code they are editing.

The project combines several properties developers currently value:

- open-source and MIT-licensed;
- local-first and model-agnostic;
- fast enough to use synchronously in many workflows;
- available through Rust, Node.js, Python and a CLI;
- broad support for legacy and modern office formats;
- directly useful to RAG and agent systems;
- backed by a hosted escalation path for OCR.

That is why AnyDoc feels less like a standalone conversion utility and more like a missing adapter in the AI data stack. The model may generate the answer, but the quality of that answer often begins much earlier—when an old spreadsheet, slide deck or contract is turned into context without losing the structure that made it meaningful.
