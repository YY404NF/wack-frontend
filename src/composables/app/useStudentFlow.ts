import type { Ref } from 'vue'

import { api, type AttendanceCheckDetail, type AvailableCourseItem, type FreeTimeItem, type SystemSetting } from '../../api'
import type { StatusCode } from '../../constants'
import { FREE_TIME_VISIBLE_SECTIONS, FREE_TIME_VISIBLE_WEEKDAYS, FREE_TIME_WEEK_COUNT, buildFreeTimeCellKey, createFreeTimeDraft, formatFreeWeeks, parseFreeWeeks, type FreeTimeDraft } from '../../utils/free-time'

type FreeTimeForm = {
  term: string
  weekday: number
  section: number
  freeWeeks: string
}

type StudentFlowDeps = {
  availableCourses: Ref<AvailableCourseItem[]>
  freeTimes: Ref<FreeTimeItem[]>
  systemSettings: Ref<SystemSetting | null>
  activeCheck: Ref<AttendanceCheckDetail | null>
  selectedStudentId: Ref<number | null>
  freeTimeModalOpen: Ref<boolean>
  freeTimeTerm: Ref<string>
  freeTimeDraft: Ref<FreeTimeDraft>
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

  async function loadStudentCoreData() {
    const [courses, systemSettings] = await Promise.all([
      api.studentAvailableCourses(),
      api.getSystemSettings(),
    ])
    deps.availableCourses.value = courses ?? []
    deps.systemSettings.value = systemSettings
  }

  async function loadStudentFreeTimes() {
    const freeTimePage = await api.listFreeTimes()
    deps.freeTimes.value = freeTimePage.items ?? []
    if (deps.freeTimeModalOpen.value) {
      syncFreeTimeDraft()
    }
  }

  async function ensureActiveCheck() {
    const resumableCourse = deps.availableCourses.value.find((course) => Boolean(course.attendance_check_id))
    if (resumableCourse) {
      await openCourse(resumableCourse)
      return
    }
    deps.activeCheck.value = null
    deps.selectedStudentId.value = null
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

  function syncFreeTimeDraft() {
    deps.freeTimeDraft.value = createFreeTimeDraft(deps.freeTimes.value, deps.freeTimeTerm.value)
  }

  function toggleFreeTimeWeek(payload: { weekday: number; section: number; weekNo: number }) {
    const key = buildFreeTimeCellKey(payload.weekday, payload.section)
    const current = new Set(deps.freeTimeDraft.value[key] ?? [])
    if (current.has(payload.weekNo)) {
      current.delete(payload.weekNo)
    } else {
      current.add(payload.weekNo)
    }
    deps.freeTimeDraft.value = {
      ...deps.freeTimeDraft.value,
      [key]: Array.from(current).sort((left, right) => left - right),
    }
  }

  function toggleFreeTimeBlock(payload: { weekday: number; section: number }) {
    const key = buildFreeTimeCellKey(payload.weekday, payload.section)
    const current = deps.freeTimeDraft.value[key] ?? []
    const nextValue = current.length === FREE_TIME_WEEK_COUNT
      ? []
      : Array.from({ length: FREE_TIME_WEEK_COUNT }, (_, index) => index + 1)
    deps.freeTimeDraft.value = {
      ...deps.freeTimeDraft.value,
      [key]: nextValue,
    }
  }

  async function saveFreeTimeDraft() {
    deps.freeTimeSaving.value = true
    deps.studentError.value = ''
    try {
      const term = deps.freeTimeTerm.value.trim()
      const originalItems = deps.freeTimes.value.filter((item) => item.term === term)
      const originalMap = new Map(originalItems.map((item) => [buildFreeTimeCellKey(item.weekday, item.section), item]))
      const tasks: Promise<unknown>[] = []

      for (const weekday of FREE_TIME_VISIBLE_WEEKDAYS) {
        for (const section of FREE_TIME_VISIBLE_SECTIONS) {
          const key = buildFreeTimeCellKey(weekday, section)
          const weeks = deps.freeTimeDraft.value[key] ?? []
          const currentValue = formatFreeWeeks(weeks)
          const currentItem = originalMap.get(key)
          const originalValue = currentItem ? formatFreeWeeks(parseFreeWeeks(currentItem.free_weeks)) : ''

          if (!currentValue && currentItem) {
            tasks.push(api.deleteFreeTime(currentItem.id))
            continue
          }

          if (!currentValue) {
            continue
          }

          const payload = {
            term,
            weekday,
            section,
            free_weeks: currentValue,
          }

          if (!currentItem) {
            tasks.push(api.createFreeTime(payload))
            continue
          }

          if (originalValue !== currentValue) {
            tasks.push(api.updateFreeTime(currentItem.id, payload))
          }
        }
      }

      await Promise.all(tasks)
      const freeTimePage = await api.listFreeTimes()
      deps.freeTimes.value = freeTimePage.items ?? []
      syncFreeTimeDraft()
      deps.freeTimeModalOpen.value = false
      deps.showStudentToast('空闲时间已保存')
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
    loadStudentCoreData,
    loadStudentFreeTimes,
    ensureActiveCheck,
    saveFreeTime,
    syncFreeTimeDraft,
    toggleFreeTimeWeek,
    toggleFreeTimeBlock,
    saveFreeTimeDraft,
    editFreeTime,
    removeFreeTime,
    openCourse,
    updateStudentStatus,
    completeAttendance,
  }
}
