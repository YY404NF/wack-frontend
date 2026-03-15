import { request } from './client'
import type { CourseCalendarItem, CourseItem } from './types'

export const coursesApi = {
  listCourses() {
    return request<{ items: CourseItem[] | null }>('/courses?page=1&page_size=50').then((page) => ({
      ...page,
      items: page.items ?? [],
    }))
  },
  createCourse(input: { id: number; term: string; course_name: string; teacher_name: string; attendance_student_count: number }) {
    return request<CourseItem>('/courses', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  replaceCourseStudents(courseId: number, studentIds: string[]) {
    return request<Record<string, never>>(`/courses/${courseId}/students`, {
      method: 'PUT',
      body: JSON.stringify({ student_ids: studentIds }),
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
    return request<Record<string, never>>(`/courses/${courseId}/sessions`, {
      method: 'PUT',
      body: JSON.stringify({ sessions }),
    })
  },
  adminCourseCalendar() {
    return request<CourseCalendarItem[] | null>('/admin/course-calendar')
  },
}
