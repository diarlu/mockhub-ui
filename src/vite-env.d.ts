/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the MockHub API as seen from the browser. Defaults to `/api` (proxied to the server); see .env.embedded. */
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
