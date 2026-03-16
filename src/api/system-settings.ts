import { request } from './client'
import { apiPaths } from './paths'
import type { SystemSetting } from './types'

export const systemSettingsApi = {
  getSystemSettings() {
    return request<SystemSetting>(apiPaths.shared.systemSettings)
  },
  updateSystemSettings(input: { current_term_start_date: string }) {
    return request<SystemSetting>(apiPaths.admin.systemSettings, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },
}
