export interface LoadedUrl {
  text: string
  url: string
  title?: string
}

export async function loadUrl(url: string): Promise<LoadedUrl> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ContextLane/0.1.0 (context ingestion; +https://github.com/talocode/contextlane)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    const html = await res.text()
    const text = extractText(html)
    const title = extractTitle(html)
    return { text, url, title }
  } finally {
    clearTimeout(timeout)
  }
}

function extractText(html: string): string {
  let text = html

  // Remove unwanted elements
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, ' ')
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, ' ')
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, ' ')
  text = text.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, ' ')
  text = text.replace(/<form[^>]*>[\s\S]*?<\/form>/gi, ' ')
  text = text.replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, ' ')

  // Replace block elements with newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|blockquote|section|article|pre|tr|th|td|br|hr|dl|dt|dd|ol|ul|table)[^>]*>/gi, '\n')

  // Remove all remaining tags
  text = text.replace(/<[^>]+>/g, ' ')

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#\d+;/g, ' ')

  // Clean up whitespace
  text = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/^\s+|\s+$/gm, '')
    .trim()

  // Remove very short lines (likely noise)
  const lines = text.split('\n').filter(l => l.trim().length > 2)
  text = lines.join('\n')

  return text
}

function extractTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (m) return m[1].trim().replace(/\s+/g, ' ')

  const og = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)
  if (og) return og[1].trim()

  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  if (h1) return h1[1].trim()

  return undefined
}
