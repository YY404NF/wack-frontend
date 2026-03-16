import { request } from './client'
import type { CourseCalendarItem, CourseDetail, CourseItem } from './types'

export const coursesApi = {
  listCourses() {
    return request<{ items: CourseItem[] | null }>('/admin/courses?page=1&page_size=50').then((page) => ({
      ...page,
      items: page.items ?? [],
    }))
  },
  getCourse(courseId: number) {
    return request<CourseDetail>(`/admin/courses/${courseId}`)
  },
  createCourse(input: { term: string; course_name: string; teacher_name: string; attendance_student_count: number }) {
    return request<CourseItem>('/admin/courses', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  updateCourse(courseId: number, input: { term: string; course_name: string; teacher_name: string; attendance_student_count: number }) {
    return request<CourseItem>(`/admin/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },
  deleteCourse(courseId: number) {
    return request<Record<string, never>>(`/admin/courses/${courseId}`, {
      method: 'DELETE',
    })
  },
  replaceCourseStudents(courseId: number, students: Array<{ student_id: string; real_name: string }>) {
    return request<Record<string, never>>(`/admin/courses/${courseId}/students`, {
      method: 'PUT',
      body: JSON.stringify({ students }),
    })
  },
  replaceCourseClasses(courseId: number, classIds: number[]) {
    return request<Record<string, never>>(`/admin/courses/${courseId}/classes`, {
      method: 'PUT',
      body: JSON.stringify({ class_ids: classIds }),
    })
  },
  replaceCourseSessions(
    courseId: number,
    sessions: Array<{
      session_no: number
      week_no: number
      weekday: number
      section: number
      building_name: string
      room_name: string
    }>,
  ) {
    return request<Record<string, never>>(`/admin/courses/${courseId}/sessions`, {
      method: 'PUT',
      body: JSON.stringify({ sessions }),
    })
  },
  adminCourseCalendar() {
    return request<CourseCalendarItem[] | null>('/admin/course-calendar')
  },
}
