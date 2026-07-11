import { Unauthorized } from './errors.js'

export function isCloudMode(): boolean {
  return process.env.CONTEXTLANE_CLOUD_MODE === 'true'
}

export function requireApiKey(req: { headers: Record<string, string | undefined> }): void {
  if (!isCloudMode()) return
  const key = req.headers['authorization']?.replace('Bearer ', '') || req.headers['x-talocode-api-key']
  if (!key || key !== process.env.TALOCODE_API_KEY) {
    throw new Unauthorized()
  }
}
