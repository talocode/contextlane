# Supported Source Types

| Type | Description |
|------|-------------|
| file | Single local file (.md, .txt, .json, .csv, .ts, .js, etc.) |
| folder | Recursive folder ingestion (ignores node_modules/, .git/, dist/) |
| url | Public URL with HTML text extraction |
| github | GitHub repo URL (clones depth 1, ingests README/docs/src) |
| text | Inline text content |

## Folder Ignore Rules

Automatically skipped: node_modules/, .git/, dist/, build/, .next/, coverage/, .contextlane/

File size limit: 10 MB (override with --force)

Binary files are automatically skipped.
