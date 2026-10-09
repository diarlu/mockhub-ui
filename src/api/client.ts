/**
 * Base URL of the MockHub API as seen from the browser. By default it is `/api`, which the dev server
 * (vite.config.ts) and the Docker image (nginx/default.conf.template) proxy to the MockHub server.
 * When the server itself serves the UI (`npm run build:embedded`), it is empty: same origin, no proxy.
 */
export const API_BASE = (import.meta.env.VITE_API_BASE ?? '/api').replace(/\/+$/, '')

/**
 * Absolute URL of an API path, for showing and copying. Built by concatenation rather than `new URL()`,
 * which would rewrite characters that are meaningful in mock patterns (e.g. `\` in `\d+`).
 */
export function absoluteApiUrl(path = ''): string {
  const base = /^https?:\/\//.test(API_BASE) ? API_BASE : window.location.origin + API_BASE
  return base + path
}

/** An API call that failed; `status` is 0 when the server could not be reached at all. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }

  /** True when the server is down or the proxy in front of it cannot reach it. */
  get isUnreachable(): boolean {
    return this.status === 0 || this.status === 502 || this.status === 503 || this.status === 504
  }
}

/** Sends a request to the API and throws an {@link ApiError} carrying the server's message on failure. */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  let response: Response
  try {
    response = await fetch(API_BASE + path, init)
  } catch {
    throw new ApiError(0, 'Cannot reach the MockHub server.')
  }
  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response))
  }
  return response
}

/**
 * MockHub answers errors with a plain-text reason, while Spring's fallback handler answers with JSON
 * such as `{"error": "Payload Too Large", ...}`. Both become a readable message.
 */
async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `${response.status} ${response.statusText}`.trim()
  const text = await response.text().catch(() => '')
  try {
    const json: unknown = JSON.parse(text)
    if (json && typeof json === 'object') {
      const { message, error } = json as { message?: unknown; error?: unknown }
      if (typeof message === 'string' && message) return message
      if (typeof error === 'string' && error) return error
    }
  } catch {
    // Not JSON: use the plain-text body below.
  }
  return text.trim() || fallback
}
