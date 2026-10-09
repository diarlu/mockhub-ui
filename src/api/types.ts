/** Mirrors the backend models in com.github.diarlu.mockhub.models. */

export interface MockRequest {
  /** HTTP method, compared case-insensitively. */
  method: string
  /** Path to match. `*` is a wildcard unless `regexPattern` is set. */
  url: string
  /** When true, `url` is a Java regular expression that must match the whole path. */
  regexPattern?: boolean
}

export interface MockResponse {
  status: number
  body?: string
  /** Name of an uploaded file to return as the body; takes precedence over `body`. */
  bodyFile?: string
  headers?: Record<string, string>
  /** Overrides a Content-Type entry in `headers`. */
  contentType?: string
}

export interface MockPair {
  request: MockRequest
  response: MockResponse
}
