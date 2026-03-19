import type { Ref } from 'vue'

import { api, type CourseItem, type FreeTimeItem, type UserItem } from '../../api'
import { buildFreeTimeCellKey, createFreeTimeDraft, getCurrentAcademicTerm } from '../../utils/free-time'

type CourseForm = {
  termId: number | ''
  grade: number
  courseName: string
  teacherName: string
}

type UseAdminEditorsDeps = {
  adminError: Ref<string>
  courseLoading: Ref<boolean>
  userFreeTimeLoading: Ref<boolean>
  freeTimeTargetName: Ref<string>
  freeTimeTargetLoginId: Ref<string>
  userFreeTimeTerm: Ref<string>
  userFreeTimeItems: Ref<FreeTimeItem[]>
  userFreeTimeDraft: Ref<Record<string, number[]>>
  userFreeTimeModalOpen: Ref<boolean>
  courseModalOpen: Ref<boolean>
  editingCourseId: Ref<number | null>
  courseForm: CourseForm
  resetCourseForm: () => void
}

export function useAdminEditors(deps: UseAdminEditorsDeps) {
  function createUserFreeTimeDraft(items: FreeTimeItem[], term: string) {
    deps.userFreeTimeDraft.value = createFreeTimeDraft(items, term)
  }

  async function loadUserFreeTimeItems(loginId: string) {
    deps.userFreeTimeItems.value = await api.listAllFreeTimes({ login_id: loginId })
    createUserFreeTimeDraft(deps.userFreeTimeItems.value, deps.userFreeTimeTerm.value)
  }

  async function openUserFreeTimeModal(user: UserItem) {
    if (user.role !== 2) {
      return
    }
    deps.userFreeTimeLoading.value = true
    deps.adminError.value = ''
    deps.freeTimeTargetName.value = `${user.real_name}（${user.login_id}）`
    deps.freeTimeTargetLoginId.value = user.login_id
    deps.userFreeTimeTerm.value = getCurrentAcademicTerm()
    deps.userFreeTimeModalOpen.value = true
    try {
      await loadUserFreeTimeItems(user.login_id)
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '加载空闲时间失败'
      deps.userFreeTimeModalOpen.value = false
      deps.freeTimeTargetName.value = ''
      deps.freeTimeTargetLoginId.value = ''
      deps.userFreeTimeTerm.value = getCurrentAcademicTerm()
      deps.userFreeTimeItems.value = []
      deps.userFreeTimeDraft.value = {}
    } finally {
      deps.userFreeTimeLoading.value = false
    }
  }

  function updateUserFreeTimeTerm(term: string) {
    deps.userFreeTimeTerm.value = term
    createUserFreeTimeDraft(deps.userFreeTimeItems.value, term)
  }

  function toggleUserFreeTimeWeek(payload: { weekday: number; section: number; weekNo: number }) {
    const key = buildFreeTimeCellKey(payload.weekday, payload.section)
    const current = new Set(deps.userFreeTimeDraft.value[key] ?? [])
    if (current.has(payload.weekNo)) {
      current.delete(payload.weekNo)
    } else {
      current.add(payload.weekNo)
    }
    deps.userFreeTimeDraft.value = {
      ...deps.userFreeTimeDraft.value,
      [key]: Array.from(current).sort((left, right) => left - right),
    }
  }

  function toggleUserFreeTimeCell(payload: { weekday: number; section: number }) {
    const key = buildFreeTimeCellKey(payload.weekday, payload.section)
    const current = deps.userFreeTimeDraft.value[key] ?? []
    const next =
      current.length >= 16
        ? []
        : Array.from({ length: 16 }, (_, index) => index + 1)

    deps.userFreeTimeDraft.value = {
      ...deps.userFreeTimeDraft.value,
      [key]: next,
    }
  }

  function openCreateCourseModal() {
    deps.resetCourseForm()
    deps.courseModalOpen.value = true
  }

  async function openEditCourseModal(item: CourseItem) {
    deps.courseLoading.value = true
    deps.adminError.value = ''
    try {
      deps.resetCourseForm()
      deps.courseForm.termId = item.term_id
      deps.courseForm.grade = item.grade
      deps.courseForm.courseName = item.course_name
      deps.courseForm.teacherName = item.teacher_name
      deps.editingCourseId.value = item.id
      deps.courseModalOpen.value = true
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '加载课程失败'
    } finally {
      deps.courseLoading.value = false
    }
  }

  return {
    loadUserFreeTimeItems,
    openUserFreeTimeModal,
    updateUserFreeTimeTerm,
    toggleUserFreeTimeWeek,
    toggleUserFreeTimeCell,
    openCreateCourseModal,
    openEditCourseModal,
  }
}
