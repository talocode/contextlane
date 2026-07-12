# Changelog

## v0.1.0 (2026-07-11)

Initial release.

### Added
- Local-first context ingestion pipeline
- File, folder, URL, and GitHub repo source ingestion
- Deterministic knowledge extraction (facts, decisions, actions, entities, tags)
- Citation tracking with line-level references
- Local artifact storage at ~/.contextlane/runs/
- MemoryLane-compatible memory records
- Optional MemoryLane sync (HTTP or CLI)
- Search and recall across ingested context
- Export and import runs as JSON
- CLI with 15+ commands
- Local HTTP API on port 3060
- TypeScript SDK with ContextLaneClient
- MCP server with 10 tools for AI agents
- Talocode Skill for agent ingestion
- Cloud auth mode gated by TALOCODE_API_KEY
- Install scripts for Linux/macOS/Windows/Termux
- Demo mode

## v0.2.0 (2026-07-11)

### Added
- PDF ingestion support via `pdftotext` (requires poppler-utils)
- Improved URL HTML text extraction (strips nav/footer/header/aside, entity decoding, dedup)
- Cleaner build pipeline using esbuild directly (no tsup dependency)
- `isPdf()` export in SDK for detecting PDF files
- Better error messages for missing external dependencies

### Fixed
- Build pipeline no longer requires tsup (esbuild used directly)
- URL content quality improved with smarter HTML stripping
- Package.json scripts work without npm install hanging
