import { Box, Button, Menu, Text } from '@mantine/core'
import { IconCheck, IconChevronDown, IconFolder, IconLogin2, IconPlus, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { useWorkspace } from './WorkspaceContext'
import { CreateWorkspaceDialog, ForgetWorkspaceDialog, OpenWorkspaceDialog } from './WorkspaceDialogs'
import { isGlobal, shortId } from './workspaces'

type Dialog = 'create' | 'open' | 'forget'

export function WorkspacePicker() {
  const { workspace, workspaces, select } = useWorkspace()
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const closeDialog = () => setDialog(null)

  return (
    <>
      <Menu position="bottom-end" width={320} shadow="md">
        <Menu.Target>
          <Button
            variant="default"
            leftSection={<IconFolder size={16} />}
            rightSection={<IconChevronDown size={14} />}
            maw={240}
            aria-label="Switch workspace"
          >
            <Text span size="sm" fw={500} truncate="end">
              {workspace.name}
            </Text>
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>Workspaces in this browser</Menu.Label>
          {workspaces.map((item) => (
            <Menu.Item
              key={item.id}
              onClick={() => select(item.id)}
              leftSection={item.id === workspace.id ? <IconCheck size={16} /> : <Box w={16} />}
              rightSection={
                isGlobal(item) ? null : (
                  <Text size="xs" c="dimmed" ff="monospace">
                    {shortId(item.id)}
                  </Text>
                )
              }
            >
              <Text size="sm" truncate="end" maw={200}>
                {item.name}
              </Text>
            </Menu.Item>
          ))}
          <Menu.Divider />
          <Menu.Item leftSection={<IconPlus size={16} />} onClick={() => setDialog('create')}>
            New workspace…
          </Menu.Item>
          <Menu.Item leftSection={<IconLogin2 size={16} />} onClick={() => setDialog('open')}>
            Open workspace by ID…
          </Menu.Item>
          {!isGlobal(workspace) && (
            <>
              <Menu.Divider />
              <Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={() => setDialog('forget')}>
                Forget this workspace…
              </Menu.Item>
            </>
          )}
        </Menu.Dropdown>
      </Menu>

      <CreateWorkspaceDialog opened={dialog === 'create'} onClose={closeDialog} />
      <OpenWorkspaceDialog opened={dialog === 'open'} onClose={closeDialog} />
      {!isGlobal(workspace) && (
        <ForgetWorkspaceDialog opened={dialog === 'forget'} onClose={closeDialog} workspace={workspace} />
      )}
    </>
  )
}
