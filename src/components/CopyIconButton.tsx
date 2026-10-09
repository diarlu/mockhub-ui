import { ActionIcon, CopyButton, Tooltip } from '@mantine/core'
import { IconCheck, IconCopy } from '@tabler/icons-react'

export function CopyIconButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  return (
    <CopyButton value={value} timeout={1500}>
      {({ copied, copy }) => (
        <Tooltip label={copied ? 'Copied' : label} withArrow>
          <ActionIcon variant="subtle" color={copied ? 'teal' : 'gray'} onClick={copy} aria-label={label}>
            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
          </ActionIcon>
        </Tooltip>
      )}
    </CopyButton>
  )
}
