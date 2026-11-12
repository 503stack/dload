import React, { useState } from 'react'
import {
  Box,
  Title,
  Modal,
  Space,
  TagsInput,
  useMantineColorScheme,
  NumberInput,
  Group,
  Select,
  Button,
  type MantineColorScheme,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { z } from 'zod'
import { useForm, schemaResolver } from '@mantine/form'

import { useShallow } from 'zustand/react/shallow'

import { useSettingStore } from '@/modules/settings/setting-store'
import * as settingService from '@/modules/settings/setting-service'

const settingsSchema = z.object({
  downloadPaths: z.array(z.string()).nonempty(),
  maximumActiveDownloads: z.number(),
})

type SettingsProps = {
  visible: boolean
  onClose: () => void
}

const Settings: React.FC<SettingsProps> = ({ visible, onClose }) => {
  const [isSubmitting, setSubmitting] = useState(false)
  // zustand 5: a selector returning a new object needs useShallow, or it re-renders forever
  const { settings, setSettings } = useSettingStore(
    useShallow(({ settings, setSettings }) => ({
      settings,
      setSettings,
    })),
  )
  const { colorScheme, setColorScheme } = useMantineColorScheme()

  const form = useForm({
    validate: schemaResolver(settingsSchema),
    initialValues: {
      downloadPaths: settings.downloadPaths,
      maximumActiveDownloads: settings.maximumActiveDownloads,
    },
    transformValues: (values) => ({
      ...values,
      downloadPaths: values.downloadPaths.map((path) => path.trim()),
    }),
  })

  function close() {
    onClose()
  }

  async function handleSubmit() {
    const result = await form.validate()
    if (result.hasErrors) return
    setSubmitting(true)
    try {
      const values = form.getTransformedValues()
      await settingService.updateSettings(values)
      setSettings(values)
      close()
    } catch (error) {
      notifications.show({
        title: 'Failure',
        message: 'Error saving settings',
        color: 'red',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      size="md"
      opened={visible}
      onClose={close}
      radius="md"
      centered
      withCloseButton={false}
    >
      <Box
        style={{
          padding: '10px 5px',
        }}
      >
        <Title order={2}>Settings</Title>
        <Space h="sm" />
        <Select
          label="Theme"
          data={[
            { value: 'auto', label: 'Auto' },
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
          ]}
          value={colorScheme}
          onChange={(value) => value && setColorScheme(value as MantineColorScheme)}
        />
        <Space h="lg" />
        <Title order={5}>Server Settings</Title>
        <Space h="sm" />
        <form onSubmit={form.onSubmit(() => handleSubmit())}>
          <TagsInput
            label="Download Paths"
            {...form.getInputProps('downloadPaths')}
          />
          <Space h="sm" />
          <NumberInput
            label="Maximum Active Downloads"
            description="Queue tasks only starts downloading once the active download is below this number"
            {...form.getInputProps('maximumActiveDownloads')}
          />
          <Space h="xl" />
          <Group justify="space-between">
            <Button onClick={close} variant="subtle" color="gray">
              Close
            </Button>
            <Button loading={isSubmitting} type="submit">
              Save
            </Button>
          </Group>
        </form>
      </Box>
    </Modal>
  )
}

export default Settings
