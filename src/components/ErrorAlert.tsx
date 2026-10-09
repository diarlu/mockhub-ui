import { Alert, Button, Code, Stack, Text } from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'
import { ApiError } from '../api/client'
import { errorMessage } from '../lib/notify'

interface ErrorAlertProps {
  error: unknown
  title?: string
  onRetry?: () => void
}

/** Shows an API error; a server that cannot be reached gets instructions on how to start it. */
export function ErrorAlert({ error, title = 'Something went wrong', onRetry }: ErrorAlertProps) {
  const unreachable = error instanceof ApiError && error.isUnreachable
  return (
    <Alert
      color="red"
      icon={<IconAlertTriangle size={18} />}
      title={unreachable ? 'The MockHub server is not reachable' : title}
    >
      <Stack gap="xs" align="flex-start">
        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
          {unreachable ? (
            <>
              Start it in the <Code>mockhub</Code> folder with <Code>mvnw spring-boot:run</Code>, then try again.
            </>
          ) : (
            errorMessage(error)
          )}
        </Text>
        {onRetry && (
          <Button size="xs" variant="light" color="red" onClick={onRetry}>
            Try again
          </Button>
        )}
      </Stack>
    </Alert>
  )
}
