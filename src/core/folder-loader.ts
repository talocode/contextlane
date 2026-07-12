import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { loadFile, isTextFile } from './file-loader.js'

const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.contextlane'])
const IGNORE_FILES = new Set(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.DS_Store'])

export interface LoadedFolderItem {
  path: string
  relativePath: string
  text: string
  lines: string[]
  ext: string
}

export function isTextOrPdfExt(ext: string): boolean {
  return isTextFile(ext) || ext === '.pdf'
}

export function loadFolder(folderPath: string, includePatterns?: string[], excludePatterns?: string[]): LoadedFolderItem[] {
  const items: LoadedFolderItem[] = []

  function walk(dir: string) {
    let entries: string[]
    try {
      entries = readdirSync(dir)
    } catch {
      return
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry)
      let s: ReturnType<typeof statSync>
      try { s = statSync(fullPath) } catch { continue }

      if (s.isDirectory()) {
        if (!IGNORE_DIRS.has(entry)) walk(fullPath)
      } else if (s.isFile()) {
        const ext = entry.includes('.') ? entry.slice(entry.lastIndexOf('.')).toLowerCase() : ''
        if (IGNORE_FILES.has(entry)) continue
        if (!isTextFile(ext) && ext !== '.pdf' && !includePatterns) continue
        try {
          const file = loadFile(fullPath, true)
          items.push({
            path: fullPath,
            relativePath: relative(folderPath, fullPath),
            text: file.text,
            lines: file.lines,
            ext: file.ext,
          })
        } catch { /* skip unreadable files */ }
      }
    }
  }

  walk(folderPath)
  return items
}
