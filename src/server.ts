import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { ingest, loadRun, listRuns, search, exportRun, syncToMemoryLane } from './core/orchestrator.js'
import { importRun } from './core/export-import.js'
import { requireApiKey } from './core/auth.js'

function parseBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk: Buffer) => { body += chunk.toString() })
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')) }
      catch { resolve({}) }
    })
  })
}

function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify(data))
}

function sendText(res: ServerResponse, status: number, text: string) {
  res.writeHead(status, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' })
  res.end(text)
}

function corsHeaders(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Api-Key')
}

async function handler(req: IncomingMessage, res: ServerResponse) {
  corsHeaders(res)
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  const path = url.pathname.replace(/\/+$/, '')

  if (path === '/health') return sendJson(res, 200, { status: 'ok' })
  if (path === '/v1/contextlane/health') return sendJson(res, 200, { status: 'ok' })
  if (path === '/v1/contextlane/capabilities') return sendJson(res, 200, { sources: ['file', 'folder', 'url', 'github', 'text'], version: '0.1.0' })
  if (path === '/v1/contextlane/pricing') return sendJson(res, 200, { local: 'free', cloud: 'per-ingestion' })

  if (req.method === 'POST' && path === '/v1/contextlane/ingest') {
    try { requireApiKey(req) } catch (e) { return sendJson(res, 401, { error: 'Unauthorized' }) }
    const body = await parseBody(req)
    const run = await ingest({ input: String(body.input || ''), type: body.type as any, syncToMemoryLane: !!body.syncToMemoryLane })
    return sendJson(res, 200, run)
  }

  if (req.method === 'POST' && path === '/v1/contextlane/ingest/url') {
    try { requireApiKey(req) } catch (e) { return sendJson(res, 401, { error: 'Unauthorized' }) }
    const body = await parseBody(req)
    const run = await ingest({ input: String(body.url || ''), type: 'url', syncToMemoryLane: !!body.syncToMemoryLane })
    return sendJson(res, 200, run)
  }

  if (req.method === 'POST' && path === '/v1/contextlane/ingest/github') {
    try { requireApiKey(req) } catch (e) { return sendJson(res, 401, { error: 'Unauthorized' }) }
    const body = await parseBody(req)
    const run = await ingest({ input: String(body.url || ''), type: 'github', syncToMemoryLane: !!body.syncToMemoryLane })
    return sendJson(res, 200, run)
  }

  if (path === '/v1/contextlane/runs') {
    try { requireApiKey(req) } catch (e) { return sendJson(res, 401, { error: 'Unauthorized' }) }
    return sendJson(res, 200, listRuns())
  }

  const runMatch = path.match(/^\/v1\/contextlane\/runs\/([^/]+)$/)
  if (runMatch) {
    try { requireApiKey(req) } catch (e) { return sendJson(res, 401, { error: 'Unauthorized' }) }
    try {
      const run = loadRun(runMatch[1])
      return sendJson(res, 200, run)
    } catch (e) { return sendJson(res, 404, { error: 'Run not found' }) }
  }

  const reportMatch = path.match(/^\/v1\/contextlane\/runs\/([^/]+)\/report$/)
  if (reportMatch) {
    try { requireApiKey(req) } catch (e) { return sendJson(res, 401, { error: 'Unauthorized' }) }
    try {
      const run = loadRun(reportMatch[1])
      return sendText(res, 200, `Run: ${run.id}\nSummary: ${run.extraction.summary}\nFacts: ${run.extraction.facts.length}\nDecisions: ${run.extraction.decisions.length}\nActions: ${run.extraction.actions.length}`)
    } catch (e) { return sendJson(res, 404, { error: 'Run not found' }) }
  }

  const memMatch = path.match(/^\/v1\/contextlane\/runs\/([^/]+)\/memory-records$/)
  if (memMatch) {
    try { requireApiKey(req) } catch (e) { return sendJson(res, 401, { error: 'Unauthorized' }) }
    try {
      const run = loadRun(memMatch[1])
      return sendJson(res, 200, run.memoryRecords)
    } catch (e) { return sendJson(res, 404, { error: 'Run not found' }) }
  }

  if (req.method === 'POST' && path === '/v1/contextlane/search') {
    try { requireApiKey(req) } catch (e) { return sendJson(res, 401, { error: 'Unauthorized' }) }
    const body = await parseBody(req)
    const results = search(String(body.query || ''), Number(body.limit) || 5)
    return sendJson(res, 200, results)
  }

  if (req.method === 'POST' && path === '/v1/contextlane/recall') {
    try { requireApiKey(req) } catch (e) { return sendJson(res, 401, { error: 'Unauthorized' }) }
    const body = await parseBody(req)
    const results = search(String(body.query || ''), Number(body.limit) || 5)
    return sendJson(res, 200, results)
  }

  if (req.method === 'POST' && path === '/v1/contextlane/sync/memorylane') {
    try { requireApiKey(req) } catch (e) { return sendJson(res, 401, { error: 'Unauthorized' }) }
    const body = await parseBody(req)
    const run = loadRun(String(body.runId || ''))
    const result = await syncToMemoryLane(run.memoryRecords)
    return sendJson(res, 200, result)
  }

  if (req.method === 'POST' && path === '/v1/contextlane/export') {
    try { requireApiKey(req) } catch (e) { return sendJson(res, 401, { error: 'Unauthorized' }) }
    const body = await parseBody(req)
    exportRun(String(body.runId || ''), String(body.outPath || 'contextlane-export.json'))
    return sendJson(res, 200, { exported: body.runId })
  }

  if (req.method === 'POST' && path === '/v1/contextlane/import') {
    try { requireApiKey(req) } catch (e) { return sendJson(res, 401, { error: 'Unauthorized' }) }
    const body = await parseBody(req)
    const run = importRun(String(body.path || ''))
    return sendJson(res, 200, { imported: run.id })
  }

  sendJson(res, 404, { error: 'Not found' })
}

export function startServer(port = 3060) {
  const server = createServer(handler)
  server.listen(port, () => {
    console.log(`ContextLane API running at http://localhost:${port}`)
  })
}

if (process.argv[1]?.endsWith('server.js') || process.argv[1]?.endsWith('server.ts')) {
  const port = parseInt(process.env.PORT || '3060')
  startServer(port)
}
