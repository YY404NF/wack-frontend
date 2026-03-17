import type { Ref } from 'vue'

import { api, type ClassStudentCandidateItem, type ClassStudentItem, type CourseDetail, type CourseItem, type FreeTimeItem, type UserItem } from '../../api'
import { buildFreeTimeCellKey, createFreeTimeDraft, getCurrentAcademicTerm } from '../../utils/free-time'

type CourseForm = {
  term: string
  courseName: string
  teacherName: string
  weekday: number | null
  section: number | null
  buildingName: string
  roomName: string
  selectedWeeks: number[]
  sessions: Array<{
    sessionNo: number
    weekNo: number
    weekday: number
    section: number
    buildingName: string
    roomName: string
  }>
}

type UseAdminEditorsDeps = {
  adminError: Ref<string>
  courseLoading: Ref<boolean>
  courseStudentLoading: Ref<boolean>
  courseStudentSaving: Ref<boolean>
  userFreeTimeLoading: Ref<boolean>
  classStudents: Ref<ClassStudentItem[]>
  courseStudentCandidates: Ref<ClassStudentCandidateItem[]>
  courseStudentTargetCourseId: Ref<number | null>
  courseStudentTargetName: Ref<string>
  courseStudentSelectedClassIds: Ref<number[]>
  courseStudentSelectedStudentIds: Ref<string[]>
  courseStudentClassStudentMap: Ref<Record<number, ClassStudentItem[]>>
  courseStudentLooseStudents: Ref<Array<{ student_id: string; real_name: string }>>
  courseStudentModalOpen: Ref<boolean>
  freeTimeTargetName: Ref<string>
  freeTimeTargetStudentId: Ref<string>
  userFreeTimeTerm: Ref<string>
  userFreeTimeItems: Ref<FreeTimeItem[]>
  userFreeTimeDraft: Ref<Record<string, number[]>>
  userFreeTimeModalOpen: Ref<boolean>
  courseModalOpen: Ref<boolean>
  editingCourseId: Ref<number | null>
  courseForm: CourseForm
  resetCourseForm: () => void
  closeCourseStudentModal: () => void
}

