# URL to Memory

```bash
contextlane ingest-url https://example.com

# Recall what was found
contextlane recall "example"

# Export the run
contextlane runs list
contextlane export <runId> --out example-export.json
```
