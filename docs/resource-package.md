# Learn with Rich resource packages

Resource packages are ZIP files for creating one resource or a related set of resources in the owner studio. The format is intended to be easy for people and LLMs to author. A package is a content interchange format; it does not contain database IDs, credentials, publication commands, or executable importer code.

## ZIP layout

```text
my-resource.zip
├── manifest.json
└── files/
    ├── cover.jpg
    └── worksheet.pdf
```

The ZIP must contain exactly one `manifest.json` at its root. `files` is optional. File paths in the manifest are relative to the ZIP root, use `/` separators, and must stay inside the package. The format schema is [`resource-package.schema.json`](resource-package.schema.json). Examples are in [`resource-package-examples/`](resource-package-examples/). [`all-resource-types.json`](resource-package-examples/all-resource-types.json) is a complete manifest with one example of every resource type and valid course/path links; its `example.com` URLs are placeholders to replace.

## Manifest format

The manifest has `format: "learnwithrich-resource"`, `version: 1`, and a non-empty `resources` array. A package with one entry creates one resource; a package with more entries creates a bundle. Each resource has a unique, package-local `key`; course and path item lists use those keys to link resources without knowing database IDs.

Required resource fields are `key`, `type`, `title`, and `slug`. The `type` is one of `PROJECT`, `ARTICLE`, `COURSE`, `PATH`, `LESSON`, `DOWNLOAD`, `BOOK`, `GUIDE`, or `ILLUSTRATION`. `summary`, `bodyMarkdown`, `tags`, and `details` are optional and default to an empty string, empty string, empty list, and empty object, matching the existing draft editor. Other optional fields are `access` (`PUBLIC`, `FREE_ACCOUNT`, or `PAID`), `priceMinor`, `currency`, `cover`, `attachments`, `sections`, and `items`. A ZIP with one resource is a single-resource import; a ZIP with multiple entries is a bundle. Package keys and slugs must be unique, and every collection item/section reference must resolve within the package. Import may create an incomplete draft; preview must show the same publishing-readiness issues the existing editor shows.

`details` uses exactly the following fields for each resource type. The nine `_sectionTitle...` properties are optional editor heading overrides accepted on every type; each is a non-empty string of at most 80 characters. Number details are positive whole numbers; list details have up to 30 non-empty entries of at most 500 characters each; other text details are at most 1,000 characters; URL details are at most 2,048 characters.

| Type | Allowed `details` fields |
| --- | --- |
| `PROJECT` | `difficulty` (`Beginner`, `Intermediate`, `Advanced`), `durationMinutes` (max 100,000), `outcomes`, `prerequisites`, `materials`, `repositoryUrl`, `demoUrl` |
| `ARTICLE` | `author`, `readingMinutes` (max 10,000), `audioUrl`, `sourceUrl` |
| `COURSE` | `difficulty`, `durationMinutes` (max 100,000), `outcomes`, `prerequisites` |
| `PATH` | `difficulty`, `durationMinutes` (max 100,000), `outcomes`, `prerequisites` |
| `LESSON` | `durationMinutes` (max 100,000), `outcomes`, `audioUrl`, `videoUrl` |
| `DOWNLOAD` | `fileUrl`, `fileName`, `fileFormat`, `version`, `license` |
| `BOOK` | `fileUrl`, `author`, `audioUrl`, `isbn`, `pageCount` (max 100,000), `edition`, `license` |
| `GUIDE` | `difficulty`, `durationMinutes` (max 100,000), `outcomes`, `prerequisites`, `fileUrl`, `audioUrl` |
| `ILLUSTRATION` | `fileUrl`, `fileFormat`, `altText`, `width` (max 100,000), `height` (max 100,000), `license` |

The schema describes these per-type fields; the importer must also call the existing resource validation, publishing-readiness rules, and collection validation rather than trusting JSON Schema alone. Omitted access defaults to `PUBLIC`; price defaults to zero; currency defaults to `GHS`. Paid resources need a positive `priceMinor`; other access modes must have a zero price. Tags are trimmed, lowercased, and deduplicated by the same normalizer as the editor. Imports always create drafts. Publishing readiness is separate: `PROJECT` and `ARTICLE` need body content; `LESSON` needs body content or `videoUrl`; `GUIDE` needs body content or `fileUrl`; `DOWNLOAD`, `BOOK`, and `ILLUSTRATION` need `details.fileUrl` (and illustrations need `altText`); courses and paths need at least one child; all types need a summary.

