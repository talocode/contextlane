export interface ContextLaneSource {
  id: string
  type: 'file' | 'folder' | 'url' | 'github' | 'text'
  input: string
  title?: string
  path?: string
  url?: string
  hash?: string
  loadedAt: string
  metadata?: Record<string, unknown>
}

export interface ContextLaneChunk {
  id: string
  sourceId: string
  text: string
  index: number
  startLine?: number
  endLine?: number
  citation: string
  metadata?: Record<string, unknown>
}

export interface ContextLaneFact {
  id: string
  text: string
  confidence: number
  tags: string[]
  citationIds: string[]
}

export interface ContextLaneDecision {
  id: string
  text: string
  status: 'active' | 'historical' | 'unknown'
  citationIds: string[]
}

export interface ContextLaneAction {
  id: string
  text: string
  priority: 'low' | 'medium' | 'high'
  citationIds: string[]
}

export interface ContextLaneEntity {
  id: string
  name: string
  type: 'person' | 'project' | 'tool' | 'company' | 'url' | 'concept' | 'other'
  mentions: number
  citationIds: string[]
}

export interface ContextLaneCitation {
  id: string
  sourceId: string
  label: string
  path?: string
  url?: string
  startLine?: number
  endLine?: number
  quote?: string
}

export interface ContextLaneExtraction {
  runId: string
  summary: string
  facts: ContextLaneFact[]
  decisions: ContextLaneDecision[]
  actions: ContextLaneAction[]
  entities: ContextLaneEntity[]
  tags: string[]
  citations: ContextLaneCitation[]
  createdAt: string
}

export interface ContextLaneMemoryRecord {
  text: string
  tags: string[]
  source: string
  citation: string
  metadata: {
    runId: string
    sourceId: string
    citationIds: string[]
    contextlane: true
  }
  importance: number
}

export interface ContextLaneRun {
  id: string
  sources: ContextLaneSource[]
  chunks: ContextLaneChunk[]
  extraction: ContextLaneExtraction
  memoryRecords: ContextLaneMemoryRecord[]
  createdAt: string
}

export interface ContextLaneRunMeta {
  id: string
  sourceCount: number
  chunkCount: number
  factCount: number
  entityCount: number
  createdAt: string
}
