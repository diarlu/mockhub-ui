import { Alert, Badge, Button, Code, Group, Image, Paper, ScrollArea, Stack, Table, Tabs, Text } from '@mantine/core'
import { IconDownload } from '@tabler/icons-react'
import type { TestResult } from '../api/mockhub'
import { statusColor, statusText } from '../lib/http'

/** Body the server sends when no mock matches the request. */
const NO_MOCK_FOUND = 'No mock response found.'

export function ResponseViewer({ result }: { result: TestResult }) {
  const noMockMatched = result.status === 404 && result.text === NO_MOCK_FOUND

  return (
    <Paper withBorder p="md">
      <Stack gap="sm">
        <Group gap="sm">
          <Badge size="lg" color={statusColor(result.status)} variant="light">
            {result.status} {result.statusText || statusText(result.status)}
          </Badge>
          <Text size="sm" c="dimmed">
            {result.durationMs} ms · {formatBytes(result.size)}
          </Text>
        </Group>

        {noMockMatched && (
          <Alert color="yellow" variant="light">
            No mock matched this request. Check the method and the path, and that the mock is in this workspace.
          </Alert>
        )}

        <Tabs defaultValue="body">
          <Tabs.List>
            <Tabs.Tab value="body">Body</Tabs.Tab>
            <Tabs.Tab value="headers">Headers ({result.headers.length})</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="body" pt="sm">
            <BodyPreview result={result} />
          </Tabs.Panel>
          <Tabs.Panel value="headers" pt="sm">
            <Table fz="sm" verticalSpacing={4}>
              <Table.Tbody>
                {result.headers.map(([name, value]) => (
                  <Table.Tr key={name}>
                    <Table.Td fw={500} w="35%">
                      {name}
                    </Table.Td>
                    <Table.Td ff="monospace" style={{ wordBreak: 'break-all' }}>
                      {value}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Paper>
  )
}

function BodyPreview({ result }: { result: TestResult }) {
  if (result.size === 0) {
    return (
      <Text size="sm" c="dimmed">
        Empty body
      </Text>
    )
  }

  if (result.text !== null) {
    return (
      <ScrollArea.Autosize mah={360}>
        <Code block style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {prettyJson(result.text)}
        </Code>
      </ScrollArea.Autosize>
    )
  }

  return (
    <Stack gap="xs" align="flex-start">
      {result.contentType.startsWith('image/') && result.dataUrl && (
        <Image src={result.dataUrl} alt="Response body" mah={320} w="auto" fit="contain" radius="sm" />
      )}
      <Group gap="xs">
        <Text size="sm" c="dimmed">
          {result.contentType || 'Binary content'}
        </Text>
        {result.dataUrl && (
          <Button component="a" href={result.dataUrl} download="response" size="xs" variant="default" leftSection={<IconDownload size={14} />}>
            Download
          </Button>
        )}
      </Group>
    </Stack>
  )
}

function prettyJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
