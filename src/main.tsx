import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'

import { MantineProvider, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { WorkspaceProvider } from './workspace/WorkspaceProvider'

const theme = createTheme({
  primaryColor: 'indigo',
  defaultRadius: 'md',
})

const queryClient = new QueryClient({
  defaultOptions: {
    // The server is usually local: fail fast instead of retrying for seconds when it is down.
    queries: { retry: 1, staleTime: 5_000 },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Notifications position="top-right" />
      <QueryClientProvider client={queryClient}>
        <WorkspaceProvider>
          <App />
        </WorkspaceProvider>
      </QueryClientProvider>
    </MantineProvider>
  </StrictMode>,
)
