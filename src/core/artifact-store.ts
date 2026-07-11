import { writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { getRunsDir, getRunDir, ensureDir } from './config-store.js'
import type { ContextLaneRun, ContextLaneRunMeta } from './schema.js'
import { RunNotFound } from './errors.js'

export function saveRun(run: ContextLaneRun): void {
  const dir = getRunDir(run.id)
  const base = (name: string) => join(dir, name)

  writeFileSync(base('run.json'), JSON.stringify({ id: run.id, createdAt: run.createdAt }, null, 2))
  writeFileSync(base('sources.json'), JSON.stringify(run.sources, null, 2))
  writeFileSync(base('chunks.json'), JSON.stringify(run.chunks, null, 2))
  writeFileSync(base('summary.md'), generateSummaryMd(run))
  writeFileSync(base('facts.json'), JSON.stringify(run.extraction.facts, null, 2))
  writeFileSync(base('decisions.json'), JSON.stringify(run.extraction.decisions, null, 2))
  writeFileSync(base('actions.json'), JSON.stringify(run.extraction.actions, null, 2))
  writeFileSync(base('entities.json'), JSON.stringify(run.extraction.entities, null, 2))
  writeFileSync(base('citations.json'), JSON.stringify(run.extraction.citations, null, 2))
  writeFileSync(base('memory-records.json'), JSON.stringify(run.memoryRecords, null, 2))
  writeFileSync(base('report.md'), generateReportMd(run))
}

function generateSummaryMd(run: ContextLaneRun): string {
  let md = `# ContextLane Run: ${run.id}\n\n`
  md += `**Sources:** ${run.sources.length}\n`
  md += `**Chunks:** ${run.chunks.length}\n`
  md += `**Facts:** ${run.extraction.facts.length}\n`
  md += `**Decisions:** ${run.extraction.decisions.length}\n`
  md += `**Actions:** ${run.extraction.actions.length}\n`
  md += `**Entities:** ${run.extraction.entities.length}\n`
  md += `**Tags:** ${run.extraction.tags.join(', ')}\n\n`
  md += `## Summary\n\n${run.extraction.summary}\n\n`
  md += `## Sources\n\n`
  for (const s of run.sources) {
    md += `- ${s.type}: ${s.input}\n`
  }
  return md
}

function generateReportMd(run: ContextLaneRun): string {
  let md = `# ContextLane Report\n\n`
  md += `Run ID: ${run.id}\n`
  md += `Created: ${run.createdAt}\n\n`
  md += `## Summary\n\n${run.extraction.summary}\n\n`

  if (run.extraction.facts.length > 0) {
    md += `## Facts\n\n`
    for (const f of run.extraction.facts) {
      md += `- ${f.text}\n`
    }
    md += '\n'
  }

  if (run.extraction.decisions.length > 0) {
    md += `## Decisions\n\n`
    for (const d of run.extraction.decisions) {
      md += `- [${d.status}] ${d.text}\n`
    }
    md += '\n'
  }

  if (run.extraction.actions.length > 0) {
    md += `## Actions\n\n`
    for (const a of run.extraction.actions) {
      md += `- [${a.priority}] ${a.text}\n`
    }
    md += '\n'
  }

  if (run.extraction.entities.length > 0) {
    md += `## Entities\n\n`
    for (const e of run.extraction.entities) {
      md += `- ${e.name} (${e.type}, ${e.mentions} mentions)\n`
    }
    md += '\n'
  }

  return md
}

export function loadRun(runId: string): ContextLaneRun {
  const dir = getRunDir(runId)
  if (!existsSync(dir)) throw new RunNotFound(runId)

  const run = JSON.parse(readFileSync(join(dir, 'run.json'), 'utf-8'))
  const sources = JSON.parse(readFileSync(join(dir, 'sources.json'), 'utf-8'))
  const chunks = JSON.parse(readFileSync(join(dir, 'chunks.json'), 'utf-8'))
  const extraction = {
    runId,
    summary: readFileSync(join(dir, 'summary.md'), 'utf-8').split('## Summary')[1]?.trim() || '',
    facts: JSON.parse(readFileSync(join(dir, 'facts.json'), 'utf-8')),
    decisions: JSON.parse(readFileSync(join(dir, 'decisions.json'), 'utf-8')),
    actions: JSON.parse(readFileSync(join(dir, 'actions.json'), 'utf-8')),
    entities: JSON.parse(readFileSync(join(dir, 'entities.json'), 'utf-8')),
    tags: readFileSync(join(dir, 'summary.md'), 'utf-8').match(/\*\*Tags:\*\* (.+)/)?.[1]?.split(', ') || [],
    citations: JSON.parse(readFileSync(join(dir, 'citations.json'), 'utf-8')),
    createdAt: run.createdAt,
  }
  const memoryRecords = JSON.parse(readFileSync(join(dir, 'memory-records.json'), 'utf-8'))

  return { id: runId, sources, chunks, extraction, memoryRecords, createdAt: run.createdAt }
}

export function listRuns(): ContextLaneRunMeta[] {
  const dir = getRunsDir()
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => {
      const run = JSON.parse(readFileSync(join(dir, d.name, 'run.json'), 'utf-8'))
      const sources = JSON.parse(readFileSync(join(dir, d.name, 'sources.json'), 'utf-8'))
      const chunks = JSON.parse(readFileSync(join(dir, d.name, 'chunks.json'), 'utf-8'))
      const facts = JSON.parse(readFileSync(join(dir, d.name, 'facts.json'), 'utf-8'))
      const entities = JSON.parse(readFileSync(join(dir, d.name, 'entities.json'), 'utf-8'))
      return {
        id: d.name,
        sourceCount: sources.length,
        chunkCount: chunks.length,
        factCount: facts.length,
        entityCount: entities.length,
        createdAt: run.createdAt,
      }
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
