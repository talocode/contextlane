import type { ContextLaneSource, ContextLaneChunk, ContextLaneExtraction, ContextLaneMemoryRecord } from './schema.js'

export function buildMemoryRecords(
  runId: string,
  sources: ContextLaneSource[],
  chunks: ContextLaneChunk[],
  extraction: ContextLaneExtraction,
): ContextLaneMemoryRecord[] {
  const records: ContextLaneMemoryRecord[] = []

  for (const fact of extraction.facts) {
    records.push({
      text: fact.text,
      tags: ['contextlane', ...extraction.tags.slice(0, 5), ...fact.tags],
      source: sources[0]?.input || 'unknown',
      citation: fact.citationIds[0] || '',
      metadata: {
        runId,
        sourceId: sources[0]?.id || '',
        citationIds: fact.citationIds,
        contextlane: true,
      },
      importance: Math.round(fact.confidence * 10),
    })
  }

  for (const decision of extraction.decisions) {
    records.push({
      text: `[Decision] ${decision.text}`,
      tags: ['contextlane', 'decision', decision.status],
      source: sources[0]?.input || 'unknown',
      citation: decision.citationIds[0] || '',
      metadata: {
        runId,
        sourceId: sources[0]?.id || '',
        citationIds: decision.citationIds,
        contextlane: true,
      },
      importance: 8,
    })
  }

  for (const action of extraction.actions) {
    records.push({
      text: `[Action] ${action.text}`,
      tags: ['contextlane', 'action', action.priority],
      source: sources[0]?.input || 'unknown',
      citation: action.citationIds[0] || '',
      metadata: {
        runId,
        sourceId: sources[0]?.id || '',
        citationIds: action.citationIds,
        contextlane: true,
      },
      importance: action.priority === 'high' ? 9 : 6,
    })
  }

  return records
}
