export class ContextLaneError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'ContextLaneError'
  }
}

export class SourceNotFound extends ContextLaneError {
  constructor(path: string) {
    super(`Source not found: ${path}`, 'SOURCE_NOT_FOUND')
  }
}

export class SourceTooLarge extends ContextLaneError {
  constructor(path: string, size: number, limit: number) {
    super(`Source too large: ${path} (${size} bytes, limit ${limit})`, 'SOURCE_TOO_LARGE')
  }
}

export class RunNotFound extends ContextLaneError {
  constructor(id: string) {
    super(`Run not found: ${id}`, 'RUN_NOT_FOUND')
  }
}

export class Unauthorized extends ContextLaneError {
  constructor() {
    super('Unauthorized: missing or invalid API key', 'UNAUTHORIZED')
  }
}
