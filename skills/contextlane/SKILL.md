# ContextLane Skill

ContextLane is an open-source context ingestion pipeline for persistent AI agents.

## When to use ContextLane

- When you need to ingest a file, folder, URL, or GitHub repo into structured memory
- When you need to extract facts, decisions, actions, and entities from source material
- When you need citation-tracked context for an AI agent
- When you want to sync ingested context to MemoryLane for persistent recall

## When NOT to use ContextLane

- For real-time search across dynamic content (use a database)
- For binary file processing (PDF/images not supported in v0.1.0)

## Source Ingestion Rules

- Files: .md, .txt, .json, .csv, .ts, .js, .py, .go, .rs, .css, .html, .yaml, .sh, and 40+ other text extensions
- Folders: recursive with automatic ignore of node_modules/, .git/, dist/, build/, .next/, coverage/
- URLs: public URLs only, extracts readable text from HTML
- GitHub: clones depth 1, ingests README/docs/src, ignores node_modules/.git/dist/build
- Text: inline text content via type: "text"
- Max file size: 10 MB

## Citation Rules

Every chunk is tracked with:
- Source ID, file name, line range, and content quote
- Citations are linked to facts, decisions, actions, and entities
- Citations are preserved on export/import

## MemoryLane Sync Rules

- ContextLane generates MemoryLane-compatible records on every run
- Sync via HTTP (set CONTEXTLANE_MEMORYLANE_URL)
- Sync via CLI (if `memorylane` command is installed)
- If unavailable, records are saved to ~/.contextlane/runs/<runId>/memory-records.json

## GateLane Usage

```bash
gatelane servers add contextlane --type mcp-stdio --command "contextlane mcp"
gatelane tools discover
gatelane policy allow contextlane.contextlane_ingest
gatelane policy allow contextlane.contextlane_recall
```

## CLI Quickstart

```bash
contextlane ingest ./README.md
contextlane recall "What is this project about?"
contextlane runs list
```

## API Quickstart

```bash
curl -X POST http://localhost:3060/v1/contextlane/ingest \
  -H 'Content-Type: application/json' \
  -d '{"input":"./README.md","type":"file"}'
```

## MCP Quickstart

```bash
contextlane mcp
# Then connect any MCP client to stdio
```

## Safety Rules

- Do not ingest secrets or .env files
- Do not ingest private repos unless the user explicitly asks
- Do not expose API keys in output
- Warn before ingesting large folders (>100 files or >50 MB)

## Troubleshooting

- "Source not found" — check the file path
- "Source too large" — use --force or reduce file size
- "Failed to clone repo" — is git installed? Is the repo public?
- MemoryLane sync fails — set CONTEXTLANE_MEMORYLANE_URL or install memorylane CLI
