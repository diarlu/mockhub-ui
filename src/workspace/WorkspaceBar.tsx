import { Badge, Button, CopyButton, Group, Paper, Stack, Text } from '@mantine/core'
import { IconCheck, IconLink } from '@tabler/icons-react'
import { absoluteApiUrl } from '../api/client'
import { CopyIconButton } from '../components/CopyIconButton'
import { useWorkspace } from './WorkspaceContext'
import { isGlobal, shareLink } from './workspaces'

/** Shows where the selected workspace's mocks are served, with everything needed to share it. */
export function WorkspaceBar() {
  const { workspace, prefix } = useWorkspace()
  const baseUrl = absoluteApiUrl(prefix)

  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap={6}>
        <Group gap="xs">
          <Text fw={600}>{workspace.name}</Text>
          <Badge variant="light" color={isGlobal(workspace) ? 'gray' : 'indigo'}>
            {isGlobal(workspace) ? 'Shared by everyone' : 'Private workspace'}
          </Badge>
        </Group>
        {/* Wraps on narrow screens: the label on one line, the URL and its copy button on the next. */}
        <Group gap={4}>
          <Text size="sm" c="dimmed">
            Mocks are served at
          </Text>
          <Group gap={4} wrap="nowrap" miw={0}>
            <Text size="sm" ff="monospace" fw={500} style={{ wordBreak: 'break-all' }}>
              {baseUrl}
            </Text>
            <CopyIconButton value={baseUrl} label="Copy base URL" />
          </Group>
        </Group>
        {isGlobal(workspace) ? (
          <Text size="xs" c="dimmed">
            Everyone using this server sees and changes these mocks. Create a workspace to keep yours separate.
          </Text>
        ) : (
          <Group gap={4}>
            <Text size="xs" c="dimmed">
              Keep the workspace ID <Text span ff="monospace" style={{ wordBreak: 'break-all' }}>{workspace.id}</Text>;
              it is the only way to open this workspace again.
            </Text>
            <CopyIconButton value={workspace.id} label="Copy workspace ID" />
            <CopyButton value={shareLink(workspace)} timeout={1500}>
              {({ copied, copy }) => (
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color={copied ? 'teal' : 'gray'}
                  leftSection={copied ? <IconCheck size={12} /> : <IconLink size={12} />}
                  onClick={copy}
                  style={{ flexShrink: 0 }}
                >
                  {copied ? 'Copied' : 'Copy share link'}
                </Button>
              )}
            </CopyButton>
          </Group>
        )}
      </Stack>
    </Paper>
  )
}
