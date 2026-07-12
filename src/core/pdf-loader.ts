import { execSync } from 'node:child_process'
import { statSync } from 'node:fs'
import { SourceNotFound, SourceTooLarge } from './errors.js'

const MAX_SIZE = 50 * 1024 * 1024

export interface LoadedPdf {
  text: string
  lines: string[]
  path: string
  pageCount: number
}

export function loadPdf(path: string, force?: boolean): LoadedPdf {
  if (!force) {
    const s = statSync(path)
    if (!s.isFile()) throw new SourceNotFound(path)
    if (s.size > MAX_SIZE) throw new SourceTooLarge(path, s.size, MAX_SIZE)
  }

  try {
    execSync('which pdftotext', { stdio: 'pipe' })
  } catch {
    throw new Error(
      'pdftotext not found. Install poppler-utils:\n' +
      '  macOS: brew install poppler\n' +
      '  Linux: apt-get install poppler-utils\n' +
      '  Windows: choco install poppler'
    )
  }

  const out = execSync(`pdftotext "${path}" -`, {
    encoding: 'utf-8',
    timeout: 30000,
    maxBuffer: MAX_SIZE,
  })

  const text = out.trim()
  const lines = text.split('\n')

  let pageCount = 1
  try {
    const pageInfo = execSync(`pdfinfo "${path}" 2>/dev/null | grep Pages || echo "Pages: 1"`, {
      encoding: 'utf-8', timeout: 5000,
    })
    const m = pageInfo.match(/Pages:\s*(\d+)/)
    if (m) pageCount = parseInt(m[1])
  } catch { /* ignore */ }

  return { text, lines, path, pageCount }
}

export function isPdf(path: string): boolean {
  return path.toLowerCase().endsWith('.pdf')
}
