import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '../workspace/WorkspaceContext'
import { fetchFiles, fetchMocks, saveMocks, saveRawMocks, uploadFile } from './mockhub'
import type { MockPair } from './types'

/** React Query hooks for the selected workspace. Every save replaces the workspace's whole mock list. */

const mocksKey = (workspaceId: string) => ['mocks', workspaceId] as const
const filesKey = (workspaceId: string) => ['files', workspaceId] as const

/**
 * Mutations sharing a scope run one after another. Every save replaces the whole list, so two saves
 * running at once would each start from the same list and the second would undo the first.
 */
const mocksScope = (workspaceId: string) => ({ id: `mocks:${workspaceId}` })

export function useMocks() {
  const { workspace, prefix } = useWorkspace()
  return useQuery({ queryKey: mocksKey(workspace.id), queryFn: () => fetchMocks(prefix) })
}

/**
 * Applies a change to the mock list and saves the result. The change is applied to the list the user
 * sees (loading it first if needed), so that a save can never drop mocks that were not loaded yet.
 */
export function useUpdateMocks() {
  const { workspace, prefix } = useWorkspace()
  const queryClient = useQueryClient()
  return useMutation({
    scope: mocksScope(workspace.id),
    mutationFn: async (change: (current: MockPair[]) => MockPair[]) => {
      const current = await queryClient.ensureQueryData({
        queryKey: mocksKey(workspace.id),
        queryFn: () => fetchMocks(prefix),
      })
      return saveMocks(prefix, change(current))
    },
    onSuccess: (saved) => queryClient.setQueryData(mocksKey(workspace.id), saved),
  })
}

export function useSaveRawMocks() {
  const { workspace, prefix } = useWorkspace()
  const queryClient = useQueryClient()
  return useMutation({
    scope: mocksScope(workspace.id),
    mutationFn: (json: string) => saveRawMocks(prefix, json),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: mocksKey(workspace.id) }),
  })
}

export function useFiles() {
  const { workspace, prefix } = useWorkspace()
  return useQuery({ queryKey: filesKey(workspace.id), queryFn: () => fetchFiles(prefix) })
}

/** Uploads files one after another; stops at the first failure. Resolves to the uploaded file names. */
export function useUploadFiles() {
  const { workspace, prefix } = useWorkspace()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (files: File[]) => {
      for (const file of files) {
        await uploadFile(prefix, file)
      }
      return files.map((file) => file.name)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: filesKey(workspace.id) }),
  })
}
