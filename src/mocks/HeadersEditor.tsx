import { ActionIcon, Button, Group, Stack, Text, TextInput } from '@mantine/core'
import { IconPlus, IconX } from '@tabler/icons-react'
import { newHeaderRow, type HeaderRow } from './mockForm'

interface HeadersEditorProps {
  rows: HeaderRow[]
  onChange: (rows: HeaderRow[]) => void
  error?: string
}

export function HeadersEditor({ rows, onChange, error }: HeadersEditorProps) {
  const update = (id: number, change: Partial<HeaderRow>) =>
    onChange(rows.map((row) => (row.id === id ? { ...row, ...change } : row)))

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>
        Response headers
      </Text>
      {rows.map((row) => (
        <Group key={row.id} gap="xs" wrap="nowrap">
          <TextInput
            aria-label="Header name"
            placeholder="Name, e.g. Cache-Control"
            value={row.name}
            onChange={(event) => update(row.id, { name: event.currentTarget.value })}
            style={{ flex: 1 }}
          />
          <TextInput
            aria-label="Header value"
            placeholder="Value"
            value={row.value}
            onChange={(event) => update(row.id, { value: event.currentTarget.value })}
            style={{ flex: 1.5 }}
          />
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label="Remove header"
            onClick={() => onChange(rows.filter((other) => other.id !== row.id))}
          >
            <IconX size={16} />
          </ActionIcon>
        </Group>
      ))}
      {error && (
        <Text size="xs" c="red">
          {error}
        </Text>
      )}
      <Button
        variant="subtle"
        size="xs"
        leftSection={<IconPlus size={14} />}
        onClick={() => onChange([...rows, newHeaderRow()])}
        style={{ alignSelf: 'flex-start' }}
      >
        Add header
      </Button>
    </Stack>
  )
}
