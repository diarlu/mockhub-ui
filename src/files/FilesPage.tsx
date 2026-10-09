import { Button, Center, FileButton, Group, Loader, Paper, Stack, Table, Text, ThemeIcon } from '@mantine/core'
import { IconFile, IconPlus, IconUpload } from '@tabler/icons-react'
import { useRef, useState, type DragEvent } from 'react'
import { useFiles, useUploadFiles } from '../api/queries'
import { CopyIconButton } from '../components/CopyIconButton'
import { ErrorAlert } from '../components/ErrorAlert'
import { notifyError, notifySuccess } from '../lib/notify'
import { useMockEditor } from '../mocks/MockEditorContext'
import { fileMock } from '../mocks/mockForm'

interface FilesPageProps {
  /** Switches to the Mocks tab, so a mock created from a file shows up in the list. */
  onShowMocks: () => void
}

export function FilesPage({ onShowMocks }: FilesPageProps) {
  const files = useFiles()
  const upload = useUploadFiles()
  const { openNew } = useMockEditor()
  const resetFileButton = useRef<() => void>(null)
  const [dragging, setDragging] = useState(false)

  const uploadAll = (selected: File[]) => {
    resetFileButton.current?.()
    if (selected.length === 0) return
    upload.mutate(selected, {
      onSuccess: (names) => notifySuccess(names.length === 1 ? `Uploaded ${names[0]}` : `Uploaded ${names.length} files`),
      onError: (error) => notifyError(error, 'Upload failed'),
    })
  }

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    uploadAll([...event.dataTransfer.files])
  }

  const handleDragLeave = (event: DragEvent) => {
    // Moving over a child element also fires dragleave; only react when the pointer leaves the zone.
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
  }

  const createMock = (fileName: string) => {
    openNew(fileMock(fileName))
    onShowMocks()
  }

  return (
    <Stack gap="md">
      <Paper
        withBorder
        radius="md"
        p="xl"
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          borderStyle: 'dashed',
          borderWidth: 2,
          borderColor: dragging ? 'var(--mantine-primary-color-filled)' : undefined,
          background: dragging ? 'var(--mantine-primary-color-light)' : undefined,
        }}
      >
        <Stack align="center" gap="xs">
          <ThemeIcon size={48} radius="xl" variant="light">
            <IconUpload size={26} />
          </ThemeIcon>
          <Text fw={500}>Drop files here to upload</Text>
          <Text size="sm" c="dimmed" ta="center" maw={480}>
            Return them as response bodies: images, PDFs, JSON fixtures, anything. Uploading a file with an existing
            name replaces it.
          </Text>
          <FileButton multiple onChange={uploadAll} resetRef={resetFileButton}>
            {(props) => (
              <Button {...props} variant="light" loading={upload.isPending}>
                Choose files
              </Button>
            )}
          </FileButton>
        </Stack>
      </Paper>

      {files.isPending && (
        <Center py="md">
          <Loader size="sm" />
        </Center>
      )}
      {files.isError && <ErrorAlert error={files.error} title="Could not load the files" onRetry={() => void files.refetch()} />}
      {files.isSuccess && files.data.length === 0 && (
        <Text size="sm" c="dimmed" ta="center">
          No files uploaded to this workspace yet.
        </Text>
      )}
      {files.isSuccess && files.data.length > 0 && (
        <Paper withBorder radius="md">
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>File</Table.Th>
                <Table.Th w={190} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {files.data.map((name) => (
                <Table.Tr key={name}>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      <IconFile size={16} color="var(--mantine-color-dimmed)" />
                      <Text ff="monospace" size="sm" style={{ wordBreak: 'break-all' }}>
                        {name}
                      </Text>
                      <CopyIconButton value={name} label="Copy file name" />
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group justify="flex-end">
                      <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={() => createMock(name)}>
                        Create mock
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Stack>
  )
}
