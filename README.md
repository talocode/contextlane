# ContextLane

**Open-source context ingestion pipeline for persistent AI agents.**

MemoryLane gives agents memory. ContextLane gives agents something worth remembering.

Turn files, folders, URLs, repos, and notes into structured context with citations — then sync to MemoryLane for persistent agent recall.

## Install

### npm (TypeScript / Node.js)
```bash
npm install -g @talocode/contextlane
contextlane demo
```

### pip (Python)
```bash
pip install contextlane
contextlane demo
```

## Quick Usage

```bash
# Ingest a file
contextlane ingest ./README.md

# Ingest a URL
contextlane ingest-url https://example.com

# Ingest a GitHub repo
contextlane ingest-github https://github.com/talocode/gatelane

# Recall what you ingested
contextlane recall "What is this project about?"

# Search across all context
contextlane search "authentication"

# Sync to MemoryLane (optional)
contextlane sync memorylane <runId>
```

## How It Works

```
source → load → normalize → chunk → extract → cite → save → optional MemoryLane sync
```

Extracted from every run:
- Summary
- Key facts (with confidence scores)
- Decisions (active/historical)
- Action items (with priority)
- Entities (people, projects, tools, URLs)
- Tags
- Line-level citations
- MemoryLane-compatible records

## Supported Sources

| Type | Examples |
|------|----------|
| File | .md, .txt, .json, .csv, .pdf, .ts, .js, .py, .go, .rs, .css, .html, .yaml, .sh, +40 more |
| Folder | Recursive, auto-ignores node_modules/.git/dist/build/.next/coverage |
| URL | Public URLs, extracts readable text from HTML |
| GitHub | Clones depth 1, ingests README/docs/src |
| Text | Inline text content |

## CLI

```bash
contextlane --version
contextlane --help
contextlane init
contextlane doctor
contextlane ingest <path>
contextlane ingest-url <url>
contextlane ingest-github <repoUrl>
contextlane runs list
contextlane runs show <runId>
contextlane search <query>
contextlane recall <query>
contextlane sync memorylane <runId>
contextlane export <runId> --out export.json
contextlane import export.json
contextlane serve --port 3060
contextlane mcp
```

## API

Default port: 3060

```bash
# Ingest a file
curl -X POST http://localhost:3060/v1/contextlane/ingest \
  -H 'Content-Type: application/json' \
  -d '{"input":"./README.md","type":"file"}'

# Recall
curl -X POST http://localhost:3060/v1/contextlane/recall \
  -H 'Content-Type: application/json' \
  -d '{"query":"What is this project about?"}'
```

## SDK

### TypeScript
```typescript
import { ContextLaneClient } from '@talocode/contextlane'

const client = new ContextLaneClient({ baseUrl: 'http://localhost:3060' })
const run = await client.ingest({ input: './README.md', type: 'file' })
const recall = await client.recall({ query: 'What is this?' })
```

### Python
```python
from contextlane import ContextLaneClient

client = ContextLaneClient('http://localhost:3060')
run = client.ingest('./README.md')
results = client.search('What is this?')
```

## MCP

```bash
contextlane mcp
```

10 MCP tools for AI agents: ingest, search, recall, sync to MemoryLane, and more.

## MemoryLane Sync

ContextLane generates MemoryLane-compatible records on every ingestion run.

Sync methods (in priority order):
1. HTTP → `CONTEXTLANE_MEMORYLANE_URL`
2. CLI → `memorylane` command
3. Fallback → `~/.contextlane/runs/<runId>/memory-records.json`

## Cloud Auth

Local usage is open-source and keyless. Talocode Cloud mode is gated by `TALOCODE_API_KEY`.

```bash
export CONTEXTLANE_CLOUD_MODE=true
export TALOCODE_API_KEY=your_key_here
```

## GateLane Integration

```bash
gatelane servers add contextlane --type mcp-stdio --command "contextlane mcp"
gatelane tools discover
gatelane policy allow contextlane.contextlane_ingest
gatelane policy allow contextlane.contextlane_recall
```

## Links

- npm: [@talocode/contextlane](https://www.npmjs.com/package/@talocode/contextlane)
- PyPI: [contextlane](https://pypi.org/project/contextlane/)
- GitHub: [github.com/talocode/contextlane](https://github.com/talocode/contextlane)
- Docs: [docs/](docs/)

## License

MIT
