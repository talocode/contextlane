import { execSync } from 'node:child_process'
import { existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadFolder } from './folder-loader.js'

export interface LoadedGitHub {
  repo: string
  items: { path: string; relativePath: string; text: string; lines: string[]; ext: string }[]
  cloneDir: string
}

export function loadGitHub(repoUrl: string): LoadedGitHub {
  const repoName = repoUrl.replace(/\.git$/, '').split('/').slice(-2).join('/')
  const cloneDir = mkdtempSync(join(tmpdir(), 'ctxlane-'))

  try {
    execSync(`git clone --depth 1 ${repoUrl} "${cloneDir}"`, { stdio: 'pipe', timeout: 60000 })
  } catch {
    throw new Error(`Failed to clone repo: ${repoUrl}. Is git installed?`)
  }

  const items = loadFolder(cloneDir)

  return { repo: repoName, items, cloneDir }
}
