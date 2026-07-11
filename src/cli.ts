#!/usr/bin/env node
import { Command } from 'commander'
import {
  ingest,
  loadRun,
  listRuns,
  search,
  exportRun as doExport,
  syncToMemoryLane,
} from './core/orchestrator.js'
import { importRun } from './core/export-import.js'
import { getContextLaneHome, ensureDir, getRunsDir } from './core/config-store.js'
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'

function log(r: { ok: boolean; data?: string; error?: string }) {
  if (r.ok && r.data) console.log(r.data)
  else if (r.error) console.error(`Error: ${r.error}`)
}

async function main() {
  const program = new Command()
  program
    .name('contextlane')
    .description('Context ingestion pipeline for persistent AI agents')
    .version('0.1.0')

  program.command('init')
    .description('Initialize ContextLane config directory')
    .action(() => {
      ensureDir(getRunsDir())
      console.log(`ContextLane initialized at ${getContextLaneHome()}`)
    })

  program.command('doctor')
    .description('Check system dependencies and paths')
    .action(() => {
      console.log(`ContextLane home: ${getContextLaneHome()}`)
      console.log(`Runs dir: ${getRunsDir()}`)
      const hasGit = execSync('which git', { stdio: 'pipe' }) ? 'yes' : 'no'
      console.log(`Git available: ${hasGit}`)
      const hasMemoryLane = existsSync(execSync('which memorylane 2>/dev/null || echo ""', { stdio: 'pipe' }).toString().trim() || '')
      console.log(`MemoryLane CLI: ${hasMemoryLane ? 'available' : 'not found'}`)
      console.log(`MemoryLane URL: ${process.env.CONTEXTLANE_MEMORYLANE_URL || 'not set'}`)
      console.log(`Cloud mode: ${process.env.CONTEXTLANE_CLOUD_MODE || 'false'}`)
      console.log(`Node version: ${process.version}`)
    })

  program.command('demo')
    .description('Run a demo ingestion to show ContextLane capabilities')
    .action(async () => {
      console.log('ContextLane Demo\n')
      const demoText = `# Sample Project Context
This is a demonstration of ContextLane ingestion.
We need to implement user authentication.
TODO: Add login page
FIXME: Fix password hashing
Decision: We chose JWT over sessions.
The project uses TypeScript and React.
https://example.com/docs
@talocode/contextlane is the product.`

      console.log('Ingesting demo content...\n')
      const run = await ingest({ input: demoText, type: 'text' })
      console.log(`Run ID: ${run.id}`)
      console.log(`Sources: ${run.sources.length}`)
      console.log(`Chunks: ${run.chunks.length}`)
      console.log(`\nSummary: ${run.extraction.summary}`)
      console.log(`\nFacts (${run.extraction.facts.length}):`)
      for (const f of run.extraction.facts.slice(0, 5)) {
        console.log(`  - ${f.text.slice(0, 80)}`)
      }
      console.log(`\nDecisions (${run.extraction.decisions.length}):`)
      for (const d of run.extraction.decisions) {
        console.log(`  - [${d.status}] ${d.text.slice(0, 80)}`)
      }
      console.log(`\nActions (${run.extraction.actions.length}):`)
      for (const a of run.extraction.actions) {
        console.log(`  - [${a.priority}] ${a.text.slice(0, 80)}`)
      }
      console.log(`\nEntities (${run.extraction.entities.length}):`)
      for (const e of run.extraction.entities) {
        console.log(`  - ${e.name} (${e.type}, ${e.mentions} mentions)`)
      }
      console.log(`\nTags: ${run.extraction.tags.join(', ')}`)
      console.log(`\nMemory records: ${run.memoryRecords.length}`)
      console.log(`\nArtifacts saved to: ${getContextLaneHome()}/runs/${run.id}/`)
      console.log(`\nTo sync to MemoryLane:\n  contextlane sync memorylane ${run.id}`)
    })

  const ingestCmd = program.command('ingest')
    .description('Ingest a file, folder, or URL')
    .argument('<input>', 'File path, folder path, or URL')
    .option('--sync', 'Sync to MemoryLane after ingestion')
    .action(async (input, opts) => {
      console.log(`Ingesting: ${input}`)
      const run = await ingest({ input, syncToMemoryLane: !!opts.sync })
      console.log(`Run ID: ${run.id}`)
      console.log(`Sources: ${run.sources.length}`)
      console.log(`Chunks: ${run.chunks.length}`)
      console.log(`Facts: ${run.extraction.facts.length}`)
      console.log(`Decisions: ${run.extraction.decisions.length}`)
      console.log(`Actions: ${run.extraction.actions.length}`)
      console.log(`Entities: ${run.extraction.entities.length}`)
    })

  program.command('ingest-url')
    .description('Ingest a URL')
    .argument('<url>', 'URL to ingest')
    .option('--sync', 'Sync to MemoryLane')
    .action(async (url, opts) => {
      console.log(`Ingesting URL: ${url}`)
      const run = await ingest({ input: url, type: 'url', syncToMemoryLane: !!opts.sync })
      console.log(`Run ID: ${run.id}`)
      console.log(`Title: ${run.sources[0]?.title || 'unknown'}`)
      console.log(`Chunks: ${run.chunks.length}`)
    })

  program.command('ingest-github')
    .description('Ingest a GitHub repository')
    .argument('<repoUrl>', 'GitHub repo URL')
    .option('--sync', 'Sync to MemoryLane')
    .action(async (repoUrl, opts) => {
      console.log(`Cloning and ingesting: ${repoUrl}`)
      const run = await ingest({ input: repoUrl, type: 'github', syncToMemoryLane: !!opts.sync })
      console.log(`Run ID: ${run.id}`)
      console.log(`Files ingested: ${run.sources.length}`)
      console.log(`Chunks: ${run.chunks.length}`)
    })

  const sourcesCmd = program.command('sources')
  sourcesCmd.command('list')
    .description('List sources from the latest run')
    .action(async () => {
      const runs = listRuns()
      if (runs.length === 0) { console.log('No runs found.'); return }
      const run = loadRun(runs[0].id)
      for (const s of run.sources) {
        console.log(`${s.type.padEnd(8)} ${s.title || s.input}`)
      }
    })

  const runsCmd = program.command('runs')
  runsCmd.command('list')
    .description('List all runs')
    .action(() => {
      const runs = listRuns()
      if (runs.length === 0) { console.log('No runs found.'); return }
      for (const r of runs) {
        console.log(`${r.id.padEnd(30)} ${r.sourceCount} sources, ${r.factCount} facts (${r.createdAt})`)
      }
    })

  runsCmd.command('show')
    .description('Show details of a run')
    .argument('<runId>', 'Run ID')
    .action((runId) => {
      const run = loadRun(runId)
      console.log(`Run: ${run.id}`)
      console.log(`Created: ${run.createdAt}`)
      console.log(`Sources: ${run.sources.length}`)
      console.log(`Chunks: ${run.chunks.length}`)
      console.log(`Facts: ${run.extraction.facts.length}`)
      console.log(`Decisions: ${run.extraction.decisions.length}`)
      console.log(`Actions: ${run.extraction.actions.length}`)
      console.log(`Entities: ${run.extraction.entities.length}`)
      console.log(`Tags: ${run.extraction.tags.join(', ')}`)
    })

  program.command('search')
    .description('Search across all ingested context')
    .argument('<query>', 'Search query')
    .option('-l, --limit <n>', 'Result limit')
    .action((query, opts) => {
      const limit = parseInt(opts.limit) || 5
      const results = search(query, limit)
      if (results.length === 0) { console.log('No results found.'); return }
      for (const r of results) {
        console.log(`[${r.runId}] (score: ${r.score})`)
        console.log(`  ${r.chunk.text.slice(0, 120)}...`)
        console.log(`  ${r.chunk.citation}\n`)
      }
    })

  program.command('recall')
    .description('Recall context matching a query')
    .argument('<query>', 'Query string')
    .option('-l, --limit <n>', 'Result limit')
    .action((query, opts) => {
      const limit = parseInt(opts.limit) || 5
      const results = search(query, limit)
      if (results.length === 0) { console.log('Nothing relevant found.'); return }
      for (const r of results) {
        console.log(`[${r.runId}] ${r.chunk.text.slice(0, 200)}`)
        console.log(`  ${r.chunk.citation}\n`)
      }
    })

  program.command('sync')
    .description('Sync a run to MemoryLane')
    .command('memorylane')
    .description('Sync a run to MemoryLane')
    .argument('<runId>', 'Run ID to sync')
    .action(async (runId) => {
      const run = loadRun(runId)
      console.log(`Syncing ${run.memoryRecords.length} records to MemoryLane...`)
      const result = await syncToMemoryLane(run.memoryRecords)
      console.log(`Saved: ${result.saved}`)
      console.log(`Failed: ${result.failed}`)
      console.log(`Method: ${result.method}`)
      if (result.errors.length > 0) {
        for (const e of result.errors) console.error(`  ${e}`)
      }
    })

  program.command('export')
    .description('Export a run to a JSON file')
    .argument('<runId>', 'Run ID')
    .option('-o, --out <path>', 'Output path', 'contextlane-export.json')
    .action((runId, opts) => {
      doExport(runId, opts.out)
      console.log(`Exported ${runId} to ${opts.out}`)
    })

  program.command('import')
    .description('Import a run from a JSON file')
    .argument('<path>', 'Path to import file')
    .action((path) => {
      const run = importRun(path)
      console.log(`Imported run: ${run.id}`)
    })

  program.command('serve')
    .description('Start the local HTTP API server')
    .option('-p, --port <port>', 'Port to listen on', '3060')
    .action(async (opts) => {
      const { startServer } = await import('./server.js')
      startServer(parseInt(opts.port))
    })

  program.command('mcp')
    .description('Start the MCP server (stdio)')
    .action(async () => {
      const { startMcp } = await import('./mcp.js')
      await startMcp()
    })

  await program.parseAsync(process.argv)
}

main().catch((e) => {
  console.error(`Fatal: ${e.message}`)
  process.exit(1)
})
