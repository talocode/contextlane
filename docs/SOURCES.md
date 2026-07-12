# Supported Source Types

| Type | Description |
|------|-------------|
| file | Single local file (.md, .txt, .json, .csv, .ts, .js, etc.) |
| folder | Recursive folder ingestion (ignores node_modules/, .git/, dist/) |
| url | Public URL with HTML text extraction |
| github | GitHub repo URL (clones depth 1, ingests README/docs/src) |
| text | Inline text content |

## PDF Support

PDF files (.pdf) are supported via `pdftotext` from poppler-utils.

Install poppler-utils:
- macOS: `brew install poppler`
- Linux: `apt-get install poppler-utils`
- Windows: `choco install poppler`

If `pdftotext` is not available, a clear error message is shown.
PDFs over 50 MB are rejected unless --force is passed.

## Folder Ignore Rules

Automatically skipped: node_modules/, .git/, dist/, build/, .next/, coverage/, .contextlane/

File size limit: 10 MB for text files, 50 MB for PDFs (override with --force)

Binary files are automatically skipped.
