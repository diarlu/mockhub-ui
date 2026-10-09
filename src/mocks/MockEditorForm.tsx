import {
  Anchor,
  Autocomplete,
  Button,
  Code,
  Fieldset,
  FileButton,
  Group,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core'
import { IconUpload } from '@tabler/icons-react'
import { useRef, useState, type FormEvent } from 'react'
import { absoluteApiUrl } from '../api/client'
import { isJson } from '../api/mockhub'
import { useFiles, useUploadFiles } from '../api/queries'
import type { MockPair } from '../api/types'
import { ErrorAlert } from '../components/ErrorAlert'
import { CONTENT_TYPES, HTTP_METHODS, statusText } from '../lib/http'
import { notifyError } from '../lib/notify'
import { MONOSPACE_INPUT } from '../lib/styles'
import { useWorkspace } from '../workspace/WorkspaceContext'
import { HeadersEditor } from './HeadersEditor'
import { fromForm, toForm, validateForm, type BodyMode, type MockForm } from './mockForm'


interface MockEditorFormProps {
  initial: MockPair
  /** Saves the mock; rejects with the server's error. */
  onSave: (mock: MockPair) => Promise<void>
  onCancel: () => void
}

export function MockEditorForm({ initial, onSave, onCancel }: MockEditorFormProps) {
  const { prefix } = useWorkspace()
  const files = useFiles()
  const upload = useUploadFiles()
  const resetFileButton = useRef<() => void>(null)

  const [form, setForm] = useState(() => toForm(initial))
  // Errors appear after the first save attempt, not while the user is still typing.
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<unknown>(null)

  const errors = validateForm(form)
  const shownErrors = submitted ? errors : {}

  const set = <K extends keyof MockForm>(key: K, value: MockForm[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length > 0) return

    setSaving(true)
    setSaveError(null)
    try {
      await onSave(fromForm(form))
    } catch (error) {
      setSaveError(error)
    } finally {
      setSaving(false)
    }
  }

  const handleUpload = (file: File | null) => {
    resetFileButton.current?.()
    if (!file) return
    upload.mutate([file], {
      onSuccess: ([name]) => set('bodyFile', name),
      onError: (error) => notifyError(error, 'Upload failed'),
    })
  }

  const bodyIsJson = form.body.trim() !== '' && isJson(form.body)
  const expectsJson = form.contentType.toLowerCase().includes('json')
  const servedAt = `${absoluteApiUrl(prefix)}${form.url.trim() || '/'}`

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="lg">
        <Fieldset legend="Request">
          <Stack gap="sm">
            <Group gap="xs" align="flex-start" wrap="nowrap">
              <Select
                label="Method"
                data={HTTP_METHODS}
                value={form.method}
                onChange={(value) => value && set('method', value)}
                allowDeselect={false}
                w={120}
              />
              <TextInput
                label="Path"
                placeholder="/users/*"
                value={form.url}
                onChange={(event) => set('url', event.currentTarget.value)}
                error={shownErrors.url}
                styles={MONOSPACE_INPUT}
                style={{ flex: 1 }}
                data-autofocus
              />
            </Group>
            <Switch
              label="Regular expression"
              description={
                form.regexPattern ? (
                  <>
                    Java regex matching the whole path, e.g. <Code>/orders/\d+</Code>
                  </>
                ) : (
                  <>
                    Off: the path is matched literally, <Code>*</Code> matches anything (e.g. <Code>/users/*</Code>)
                  </>
                )
              }
              checked={form.regexPattern}
              onChange={(event) => set('regexPattern', event.currentTarget.checked)}
            />
            <Text size="xs" c="dimmed">
              Served at{' '}
              <Text span ff="monospace" size="xs" style={{ wordBreak: 'break-all' }}>
                {servedAt}
              </Text>
            </Text>
          </Stack>
        </Fieldset>

        <Fieldset legend="Response">
          <Stack gap="md">
            <Group gap="xs" align="flex-start" wrap="nowrap">
              <NumberInput
                label="Status"
                description={statusText(Number(form.status)) || 'HTTP status code'}
                value={form.status}
                onChange={(value) => set('status', value)}
                min={100}
                max={599}
                allowDecimal={false}
                error={shownErrors.status}
                w={140}
              />
              {form.bodyMode !== 'none' && (
                <Autocomplete
                  label="Content type"
                  description={form.bodyMode === 'file' ? 'Empty: derived from the file extension' : 'Optional'}
                  placeholder="application/json"
                  data={CONTENT_TYPES}
                  value={form.contentType}
                  onChange={(value) => set('contentType', value)}
                  style={{ flex: 1 }}
                />
              )}
            </Group>

            <Stack gap={6}>
              <Text size="sm" fw={500}>
                Body
              </Text>
              <SegmentedControl
                value={form.bodyMode}
                onChange={(value) => set('bodyMode', value as BodyMode)}
                data={[
                  { value: 'text', label: 'Text / JSON' },
                  { value: 'file', label: 'Uploaded file' },
                  { value: 'none', label: 'No body' },
                ]}
              />
            </Stack>

            {form.bodyMode === 'text' && (
              <Stack gap={6}>
                <Textarea
                  aria-label="Response body"
                  placeholder={'{\n  "id": 1\n}'}
                  value={form.body}
                  onChange={(event) => set('body', event.currentTarget.value)}
                  autosize
                  minRows={6}
                  maxRows={18}
                  styles={MONOSPACE_INPUT}
                />
                <Group gap="md">
                  {bodyIsJson && (
                    <Anchor component="button" type="button" size="xs" onClick={() => set('body', JSON.stringify(JSON.parse(form.body), null, 2))}>
                      Format JSON
                    </Anchor>
                  )}
                  {bodyIsJson && !form.contentType.trim() && (
                    <Anchor component="button" type="button" size="xs" onClick={() => set('contentType', 'application/json')}>
                      Set content type to application/json
                    </Anchor>
                  )}
                  {expectsJson && form.body.trim() !== '' && !bodyIsJson && (
                    <Text size="xs" c="orange">
                      This is not valid JSON. It will be returned exactly as written.
                    </Text>
                  )}
                </Group>
              </Stack>
            )}

            {form.bodyMode === 'file' && (
              <Group gap="xs" align="flex-end" wrap="nowrap">
                <Select
                  label="File"
                  placeholder={files.data?.length ? 'Choose an uploaded file' : 'No files uploaded yet'}
                  data={files.data ?? []}
                  value={form.bodyFile}
                  onChange={(value) => set('bodyFile', value)}
                  searchable
                  nothingFoundMessage="No such file"
                  error={shownErrors.bodyFile}
                  style={{ flex: 1 }}
                />
                <FileButton onChange={handleUpload} resetRef={resetFileButton}>
                  {(props) => (
                    <Button {...props} variant="default" leftSection={<IconUpload size={16} />} loading={upload.isPending}>
                      Upload
                    </Button>
                  )}
                </FileButton>
              </Group>
            )}

            <HeadersEditor rows={form.headers} onChange={(rows) => set('headers', rows)} error={shownErrors.headers} />
          </Stack>
        </Fieldset>

        {saveError !== null && <ErrorAlert error={saveError} title="The server rejected this mock" />}

        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save mock
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
