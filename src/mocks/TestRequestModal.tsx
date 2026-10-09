import { Button, CopyButton, Group, Modal, Select, Stack, Text, TextInput, Textarea } from '@mantine/core'
import { IconCheck, IconSend, IconTerminal2 } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { absoluteApiUrl } from '../api/client'
import { guessContentType, sendTestRequest } from '../api/mockhub'
import type { MockPair } from '../api/types'
import { CopyIconButton } from '../components/CopyIconButton'
import { ErrorAlert } from '../components/ErrorAlert'
import { HTTP_METHODS, methodAllowsBody, samplePath } from '../lib/http'
import { MONOSPACE_INPUT } from '../lib/styles'
import { useWorkspace } from '../workspace/WorkspaceContext'
import { ResponseViewer } from './ResponseViewer'


interface TestRequestModalProps {
  /** The mock to test, or null when the modal is closed. */
  mock: MockPair | null
  onClose: () => void
}

export function TestRequestModal({ mock, onClose }: TestRequestModalProps) {
  return (
    <Modal opened={mock !== null} onClose={onClose} title="Send a test request" size="xl">
      {mock && <TestRequestForm mock={mock} />}
    </Modal>
  )
}

function TestRequestForm({ mock }: { mock: MockPair }) {
  const { prefix } = useWorkspace()
  const [method, setMethod] = useState(mock.request.method.toUpperCase())
  const [path, setPath] = useState(() => samplePath(mock.request))
  const [body, setBody] = useState('')

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const requestBody = methodAllowsBody(method) ? body : ''
  const fullUrl = absoluteApiUrl(prefix + normalizedPath)
  const isPattern = mock.request.regexPattern || mock.request.url.includes('*')

  const send = useMutation({ mutationFn: () => sendTestRequest(prefix, method, normalizedPath, requestBody) })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    send.mutate()
  }

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Sends a real request to the server, answered by the saved mocks of this workspace.
        {isPattern && ' The path was filled in from the pattern; change it to any value the pattern matches.'}
      </Text>

      <form onSubmit={handleSubmit}>
        <Group gap="xs" wrap="nowrap" align="flex-start">
          <Select
            aria-label="Method"
            data={HTTP_METHODS}
            value={method}
            onChange={(value) => value && setMethod(value)}
            allowDeselect={false}
            w={120}
          />
          <TextInput
            aria-label="Path"
            value={path}
            onChange={(event) => setPath(event.currentTarget.value)}
            styles={MONOSPACE_INPUT}
            style={{ flex: 1 }}
            data-autofocus
          />
          <Button type="submit" loading={send.isPending} leftSection={<IconSend size={16} />}>
            Send
          </Button>
        </Group>
      </form>

      {methodAllowsBody(method) && (
        <Textarea
          label="Request body"
          description="Optional. Mocks match on method and path only, so the body does not change the answer."
          value={body}
          onChange={(event) => setBody(event.currentTarget.value)}
          autosize
          minRows={2}
          maxRows={10}
          styles={MONOSPACE_INPUT}
        />
      )}

      <Group gap={4} wrap="nowrap">
        <Text size="xs" c="dimmed" ff="monospace" truncate="end" style={{ flex: 1 }}>
          {fullUrl}
        </Text>
        <CopyIconButton value={fullUrl} label="Copy URL" />
        <CopyButton value={curlCommand(method, fullUrl, requestBody)} timeout={1500}>
          {({ copied, copy }) => (
            <Button
              size="xs"
              variant="subtle"
              color={copied ? 'teal' : 'gray'}
              leftSection={copied ? <IconCheck size={14} /> : <IconTerminal2 size={14} />}
              onClick={copy}
            >
              {copied ? 'Copied' : 'Copy as curl'}
            </Button>
          )}
        </CopyButton>
      </Group>

      {send.error && <ErrorAlert error={send.error} />}
      {send.data && <ResponseViewer result={send.data} />}
    </Stack>
  )
}

/** A POSIX-shell curl command equivalent to the test request. */
function curlCommand(method: string, url: string, body: string): string {
  const quote = (value: string) => `'${value.replaceAll("'", `'\\''`)}'`
  const parts = ['curl', '-i', '-X', method, quote(url)]
  if (body) {
    parts.push('-H', quote(`Content-Type: ${guessContentType(body)}`), '--data', quote(body))
  }
  return parts.join(' ')
}
