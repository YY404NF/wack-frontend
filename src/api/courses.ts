import { request } from './client'
import { apiPaths } from './paths'
import type {
  AvailableCourseGroupClassItem,
  AvailableCourseGroupStudentItem,
  CourseCalendarItem,
  CourseGroupDetail,
  CourseGroupLessonItem,
  CourseGroupItem,
  CourseGroupStudentItem,
  CourseItem,
  PageResult,
} from './types'

function asArray<T>(value: T[] | null | undefined) {
  return Array.isArray(value) ? value : []
}

function normalizeCourseGroupDetail(detail: CourseGroupDetail | null | undefined): CourseGroupDetail {
  return {
    course_group: (detail?.course_group ?? {}) as CourseGroupDetail['course_group'],
    students: asArray(detail?.students as CourseGroupStudentItem[] | null | undefined),
    sessions: asArray(detail?.sessions as CourseGroupLessonItem[] | null | undefined),
  }
}

export const coursesApi = {
  listCourses(query: { page?: number; page_size?: number; term?: string; course_name?: string; teacher_name?: string; class_id?: number | '' } = {}) {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.page_size ?? 100))
    if (query.term?.trim()) params.set('term', query.term.trim())
    if (query.course_name?.trim()) params.set('keyword', query.course_name.trim())
    if (query.teacher_name?.trim()) params.set('teacher_name', query.teacher_name.trim())
    if (typeof query.class_id === 'number' && query.class_id > 0) params.set('class_id', String(query.class_id))
    return request<PageResult<CourseItem>>(`${apiPaths.admin.courses}?${params.toString()}`).then((page) => ({
      ...page,
      items: page.items ?? [],
    }))
  },
  listCourseGroups(courseId: number) {
    return request<CourseGroupItem[] | null>(`${apiPaths.admin.courses}/${courseId}/groups`).then((items) => items ?? [])
  },
  getCourseSummary(courseId: number) {
    return request<CourseItem>(`${apiPaths.admin.courses}/${courseId}/summary`)
  },
  getCourseGroup(courseId: number, groupId: number) {
    return request<CourseGroupDetail>(`${apiPaths.admin.courses}/${courseId}/groups/${groupId}`).then((detail) => normalizeCourseGroupDetail(detail))
  },
  listCourseGroupSessions(courseId: number, groupId: number) {
    return request<CourseGroupDetail['sessions'] | null>(`${apiPaths.admin.courses}/${courseId}/groups/${groupId}/sessions`).then((items) => asArray(items))
  },
  createCourseGroupSession(
    courseId: number,
    groupId: number,
    input: {
      week_no: number
      weekday: number
      section: number
      building_name: string
      room_name: string
    },
  ) {
    return request<CourseGroupDetail['sessions'][number]>(`${apiPaths.admin.courses}/${courseId}/groups/${groupId}/sessions`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  updateCourseGroupSession(
    courseId: number,
    groupId: number,
    sessionId: number,
    input: {
      week_no: number
      weekday: number
      section: number
      building_name: string
      room_name: string
    },
  ) {
    return request<CourseGroupDetail['sessions'][number]>(`${apiPaths.admin.courses}/${courseId}/groups/${groupId}/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },
  deleteCourseGroupSession(courseId: number, groupId: number, sessionId: number) {
    return request<Record<string, never>>(`${apiPaths.admin.courses}/${courseId}/groups/${groupId}/sessions/${sessionId}`, {
      method: 'DELETE',
    })
  },
  listCourseGroupStudents(courseId: number, groupId: number) {
    return request<CourseGroupDetail['students'] | null>(`${apiPaths.admin.courses}/${courseId}/groups/${groupId}/students`).then((items) => asArray(items))
  },
  listAvailableCourseGroupClasses(courseId: number, groupId: number, query: { keyword?: string; page?: number; page_size?: number } = {}) {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.page_size ?? 20))
    if (query.keyword?.trim()) {
      params.set('keyword', query.keyword.trim())
    }
    const suffix = params.toString() ? `?${params.toString()}` : ''
    return request<PageResult<AvailableCourseGroupClassItem>>(`${apiPaths.admin.courses}/${courseId}/groups/${groupId}/available-classes${suffix}`).then((page) => ({
      ...page,
      items: asArray(page.items),
    }))
  },
  addCourseGroupClasses(courseId: number, groupId: number, classIds: number[]) {
    return request<Record<string, never>>(`${apiPaths.admin.courses}/${courseId}/groups/${groupId}/classes`, {
      method: 'POST',
      body: JSON.stringify({ class_ids: classIds }),
    })
  },
  removeCourseGroupClass(courseId: number, groupId: number, classId: number) {
    return request<Record<string, never>>(`${apiPaths.admin.courses}/${courseId}/groups/${groupId}/classes/${classId}`, {
      method: 'DELETE',
    })
  },
  listAvailableCourseGroupStudents(courseId: number, groupId: number, query: { keyword?: string; page?: number; page_size?: number } = {}) {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.page_size ?? 20))
    if (query.keyword?.trim()) {
      params.set('keyword', query.keyword.trim())
    }
    const suffix = params.toString() ? `?${params.toString()}` : ''
    return request<PageResult<AvailableCourseGroupStudentItem>>(`${apiPaths.admin.courses}/${courseId}/groups/${groupId}/available-students${suffix}`).then((page) => ({
      ...page,
      items: asArray(page.items),
    }))
  },
  addCourseGroupStudents(courseId: number, groupId: number, studentIds: number[]) {
    return request<Record<string, never>>(`${apiPaths.admin.courses}/${courseId}/groups/${groupId}/students`, {
      method: 'POST',
      body: JSON.stringify({ student_ids: studentIds }),
    })
  },
  removeCourseGroupStudent(courseId: number, groupId: number, studentId: number) {
    return request<Record<string, never>>(`${apiPaths.admin.courses}/${courseId}/groups/${groupId}/students/${studentId}`, {
      method: 'DELETE',
    })
  },
  createCourseGroup(courseId: number) {
    return request<CourseGroupItem>(`${apiPaths.admin.courses}/${courseId}/groups`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
  },
  deleteCourseGroup(courseId: number, groupId: number) {
    return request<Record<string, never>>(`${apiPaths.admin.courses}/${courseId}/groups/${groupId}`, {
      method: 'DELETE',
    })
  },
  createCourse(input: { term_id: number; grade: number; course_name: string; teacher_name: string }) {
    return request<CourseItem>(apiPaths.admin.courses, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  updateCourse(courseId: number, input: { term_id: number; grade: number; course_name: string; teacher_name: string }) {
    return request<CourseItem>(`${apiPaths.admin.courses}/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },
  deleteCourse(courseId: number) {
    return request<Record<string, never>>(`${apiPaths.admin.courses}/${courseId}`, {
      method: 'DELETE',
    })
  },
  adminCourseCalendar(term = '') {
    const params = new URLSearchParams()
    if (term.trim()) params.set('term', term.trim())
    const suffix = params.toString() ? `?${params.toString()}` : ''
    return request<CourseCalendarItem[] | null>(`${apiPaths.admin.courseCalendar}${suffix}`)
  },
}
