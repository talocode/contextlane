import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { createRequire } from 'node:module'
import { execSync, spawnSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const ctx = require('../dist/index.cjs')

const TMP = join(tmpdir(), `contextlane-test-${Date.now()}`)
mkdirSync(TMP, { recursive: true })

let pass = 0
let fail = 0

function assert(name, condition, detail) {
  if (condition) {
    pass++
    console.log(`  PASS  ${name}`)
  } else {
    fail++
    console.log(`  FAIL  ${name}${detail ? ': ' + detail : ''}`)
  }
}

function assertRejects(name, fn) {
  try {
    fn()
    fail++
    console.log(`  FAIL  ${name} — expected error`)
  } catch {
    pass++
    console.log(`  PASS  ${name}`)
  }
}

async function main() {

// ---------------------------------------
// Core imports
// ---------------------------------------
console.log('\nCore imports...')
assert('ingest exported', typeof ctx.ingest === 'function')
assert('loadRun exported', typeof ctx.loadRun === 'function')
assert('listRuns exported', typeof ctx.listRuns === 'function')
assert('search exported', typeof ctx.search === 'function')

// -------------------------------------------------------
// Integration: text ingestion + search + load
// -------------------------------------------------------
console.log('\nText ingestion...')
try {
  const run = await ctx.ingest({
    input: `# Test Project
This is a test project for ContextLane.
TODO: Add more tests
Decision: We chose TypeScript over JavaScript.
The project uses Node.js and React.
https://example.com/docs
`,
    type: 'text',
  })

  assert('run has id', !!run.id && run.id.startsWith('ctx_'))
  assert('run has sources', run.sources.length > 0)
  assert('run has chunks', run.chunks.length > 0)
  assert('run has extraction', !!run.extraction)
  assert('run has facts', run.extraction.facts.length > 0)
  assert('run has citations', run.extraction.citations.length > 0)
  assert('run has memory records', run.memoryRecords.length > 0)
  assert('summary is non-empty', run.extraction.summary.length > 0)

  const src = run.sources[0]
  assert('source type is text', src.type === 'text')
  assert('source has loadedAt', !!src.loadedAt)

  console.log('\nSearch...')
  const results = ctx.search('TypeScript', 3)
  assert('search returns results', results.length > 0)
  assert('search result has score', results[0].score > 0)
  assert('search result has runId', !!results[0].runId)
  assert('search result has chunk', !!results[0].chunk)

  console.log('\nExport/Import...')
  const exportPath = join(TMP, 'test-export.json')
  ctx.exportRun(run.id, exportPath)
  assert('export file exists', existsSync(exportPath))

  const imported = ctx.importRun(exportPath)
  assert('import returns run with same id', imported.id === run.id)

  console.log('\nList runs...')
  const runs = ctx.listRuns()
  assert('listRuns returns array', Array.isArray(runs))
  assert('listRuns includes our run', runs.some(r => r.id === run.id))

  console.log('\nLoad run...')
  const loaded = ctx.loadRun(run.id)
  assert('loaded run has id', loaded.id === run.id)
  assert('loaded run has sources', loaded.sources.length > 0)
  assert('loaded run has chunks', loaded.chunks.length > 0)
  assert('loaded run has extraction', !!loaded.extraction)

  console.log('\nCitations...')
  assert('citations have sourceId', run.extraction.citations.every(c => !!c.sourceId))
  assert('citations have label', run.extraction.citations.every(c => !!c.label))

  console.log('\nFacts...')
  assert('facts have id', run.extraction.facts.every(f => !!f.id))
  assert('facts have text', run.extraction.facts.every(f => !!f.text))
  assert('facts have confidence', run.extraction.facts.every(f => f.confidence > 0))

  console.log('\nDecisions...')
  assert('decision found for keyword', run.extraction.decisions.length > 0)

  console.log('\nActions...')
  assert('action found for TODO', run.extraction.actions.length > 0)

  console.log('\nEntities...')
  const urlEntity = run.extraction.entities.find(e => e.type === 'url')
  assert('URL entity extracted', !!urlEntity)

  console.log('\nMemory records...')
  assert('memory records have text', run.memoryRecords.every(r => !!r.text))
  assert('memory records have contextlane metadata', run.memoryRecords.every(r => r.metadata.contextlane === true))
  assert('memory records have tags', run.memoryRecords.every(r => r.tags.length > 0))

} catch (e) {
  console.log(`  FAIL  Integration error: ${e.message}`)
  console.error(e.stack)
  fail++
}

// -------------------------------------------------------
// Source loaders (from bundled core)
// -------------------------------------------------------
console.log('\nSource loaders...')
try {
  const testFile = join(TMP, 'test.txt')
  writeFileSync(testFile, 'hello\nworld')
  const loaded = await ctx.ingest({ input: testFile, type: 'file' })
  assert('text file ingested', loaded.chunks.length > 0)
  assert('source path matches', loaded.sources[0].path === testFile)

  writeFileSync(join(TMP, 'a.md'), '# A')
  writeFileSync(join(TMP, 'b.ts'), 'const x = 1')
  const folderRun = await ctx.ingest({ input: TMP, type: 'folder' })
  assert('folder ingested with multiple sources', folderRun.sources.length >= 2)

} catch (e) {
  console.log(`  FAIL  Source loaders: ${e.message}`)
  fail++
}

// -------------------------------------------------------
// Cloud auth
// -------------------------------------------------------
console.log('\nCloud auth...')
try {
  const { requireApiKey, isCloudMode } = require('../dist/index.cjs')

  assert('isCloudMode false by default', isCloudMode() === false)

  const oldMode = process.env.CONTEXTLANE_CLOUD_MODE
  process.env.CONTEXTLANE_CLOUD_MODE = 'true'
  assert('isCloudMode true when set', isCloudMode() === true)

  assertRejects('missing key rejected', () => {
    requireApiKey({ headers: {} })
  })

  const oldKey = process.env.TALOCODE_API_KEY
  process.env.TALOCODE_API_KEY = 'test-key-123'
  requireApiKey({ headers: { 'authorization': 'Bearer test-key-123' } })
  assert('valid Bearer key accepted', true)

  requireApiKey({ headers: { 'x-talocode-api-key': 'test-key-123' } })
  assert('valid X-Api-Key accepted', true)

  process.env.CONTEXTLANE_CLOUD_MODE = oldMode || ''
  process.env.TALOCODE_API_KEY = oldKey || ''
} catch (e) {
  console.log(`  FAIL  Auth: ${e.message}`)
  fail++
}

// -------------------------------------------------------
// Artifact store
// -------------------------------------------------------
console.log('\nArtifact store...')
try {
  const run = await ctx.ingest({ input: 'test for store', type: 'text' })
  const runs = ctx.listRuns()
  assert('run appears in listRuns', runs.some(r => r.id === run.id))
  const loaded = ctx.loadRun(run.id)
  assert('loaded run matches', loaded.id === run.id)
} catch (e) {
  console.log(`  FAIL  Artifact store: ${e.message}`)
  fail++
}

// -------------------------------------------------------
// API health
// -------------------------------------------------------
console.log('\nAPI health...')
try {
  const server = require('../dist/server.cjs')
  assert('server module loaded', typeof server.startServer === 'function')
} catch (e) {
  console.log(`  FAIL  API health: ${e.message}`)
  fail++
}

// -------------------------------------------------------
// MCP tool definitions
// -------------------------------------------------------
console.log('\nMCP tools...')
try {
  const mcp = require('../dist/mcp.cjs')
  assert('MCP module loaded', typeof mcp.startMcp === 'function')
} catch (e) {
  console.log(`  FAIL  MCP: ${e.message}`)
  fail++
}

// -------------------------------------------------------
// SDK exports
// -------------------------------------------------------
console.log('\nSDK exports...')
assert('ContextLaneClient exported', typeof ctx.ContextLaneClient === 'function')
assert('createContextLaneClient exported', typeof ctx.createContextLaneClient === 'function')

// -------------------------------------------------------
// CLI demo
// -------------------------------------------------------
console.log('\nCLI demo...')
try {
  const out = execSync('node dist/cli.cjs demo 2>&1', {
    cwd: join(__dirname, '..'),
    encoding: 'utf-8',
    timeout: 15000,
  })
  assert('CLI demo works', out.includes('Run ID:'))
} catch (e) {
  console.log(`  FAIL  CLI demo: ${e.message}`)
  fail++
}

// -------------------------------------------------------
// Cleanup
// -------------------------------------------------------
rmSync(TMP, { recursive: true, force: true })

console.log(`\n${'-'.repeat(40)}`)
console.log(`Results: ${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)

}

main().catch(e => {
  console.error('Test suite error:', e)
  process.exit(1)
})
