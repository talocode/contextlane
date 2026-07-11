import { listRuns, loadRun } from './artifact-store.js'
import type { ContextLaneChunk } from './schema.js'

export interface SearchResult {
  runId: string
  chunk: ContextLaneChunk
  score: number
}

export function search(query: string, limit = 5): SearchResult[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  const results: SearchResult[] = []
  const runs = listRuns()

  for (const meta of runs) {
    const run = loadRun(meta.id)
    for (const chunk of run.chunks) {
      const lower = chunk.text.toLowerCase()
      const score = terms.filter(t => lower.includes(t)).length
      if (score > 0) {
        results.push({ runId: meta.id, chunk, score })
      }
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit)
}
