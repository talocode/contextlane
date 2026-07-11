# ContextLane MCP

## Starting the MCP server

```bash
contextlane mcp
```

## Available Tools

| Tool | Description |
|------|-------------|
| `contextlane_health` | Check if MCP server is running |
| `contextlane_ingest` | Ingest a file/folder/text into structured context |
| `contextlane_ingest_url` | Ingest a URL into structured context |
| `contextlane_ingest_github` | Clone and ingest a GitHub repo |
| `contextlane_list_runs` | List all ingestion runs |
| `contextlane_get_run` | Get details of a specific run |
| `contextlane_search` | Search across all ingested context |
| `contextlane_recall` | Recall context relevant to a query |
| `contextlane_sync_memorylane` | Sync a run to MemoryLane |
| `contextlane_export` | Export a run as JSON |

## GateLane Integration

```bash
gatelane servers add contextlane --type mcp-stdio --command "contextlane mcp"
gatelane tools discover
gatelane policy allow contextlane.contextlane_ingest
gatelane policy allow contextlane.contextlane_recall
```
