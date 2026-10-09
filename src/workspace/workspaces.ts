/**
 * A workspace is a mock namespace on the server: the global one, or one created with POST /register
 * and identified by a UUID. The server does not list workspaces, so the UI remembers the ones the user
 * created or opened in localStorage.
 */
export interface Workspace {
  /** `'global'` or the workspace UUID. */
  id: string
  name: string
}

export const GLOBAL_WORKSPACE: Workspace = { id: 'global', name: 'Global' }

const WORKSPACES_KEY = 'mockhub.workspaces'
const CURRENT_KEY = 'mockhub.currentWorkspace'
const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

export function isGlobal(workspace: Workspace): boolean {
  return workspace.id === GLOBAL_WORKSPACE.id
}

/** Path prefix of the workspace's endpoints: `''` for the global workspace, `'/{uuid}'` otherwise. */
export function workspacePrefix(workspace: Workspace): string {
  return isGlobal(workspace) ? '' : `/${workspace.id}`
}

/** Finds a workspace ID anywhere in the text, so users can paste a full mock URL or share link. */
export function extractWorkspaceId(text: string): string | null {
  return text.match(UUID_PATTERN)?.[0].toLowerCase() ?? null
}

export function shortId(id: string): string {
  return id.slice(0, 8)
}

/** Link that opens the UI in the given workspace (see readWorkspaceIdFromUrl). */
export function shareLink(workspace: Workspace): string {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  if (!isGlobal(workspace)) url.searchParams.set('workspace', workspace.id)
  return url.toString()
}

export function readWorkspaceIdFromUrl(): string | null {
  const value = new URLSearchParams(window.location.search).get('workspace')
  return value ? extractWorkspaceId(value) : null
}

/** Keeps the address bar in sync with the selected workspace, so it can be bookmarked or shared. */
export function writeWorkspaceIdToUrl(workspace: Workspace): void {
  window.history.replaceState(null, '', shareLink(workspace))
}

// Storage can be unavailable (private mode, blocked site data); the UI then simply forgets workspaces.

export function loadSavedWorkspaces(): Workspace[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(WORKSPACES_KEY) ?? '[]')
    return Array.isArray(parsed)
      ? parsed.filter((item): item is Workspace =>
          typeof item?.id === 'string' && typeof item?.name === 'string' && extractWorkspaceId(item.id) === item.id)
      : []
  } catch {
    return []
  }
}

export function storeSavedWorkspaces(workspaces: Workspace[]): void {
  try {
    localStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaces))
  } catch {
    // Ignored, see above.
  }
}

export function loadCurrentWorkspaceId(): string | null {
  try {
    return localStorage.getItem(CURRENT_KEY)
  } catch {
    return null
  }
}

export function storeCurrentWorkspaceId(id: string): void {
  try {
    localStorage.setItem(CURRENT_KEY, id)
  } catch {
    // Ignored, see above.
  }
}
