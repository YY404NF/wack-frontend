const buildPath = (...parts: string[]) => `/${parts.filter(Boolean).join('/')}`

const ADMIN_PREFIX = 'admin'
const STUDENT_PREFIX = 'student'

export const apiPaths = {
  auth: {
    setupStatus: buildPath('setup', 'status'),
    initializeSystem: buildPath('setup', 'initialize'),
    login: buildPath('auth', 'login'),
    me: buildPath('auth', 'me'),
    logout: buildPath('auth', 'logout'),
    changePassword: buildPath('auth', 'change-password'),
    updateProfile: buildPath('auth', 'profile'),
  },
  admin: {
    users: buildPath(ADMIN_PREFIX, 'users'),
    classes: buildPath(ADMIN_PREFIX, 'classes'),
    students: buildPath(ADMIN_PREFIX, 'students'),
    classStudents: buildPath(ADMIN_PREFIX, 'class-students'),
    courses: buildPath(ADMIN_PREFIX, 'courses'),
    courseCalendar: buildPath(ADMIN_PREFIX, 'course-calendar'),
    attendanceDashboard: buildPath(ADMIN_PREFIX, 'attendance-dashboard'),
    attendanceResults: buildPath(ADMIN_PREFIX, 'attendance-results'),
    attendanceSessions: buildPath(ADMIN_PREFIX, 'attendance-sessions'),
    attendanceRecords: buildPath(ADMIN_PREFIX, 'attendance-records'),
    freeTimeCalendar: buildPath(ADMIN_PREFIX, 'free-time-calendar'),
    attendanceRecordLogs: buildPath(ADMIN_PREFIX, 'attendance-record-logs'),
    systemSettings: buildPath(ADMIN_PREFIX, 'system-settings'),
    terms: buildPath(ADMIN_PREFIX, 'terms'),
  },
  student: {
    coursesAvailable: buildPath(STUDENT_PREFIX, 'courses', 'available'),
    attendanceSessions: buildPath(STUDENT_PREFIX, 'attendance-sessions'),
    attendanceRecords: buildPath(STUDENT_PREFIX, 'attendance-records'),
  },
  shared: {
    freeTimes: buildPath('free-times'),
    systemSettings: buildPath('system-settings'),
    metaTerms: buildPath('meta', 'terms'),
    metaSections: buildPath('meta', 'sections'),
  },
}
