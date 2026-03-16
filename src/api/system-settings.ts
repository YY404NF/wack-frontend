import { request } from './client'
import type { SystemSetting } from './types'

export const systemSettingsApi = {
  getSystemSettings() {
    return request<SystemSetting>('/system-settings')
  },
  updateSystemSettings(input: { current_term_start_date: string }) {
    return request<SystemSetting>('/admin/system-settings', {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },
}
