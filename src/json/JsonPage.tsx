import { Button, Center, FileButton, Group, JsonInput, Loader, Stack, Text } from '@mantine/core'
import { IconDeviceFloppy, IconDownload, IconFileImport } from '@tabler/icons-react'
import { useMemo, useRef, useState } from 'react'
import { isJson } from '../api/mockhub'
import { useMocks, useSaveRawMocks } from '../api/queries'
import { ErrorAlert } from '../components/ErrorAlert'
import { notifyError, notifySuccess } from '../lib/notify'
import { MONOSPACE_INPUT } from '../lib/styles'

/** Edits the workspace's whole mock list as JSON, in the format POST /mockpairs accepts. */
export function JsonPage() {
  const mocks = useMocks()
  const save = useSaveRawMocks()
  const resetFileButton = useRef<() => void>(null)
  // null while the user has not edited anything: the editor then follows the server's list.
  const [draft, setDraft] = useState<string | null>(null)

  const serverText = useMemo(() => JSON.stringify(mocks.data ?? [], null, 2), [mocks.data])
  const value = draft ?? serverText
  const dirty = draft !== null && draft !== serverText
  const problem = jsonProblem(value)

  /** `null` drops the draft and goes back to the server's list. */
  const edit = (text: string | null) => {
    save.reset()
    setDraft(text)
  }

  const handleSave = () =>
    save.mutate(value, {
      onSuccess: () => {
        setDraft(null)
        notifySuccess('Mocks saved')
      },
    })

  const handleImport = async (file: File | null) => {
    resetFileButton.current?.()
    if (!file) return
    try {
      edit(await file.text())
    } catch (error) {
      notifyError(error, 'Could not read the file')
    }
  }

  const handleDownload = () => {
    const url = URL.createObjectURL(new Blob([value], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'mocks.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  if (mocks.isPending) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    )
  }
  if (mocks.isError) {
    return <ErrorAlert error={mocks.error} title="Could not load the mocks" onRetry={() => void mocks.refetch()} />
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Text size="sm" c="dimmed" maw={520}>
          All mocks of this workspace as JSON, in the same format as <code>POST /mockpairs</code>. Saving replaces every
          mock in the workspace.
        </Text>
        <Group gap="xs">
          <FileButton accept="application/json,.json" onChange={handleImport} resetRef={resetFileButton}>
            {(props) => (
              <Button {...props} variant="default" leftSection={<IconFileImport size={16} />}>
                Import
              </Button>
            )}
          </FileButton>
          <Button variant="default" leftSection={<IconDownload size={16} />} onClick={handleDownload}>
            Download
          </Button>
          <Button variant="default" disabled={!dirty} onClick={() => edit(null)}>
            Revert
          </Button>
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            disabled={!dirty || problem !== null}
            loading={save.isPending}
            onClick={handleSave}
          >
            Save
          </Button>
        </Group>
      </Group>

      {save.isError && <ErrorAlert error={save.error} title="The server rejected the mocks" />}

      <JsonInput
        aria-label="Mocks JSON"
        value={value}
        onChange={edit}
        error={dirty ? problem : null}
        formatOnBlur
        autosize
        minRows={18}
        maxRows={40}
        styles={MONOSPACE_INPUT}
      />
    </Stack>
  )
}

/** Client-side check before saving; the server validates the individual mocks. */
function jsonProblem(text: string): string | null {
  if (!isJson(text)) return 'Invalid JSON'
  return Array.isArray(JSON.parse(text)) ? null : 'The mocks must be a JSON array: [ { "request": …, "response": … } ]'
}
