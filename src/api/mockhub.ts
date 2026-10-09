import { API_BASE, ApiError, apiFetch } from './client'
import type { MockPair, MockResponse } from './types'

/**
 * Typed calls to the MockHub REST API. `prefix` selects the workspace: `''` for the global workspace,
 * `'/{uuid}'` for a registered one (see workspacePrefix).
 */

/** Text the server answers with when no mock matches, i.e. the endpoint does not exist on this server version. */
const NO_MOCK_FOUND = 'No mock response found.'

export async function fetchMocks(prefix: string): Promise<MockPair[]> {
  let response: Response
  try {
    response = await apiFetch(`${prefix}/mockpairs`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404 && error.message === NO_MOCK_FOUND) {
      throw new ApiError(404, 'This MockHub server is too old: it cannot list saved mocks (GET /mockpairs). Update the server.')
    }
    throw error
  }
  return normalizeMocks(await response.json())
}

/** Replaces all mocks of the workspace and returns the list as it was sent. */
export async function saveMocks(prefix: string, mocks: MockPair[]): Promise<MockPair[]> {
  const cleaned = mocks.map(cleanMock)
  await apiFetch(`${prefix}/mockpairs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleaned),
  })
  return cleaned
}

/** Saves JSON typed by the user as is, so that the server reports any problem in it. */
export async function saveRawMocks(prefix: string, json: string): Promise<void> {
  await apiFetch(`${prefix}/mockpairs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: json,
  })
}

export async function fetchFiles(prefix: string): Promise<string[]> {
  const response = await apiFetch(`${prefix}/files`)
  return (await response.json()) as string[]
}

export async function uploadFile(prefix: string, file: File): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  try {
    await apiFetch(`${prefix}/files`, { method: 'POST', body: form })
  } catch (error) {
    if (error instanceof ApiError && error.status === 413) {
      throw new ApiError(413, `${file.name} is larger than the server allows (spring.servlet.multipart.max-file-size, 1 MB by default).`)
    }
    throw error
  }
}

/** Creates a new workspace and returns its ID. The server requires an email but does not store it. */
export async function registerWorkspace(email: string): Promise<string> {
  const response = await apiFetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: email,
  })
  return (await response.json()) as string
}

export interface TestResult {
  status: number
  statusText: string
  headers: [string, string][]
  contentType: string
  /** Body size in bytes. */
  size: number
  /** The body decoded as text, or null for binary content such as images. */
  text: string | null
  /** Binary bodies as a data URL, for previewing images and downloading. */
  dataUrl: string | null
  durationMs: number
}

/** Calls a mock endpoint. Unlike the API calls above, any HTTP status is a valid result here. */
export async function sendTestRequest(
  prefix: string,
  method: string,
  path: string,
  body?: string,
): Promise<TestResult> {
  const hasBody = body !== undefined && body !== '' && method !== 'GET' && method !== 'HEAD'
  const startedAt = performance.now()
  let response: Response
  try {
    response = await fetch(API_BASE + prefix + path, {
      method,
      body: hasBody ? body : undefined,
      headers: hasBody ? { 'Content-Type': guessContentType(body) } : undefined,
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the MockHub server.')
  }
  const responseBody = await response.blob()
  const durationMs = Math.round(performance.now() - startedAt)
  const contentType = response.headers.get('content-type') ?? ''
  const textual = isTextual(contentType)
  return {
    status: response.status,
    statusText: response.statusText,
    headers: [...response.headers.entries()],
    contentType,
    size: responseBody.size,
    text: textual ? await responseBody.text() : null,
    dataUrl: textual ? null : await readAsDataUrl(responseBody),
    durationMs,
  }
}

/** A data URL needs no cleanup, unlike URL.createObjectURL. */
function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the response body'))
    reader.readAsDataURL(blob)
  })
}

/** Content types shown as text. No content type at all usually means a plain-text mock body. */
function isTextual(contentType: string): boolean {
  const type = contentType.toLowerCase()
  return type === '' || type.startsWith('text/') || /json|xml|javascript|x-www-form-urlencoded/.test(type)
}

export function guessContentType(body: string): string {
  return isJson(body) ? 'application/json' : 'text/plain'
}

export function isJson(text: string): boolean {
  try {
    JSON.parse(text)
    return true
  } catch {
    return false
  }
}

/** Drops empty optional fields so that the saved JSON stays as small as a hand-written one. */
export function cleanMock({ request, response }: MockPair): MockPair {
  const cleaned: MockResponse = { status: response.status }
  if (response.body) cleaned.body = response.body
  if (response.bodyFile) cleaned.bodyFile = response.bodyFile
  if (response.contentType?.trim()) cleaned.contentType = response.contentType.trim()
  const headers = Object.entries(response.headers ?? {}).filter(([name]) => name.trim() !== '')
  if (headers.length > 0) cleaned.headers = Object.fromEntries(headers)
  return {
    request: { method: request.method.toUpperCase(), url: request.url, regexPattern: Boolean(request.regexPattern) },
    response: cleaned,
  }
}

/**
 * Mock files can be edited by hand on the server, so incomplete entries are completed (and `null`
 * entries dropped) to keep the UI from crashing on them.
 */
function normalizeMocks(data: unknown): MockPair[] {
  if (!Array.isArray(data)) {
    throw new ApiError(500, 'The server returned something other than a list of mocks.')
  }
  return data
    .filter((item): item is Partial<MockPair> => item !== null && typeof item === 'object')
    .map(({ request, response }) => ({
      request: {
        method: typeof request?.method === 'string' ? request.method : 'GET',
        url: typeof request?.url === 'string' ? request.url : '/',
        regexPattern: Boolean(request?.regexPattern),
      },
      response: { ...response, status: typeof response?.status === 'number' ? response.status : 200 },
    }))
}
