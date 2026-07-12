import { existsSync, statSync } from 'node:fs'
import { extname, isAbsolute, resolve } from 'node:path'

export interface DetectedSource {
  type: 'file' | 'folder' | 'url' | 'github'
  input: string
}

export function detectSource(input: string): DetectedSource {
  if (input.startsWith('https://github.com/') || input.startsWith('http://github.com/')) {
    return { type: 'github', input }
  }
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return { type: 'url', input }
  }
  const absPath = isAbsolute(input) ? input : resolve(process.cwd(), input)
  if (existsSync(absPath)) {
    const s = statSync(absPath)
    if (s.isDirectory()) return { type: 'folder', input: absPath }
    return { type: 'file', input: absPath }
  }
  return { type: 'url', input }
}
