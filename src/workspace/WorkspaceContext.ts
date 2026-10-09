import { createContext, useContext } from 'react'
import type { Workspace } from './workspaces'

export interface WorkspaceContextValue {
  /** The selected workspace. */
  workspace: Workspace
  /** Path prefix of the selected workspace's endpoints (see workspacePrefix). */
  prefix: string
  /** The global workspace followed by the workspaces remembered in this browser. */
  workspaces: Workspace[]
  select: (id: string) => void
  /** Remembers the workspace (or renames it if already known) and selects it. */
  add: (workspace: Workspace) => void
  /** Removes the workspace from this browser only; its mocks stay on the server. */
  forget: (id: string) => void
}

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error('useWorkspace must be used inside <WorkspaceProvider>')
  return context
}
