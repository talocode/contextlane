import { execSync } from 'node:child_process'
import type { ContextLaneMemoryRecord } from './schema.js'

export interface SyncResult {
  saved: number
  failed: number
  errors: string[]
  method: 'http' | 'cli' | 'none'
}

export async function syncToMemoryLane(records: ContextLaneMemoryRecord[]): Promise<SyncResult> {
  const result: SyncResult = { saved: 0, failed: 0, errors: [], method: 'none' }

  const memoryLaneUrl = process.env.CONTEXTLANE_MEMORYLANE_URL

  if (memoryLaneUrl) {
    try {
      for (const record of records) {
        const res = await fetch(`${memoryLaneUrl}/v1/memorylane/memories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record),
        })
        if (res.ok) result.saved++
        else {
          result.failed++
          result.errors.push(`HTTP ${res.status}: ${await res.text()}`)
        }
      }
      result.method = 'http'
      return result
    } catch (e) {
      result.errors.push(`HTTP sync failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  try {
    execSync('which memorylane', { stdio: 'pipe' })
    for (const record of records) {
      try {
        const tags = record.tags.map(t => `--tag ${t}`).join(' ')
        execSync(`memorylane remember "${record.text.replace(/"/g, '\\"')}" ${tags} --tag contextlane`, { stdio: 'pipe', timeout: 10000 })
        result.saved++
      } catch {
        result.failed++
      }
    }
    result.method = 'cli'
    return result
  } catch {
    // memorylane CLI not available
  }

  result.method = 'none'
  result.errors.push('MemoryLane not available. Set CONTEXTLANE_MEMORYLANE_URL or install @talocode/memorylane.')
  return result
}
