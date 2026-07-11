# ContextLane SDK

## Installation

```bash
npm install @talocode/contextlane
```

## Usage

```typescript
import { ContextLaneClient } from '@talocode/contextlane'

// Local mode
const client = new ContextLaneClient({
  baseUrl: 'http://localhost:3060',
})

// Cloud mode
const cloudClient = new ContextLaneClient({
  baseUrl: 'https://api.talocode.com',
  apiKey: process.env.TALOCODE_API_KEY,
})

// Ingest a source
const run = await client.ingest({
  input: './README.md',
  type: 'file',
})

// Recall context
const results = await client.recall({
  query: 'What is this project about?',
  limit: 5,
})
```

## Methods

- `health()` - Health check
- `capabilities()` - List capabilities  
- `ingest(req)` - Ingest a source
- `ingestUrl(url)` - Ingest a URL
- `ingestGithub(repoUrl)` - Ingest a GitHub repo
- `listRuns()` - List all runs
- `getRun(id)` - Get run details
- `getReport(id)` - Get run report
- `getMemoryRecords(id)` - Get memory records
- `search(query)` - Search context
- `recall(query)` - Recall context
- `syncMemoryLane(runId)` - Sync to MemoryLane
- `exportRun(runId)` - Export run
- `importRun(path)` - Import run

## Direct imports

```typescript
import { ingest, loadRun, listRuns, search } from '@talocode/contextlane'
```
