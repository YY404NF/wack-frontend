export * from './types'
export { clearToken, getToken, request, setToken } from './client'
export { authApi } from './auth'
export { usersApi } from './users'
export { classesApi } from './classes'
export { coursesApi } from './courses'
export { freeTimesApi } from './free-times'
export { attendanceApi } from './attendance'

import { attendanceApi } from './attendance'
import { authApi } from './auth'
import { classesApi } from './classes'
import { coursesApi } from './courses'
import { freeTimesApi } from './free-times'
import { usersApi } from './users'

export const api = {
  ...authApi,
  ...usersApi,
  ...classesApi,
  ...coursesApi,
  ...freeTimesApi,
  ...attendanceApi,
}