export function useAdminEditors(deps: UseAdminEditorsDeps) {
  function createUserFreeTimeDraft(items: FreeTimeItem[], term: string) {
    deps.userFreeTimeDraft.value = createFreeTimeDraft(items, term)
  }

  async function loadUserFreeTimeItems(studentId: string) {
    const page = await api.listFreeTimes({ page: 1, page_size: 200, student_id: studentId })
    deps.userFreeTimeItems.value = page.items ?? []
    createUserFreeTimeDraft(deps.userFreeTimeItems.value, deps.userFreeTimeTerm.value)
  }

  async function openUserFreeTimeModal(user: UserItem) {
    if (user.role !== 2) {
      return
    }
    deps.userFreeTimeLoading.value = true
    deps.adminError.value = ''
    deps.freeTimeTargetName.value = `${user.real_name}（${user.student_id}）`
    deps.freeTimeTargetStudentId.value = user.student_id
    deps.userFreeTimeTerm.value = getCurrentAcademicTerm()
    deps.userFreeTimeModalOpen.value = true
    try {
      await loadUserFreeTimeItems(user.student_id)
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '加载空闲时间失败'
      deps.userFreeTimeModalOpen.value = false
      deps.freeTimeTargetName.value = ''
      deps.freeTimeTargetStudentId.value = ''
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

  function applyCourseDetail(detail: CourseDetail) {
    deps.courseForm.term = detail.course.term
    deps.courseForm.courseName = detail.course.course_name
    deps.courseForm.teacherName = detail.course.teacher_name
    deps.courseForm.weekday = null
    deps.courseForm.section = null
    deps.courseForm.buildingName = ''
    deps.courseForm.roomName = ''
    deps.courseForm.selectedWeeks = []
    deps.courseForm.sessions = detail.sessions
      .slice()
      .sort((left, right) => left.session_no - right.session_no)
      .map((session) => ({
        sessionNo: session.session_no,
        weekNo: session.week_no,
        weekday: session.weekday,
        section: session.section,
        buildingName: session.building_name,
        roomName: session.room_name,
      }))
  }

  async function loadCourseStudentClassStudents(classIds: number[]) {
    const entries = await Promise.all(
      classIds.map(async (classId) => {
        const students = await api.listClassStudents(classId)
        return [classId, students] as const
      }),
    )
    deps.courseStudentClassStudentMap.value = Object.fromEntries(entries)
  }

  function syncLooseCourseStudents() {
    const classStudentIds = new Set(
      Object.values(deps.courseStudentClassStudentMap.value)
        .flat()
        .map((item) => item.student_id),
    )
    const existingLooseNames = new Map(deps.courseStudentLooseStudents.value.map((item) => [item.student_id, item.real_name]))
    deps.courseStudentLooseStudents.value = deps.courseStudentSelectedStudentIds.value
      .filter((studentId) => !classStudentIds.has(studentId))
      .map((studentId) => {
        const matchedStudent = deps.courseStudentCandidates.value.find((item) => item.student_id === studentId)
        return {
          student_id: studentId,
          real_name: matchedStudent?.real_name ?? existingLooseNames.get(studentId) ?? studentId,
        }
      })
  }

  function sortCourseSessions() {
    deps.courseForm.sessions = deps.courseForm.sessions
      .slice()
      .sort((left, right) => {
        if (left.weekNo !== right.weekNo) return left.weekNo - right.weekNo
        if (left.weekday !== right.weekday) return left.weekday - right.weekday
        if (left.section !== right.section) return left.section - right.section
        return left.roomName.localeCompare(right.roomName, 'zh-Hans-CN')
      })
      .map((item, index) => ({ ...item, sessionNo: index + 1 }))
  }

  function setCourseWeekSelected(weekNo: number, selected: boolean) {
    const weekSet = new Set(deps.courseForm.selectedWeeks)
    if (selected) weekSet.add(weekNo)
    else weekSet.delete(weekNo)
    deps.courseForm.selectedWeeks = Array.from(weekSet).sort((left, right) => left - right)
  }

  function addCourseSessions() {
    const weeks = Array.from(new Set(deps.courseForm.selectedWeeks)).sort((left, right) => left - right)
    if (weeks.length === 0) {
      deps.adminError.value = '请先选择周数'
      return
    }
    if (deps.courseForm.weekday === null || deps.courseForm.section === null || !deps.courseForm.buildingName.trim() || !deps.courseForm.roomName.trim()) {
      deps.adminError.value = '请先填写完整的上课时间'
      return
    }

    const nextSessions = deps.courseForm.sessions.filter(
      (item) => !weeks.some((weekNo) => weekNo === item.weekNo && item.weekday === deps.courseForm.weekday && item.section === deps.courseForm.section),
    )
    for (const weekNo of weeks) {
      nextSessions.push({
        sessionNo: 0,
        weekNo,
        weekday: deps.courseForm.weekday,
        section: deps.courseForm.section,
        buildingName: deps.courseForm.buildingName.trim(),
        roomName: deps.courseForm.roomName.trim(),
      })
    }
    deps.courseForm.sessions = nextSessions
    sortCourseSessions()
    deps.courseForm.selectedWeeks = []
    deps.adminError.value = ''
  }

  function editCourseSession(sessionNo: number) {
    const target = deps.courseForm.sessions.find((item) => item.sessionNo === sessionNo)
    if (!target) return
    deps.courseForm.weekday = target.weekday
    deps.courseForm.section = target.section
    deps.courseForm.buildingName = target.buildingName
    deps.courseForm.roomName = target.roomName
    deps.courseForm.selectedWeeks = [target.weekNo]
    deps.courseForm.sessions = deps.courseForm.sessions.filter((item) => item.sessionNo !== sessionNo)
    sortCourseSessions()
  }

  function removeCourseSession(sessionNo: number) {
    deps.courseForm.sessions = deps.courseForm.sessions.filter((item) => item.sessionNo !== sessionNo)
    sortCourseSessions()
  }

  function openCreateCourseModal() {
    deps.resetCourseForm()
    deps.courseModalOpen.value = true
  }

  async function openEditCourseModal(item: CourseItem) {
    deps.courseLoading.value = true
    deps.adminError.value = ''
    try {
      const detail = await api.getCourse(item.id)
      deps.resetCourseForm()
      applyCourseDetail(detail)
      deps.editingCourseId.value = item.id
      deps.courseModalOpen.value = true
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '加载课程失败'
    } finally {
      deps.courseLoading.value = false
    }
  }

  async function openCourseStudentModal(item: CourseItem) {
    deps.courseStudentLoading.value = true
    deps.adminError.value = ''
    try {
      const detail = await api.getCourse(item.id)
      deps.courseStudentTargetCourseId.value = item.id
      deps.courseStudentTargetName.value = `${item.course_name} · ${item.teacher_name}`
      deps.courseStudentSelectedClassIds.value = detail.classes.map((entry) => Number(entry.class_id)).sort((left, right) => left - right)
      deps.courseStudentSelectedStudentIds.value = detail.students.map((entry) => entry.student_id).sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'))
      deps.courseStudentLooseStudents.value = detail.students.map((entry) => ({ student_id: entry.student_id, real_name: entry.real_name }))
      await loadCourseStudentClassStudents(deps.courseStudentSelectedClassIds.value)
      syncLooseCourseStudents()
      deps.courseStudentModalOpen.value = true
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '加载课程学生失败'
      deps.closeCourseStudentModal()
    } finally {
      deps.courseStudentLoading.value = false
    }
  }

  async function addCourseStudentClass(classId: number) {
    if (deps.courseStudentSelectedClassIds.value.includes(classId)) return
    deps.courseStudentLoading.value = true
    deps.adminError.value = ''
    try {
      const students = await api.listClassStudents(classId)
      deps.courseStudentClassStudentMap.value = { ...deps.courseStudentClassStudentMap.value, [classId]: students }
      deps.courseStudentSelectedClassIds.value = [...deps.courseStudentSelectedClassIds.value, classId].sort((left, right) => left - right)
      const selected = new Set(deps.courseStudentSelectedStudentIds.value)
      for (const student of students) selected.add(student.student_id)
      deps.courseStudentSelectedStudentIds.value = Array.from(selected).sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'))
      syncLooseCourseStudents()
    } catch (error) {
      deps.adminError.value = error instanceof Error ? error.message : '添加班级失败'
    } finally {
      deps.courseStudentLoading.value = false
    }
  }

  function removeCourseStudentClass(classId: number) {
    const remainingClassIds = deps.courseStudentSelectedClassIds.value.filter((item) => item !== classId)
    const remainingClassStudents = new Set(
      remainingClassIds.flatMap((item) => (deps.courseStudentClassStudentMap.value[item] ?? []).map((student) => student.student_id)),
    )
    const looseStudentIds = new Set(deps.courseStudentLooseStudents.value.map((item) => item.student_id))
    const nextMap = { ...deps.courseStudentClassStudentMap.value }
    delete nextMap[classId]
    deps.courseStudentSelectedClassIds.value = remainingClassIds
    deps.courseStudentClassStudentMap.value = nextMap
    deps.courseStudentSelectedStudentIds.value = deps.courseStudentSelectedStudentIds.value.filter(
      (studentId) => remainingClassStudents.has(studentId) || looseStudentIds.has(studentId),
    )
    syncLooseCourseStudents()
  }

  function toggleCourseStudentClassSelection(classId: number) {
    const classStudentIds = (deps.courseStudentClassStudentMap.value[classId] ?? []).map((student) => student.student_id)
    const selected = new Set(deps.courseStudentSelectedStudentIds.value)
    const allSelected = classStudentIds.length > 0 && classStudentIds.every((studentId) => selected.has(studentId))
    if (allSelected) {
      const otherClassStudentIds = new Set(
        deps.courseStudentSelectedClassIds.value
          .filter((item) => item !== classId)
          .flatMap((item) => (deps.courseStudentClassStudentMap.value[item] ?? []).map((student) => student.student_id)),
      )
      deps.courseStudentSelectedStudentIds.value = deps.courseStudentSelectedStudentIds.value.filter(
        (studentId) => !classStudentIds.includes(studentId) || otherClassStudentIds.has(studentId),
      )
      syncLooseCourseStudents()
      return
    }
    for (const studentId of classStudentIds) selected.add(studentId)
    deps.courseStudentSelectedStudentIds.value = Array.from(selected).sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'))
    syncLooseCourseStudents()
  }

  function toggleCourseStudentSelection(studentId: string) {
    const selected = new Set(deps.courseStudentSelectedStudentIds.value)
    if (selected.has(studentId)) selected.delete(studentId)
    else selected.add(studentId)
    deps.courseStudentSelectedStudentIds.value = Array.from(selected).sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'))
    syncLooseCourseStudents()
  }

  function addCourseStudent(studentId: string) {
    const selected = new Set(deps.courseStudentSelectedStudentIds.value)
    if (selected.has(studentId)) return
    selected.add(studentId)
    deps.courseStudentSelectedStudentIds.value = Array.from(selected).sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'))
    syncLooseCourseStudents()
  }

  function removeCourseStudent(studentId: string) {
    deps.courseStudentSelectedStudentIds.value = deps.courseStudentSelectedStudentIds.value.filter((item) => item !== studentId)
    deps.courseStudentLooseStudents.value = deps.courseStudentLooseStudents.value.filter((item) => item.student_id !== studentId)
  }

  return {
    loadUserFreeTimeItems,
    openUserFreeTimeModal,
    updateUserFreeTimeTerm,
    toggleUserFreeTimeWeek,
    toggleUserFreeTimeCell,
    openCreateCourseModal,
    openEditCourseModal,
    openCourseStudentModal,
    addCourseStudentClass,
    removeCourseStudentClass,
    toggleCourseStudentClassSelection,
    toggleCourseStudentSelection,
    addCourseStudent,
    removeCourseStudent,
    setCourseWeekSelected,
    addCourseSessions,
    editCourseSession,
    removeCourseSession,
  }
}
