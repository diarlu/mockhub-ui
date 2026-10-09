import { createContext, useContext } from 'react'
import type { MockPair } from '../api/types'

export interface MockEditorApi {
  /** Opens the editor for a new mock, optionally prefilled. */
  openNew: (draft?: MockPair) => void
  /** Opens the editor for the mock at `index` in the workspace's list. */
  openExisting: (index: number, mock: MockPair) => void
}

export const MockEditorContext = createContext<MockEditorApi | null>(null)

export function useMockEditor(): MockEditorApi {
  const context = useContext(MockEditorContext)
  if (!context) throw new Error('useMockEditor must be used inside <MockEditorProvider>')
  return context
}
