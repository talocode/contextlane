export function generateRunId(): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 6)
  return `ctx_${ts}_${rand}`
}

export function generateSourceId(): string {
  return `src_${Math.random().toString(36).slice(2, 10)}`
}

export function generateChunkId(): string {
  return `chk_${Math.random().toString(36).slice(2, 10)}`
}

export function generateFactId(): string {
  return `fct_${Math.random().toString(36).slice(2, 10)}`
}

export function generateDecisionId(): string {
  return `dec_${Math.random().toString(36).slice(2, 10)}`
}

export function generateActionId(): string {
  return `act_${Math.random().toString(36).slice(2, 10)}`
}

export function generateEntityId(): string {
  return `ent_${Math.random().toString(36).slice(2, 10)}`
}

export function generateCitationId(): string {
  return `cit_${Math.random().toString(36).slice(2, 10)}`
}
