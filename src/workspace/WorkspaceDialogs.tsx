import { Button, Code, Group, Modal, Stack, Text, TextInput } from '@mantine/core'
import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { registerWorkspace } from '../api/mockhub'
import { CopyIconButton } from '../components/CopyIconButton'
import { ErrorAlert } from '../components/ErrorAlert'
import { notifySuccess } from '../lib/notify'
import { useWorkspace } from './WorkspaceContext'
import { extractWorkspaceId, shortId, type Workspace } from './workspaces'

interface DialogProps {
  opened: boolean
  onClose: () => void
}

export function CreateWorkspaceDialog({ opened, onClose }: DialogProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="New workspace">
      <CreateWorkspaceForm onDone={onClose} />
    </Modal>
  )
}

function CreateWorkspaceForm({ onDone }: { onDone: () => void }) {
  const { add } = useWorkspace()
  const [email, setEmail] = useState('')
  const register = useMutation({ mutationFn: registerWorkspace })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const name = email.trim()
    register.mutate(name, {
      onSuccess: (id) => {
        add({ id, name })
        notifySuccess('Workspace created. Keep its ID: it is the only way to open it again.')
        onDone()
      },
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        <Text size="sm" c="dimmed">
          A workspace keeps your mocks and files apart from everyone else using this server. Its endpoints are served
          under a unique ID.
        </Text>
        <TextInput
          label="Email or name"
          description="Required by the server, and used as the workspace name in this browser."
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
          required
          data-autofocus
        />
        {register.isError && <ErrorAlert error={register.error} title="Could not create the workspace" />}
        <Group justify="flex-end">
          <Button variant="default" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" loading={register.isPending} disabled={!email.trim()}>
            Create workspace
          </Button>
        </Group>
      </Stack>
    </form>
  )
}

export function OpenWorkspaceDialog({ opened, onClose }: DialogProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Open workspace">
      <OpenWorkspaceForm onDone={onClose} />
    </Modal>
  )
}

function OpenWorkspaceForm({ onDone }: { onDone: () => void }) {
  const { add, workspaces } = useWorkspace()
  const [idText, setIdText] = useState('')
  const [name, setName] = useState('')
  const id = extractWorkspaceId(idText)
  const known = workspaces.find((workspace) => workspace.id === id)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!id) return
    add({ id, name: name.trim() || known?.name || `Workspace ${shortId(id)}` })
    onDone()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        <TextInput
          label="Workspace ID"
          description="Paste the ID, a share link or any mock URL that contains it."
          placeholder="4bb9b9b7-dc60-4142-9aea-c8e9178514ac"
          value={idText}
          onChange={(event) => setIdText(event.currentTarget.value)}
          error={idText.trim() && !id ? 'No workspace ID found in this text' : undefined}
          required
          data-autofocus
        />
        <TextInput
          label="Name"
          description="Optional, only stored in this browser."
          placeholder={known?.name ?? 'My workspace'}
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={!id}>
            Open workspace
          </Button>
        </Group>
      </Stack>
    </form>
  )
}

interface ForgetWorkspaceDialogProps extends DialogProps {
  workspace: Workspace
}

export function ForgetWorkspaceDialog({ opened, onClose, workspace }: ForgetWorkspaceDialogProps) {
  const { forget } = useWorkspace()
  return (
    <Modal opened={opened} onClose={onClose} title={`Forget "${workspace.name}"?`}>
      <Stack>
        <Text size="sm">
          This only removes the workspace from this browser. Its mocks and files stay on the server, and you can open
          it again with its ID:
        </Text>
        <Group gap="xs" wrap="nowrap">
          <Code style={{ wordBreak: 'break-all' }}>{workspace.id}</Code>
          <CopyIconButton value={workspace.id} label="Copy workspace ID" />
        </Group>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() => {
              forget(workspace.id)
              onClose()
            }}
          >
            Forget workspace
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
