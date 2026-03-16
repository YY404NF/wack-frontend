const buildPath = (...parts: string[]) => `/${parts.filter(Boolean).join('/')}`

const ADMIN_PREFIX = 'admin'
const STUDENT_PREFIX = 'student'

export const apiPaths = {
  auth: {
    setupStatus: buildPath('setup', 'status'),
    initializeSystem: buildPath('setup', 'initialize'),
    login: buildPath('auth', 'login'),
    me: buildPath('auth', 'me'),
    changePassword: buildPath('auth', 'change-password'),
    updateProfile: buildPath('auth', 'profile'),
  },
  admin: {
    users: buildPath(ADMIN_PREFIX, 'users'),
    classes: buildPath(ADMIN_PREFIX, 'classes'),
    classStudents: buildPath(ADMIN_PREFIX, 'class-students'),
    courses: buildPath(ADMIN_PREFIX, 'courses'),
    courseCalendar: buildPath(ADMIN_PREFIX, 'course-calendar'),
    attendanceDashboard: buildPath(ADMIN_PREFIX, 'attendance-dashboard'),
    attendanceResults: buildPath(ADMIN_PREFIX, 'attendance-results'),
    attendanceDetails: buildPath(ADMIN_PREFIX, 'attendance-details'),
    freeTimeCalendar: buildPath(ADMIN_PREFIX, 'free-time-calendar'),
    operationLogs: buildPath(ADMIN_PREFIX, 'operation-logs'),
    attendanceDetailLogs: buildPath(ADMIN_PREFIX, 'attendance-detail-logs'),
    systemSettings: buildPath(ADMIN_PREFIX, 'system-settings'),
  },
  student: {
    coursesAvailable: buildPath(STUDENT_PREFIX, 'courses', 'available'),
    attendanceChecks: buildPath(STUDENT_PREFIX, 'attendance-checks'),
    attendanceDetails: buildPath(STUDENT_PREFIX, 'attendance-details'),
  },
  shared: {
    freeTimes: buildPath('free-times'),
    systemSettings: buildPath('system-settings'),
  },
}
