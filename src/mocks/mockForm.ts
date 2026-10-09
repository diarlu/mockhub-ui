import type { MockPair, MockResponse } from '../api/types'

/** Editable form state of one mock. Unlike MockPair it keeps fields of every body mode while the user switches. */
export interface MockForm {
  method: string
  url: string
  regexPattern: boolean
  /** NumberInput reports a string while the field is empty or being edited. */
  status: number | string
  bodyMode: BodyMode
  body: string
  bodyFile: string | null
  contentType: string
  headers: HeaderRow[]
}

export type BodyMode = 'text' | 'file' | 'none'

export interface HeaderRow {
  /** Stable React key; header names can be empty or duplicated while editing. */
  id: number
  name: string
  value: string
}

export type FormErrors = Partial<Record<'url' | 'status' | 'bodyFile' | 'headers', string>>

let nextHeaderRowId = 0

export function newHeaderRow(name = '', value = ''): HeaderRow {
  nextHeaderRowId += 1
  return { id: nextHeaderRowId, name, value }
}

export const NEW_MOCK: MockPair = {
  request: { method: 'GET', url: '/', regexPattern: false },
  response: { status: 200, contentType: 'application/json', body: '' },
}

/** A mock that serves an uploaded file under its own name, e.g. GET /logo.png. */
export function fileMock(fileName: string): MockPair {
  return {
    // The server matches against the raw (percent-encoded) request path.
    request: { method: 'GET', url: `/${encodeURIComponent(fileName)}`, regexPattern: false },
    response: { status: 200, bodyFile: fileName },
  }
}

export function toForm({ request, response }: MockPair): MockForm {
  return {
    method: request.method.toUpperCase(),
    url: request.url,
    regexPattern: Boolean(request.regexPattern),
    status: response.status,
    bodyMode: response.bodyFile ? 'file' : response.body !== undefined ? 'text' : 'none',
    body: response.body ?? '',
    bodyFile: response.bodyFile ?? null,
    contentType: response.contentType ?? '',
    headers: Object.entries(response.headers ?? {}).map(([name, value]) => newHeaderRow(name, value)),
  }
}

/** Converts a validated form to the API model, keeping only the fields of the selected body mode. */
export function fromForm(form: MockForm): MockPair {
  const response: MockResponse = { status: Number(form.status) }
  if (form.bodyMode === 'text') response.body = form.body
  if (form.bodyMode === 'file' && form.bodyFile) response.bodyFile = form.bodyFile
  if (form.bodyMode !== 'none' && form.contentType.trim()) response.contentType = form.contentType.trim()

  const headers = form.headers.filter((row) => row.name.trim() !== '')
  if (headers.length > 0) {
    response.headers = Object.fromEntries(headers.map((row) => [row.name.trim(), row.value]))
  }
  return {
    request: { method: form.method, url: form.url.trim(), regexPattern: form.regexPattern },
    response,
  }
}

/**
 * Catches mistakes the server would either reject or silently accept as a mock that never matches.
 * Regex syntax is left to the server: Java and JavaScript regexes differ.
 */
export function validateForm(form: MockForm): FormErrors {
  const errors: FormErrors = {}
  const url = form.url.trim()
  if (!url) {
    errors.url = 'Enter the path to mock, e.g. /users/*'
  } else if (!form.regexPattern && !url.startsWith('/') && !url.startsWith('*')) {
    errors.url = 'Paths start with /, e.g. /users/*'
  }

  const status = Number(form.status)
  if (!Number.isInteger(status) || status < 100 || status > 599) {
    errors.status = 'Use a status code between 100 and 599'
  }

  if (form.bodyMode === 'file' && !form.bodyFile) {
    errors.bodyFile = 'Choose or upload the file to return'
  }

  if (form.headers.some((row) => !row.name.trim() && row.value.trim())) {
    errors.headers = 'Every header needs a name'
  }
  return errors
}
