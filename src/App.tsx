import {
  ActionIcon,
  AppShell,
  Container,
  Group,
  Stack,
  Tabs,
  Title,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core'
import { IconBook, IconBraces, IconFiles, IconMoon, IconRoute, IconSun } from '@tabler/icons-react'
import { useState } from 'react'
import { API_BASE } from './api/client'
import { FilesPage } from './files/FilesPage'
import { JsonPage } from './json/JsonPage'
import { MockEditorProvider } from './mocks/MockEditorProvider'
import { MocksPage } from './mocks/MocksPage'
import { WorkspaceBar } from './workspace/WorkspaceBar'
import { useWorkspace } from './workspace/WorkspaceContext'
import { WorkspacePicker } from './workspace/WorkspacePicker'

type Tab = 'mocks' | 'files' | 'json'

export function App() {
  const { workspace } = useWorkspace()
  const [tab, setTab] = useState<Tab>('mocks')

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Container size="lg" h="100%">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={28} height={28} />
              <Title order={3} visibleFrom="xs">
                MockHub
              </Title>
            </Group>
            <Group gap="xs" wrap="nowrap">
              <WorkspacePicker />
              <Tooltip label="API documentation">
                <ActionIcon
                  component="a"
                  href={`${API_BASE}/help`}
                  target="_blank"
                  rel="noreferrer"
                  variant="default"
                  size="lg"
                  aria-label="API documentation"
                >
                  <IconBook size={18} />
                </ActionIcon>
              </Tooltip>
              <ColorSchemeToggle />
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="lg" px={0}>
          <MockEditorProvider>
            <Stack gap="lg">
              <WorkspaceBar />
              {/* Keyed by workspace, so unsaved edits never leak from one workspace into another. */}
              <Tabs key={workspace.id} value={tab} onChange={(value) => setTab((value as Tab | null) ?? 'mocks')}>
                <Tabs.List mb="md">
                  <Tabs.Tab value="mocks" leftSection={<IconRoute size={16} />}>
                    Mocks
                  </Tabs.Tab>
                  <Tabs.Tab value="files" leftSection={<IconFiles size={16} />}>
                    Files
                  </Tabs.Tab>
                  <Tabs.Tab value="json" leftSection={<IconBraces size={16} />}>
                    JSON
                  </Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value="mocks">
                  <MocksPage />
                </Tabs.Panel>
                <Tabs.Panel value="files">
                  <FilesPage onShowMocks={() => setTab('mocks')} />
                </Tabs.Panel>
                <Tabs.Panel value="json">
                  <JsonPage />
                </Tabs.Panel>
              </Tabs>
            </Stack>
          </MockEditorProvider>
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}

function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme()
  const colorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })
  const next = colorScheme === 'light' ? 'dark' : 'light'

  return (
    <Tooltip label={`Switch to ${next} mode`}>
      <ActionIcon variant="default" size="lg" onClick={() => setColorScheme(next)} aria-label={`Switch to ${next} mode`}>
        {colorScheme === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />}
      </ActionIcon>
    </Tooltip>
  )
}
