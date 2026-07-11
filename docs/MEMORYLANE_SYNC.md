# MemoryLane Sync

ContextLane automatically generates MemoryLane-compatible records during every ingestion run.

## Sync Methods

### 1. HTTP Sync (recommended)

Set CONTEXTLANE_MEMORYLANE_URL:

```bash
export CONTEXTLANE_MEMORYLANE_URL=http://localhost:3040
contextlane sync memorylane <runId>
```

### 2. CLI Fallback

If the `memorylane` CLI is installed, ContextLane will use it:

```bash
contextlane sync memorylane <runId>
```

### 3. Local Artifacts

If MemoryLane is unavailable, `memory-records.json` is saved in the run's artifact folder:

```
~/.contextlane/runs/<runId>/memory-records.json
```

## Record Format

Each memory record includes:

- Text content
- Tags (including 'contextlane')
- Source citation
- Run metadata
- Importance score
