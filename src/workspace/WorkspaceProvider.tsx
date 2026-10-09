import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { WorkspaceContext, type WorkspaceContextValue } from './WorkspaceContext'
import {
  GLOBAL_WORKSPACE,
  loadCurrentWorkspaceId,
  loadSavedWorkspaces,
  readWorkspaceIdFromUrl,
  storeCurrentWorkspaceId,
  storeSavedWorkspaces,
  workspacePrefix,
  writeWorkspaceIdToUrl,
  type Workspace,
} from './workspaces'

interface InitialState {
  saved: Workspace[]
  currentId: string
}

/** A `?workspace=<uuid>` link wins over the last used workspace, and is remembered if it is new. */
function initialState(): InitialState {
  const saved = loadSavedWorkspaces()
  const idFromUrl = readWorkspaceIdFromUrl()
  if (idFromUrl) {
    const known = saved.some((workspace) => workspace.id === idFromUrl)
    return {
      saved: known ? saved : [...saved, { id: idFromUrl, name: 'Shared workspace' }],
      currentId: idFromUrl,
    }
  }
  return { saved, currentId: loadCurrentWorkspaceId() ?? GLOBAL_WORKSPACE.id }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState)

  const workspaces = useMemo(() => [GLOBAL_WORKSPACE, ...state.saved], [state.saved])
  const workspace = workspaces.find((candidate) => candidate.id === state.currentId) ?? GLOBAL_WORKSPACE

  useEffect(() => storeSavedWorkspaces(state.saved), [state.saved])
  useEffect(() => {
    storeCurrentWorkspaceId(workspace.id)
    writeWorkspaceIdToUrl(workspace)
  }, [workspace])

  const select = useCallback((id: string) => setState((previous) => ({ ...previous, currentId: id })), [])

  const add = useCallback((added: Workspace) => {
    setState((previous) => ({
      saved: [...previous.saved.filter((existing) => existing.id !== added.id), added],
      currentId: added.id,
    }))
  }, [])

  const forget = useCallback((id: string) => {
    setState((previous) => ({
      saved: previous.saved.filter((existing) => existing.id !== id),
      currentId: previous.currentId === id ? GLOBAL_WORKSPACE.id : previous.currentId,
    }))
  }, [])

  const value = useMemo<WorkspaceContextValue>(
    () => ({ workspace, prefix: workspacePrefix(workspace), workspaces, select, add, forget }),
    [workspace, workspaces, select, add, forget],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
