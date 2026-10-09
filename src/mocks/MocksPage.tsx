import {
  ActionIcon,
  Badge,
  Button,
  Center,
  Group,
  Loader,
  Menu,
  Modal,
  Paper,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core'
import {
  IconArrowDown,
  IconArrowUp,
  IconCopy,
  IconDots,
  IconPencil,
  IconPlayerPlay,
  IconPlus,
  IconRoute,
  IconTrash,
} from '@tabler/icons-react'
import { useState } from 'react'
import { useMocks, useUpdateMocks } from '../api/queries'
import type { MockPair, MockResponse } from '../api/types'
import { ErrorAlert } from '../components/ErrorAlert'
import { EXAMPLE_MOCKS, methodColor, statusColor } from '../lib/http'
import { notifyError, notifySuccess } from '../lib/notify'
import { useMockEditor } from './MockEditorContext'
import { TestRequestModal } from './TestRequestModal'

type MockListChange = (current: MockPair[]) => MockPair[]

export function MocksPage() {
  const mocks = useMocks()
  const updateMocks = useUpdateMocks()
  const { openNew, openExisting } = useMockEditor()
  const [testing, setTesting] = useState<MockPair | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

  const apply = (change: MockListChange, successMessage: string, onDone?: () => void) =>
    updateMocks.mutate(change, {
      onSuccess: () => notifySuccess(successMessage),
      onError: (error) => notifyError(error, 'Could not save the mocks'),
      onSettled: onDone,
    })

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

  const list = mocks.data
  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          A request is answered by the <b>first</b> mock that matches its method and path, so order matters.
        </Text>
        <Button leftSection={<IconPlus size={16} />} onClick={() => openNew()}>
          New mock
        </Button>
      </Group>

      {list.length === 0 ? (
        <EmptyState
          onCreate={() => openNew()}
          onAddExamples={() => apply((current) => [...current, ...EXAMPLE_MOCKS], 'Example mocks added')}
          addingExamples={updateMocks.isPending}
        />
      ) : (
        <Paper withBorder radius="md">
          <Table.ScrollContainer minWidth={720}>
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={40}>#</Table.Th>
                  <Table.Th w={100}>Method</Table.Th>
                  <Table.Th>Path</Table.Th>
                  <Table.Th>Response</Table.Th>
                  <Table.Th w={120} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {list.map((mock, index) => (
                  <Table.Tr key={index} onClick={() => openExisting(index, mock)} style={{ cursor: 'pointer' }}>
                    <Table.Td c="dimmed">{index + 1}</Table.Td>
                    <Table.Td>
                      <Badge color={methodColor(mock.request.method)} variant="light">
                        {mock.request.method}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={6} wrap="nowrap">
                        <Text ff="monospace" size="sm" style={{ wordBreak: 'break-all' }}>
                          {mock.request.url}
                        </Text>
                        {mock.request.regexPattern && (
                          <Badge size="xs" variant="outline" color="gray">
                            regex
                          </Badge>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap">
                        <Badge color={statusColor(mock.response.status)} variant="light">
                          {mock.response.status}
                        </Badge>
                        <Text size="sm" c="dimmed" truncate="end" maw={300}>
                          {responseSummary(mock.response)}
                        </Text>
                      </Group>
                    </Table.Td>
                    {/* Buttons act on the row without also opening the editor. */}
                    <Table.Td onClick={(event) => event.stopPropagation()}>
                      <Group gap={2} justify="flex-end" wrap="nowrap">
                        <Tooltip label="Send a test request">
                          <ActionIcon variant="subtle" onClick={() => setTesting(mock)} aria-label="Send a test request">
                            <IconPlayerPlay size={18} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Edit">
                          <ActionIcon variant="subtle" color="gray" onClick={() => openExisting(index, mock)} aria-label="Edit">
                            <IconPencil size={18} />
                          </ActionIcon>
                        </Tooltip>
                        <Menu position="bottom-end" withinPortal>
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray" aria-label="More actions">
                              <IconDots size={18} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconCopy size={16} />}
                              onClick={() => apply((current) => insertAt(current, index + 1, current[index]), 'Mock duplicated')}
                            >
                              Duplicate
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconArrowUp size={16} />}
                              disabled={index === 0}
                              onClick={() => apply((current) => swap(current, index, index - 1), 'Mock moved up')}
                            >
                              Move up
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconArrowDown size={16} />}
                              disabled={index === list.length - 1}
                              onClick={() => apply((current) => swap(current, index, index + 1), 'Mock moved down')}
                            >
                              Move down
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={() => setDeleteIndex(index)}>
                              Delete
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      )}

      <TestRequestModal mock={testing} onClose={() => setTesting(null)} />

      <Modal opened={deleteIndex !== null} onClose={() => setDeleteIndex(null)} title="Delete mock?" size="sm">
        {deleteIndex !== null && list[deleteIndex] && (
          <Stack>
            <Text size="sm">
              <b>{list[deleteIndex].request.method}</b>{' '}
              <Text span ff="monospace">
                {list[deleteIndex].request.url}
              </Text>{' '}
              will stop answering requests.
            </Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setDeleteIndex(null)}>
                Cancel
              </Button>
              <Button
                color="red"
                loading={updateMocks.isPending}
                onClick={() =>
                  apply(
                    (current) => current.filter((_, i) => i !== deleteIndex),
                    'Mock deleted',
                    () => setDeleteIndex(null),
                  )
                }
              >
                Delete
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}

interface EmptyStateProps {
  onCreate: () => void
  onAddExamples: () => void
  addingExamples: boolean
}

function EmptyState({ onCreate, onAddExamples, addingExamples }: EmptyStateProps) {
  return (
    <Paper withBorder radius="md" p="xl">
      <Stack align="center" gap="sm">
        <ThemeIcon size={52} radius="xl" variant="light">
          <IconRoute size={28} />
        </ThemeIcon>
        <Title order={4}>No mocks in this workspace yet</Title>
        <Text c="dimmed" ta="center" maw={460} size="sm">
          A mock is an endpoint with a fixed answer: choose a method and a path, then what it returns. Call it from
          your app, or right here with the built-in tester.
        </Text>
        <Group mt="xs">
          <Button leftSection={<IconPlus size={16} />} onClick={onCreate}>
            Create your first mock
          </Button>
          <Button variant="default" onClick={onAddExamples} loading={addingExamples}>
            Add example mocks
          </Button>
        </Group>
      </Stack>
    </Paper>
  )
}

function responseSummary(response: MockResponse): string {
  if (response.bodyFile) return `File: ${response.bodyFile}`
  if (!response.body) return 'No body'
  const body = response.body.replace(/\s+/g, ' ').trim()
  return response.contentType ? `${response.contentType} · ${body}` : body
}

function insertAt<T>(items: T[], index: number, item: T): T[] {
  return [...items.slice(0, index), item, ...items.slice(index)]
}

function swap<T>(items: T[], a: number, b: number): T[] {
  const result = [...items]
  ;[result[a], result[b]] = [result[b], result[a]]
  return result
}
