import type {
  LocationQuery,
  LocationQueryRaw,
  RouteLocationNormalizedLoaded,
  RouteLocationRaw,
  RouteRecordRaw,
} from 'vue-router'

import type { AdminTab } from '../constants'
import type { AdminClassManageRouteView, AdminCourseManageRouteView, AdminStudentManageRouteView } from '../components/admin/shared-types'

type AdminRouteMeta = {
  adminTab: AdminTab
  adminCourseView?: AdminCourseManageRouteView
  adminClassView?: AdminClassManageRouteView
  adminStudentView?: AdminStudentManageRouteView
}

type AdminCourseRouteState = {
  view: AdminCourseManageRouteView
  courseId: number | null
  groupId: number | null
  lessonId: number | null
}

type AdminClassRouteState = {
  view: AdminClassManageRouteView
  classId: number | null
}

type AdminStudentRouteState = {
  view: AdminStudentManageRouteView
  studentId: number | null
}

export const adminFocusQueryKeys = ['focus_course_id', 'focus_class_id', 'focus_student_ref_id'] as const

export type AdminFocusQueryKey = (typeof adminFocusQueryKeys)[number]

const EmptyRouteComponent = { template: '<div />' }

export const adminRouteNames = {
  root: 'admin-root',
  overview: 'admin-overview',
  attendance: 'admin-attendance',
  attendanceLogs: 'admin-attendance-logs',
  courseCalendar: 'admin-course-calendar',
  courseManage: 'admin-course-manage',
  courseGroups: 'admin-course-groups',
  courseLessons: 'admin-course-lessons',
  courseStudents: 'admin-course-students',
  courseAttendanceDetail: 'admin-course-attendance-detail',
  classManage: 'admin-class-manage',
  classStudents: 'admin-class-students',
  classAttendanceDetail: 'admin-class-attendance-detail',
  studentManage: 'admin-student-manage',
  studentAttendanceDetail: 'admin-student-attendance-detail',
  userManage: 'admin-user-manage',
  settings: 'admin-settings',
  legacy: 'admin-legacy',
} as const

const adminTabRouteNameMap: Record<AdminTab, string> = {
  overview: adminRouteNames.overview,
  attendance: adminRouteNames.attendance,
  'attendance-logs': adminRouteNames.attendanceLogs,
  'course-calendar': adminRouteNames.courseCalendar,
  'course-manage': adminRouteNames.courseManage,
  'class-manage': adminRouteNames.classManage,
  'student-manage': adminRouteNames.studentManage,
  'user-manage': adminRouteNames.userManage,
  settings: adminRouteNames.settings,
}

const adminTabs = new Set<AdminTab>(Object.keys(adminTabRouteNameMap) as AdminTab[])

function adminMeta(adminTab: AdminTab, adminCourseView?: AdminCourseManageRouteView): AdminRouteMeta {
  return {
    adminTab,
    adminCourseView,
  }
}

function adminClassMeta(adminTab: AdminTab, adminClassView?: AdminClassManageRouteView): AdminRouteMeta {
  return {
    adminTab,
    adminClassView,
  }
}

function adminStudentMeta(adminTab: AdminTab, adminStudentView?: AdminStudentManageRouteView): AdminRouteMeta {
  return {
    adminTab,
    adminStudentView,
  }
}

function readFirstString(value: unknown): string | null {
  if (typeof value === 'string') {
    return value
  }
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0]
  }
  return null
}

function readPositiveInt(value: unknown): number | null {
  const raw = readFirstString(value)
  if (!raw || !/^\d+$/.test(raw)) {
    return null
  }
  return Number(raw)
}

export function readAdminTab(route: RouteLocationNormalizedLoaded): AdminTab | null {
  const adminTab = route.meta.adminTab
  if (typeof adminTab !== 'string' || !adminTabs.has(adminTab as AdminTab)) {
    return null
  }
  return adminTab as AdminTab
}

export function buildAdminTabLocation(tab: AdminTab, query?: LocationQueryRaw): RouteLocationRaw {
  return {
    name: adminTabRouteNameMap[tab],
    query,
  }
}

export function buildAdminCourseLocation(state: AdminCourseRouteState, query?: LocationQueryRaw): RouteLocationRaw {
  switch (state.view) {
    case 'groups':
      if (state.courseId) {
        return {
          name: adminRouteNames.courseGroups,
          params: { courseId: String(state.courseId) },
          query,
        }
      }
      break
    case 'lessons':
      if (state.courseId && state.groupId) {
        return {
          name: adminRouteNames.courseLessons,
          params: {
            courseId: String(state.courseId),
            groupId: String(state.groupId),
          },
          query,
        }
      }
      break
    case 'students':
      if (state.courseId && state.groupId) {
        return {
          name: adminRouteNames.courseStudents,
          params: {
            courseId: String(state.courseId),
            groupId: String(state.groupId),
          },
          query,
        }
      }
      break
    case 'attendance-detail':
      if (state.courseId && state.groupId && state.lessonId) {
        return {
          name: adminRouteNames.courseAttendanceDetail,
          params: {
            courseId: String(state.courseId),
            groupId: String(state.groupId),
            lessonId: String(state.lessonId),
          },
          query,
        }
      }
      break
    case 'courses':
    default:
      break
  }

  return buildAdminTabLocation('course-manage', query)
}

