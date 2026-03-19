import type { Ref } from 'vue'

import { api, type AvailableCourseItem, type FreeTimeEditorItem, type MetaSectionItem, type SystemSetting } from '../../api'
import { FREE_TIME_VISIBLE_SECTIONS, FREE_TIME_VISIBLE_WEEKDAYS, FREE_TIME_WEEK_COUNT, buildFreeTimeCellKey, createFreeTimeDraft, formatFreeWeeks, parseFreeWeeks, type FreeTimeDraft } from '../../utils/free-time'

type FreeTimeForm = {
  term: string
  weekday: number
  section: number
  freeWeeks: string
}

type StudentFlowDeps = {
  availableCourses: Ref<AvailableCourseItem[]>
  freeTimes: Ref<FreeTimeEditorItem[]>
  systemSettings: Ref<SystemSetting | null>
  currentSchedule: Ref<'summer' | 'autumn'>
  metaSections: Ref<MetaSectionItem[]>
  freeTimeModalOpen: Ref<boolean>
  freeTimeTerm: Ref<string>
  freeTimeDraft: Ref<FreeTimeDraft>
  editingFreeTimeId: Ref<number | null>
  freeTimeForm: FreeTimeForm
  freeTimeSaving: Ref<boolean>
  studentError: Ref<string>
  resetFreeTimeForm: () => void
  showStudentToast: (message: string) => void
}

export function useStudentFlow(deps: StudentFlowDeps) {
  async function loadStudentCoreData() {
    const [courses, systemSettings, sectionsData] = await Promise.all([
      api.studentAvailableCourses(),
      api.getSystemSettings(),
      api.getMetaSections(),
    ])
    deps.availableCourses.value = courses ?? []
    deps.systemSettings.value = systemSettings
    deps.currentSchedule.value = sectionsData.schedule
    deps.metaSections.value = sectionsData.list ?? []
  }

  async function loadStudentFreeTimes() {
    deps.freeTimes.value = await api.listFreeTimeEditor({ term: deps.freeTimeTerm.value })
    if (deps.freeTimeModalOpen.value) {
      syncFreeTimeDraft()
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
      deps.freeTimes.value = await api.listFreeTimeEditor({ term: deps.freeTimeForm.term.trim() })
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
      deps.freeTimes.value = await api.listFreeTimeEditor({ term })
      syncFreeTimeDraft()
      deps.freeTimeModalOpen.value = false
      deps.showStudentToast('空闲时间已保存')
    } catch (error) {
      deps.studentError.value = error instanceof Error ? error.message : '保存空闲时间失败'
    } finally {
      deps.freeTimeSaving.value = false
    }
  }

  function editFreeTime(item: FreeTimeEditorItem) {
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

  return {
    loadStudentCoreData,
    loadStudentFreeTimes,
    saveFreeTime,
    syncFreeTimeDraft,
    toggleFreeTimeWeek,
    toggleFreeTimeBlock,
    saveFreeTimeDraft,
    editFreeTime,
    removeFreeTime,
  }
}
