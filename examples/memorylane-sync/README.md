# MemoryLane Sync

```bash
# Ingest content
contextlane ingest ./README.md

# List runs to get the run ID
contextlane runs list

# Sync to MemoryLane (if available)
contextlane sync memorylane <runId>

# If MemoryLane is not available, records are saved locally:
# ~/.contextlane/runs/<runId>/memory-records.json
```