export function buildAdminClassLocation(state: AdminClassRouteState, query?: LocationQueryRaw): RouteLocationRaw {
  if (state.classId) {
    if (state.view === 'students') {
      return {
        name: adminRouteNames.classStudents,
        params: { classId: String(state.classId) },
        query,
      }
    }
    if (state.view === 'attendance-detail') {
      return {
        name: adminRouteNames.classAttendanceDetail,
        params: { classId: String(state.classId) },
        query,
      }
    }
  }

  return buildAdminTabLocation('class-manage', query)
}

export function buildAdminStudentLocation(state: AdminStudentRouteState, query?: LocationQueryRaw): RouteLocationRaw {
  if (state.view === 'attendance-detail' && state.studentId) {
    return {
      name: adminRouteNames.studentAttendanceDetail,
      params: { studentId: String(state.studentId) },
      query,
    }
  }

  return buildAdminTabLocation('student-manage', query)
}

export function readAdminQueryNumber(query: LocationQuery, key: AdminFocusQueryKey): number | null {
  return readPositiveInt(query[key])
}

export function omitAdminFocusQuery(query: LocationQuery | LocationQueryRaw): LocationQueryRaw {
  const nextQuery: LocationQueryRaw = { ...query }
  for (const key of adminFocusQueryKeys) {
    delete nextQuery[key]
  }
  return nextQuery
}

export function readAdminCourseRoute(route: RouteLocationNormalizedLoaded): AdminCourseRouteState | null {
  const adminTab = readAdminTab(route)
  if (adminTab !== 'course-manage') {
    return null
  }

  const view = route.meta.adminCourseView
  if (
    view !== 'courses' &&
    view !== 'groups' &&
    view !== 'lessons' &&
    view !== 'students' &&
    view !== 'attendance-detail'
  ) {
    return {
      view: 'courses',
      courseId: null,
      groupId: null,
      lessonId: null,
    }
  }

  return {
    view,
    courseId: readPositiveInt(route.params.courseId),
    groupId: readPositiveInt(route.params.groupId),
    lessonId: readPositiveInt(route.params.lessonId),
  }
}

export function readAdminClassRoute(route: RouteLocationNormalizedLoaded): AdminClassRouteState | null {
  const adminTab = readAdminTab(route)
  if (adminTab !== 'class-manage') {
    return null
  }

  const view = route.meta.adminClassView
  if (view !== 'students' && view !== 'attendance-detail') {
    return {
      view: 'classes',
      classId: null,
    }
  }

  return {
    view,
    classId: readPositiveInt(route.params.classId),
  }
}

export function readAdminStudentRoute(route: RouteLocationNormalizedLoaded): AdminStudentRouteState | null {
  const adminTab = readAdminTab(route)
  if (adminTab !== 'student-manage') {
    return null
  }

  const view = route.meta.adminStudentView
  if (view !== 'attendance-detail') {
    return {
      view: 'students',
      studentId: null,
    }
  }

  return {
    view,
    studentId: readPositiveInt(route.params.studentId),
  }
}

export function resolveLegacyAdminLocation(to: { params: Record<string, unknown>; query: Record<string, unknown> }): RouteLocationRaw {
  const legacyTab = readFirstString(to.params.legacyTab)

  switch (legacyTab) {
    case 'attendance': {
      const attendanceSessionId = readPositiveInt(to.query.attendanceSessionId)
      if (attendanceSessionId) {
        return {
          name: adminRouteNames.attendance,
          query: { attendanceSessionId: String(attendanceSessionId) },
        }
      }
      return buildAdminTabLocation('attendance')
    }
    case 'attendance-logs':
      return buildAdminTabLocation('attendance-logs')
    case 'course-calendar':
      return buildAdminTabLocation('course-calendar')
    case 'course-manage': {
      const courseId = readPositiveInt(to.query.courseId)
      const groupId = readPositiveInt(to.query.groupId)
      const lessonId = readPositiveInt(to.query.lessonId)
      const view = readFirstString(to.query.courseView)

      if (view === 'groups' && courseId) {
        return buildAdminCourseLocation({ view: 'groups', courseId, groupId: null, lessonId: null })
      }
      if (view === 'lessons' && courseId && groupId) {
        return buildAdminCourseLocation({ view: 'lessons', courseId, groupId, lessonId: null })
      }
      if (view === 'students' && courseId && groupId) {
        return buildAdminCourseLocation({ view: 'students', courseId, groupId, lessonId: null })
      }
      if (view === 'attendance-detail' && courseId && groupId && lessonId) {
        return buildAdminCourseLocation({ view: 'attendance-detail', courseId, groupId, lessonId })
      }
      return buildAdminTabLocation('course-manage')
    }
    case 'class-manage':
    {
      const classId = readPositiveInt(to.query.classId)
      const view = readFirstString(to.query.classView)
      if (view === 'students' && classId) {
        return buildAdminClassLocation({ view: 'students', classId })
      }
      if (view === 'attendance-detail' && classId) {
        return buildAdminClassLocation({ view: 'attendance-detail', classId })
      }
      return buildAdminClassLocation({ view: 'classes', classId: null })
    }
    case 'student':
    case 'student-manage':
      return buildAdminTabLocation('student-manage')
    case 'user-manage':
      return buildAdminTabLocation('user-manage')
    case 'settings':
      return buildAdminTabLocation('settings')
    case 'overview':
    default:
      return buildAdminTabLocation('overview')
  }
}

