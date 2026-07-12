# ContextLane

**Open-source context ingestion pipeline for persistent AI agents.**

[![PyPI version](https://img.shields.io/pypi/v/contextlane)](https://pypi.org/project/contextlane/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)

MemoryLane gives agents memory. ContextLane gives agents something worth remembering.

Turn files, folders, URLs, repos, and notes into structured context with citations — then sync to MemoryLane for persistent agent recall.

## Quick Start

```bash
pip install contextlane
contextlane demo
```

## What It Does

ContextLane ingests any source of information and extracts structured knowledge:

```
source → load → normalize → chunk → extract → cite → save → optional MemoryLane sync
```

Every ingestion run produces:
- **Summary** — high-level overview of the source
- **Key facts** — extracted statements with confidence scores
- **Decisions** — identified decisions (active/historical status)
- **Action items** — TODOs, FIXMEs, HACKs with priority levels
- **Entities** — people, projects, tools, URLs mentioned
- **Tags** — auto-generated topic tags
- **Citations** — line-level source references for every extract
- **MemoryLane records** — ready-to-sync structured memory

## Supported Sources

| Type | Examples |
|------|----------|
| File | `.md`, `.txt`, `.json`, `.pdf`, `.py`, `.ts`, `.js`, `.go`, `.rs`, `.css`, `.html`, `.yaml`, `.sh`, +40 more |
| Folder | Recursive traversal, auto-ignores `node_modules`/`.git`/`dist`/`build`/`.next` |
| URL | Public web pages, extracts readable text (strips nav, footer, ads) |
| GitHub | `git clone --depth 1`, ingests README/docs/src |
| Text | Inline text content (piped or argument) |

## CLI

```bash
contextlane --help
contextlane --version
contextlane init                    # Initialize ~/.contextlane/
contextlane doctor                  # Check dependencies
contextlane demo                    # Run demo ingestion
contextlane ingest <path>           # Ingest file/folder/URL
contextlane ingest-url <url>        # Ingest a URL
contextlane ingest-github <repo>    # Ingest GitHub repo
contextlane runs list               # List all runs
contextlane runs show <runId>       # Show run details
contextlane search <query>          # Search across all context
contextlane recall <query>          # Recall context (alias for search)
contextlane sync memorylane <runId> # Sync to MemoryLane
contextlane export <runId> -o file.json
contextlane import file.json
contextlane serve --port 3060       # Start HTTP API
```

## Python SDK

```python
from contextlane import ContextLaneClient, ingest, search

# Local SDK (direct engine, no network)
run = ingest("./README.md")
print(f"Run: {run['id']}, Facts: {len(run['extraction']['facts'])}")

# Search across all ingested runs
results = search("authentication")
for r in results:
    print(f"[{r['run_id']}] {r['chunk']['text'][:100]}...")

# Remote client (HTTP API)
client = ContextLaneClient("http://localhost:3060")
health = client.health()
runs = client.list_runs()
```

## API Server

```bash
# Start the REST API
contextlane serve --port 3060

# Ingest a file
curl -X POST http://localhost:3060/v1/contextlane/ingest \
  -H 'Content-Type: application/json' \
  -d '{"input":"./README.md"}'

# Search
curl -X POST http://localhost:3060/v1/contextlane/search \
  -H 'Content-Type: application/json' \
  -d '{"query":"What is this?"}'
```

## MemoryLane Sync

ContextLane generates MemoryLane-compatible records on every ingestion run.

Sync methods (in priority order):
1. **HTTP** → `CONTEXTLANE_MEMORYLANE_URL` env var
2. **CLI** → `memorylane` command on PATH
3. **Fallback** → `~/.contextlane/runs/<runId>/memory-records.json`

```bash
# Sync specific run
contextlane sync memorylane <runId>

# Auto-sync during ingestion
contextlane ingest ./README.md --sync
```

## Cloud Mode

Local usage is free and open-source. For hosted cloud mode:

```bash
export CONTEXTLANE_CLOUD_MODE=true
export TALOCODE_API_KEY=your_key
```

## Installation Options

### pip (recommended)
```bash
pip install contextlane
```

### From source
```bash
git clone https://github.com/talocode/contextlane.git
cd contextlane/python
pip install -e .
```

### npm (TypeScript/Node.js version)
```bash
npm install -g @talocode/contextlane
```

## Links

- **PyPI**: https://pypi.org/project/contextlane/
- **npm**: https://www.npmjs.com/package/@talocode/contextlane
- **GitHub**: https://github.com/talocode/contextlane
- **Docs**: https://docs.talocode.site

## License

MIT
