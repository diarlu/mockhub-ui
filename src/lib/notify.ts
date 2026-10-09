import { notifications } from '@mantine/notifications'

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function notifySuccess(message: string): void {
  notifications.show({ color: 'teal', message, autoClose: 2500 })
}

export function notifyError(error: unknown, title = 'Something went wrong'): void {
  notifications.show({ color: 'red', title, message: errorMessage(error), autoClose: 8000 })
}