For `COURSE` and `PATH`, `sections` is an ordered array of `{ "key", "title" }`; `items` is the ordered list of `{ "resource": "resource-key", "section": "section-key" }`. `section` may be omitted or null. Courses contain lessons only; paths may contain any resource type. A resource can occur once in a collection, sections only belong to collections, and collection links must not form cycles. Item references may point to resources inside this package. The initial importer should reject references to existing catalog resources: portable packages cannot rely on site-specific records, and the importer should not guess a match by slug. These cross-resource constraints cannot be fully expressed by JSON Schema and must be checked by the importer.

`cover` and attachment `path` use ZIP-relative file paths under `files/`. They may not be external URLs. Markdown may refer to an included image or media file with `package-file:files/example.png`, for example `![Circuit diagram](package-file:files/circuit.png)`. External Markdown links and URL-valued details such as `fileUrl`, `repositoryUrl`, `demoUrl`, `sourceUrl`, `videoUrl`, and `audioUrl` may use HTTPS URLs. URL-valued details may instead use `package-file:files/example.ext`. The importer must verify a local path exists, import the media, and rewrite package references to the site's media-library reference. Every local media asset referenced by a detail or Markdown must also be linked to that resource so the existing resource media delivery route can enforce access and file pricing. HTTPS URLs must not contain embedded usernames or passwords. Non-HTTPS external links are rejected. The package format does not fetch remote files; external attachments are not supported.

Attachments have `{ "path", "title" }`; an optional `priceMinor` can set an individual attachment price for non-paid resources. Repeating the same path in a resource's attachment list is invalid; one imported asset may still be referenced by its `cover`, `details`, and Markdown. An attachment is a separate downloadable media-library item; it does not populate `details.fileUrl`. For types whose publishing checks require `details.fileUrl`, set that field too, using the same package file path (or an external HTTPS URL). The media library accepts JPEG, PNG, WebP, GIF, AVIF, PDF, DOC, DOCX, ZIP, MP3, M4A, WAV, OGG, MP4, WebM, Markdown, plain text, CSV, JSON, YAML, XML, TOML, and common Python, JavaScript, TypeScript, HTML, CSS, C/C++, Arduino, and shell source files after checking their contents, with a 50 MB per-file limit. SVG is accepted as an `application/octet-stream` download and is not available as a cover or inline image. ZIP archives are stored as files; the media library does not extract them. Resource package preview accepts ZIP files up to 100 MB, at most 500 entries, and up to 250 MB expanded content; nested media files must still be 50 MB or smaller.

## Import behavior

The owner studio's **Upload ZIP** screen first posts packages to an owner-only preview endpoint. Preview shows resource summaries, publication-readiness issues, included files and their references, and warnings for unreferenced files. Duplicate keys/slugs, existing slugs, missing files, invalid details, unsupported referenced files, unsafe ZIP paths, excessive ZIP expansion, and broken or circular collection references block import. Resource packages use standard ZIP store/deflate compression; encrypted and ZIP64 archives are not supported.

On confirmation, the importer uploads referenced media and creates all resources as drafts. Resource rows, content, tags, sections, collection items, media links, and audit snapshots are committed in one owner-authorized database transaction. If storage or database creation fails, newly uploaded objects are deleted and no partial bundle is committed. Existing slugs are conflicts; version 1 does not overwrite or update existing resources. Publishing remains a separate owner action in the existing editor. Each imported resource can be opened from the completion list to review its draft content and readiness before publishing.

## Authoring checklist

- Make every `key` unique within the package and every `slug` unique within the package.
- Keep slugs lowercase and hyphenated.
- Include a useful summary, complete body content, and the correct type-specific `details`.
- For courses and paths, order items in `items` and use local resource keys; use sections only for grouping.
- Put local media under `files/` and reference it with a ZIP-relative path or `package-file:` in Markdown.
- Use HTTPS for external resources.
- Do not include secrets, executable code intended to run during import, or assumptions about the destination site's database IDs.
