import { generateFactId, generateDecisionId, generateActionId, generateEntityId } from './ids.js'
import type { ContextLaneChunk, ContextLaneCitation, ContextLaneExtraction, ContextLaneFact, ContextLaneDecision, ContextLaneAction, ContextLaneEntity } from './schema.js'

export interface ExtractOptions {
  runId: string
  chunks: ContextLaneChunk[]
  citations: ContextLaneCitation[]
}

export function extract(options: ExtractOptions): ContextLaneExtraction {
  const { runId, chunks, citations } = options

  const allText = chunks.map(c => c.text).join('\n')
  const lines = allText.split('\n').filter(l => l.trim())

  const summary = generateSummary(chunks)
  const facts = extractFacts(chunks, citations)
  const decisions = extractDecisions(chunks, citations)
  const actions = extractActions(chunks, citations)
  const entities = extractEntities(chunks, citations)
  const tags = extractTags(chunks)

  return {
    runId,
    summary,
    facts,
    decisions,
    actions,
    entities,
    tags,
    citations,
    createdAt: new Date().toISOString(),
  }
}

function generateSummary(chunks: ContextLaneChunk[]): string {
  const headlines = chunks
    .map(c => c.text.split('\n').filter(l => l.trim().startsWith('#')))
    .flat()
    .slice(0, 10)

  if (headlines.length > 0) {
    return `Source contains ${chunks.length} chunks across ${headlines.length} sections. Top sections: ${headlines.map(h => h.trim().replace(/^#+\s*/, '')).join(', ')}.`
  }

  const firstLines = chunks[0]?.text.split('\n').slice(0, 3).join(' ').slice(0, 200) || ''
  return `Source contains ${chunks.length} chunks. First content: ${firstLines}...`
}

function extractFacts(chunks: ContextLaneChunk[], citations: ContextLaneCitation[]): ContextLaneFact[] {
  const facts: ContextLaneFact[] = []
  const seen = new Set<string>()

  for (const chunk of chunks) {
    const lines = chunk.text.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('```')) continue
      if (trimmed.length < 20) continue

      const key = trimmed.slice(0, 60)
      if (seen.has(key)) continue
      seen.add(key)

      const cit = citations.find(c => c.startLine === chunk.startLine) || citations.find(c => c.sourceId === chunk.sourceId)
      facts.push({
        id: generateFactId(),
        text: trimmed.slice(0, 300),
        confidence: 0.7,
        tags: [],
        citationIds: cit ? [cit.id] : [],
      })
    }
  }

  return facts.slice(0, 50)
}

const ACTION_KEYWORDS = ['TODO', 'FIXME', 'HACK', 'need to', 'should', 'must', 'required', 'action item', 'action', 'todo:', 'to do']
const DECISION_KEYWORDS = ['decision', 'we decided', 'we chose', 'agreed', 'elected', 'resolved', 'conclusion', 'outcome']

function extractDecisions(chunks: ContextLaneChunk[], citations: ContextLaneCitation[]): ContextLaneDecision[] {
  const decisions: ContextLaneDecision[] = []

  for (const chunk of chunks) {
    for (const line of chunk.text.split('\n')) {
      const lower = line.toLowerCase()
      if (DECISION_KEYWORDS.some(k => lower.includes(k))) {
        const cit = citations.find(c => c.startLine === chunk.startLine)
        decisions.push({
          id: generateDecisionId(),
          text: line.trim().slice(0, 300),
          status: 'active',
          citationIds: cit ? [cit.id] : [],
        })
      }
    }
  }

  return decisions
}

function extractActions(chunks: ContextLaneChunk[], citations: ContextLaneCitation[]): ContextLaneAction[] {
  const actions: ContextLaneAction[] = []

  for (const chunk of chunks) {
    for (const line of chunk.text.split('\n')) {
      const lower = line.toLowerCase()
      const matched = ACTION_KEYWORDS.find(k => lower.includes(k))
      if (matched) {
        const priority = matched === 'HACK' || matched === 'FIXME' ? 'high' as const : matched === 'TODO' ? 'medium' as const : 'low' as const
        const cit = citations.find(c => c.startLine === chunk.startLine)
        actions.push({
          id: generateActionId(),
          text: line.trim().slice(0, 300),
          priority,
          citationIds: cit ? [cit.id] : [],
        })
      }
    }
  }

  return actions
}

const URL_RE = /https?:\/\/[^\s)"'\]>]+/g
const PROJECT_RE = /@[\w-]+\/[\w-]+/g
const TOOL_RE = /[\w-]+/g

function extractEntities(chunks: ContextLaneChunk[], citations: ContextLaneCitation[]): ContextLaneEntity[] {
  const entityMap = new Map<string, { type: ContextLaneEntity['type']; mentions: number; citationIds: Set<string> }>()

  for (const chunk of chunks) {
    const matchingCitations = citations.filter(c => c.startLine === chunk.startLine)

    for (const match of chunk.text.matchAll(URL_RE)) {
      const url = match[0]
      const e = entityMap.get(url) || { type: 'url' as const, mentions: 0, citationIds: new Set() }
      e.mentions++
      for (const c of matchingCitations) e.citationIds.add(c.id)
      entityMap.set(url, e)
    }

    for (const match of chunk.text.matchAll(PROJECT_RE)) {
      const name = match[0]
      const e = entityMap.get(name) || { type: 'project' as const, mentions: 0, citationIds: new Set() }
      e.mentions++
      for (const c of matchingCitations) e.citationIds.add(c.id)
      entityMap.set(name, e)
    }
  }

  return Array.from(entityMap.entries()).map(([name, data]) => ({
    id: generateEntityId(),
    name,
    type: data.type,
    mentions: data.mentions,
    citationIds: Array.from(data.citationIds),
  }))
}

function extractTags(chunks: ContextLaneChunk[]): string[] {
  const freq = new Map<string, number>()
  const skip = new Set(['the', 'this', 'that', 'with', 'from', 'have', 'been', 'will', 'what', 'about', 'when', 'where', 'which', 'their', 'there', 'would', 'could', 'should', 'into', 'more', 'some', 'than', 'then', 'also', 'just', 'like', 'very', 'well', 'even', 'still', 'over', 'such', 'only', 'other', 'after', 'before', 'between', 'through', 'during', 'without', 'within', 'along', 'following', 'including', 'using', 'based', 'related', 'various', 'multiple', 'within', 'across', 'among', 'before', 'after', 'above', 'below', 'under', 'while', 'because', 'though', 'unless', 'until', 'since', 'about'])

  for (const chunk of chunks) {
    const words = chunk.text.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !skip.has(w))
    for (const w of words) {
      freq.set(w, (freq.get(w) || 0) + 1)
    }
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word)
}
