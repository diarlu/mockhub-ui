import type { MockPair, MockRequest } from '../api/types'

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

export const CONTENT_TYPES = [
  'application/json',
  'text/plain',
  'text/html',
  'application/xml',
  'text/csv',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/svg+xml',
  'application/octet-stream',
]

const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  204: 'No Content',
  301: 'Moved Permanently',
  302: 'Found',
  304: 'Not Modified',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  409: 'Conflict',
  422: 'Unprocessable Content',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
}

export function statusText(status: number): string {
  return STATUS_TEXT[status] ?? ''
}

export function statusColor(status: number): string {
  if (status >= 500) return 'red'
  if (status >= 400) return 'orange'
  if (status >= 300) return 'cyan'
  if (status >= 200) return 'teal'
  return 'gray'
}

export function methodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: 'blue',
    POST: 'teal',
    PUT: 'orange',
    PATCH: 'yellow',
    DELETE: 'red',
    HEAD: 'gray',
    OPTIONS: 'grape',
  }
  return colors[method.toUpperCase()] ?? 'gray'
}

export function methodAllowsBody(method: string): boolean {
  return !['GET', 'HEAD'].includes(method.toUpperCase())
}

/**
 * Common regex fragments and a concrete text they match. Used to turn a mock's regex into a path the user
 * can send right away; anything not covered is left as is for the user to edit.
 */
const REGEX_SAMPLES: [RegExp, string][] = [
  [/^\^|\$$/g, ''],
  [/\\d[+*]|\[0-9\][+*]/g, '123'],
  [/\\d|\[0-9\]/g, '1'],
  [/\\w[+*]|\[\^\/\][+*]|\[a-zA-Z0-9_-]*\][+*]|\.[+*]/g, 'abc'],
  [/\\([./-])/g, '$1'],
]

/** A concrete path that matches the mock's URL pattern, as a starting point for a test request. */
export function samplePath({ url, regexPattern }: MockRequest): string {
  const path = regexPattern
    ? REGEX_SAMPLES.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), url)
    : url.replaceAll('*', '1')
  return path.startsWith('/') ? path : `/${path}`
}

/** Starter mocks for an empty workspace, one per matching style the server supports. */
export const EXAMPLE_MOCKS: MockPair[] = [
  {
    request: { method: 'GET', url: '/hello', regexPattern: false },
    response: { status: 200, body: 'Hello from MockHub!', contentType: 'text/plain' },
  },
  {
    request: { method: 'GET', url: '/users/*', regexPattern: false },
    response: { status: 200, contentType: 'application/json', body: '{\n  "id": 42,\n  "name": "Jane Doe"\n}' },
  },
  {
    request: { method: 'GET', url: '/orders/\\d+', regexPattern: true },
    response: { status: 200, contentType: 'application/json', body: '{\n  "orderId": 1001,\n  "status": "SHIPPED"\n}' },
  },
  {
    request: { method: 'POST', url: '/users', regexPattern: false },
    response: { status: 201, contentType: 'application/json', headers: { Location: '/users/42' }, body: '{\n  "id": 42\n}' },
  },
  {
    request: { method: 'DELETE', url: '/users/*', regexPattern: false },
    response: { status: 204 },
  },
]
