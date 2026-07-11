import type { ContextLaneCitation, ContextLaneChunk } from './schema.js'
import { generateCitationId } from './ids.js'

export function buildCitation(
  sourceId: string,
  label: string,
  chunk?: ContextLaneChunk,
  path?: string,
  url?: string,
): ContextLaneCitation {
  return {
    id: generateCitationId(),
    sourceId,
    label,
    path,
    url,
    startLine: chunk?.startLine,
    endLine: chunk?.endLine,
    quote: chunk?.text.slice(0, 200),
  }
}
