import { generateRunId, generateSourceId } from './ids.js'
import { detectSource } from './source-detector.js'
import { loadFile } from './file-loader.js'
import { loadFolder } from './folder-loader.js'
import { loadUrl } from './url-loader.js'
import { loadGitHub } from './github-loader.js'
import { chunkTextString } from './chunker.js'
import { extract } from './extractor.js'
import { saveRun, loadRun, listRuns } from './artifact-store.js'
import { syncToMemoryLane } from './memorylane-sync.js'
import { exportRun } from './export-import.js'
import { search } from './search.js'
import { buildMemoryRecords } from './memory-records-builder.js'
import type { ContextLaneSource, ContextLaneRun, ContextLaneChunk } from './schema.js'

export interface IngestOptions {
  input: string
  type?: 'file' | 'folder' | 'url' | 'github' | 'text'
  syncToMemoryLane?: boolean
}

export async function ingest(options: IngestOptions): Promise<ContextLaneRun> {
  const { input, syncToMemoryLane: doSync } = options
  let detectedType = options.type || detectSource(input).type

  const runId = generateRunId()
  const sourceId = generateSourceId()
  const allChunks: ContextLaneChunk[] = []
  const allCitations: ContextLaneCitation[] = []

  const sources: ContextLaneSource[] = []

  if (detectedType === 'file') {
    const file = loadFile(input)
    const label = input.split('/').pop() || input
    sources.push({
      id: sourceId,
      type: 'file',
      input,
      title: label,
      path: input,
      loadedAt: new Date().toISOString(),
    })
    const result = chunkTextString(file.text, sourceId, label, input)
    allChunks.push(...result.chunks)
    allCitations.push(...result.citations)
  }

  if (detectedType === 'folder') {
    const items = loadFolder(input)
    for (const item of items) {
      const itemSourceId = generateSourceId()
      sources.push({
        id: itemSourceId,
        type: 'file',
        input: item.path,
        title: item.relativePath,
        path: item.path,
        loadedAt: new Date().toISOString(),
      })
      const result = chunkTextString(item.text, itemSourceId, item.relativePath, item.path)
      allChunks.push(...result.chunks)
      allCitations.push(...result.citations)
    }
  }

  if (detectedType === 'url') {
    const loaded = await loadUrl(input)
    sources.push({
      id: sourceId,
      type: 'url',
      input,
      title: loaded.title,
      url: input,
      loadedAt: new Date().toISOString(),
    })
    const result = chunkTextString(loaded.text, sourceId, loaded.title || input, undefined, input)
    allChunks.push(...result.chunks)
    allCitations.push(...result.citations)
  }

  if (detectedType === 'github') {
    const loaded = loadGitHub(input)
    for (const item of loaded.items) {
      const itemSourceId = generateSourceId()
      sources.push({
        id: itemSourceId,
        type: 'file',
        input: item.path,
        title: item.relativePath,
        path: item.path,
        loadedAt: new Date().toISOString(),
      })
      const result = chunkTextString(item.text, itemSourceId, item.relativePath, item.path)
      allChunks.push(...result.chunks)
      allCitations.push(...result.citations)
    }
  }

  if (detectedType === 'text') {
    sources.push({
      id: sourceId,
      type: 'text',
      input,
      title: 'inline-text',
      loadedAt: new Date().toISOString(),
    })
    const result = chunkTextString(input, sourceId, 'inline-text')
    allChunks.push(...result.chunks)
    allCitations.push(...result.citations)
  }

  const extraction = extract({ runId, chunks: allChunks, citations: allCitations })
  const memoryRecords = buildMemoryRecords(runId, sources, allChunks, extraction)

  const run: ContextLaneRun = {
    id: runId,
    sources,
    chunks: allChunks,
    extraction: { ...extraction, citations: allCitations },
    memoryRecords,
    createdAt: new Date().toISOString(),
  }

  saveRun(run)

  if (doSync) {
    const syncResult = await syncToMemoryLane(memoryRecords)
    console.error(`MemoryLane sync: ${syncResult.saved} saved, ${syncResult.failed} failed (via ${syncResult.method})`)
  }

  return run
}

export { loadRun, listRuns, search, exportRun, syncToMemoryLane, loadRun as getRun }
export type { ContextLaneRun }
