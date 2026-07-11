import { readFileSync, statSync } from 'node:fs'
import { extname } from 'node:path'
import { SourceNotFound, SourceTooLarge } from './errors.js'

const MAX_SIZE = 10 * 1024 * 1024
const TEXT_EXTENSIONS = new Set([
  '.md', '.txt', '.json', '.csv', '.js', '.ts', '.tsx', '.jsx', '.py', '.rb',
  '.go', '.rs', '.java', '.c', '.cpp', '.h', '.hpp', '.css', '.scss', '.html',
  '.yaml', '.yml', '.toml', '.xml', '.sh', '.bash', '.zsh', '.fish', '.ps1',
  '.env', '.cfg', '.ini', '.conf', '.sql', '.r', '.mjs', '.cjs', '.mts', '.cts',
  '.vue', '.svelte', '.astro', '.mdx',
])

export interface LoadedFile {
  text: string
  lines: string[]
  path: string
  ext: string
}

export function loadFile(path: string, force?: boolean): LoadedFile {
  if (!force) {
    const s = statSync(path)
    if (!s.isFile()) throw new SourceNotFound(path)
    if (s.size > MAX_SIZE) throw new SourceTooLarge(path, s.size, MAX_SIZE)
  }
  const ext = extname(path).toLowerCase()
  const text = readFileSync(path, 'utf-8')
  const lines = text.split('\n')
  return { text, lines, path, ext }
}

export function isTextFile(ext: string): boolean {
  return TEXT_EXTENSIONS.has(ext)
}
