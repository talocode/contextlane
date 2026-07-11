# ContextLane CLI

## Commands

| Command | Description |
|---------|-------------|
| `contextlane --version` | Show version |
| `contextlane --help` | Show help |
| `contextlane init` | Initialize config directory |
| `contextlane doctor` | Check system dependencies |
| `contextlane demo` | Run demo ingestion |
| `contextlane ingest <path>` | Ingest file, folder, or URL |
| `contextlane ingest-url <url>` | Ingest a URL |
| `contextlane ingest-github <repoUrl>` | Ingest a GitHub repo |
| `contextlane sources list` | List sources from latest run |
| `contextlane runs list` | List all runs |
| `contextlane runs show <runId>` | Show run details |
| `contextlane search <query>` | Search across all runs |
| `contextlane recall <query>` | Recall context for a query |
| `contextlane sync memorylane <runId>` | Sync run to MemoryLane |
| `contextlane export <runId> --out <path>` | Export run as JSON |
| `contextlane import <path>` | Import run from JSON |
| `contextlane serve --port 3060` | Start local API |
| `contextlane mcp` | Start MCP server |
