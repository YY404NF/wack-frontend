export * from './types'
export { clearToken, getToken, request, setToken } from './client'
export { authApi } from './auth'
export { usersApi } from './users'
export { classesApi } from './classes'
export { studentsApi } from './students'
export { coursesApi } from './courses'
export { freeTimesApi } from './free-times'
export { attendanceApi } from './attendance'
export { logsApi } from './logs'
export { metaApi } from './meta'
export { systemSettingsApi } from './system-settings'

import { attendanceApi } from './attendance'
import { authApi } from './auth'
import { classesApi } from './classes'
import { coursesApi } from './courses'
import { freeTimesApi } from './free-times'
import { logsApi } from './logs'
import { metaApi } from './meta'
import { systemSettingsApi } from './system-settings'
import { studentsApi } from './students'
import { usersApi } from './users'

export const api = {
  ...authApi,
  ...usersApi,
  ...classesApi,
  ...studentsApi,
  ...coursesApi,
  ...freeTimesApi,
  ...attendanceApi,
  ...logsApi,
  ...metaApi,
  ...systemSettingsApi,
}
