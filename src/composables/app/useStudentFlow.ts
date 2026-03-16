import type { Ref } from 'vue'

import { api, type AttendanceCheckDetail, type AvailableCourseItem, type FreeTimeItem } from '../../api'
import type { StatusCode } from '../../constants'

type FreeTimeForm = {
  term: string
  weekday: number
  section: number
  freeWeeks: string
}

type StudentFlowDeps = {
  availableCourses: Ref<AvailableCourseItem[]>
  freeTimes: Ref<FreeTimeItem[]>
  activeCheck: Ref<AttendanceCheckDetail | null>
  selectedStudentId: Ref<number | null>
  editingFreeTimeId: Ref<number | null>
  freeTimeForm: FreeTimeForm
  freeTimeSaving: Ref<boolean>
  attendanceCompleting: Ref<boolean>
  studentError: Ref<string>
  resetFreeTimeForm: () => void
  showStudentToast: (message: string) => void
  statusName: (status: number) => string
}

export function useStudentFlow(deps: StudentFlowDeps) {
  async function openCourse(course: AvailableCourseItem) {
    deps.studentError.value = ''
    try {
      const activeCheck = await api.enterAttendanceCheck(course.course_session_id)
      deps.activeCheck.value = activeCheck
      deps.selectedStudentId.value = activeCheck.students[0]?.id ?? null
      deps.availableCourses.value = (await api.studentAvailableCourses()) ?? []
      deps.showStudentToast(`已进入 ${course.course_name}`)
    } catch (error) {
      deps.studentError.value = error instanceof Error ? error.message : '进入查课失败'
    }
  }

  async function loadStudentData() {
    deps.availableCourses.value = (await api.studentAvailableCourses()) ?? []
    const freeTimePage = await api.listFreeTimes()
    deps.freeTimes.value = freeTimePage.items ?? []
    if (deps.availableCourses.value.length > 0 && deps.availableCourses.value[0].attendance_check_id) {
      await openCourse(deps.availableCourses.value[0])
    }
  }

  async function saveFreeTime() {
    deps.freeTimeSaving.value = true
    deps.studentError.value = ''
    try {
      const payload = {
        term: deps.freeTimeForm.term.trim(),
        weekday: deps.freeTimeForm.weekday,
        section: deps.freeTimeForm.section,
        free_weeks: deps.freeTimeForm.freeWeeks.trim(),
      }
      const successMessage = deps.editingFreeTimeId.value ? '空闲时间已更新' : '空闲时间已新增'
      if (deps.editingFreeTimeId.value) {
        await api.updateFreeTime(deps.editingFreeTimeId.value, payload)
      } else {
        await api.createFreeTime(payload)
      }
      const freeTimePage = await api.listFreeTimes()
      deps.freeTimes.value = freeTimePage.items ?? []
      deps.resetFreeTimeForm()
      deps.showStudentToast(successMessage)
    } catch (error) {
      deps.studentError.value = error instanceof Error ? error.message : '保存空闲时间失败'
    } finally {
      deps.freeTimeSaving.value = false
    }
  }

  function editFreeTime(item: FreeTimeItem) {
    deps.freeTimeForm.term = item.term
    deps.freeTimeForm.weekday = item.weekday
    deps.freeTimeForm.section = item.section
    deps.freeTimeForm.freeWeeks = item.free_weeks
    deps.editingFreeTimeId.value = item.id
  }

  async function removeFreeTime(id: number) {
    deps.studentError.value = ''
    try {
      await api.deleteFreeTime(id)
      deps.freeTimes.value = deps.freeTimes.value.filter((item) => item.id !== id)
      if (deps.editingFreeTimeId.value === id) {
        deps.resetFreeTimeForm()
      }
      deps.showStudentToast('空闲时间已删除')
    } catch (error) {
      deps.studentError.value = error instanceof Error ? error.message : '删除空闲时间失败'
    }
  }

  async function updateStudentStatus(detailId: number, status: StatusCode) {
    deps.studentError.value = ''
    try {
      await api.updateAttendanceStatus(detailId, status)
      if (deps.activeCheck.value) {
        const target = deps.activeCheck.value.students.find((student) => student.id === detailId)
        if (target) {
          target.status = status
        }
        const currentIndex = deps.activeCheck.value.students.findIndex((student) => student.id === detailId)
        const nextStudent = currentIndex >= 0 ? deps.activeCheck.value.students[currentIndex + 1] : null
        deps.selectedStudentId.value = nextStudent?.id ?? detailId
      }
      deps.showStudentToast(`状态已更新为${deps.statusName(status)}`)
    } catch (error) {
      deps.studentError.value = error instanceof Error ? error.message : '更新状态失败'
    }
  }

  async function completeAttendance(reloadStudentData: () => Promise<void>) {
    if (!deps.activeCheck.value) {
      return
    }
    deps.attendanceCompleting.value = true
    deps.studentError.value = ''
    try {
      await api.completeAttendanceCheck(deps.activeCheck.value.attendance_check.id)
      await reloadStudentData()
      deps.activeCheck.value = null
      deps.selectedStudentId.value = null
      deps.showStudentToast('本次查课已结束')
    } catch (error) {
      deps.studentError.value = error instanceof Error ? error.message : '完成查课失败'
    } finally {
      deps.attendanceCompleting.value = false
    }
  }

  return {
    loadStudentData,
    saveFreeTime,
    editFreeTime,
    removeFreeTime,
    openCourse,
    updateStudentStatus,
    completeAttendance,
  }
}
