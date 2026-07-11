import { generateChunkId, generateCitationId } from './ids.js'
import type { ContextLaneChunk, ContextLaneCitation } from './schema.js'

export interface ChunkResult {
  chunks: ContextLaneChunk[]
  citations: ContextLaneCitation[]
}

export function chunkText(
  text: string,
  lines: string[],
  sourceId: string,
  sourceLabel: string,
  sourcePath?: string,
  sourceUrl?: string,
): ChunkResult {
  const chunks: ContextLaneChunk[] = []
  const citations: ContextLaneCitation[] = []

  const maxChunkLines = 50
  for (let i = 0; i < lines.length; i += maxChunkLines) {
    const chunkLines = lines.slice(i, i + maxChunkLines)
    const chunkText = chunkLines.join('\n').trim()
    if (!chunkText) continue

    const chunkId = generateChunkId()
    const citId = generateCitationId()

    chunks.push({
      id: chunkId,
      sourceId,
      text: chunkText,
      index: chunks.length,
      startLine: i + 1,
      endLine: i + chunkLines.length,
      citation: `[${sourceLabel}:${i + 1}]`,
    })

    citations.push({
      id: citId,
      sourceId,
      label: sourceLabel,
      path: sourcePath,
      url: sourceUrl,
      startLine: i + 1,
      endLine: i + chunkLines.length,
      quote: chunkText.slice(0, 200),
    })
  }

  return { chunks, citations }
}

export function chunkTextString(
  text: string,
  sourceId: string,
  sourceLabel: string,
  sourcePath?: string,
  sourceUrl?: string,
): ChunkResult {
  const lines = text.split('\n')
  return chunkText(text, lines, sourceId, sourceLabel, sourcePath, sourceUrl)
}
