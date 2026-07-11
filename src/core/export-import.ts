import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import type { ContextLaneRun } from './schema.js'
import { loadRun, saveRun } from './artifact-store.js'

export function exportRun(runId: string, outPath: string): void {
  const run = loadRun(runId)
  writeFileSync(outPath, JSON.stringify(run, null, 2))
}

export function importRun(inPath: string): ContextLaneRun {
  if (!existsSync(inPath)) throw new Error(`File not found: ${inPath}`)
  const run: ContextLaneRun = JSON.parse(readFileSync(inPath, 'utf-8'))
  saveRun(run)
  return run
}
