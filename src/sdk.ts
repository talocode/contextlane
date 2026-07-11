import type {
  ContextLaneRun,
  ContextLaneRunMeta,
  ContextLaneExtraction,
  ContextLaneMemoryRecord,
} from './core/schema.js'
import type { SearchResult } from './core/search.js'

export interface ClientOptions {
  baseUrl: string
  apiKey?: string
}

export interface IngestRequest {
  input: string
  type?: 'file' | 'folder' | 'url' | 'github' | 'text'
  syncToMemoryLane?: boolean
}

export interface RecallRequest {
  query: string
  limit?: number
}

export class ContextLaneClient {
  private baseUrl: string
  private headers: Record<string, string>

  constructor(opts: ClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '')
    this.headers = { 'Content-Type': 'application/json' }
    if (opts.apiKey) {
      this.headers['Authorization'] = `Bearer ${opts.apiKey}`
    }
  }

  async health(): Promise<{ status: string }> {
    const res = await fetch(`${this.baseUrl}/health`)
    return res.json()
  }

  async capabilities(): Promise<Record<string, unknown>> {
    const res = await fetch(`${this.baseUrl}/v1/contextlane/capabilities`)
    return res.json()
  }

  async ingest(req: IngestRequest): Promise<ContextLaneRun> {
    const res = await fetch(`${this.baseUrl}/v1/contextlane/ingest`, {
      method: 'POST', headers: this.headers, body: JSON.stringify(req),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  async ingestUrl(url: string, syncToMemoryLane?: boolean): Promise<ContextLaneRun> {
    return this.ingest({ input: url, type: 'url', syncToMemoryLane })
  }

  async ingestGithub(repoUrl: string, syncToMemoryLane?: boolean): Promise<ContextLaneRun> {
    return this.ingest({ input: repoUrl, type: 'github', syncToMemoryLane })
  }

  async listRuns(): Promise<ContextLaneRunMeta[]> {
    const res = await fetch(`${this.baseUrl}/v1/contextlane/runs`, { headers: this.headers })
    return res.json()
  }

  async getRun(id: string): Promise<ContextLaneRun> {
    const res = await fetch(`${this.baseUrl}/v1/contextlane/runs/${id}`, { headers: this.headers })
    return res.json()
  }

  async getReport(id: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/v1/contextlane/runs/${id}/report`, { headers: this.headers })
    return res.text()
  }

  async getMemoryRecords(id: string): Promise<ContextLaneMemoryRecord[]> {
    const res = await fetch(`${this.baseUrl}/v1/contextlane/runs/${id}/memory-records`, { headers: this.headers })
    return res.json()
  }

  async search(query: string, limit = 5): Promise<SearchResult[]> {
    const res = await fetch(`${this.baseUrl}/v1/contextlane/search`, {
      method: 'POST', headers: this.headers, body: JSON.stringify({ query, limit }),
    })
    return res.json()
  }

  async recall(query: string, limit = 5): Promise<SearchResult[]> {
    return this.search(query, limit)
  }

  async syncMemoryLane(runId: string): Promise<{ saved: number; failed: number; method: string }> {
    const res = await fetch(`${this.baseUrl}/v1/contextlane/sync/memorylane`, {
      method: 'POST', headers: this.headers, body: JSON.stringify({ runId }),
    })
    return res.json()
  }

  async exportRun(runId: string, outPath: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/v1/contextlane/export`, {
      method: 'POST', headers: this.headers, body: JSON.stringify({ runId, outPath }),
    })
    if (!res.ok) throw new Error(await res.text())
  }

  async importRun(dataPath: string): Promise<ContextLaneRun> {
    const res = await fetch(`${this.baseUrl}/v1/contextlane/import`, {
      method: 'POST', headers: this.headers, body: JSON.stringify({ path: dataPath }),
    })
    return res.json()
  }
}

export function createContextLaneClient(opts: ClientOptions): ContextLaneClient {
  return new ContextLaneClient(opts)
}