export const adminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin',
    name: adminRouteNames.root,
    redirect: { name: adminRouteNames.overview },
  },
  {
    path: '/admin/overview',
    name: adminRouteNames.overview,
    component: EmptyRouteComponent,
    meta: adminMeta('overview'),
  },
  {
    path: '/admin/attendance',
    name: adminRouteNames.attendance,
    component: EmptyRouteComponent,
    meta: adminMeta('attendance'),
  },
  {
    path: '/admin/attendance-logs',
    name: adminRouteNames.attendanceLogs,
    component: EmptyRouteComponent,
    meta: adminMeta('attendance-logs'),
  },
  {
    path: '/admin/course-calendar',
    name: adminRouteNames.courseCalendar,
    component: EmptyRouteComponent,
    meta: adminMeta('course-calendar'),
  },
  {
    path: '/admin/courses',
    name: adminRouteNames.courseManage,
    component: EmptyRouteComponent,
    meta: adminMeta('course-manage', 'courses'),
  },
  {
    path: '/admin/courses/:courseId(\\d+)/groups',
    name: adminRouteNames.courseGroups,
    component: EmptyRouteComponent,
    meta: adminMeta('course-manage', 'groups'),
  },
  {
    path: '/admin/courses/:courseId(\\d+)/groups/:groupId(\\d+)/lessons',
    name: adminRouteNames.courseLessons,
    component: EmptyRouteComponent,
    meta: adminMeta('course-manage', 'lessons'),
  },
  {
    path: '/admin/courses/:courseId(\\d+)/groups/:groupId(\\d+)/students',
    name: adminRouteNames.courseStudents,
    component: EmptyRouteComponent,
    meta: adminMeta('course-manage', 'students'),
  },
  {
    path: '/admin/courses/:courseId(\\d+)/groups/:groupId(\\d+)/lessons/:lessonId(\\d+)/attendance',
    name: adminRouteNames.courseAttendanceDetail,
    component: EmptyRouteComponent,
    meta: adminMeta('course-manage', 'attendance-detail'),
  },
  {
    path: '/admin/classes',
    name: adminRouteNames.classManage,
    component: EmptyRouteComponent,
    meta: adminClassMeta('class-manage', 'classes'),
  },
  {
    path: '/admin/classes/:classId(\\d+)/students',
    name: adminRouteNames.classStudents,
    component: EmptyRouteComponent,
    meta: adminClassMeta('class-manage', 'students'),
  },
  {
    path: '/admin/classes/:classId(\\d+)/attendance',
    name: adminRouteNames.classAttendanceDetail,
    component: EmptyRouteComponent,
    meta: adminClassMeta('class-manage', 'attendance-detail'),
  },
  {
    path: '/admin/students',
    name: adminRouteNames.studentManage,
    component: EmptyRouteComponent,
    meta: adminStudentMeta('student-manage', 'students'),
  },
  {
    path: '/admin/students/:studentId(\\d+)/attendance',
    name: adminRouteNames.studentAttendanceDetail,
    component: EmptyRouteComponent,
    meta: adminStudentMeta('student-manage', 'attendance-detail'),
  },
  {
    path: '/admin/users',
    name: adminRouteNames.userManage,
    component: EmptyRouteComponent,
    meta: adminMeta('user-manage'),
  },
  {
    path: '/admin/settings',
    name: adminRouteNames.settings,
    component: EmptyRouteComponent,
    meta: adminMeta('settings'),
  },
  {
    path: '/admin/:legacyTab(overview|attendance|attendance-logs|course-calendar|course-manage|class-manage|student|student-manage|user-manage|settings)',
    name: adminRouteNames.legacy,
    redirect: (to) => resolveLegacyAdminLocation(to),
  },
]
