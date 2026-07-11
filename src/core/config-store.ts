import { existsSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export function getContextLaneHome(): string {
  return process.env.CONTEXTLANE_HOME || join(homedir(), '.contextlane')
}

export function getRunsDir(): string {
  const dir = join(getContextLaneHome(), 'runs')
  ensureDir(dir)
  return dir
}

export function getRunDir(runId: string): string {
  const dir = join(getRunsDir(), runId)
  ensureDir(dir)
  return dir
}

export function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}
