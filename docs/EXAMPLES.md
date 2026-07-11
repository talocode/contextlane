# Examples

## Ingest a file

```bash
contextlane ingest ./README.md
```

## Ingest a folder

```bash
contextlane ingest ./docs
```

## Ingest a URL

```bash
contextlane ingest-url https://example.com
```

## Ingest a GitHub repo

```bash
contextlane ingest-github https://github.com/talocode/gatelane
```

## Ingest and sync to MemoryLane

```bash
contextlane ingest ./README.md --sync
```

## Recall context

```bash
contextlane recall "What is this project about?"
```

## Search across all runs

```bash
contextlane search "authentication"
```

## Export a run

```bash
contextlane export ctx_20260711_ab12cd --out ./backup.json
```

## Import a run

```bash
contextlane import ./backup.json
```

## Sync to MemoryLane

```bash
contextlane sync memorylane ctx_20260711_ab12cd
```
