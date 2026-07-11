# ContextLane API

Default port: 3060

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/v1/contextlane/health` | Health check |
| GET | `/v1/contextlane/capabilities` | List capabilities |
| GET | `/v1/contextlane/pricing` | Pricing info |
| POST | `/v1/contextlane/ingest` | Ingest a source |
| POST | `/v1/contextlane/ingest/url` | Ingest a URL |
| POST | `/v1/contextlane/ingest/github` | Ingest a GitHub repo |
| GET | `/v1/contextlane/runs` | List all runs |
| GET | `/v1/contextlane/runs/:id` | Get run details |
| GET | `/v1/contextlane/runs/:id/report` | Get run report |
| GET | `/v1/contextlane/runs/:id/memory-records` | Get memory records |
| POST | `/v1/contextlane/search` | Search across runs |
| POST | `/v1/contextlane/recall` | Recall context |
| POST | `/v1/contextlane/sync/memorylane` | Sync to MemoryLane |
| POST | `/v1/contextlane/export` | Export a run |
| POST | `/v1/contextlane/import` | Import a run |

## Examples

```bash
# Ingest a file
curl -X POST http://localhost:3060/v1/contextlane/ingest \
  -H 'Content-Type: application/json' \
  -d '{"input":"./README.md","type":"file"}'
```

```bash
# Recall context
curl -X POST http://localhost:3060/v1/contextlane/recall \
  -H 'Content-Type: application/json' \
  -d '{"query":"What is this project about?","limit":3}'
```
