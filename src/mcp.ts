import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { ingest, loadRun, listRuns, search, syncToMemoryLane } from './core/orchestrator.js'

const MCP_TOOLS = [
  {
    name: 'contextlane_health',
    description: 'Check if ContextLane MCP server is running',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'contextlane_ingest',
    description: 'Ingest a file, folder, or text into structured context with citations',
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string', description: 'Path to file/folder or text content' },
        type: { type: 'string', enum: ['file', 'folder', 'url', 'github', 'text'], description: 'Source type' },
        syncToMemoryLane: { type: 'boolean', description: 'Sync to MemoryLane after ingestion' },
      },
      required: ['input'],
    },
  },
  {
    name: 'contextlane_ingest_url',
    description: 'Ingest a URL into structured context with citations',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to ingest' },
        syncToMemoryLane: { type: 'boolean' },
      },
      required: ['url'],
    },
  },
  {
    name: 'contextlane_ingest_github',
    description: 'Clone and ingest a GitHub repository into structured context',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'GitHub repo URL (e.g. https://github.com/user/repo)' },
        syncToMemoryLane: { type: 'boolean' },
      },
      required: ['url'],
    },
  },
  {
    name: 'contextlane_list_runs',
    description: 'List all context ingestion runs',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'contextlane_get_run',
    description: 'Get full details of a specific ingestion run',
    inputSchema: {
      type: 'object',
      properties: { runId: { type: 'string', description: 'Run ID (e.g. ctx_abc123_def456)' } },
      required: ['runId'],
    },
  },
  {
    name: 'contextlane_search',
    description: 'Search across all ingested context for relevant information',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Max results (default 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'contextlane_recall',
    description: 'Recall context relevant to a query from all ingested sources',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Query to recall context for' },
        limit: { type: 'number', description: 'Max results (default 5)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'contextlane_sync_memorylane',
    description: 'Sync a completed ingestion run to MemoryLane for persistent memory',
    inputSchema: {
      type: 'object',
      properties: { runId: { type: 'string', description: 'Run ID to sync' } },
      required: ['runId'],
    },
  },
  {
    name: 'contextlane_export',
    description: 'Export a run as JSON for backup or transfer',
    inputSchema: {
      type: 'object',
      properties: { runId: { type: 'string' }, outPath: { type: 'string' } },
      required: ['runId'],
    },
  },
]

const server = new Server(
  { name: 'contextlane', version: '0.1.0' },
  { capabilities: { tools: {} } },
)

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: MCP_TOOLS }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  try {
    switch (name) {
      case 'contextlane_health':
        return { content: [{ type: 'text', text: 'ContextLane MCP server is running' }] }

      case 'contextlane_ingest': {
        const run = await ingest({
          input: String(args?.input || ''),
          type: (args?.type as any) || 'text',
          syncToMemoryLane: !!args?.syncToMemoryLane,
        })
        return {
          content: [{ type: 'text', text: JSON.stringify({ runId: run.id, sources: run.sources.length, chunks: run.chunks.length, facts: run.extraction.facts.length, summary: run.extraction.summary }, null, 2) }],
        }
      }

      case 'contextlane_ingest_url': {
        const run = await ingest({ input: String(args?.url || ''), type: 'url', syncToMemoryLane: !!args?.syncToMemoryLane })
        return {
          content: [{ type: 'text', text: JSON.stringify({ runId: run.id, title: run.sources[0]?.title, chunks: run.chunks.length }, null, 2) }],
        }
      }

      case 'contextlane_ingest_github': {
        const run = await ingest({ input: String(args?.url || ''), type: 'github', syncToMemoryLane: !!args?.syncToMemoryLane })
        return {
          content: [{ type: 'text', text: JSON.stringify({ runId: run.id, files: run.sources.length, chunks: run.chunks.length, facts: run.extraction.facts.length }, null, 2) }],
        }
      }

      case 'contextlane_list_runs': {
        const runs = listRuns()
        return { content: [{ type: 'text', text: JSON.stringify(runs, null, 2) }] }
      }

      case 'contextlane_get_run': {
        const run = loadRun(String(args?.runId || ''))
        return { content: [{ type: 'text', text: JSON.stringify({ id: run.id, sources: run.sources.length, chunks: run.chunks.length, facts: run.extraction.facts.length, decisions: run.extraction.decisions.length, actions: run.extraction.actions.length, entities: run.extraction.entities.length, tags: run.extraction.tags }, null, 2) }] }
      }

      case 'contextlane_search':
      case 'contextlane_recall': {
        const results = search(String(args?.query || ''), Number(args?.limit) || 5)
        return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] }
      }

      case 'contextlane_sync_memorylane': {
        const run = loadRun(String(args?.runId || ''))
        const result = await syncToMemoryLane(run.memoryRecords)
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
      }

      case 'contextlane_export': {
        const { exportRun } = await import('./core/export-import.js')
        exportRun(String(args?.runId || ''), String(args?.outPath || 'contextlane-export.json'))
        return { content: [{ type: 'text', text: `Exported ${args?.runId} to ${args?.outPath || 'contextlane-export.json'}` }] }
      }

      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true }
    }
  } catch (e) {
    return { content: [{ type: 'text', text: `Error: ${e instanceof Error ? e.message : String(e)}` }], isError: true }
  }
})

export async function startMcp() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('ContextLane MCP server running on stdio')
}

if (process.argv[1]?.endsWith('mcp.js') || process.argv[1]?.endsWith('mcp.ts')) {
  startMcp().catch(e => { console.error('MCP error:', e); process.exit(1) })
}
