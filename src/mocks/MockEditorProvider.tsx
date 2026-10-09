import { Drawer } from '@mantine/core'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useUpdateMocks } from '../api/queries'
import type { MockPair } from '../api/types'
import { notifySuccess } from '../lib/notify'
import { MockEditorContext, type MockEditorApi } from './MockEditorContext'
import { MockEditorForm } from './MockEditorForm'
import { NEW_MOCK } from './mockForm'

interface EditorTarget {
  /** Position in the mock list, or null for a new mock (appended at the end). */
  index: number | null
  mock: MockPair
  /** Remounts the form, so that reopening the editor starts from fresh state. */
  key: number
}

/** Hosts the mock editor drawer, so that every page (e.g. Files) can open it. */
export function MockEditorProvider({ children }: { children: ReactNode }) {
  const [opened, setOpened] = useState(false)
  // Kept after closing, so the drawer still has content during its closing animation.
  const [target, setTarget] = useState<EditorTarget | null>(null)
  const updateMocks = useUpdateMocks()

  const openNew = useCallback((draft: MockPair = NEW_MOCK) => {
    setTarget({ index: null, mock: draft, key: Date.now() })
    setOpened(true)
  }, [])

  const openExisting = useCallback((index: number, mock: MockPair) => {
    setTarget({ index, mock, key: Date.now() })
    setOpened(true)
  }, [])

  const api = useMemo<MockEditorApi>(() => ({ openNew, openExisting }), [openNew, openExisting])

  /** Rejects with the server's error, which the form shows next to its buttons. */
  const save = async (mock: MockPair) => {
    const index = target?.index ?? null
    await updateMocks.mutateAsync((current) =>
      index === null ? [...current, mock] : current.map((existing, i) => (i === index ? mock : existing)),
    )
    notifySuccess(index === null ? 'Mock created' : 'Mock saved')
    setOpened(false)
  }

  const title = target?.index == null ? 'New mock' : `Edit mock #${target.index + 1}`

  return (
    <MockEditorContext.Provider value={api}>
      {children}
      <Drawer opened={opened} onClose={() => setOpened(false)} title={title} position="right" size="xl">
        {target && (
          <MockEditorForm key={target.key} initial={target.mock} onSave={save} onCancel={() => setOpened(false)} />
        )}
      </Drawer>
    </MockEditorContext.Provider>
  )
}
