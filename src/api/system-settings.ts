import { request } from './client'
import type { SystemSetting } from './types'

export const systemSettingsApi = {
  getSystemSettings() {
    return request<SystemSetting>('/admin/system-settings')
  },
  updateSystemSettings(input: { current_term_start_date: string; current_schedule: 'summer' | 'winter' }) {
    return request<SystemSetting>('/admin/system-settings', {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },
}
