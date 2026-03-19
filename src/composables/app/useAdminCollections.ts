import { computed, type ComputedRef, type Ref } from 'vue'

import type { AttendanceRecordLogItem, ClassItem, ClassStudentItem, CourseItem, FreeTimeEditorItem, StudentItem, UserItem } from '../../api'
import type {
  AdminClassStudentFilters,
} from '../../components/admin/form-types'
import { getCurrentAcademicTerm } from '../../utils/free-time'
import { selectDefaultTermName, sortTermsForSelect } from '../../utils/terms'
import { useSelection } from './useSelection'

export type UseAdminCollectionsDeps = {
  users: Ref<UserItem[]>
  classes: Ref<ClassItem[]>
  students: Ref<StudentItem[]>
  courses: Ref<CourseItem[]>
  courseTerms: Ref<{ id: number; name: string; term_start_date: string }[]>
  attendanceLogs: Ref<AttendanceRecordLogItem[]>
  classStudents: Ref<ClassStudentItem[]>
  classStudentFilters: AdminClassStudentFilters
  userFreeTimeItems: Ref<FreeTimeEditorItem[]>
  userFreeTimeTerm: Ref<string>
  currentUserId: ComputedRef<number | undefined>
}

export type AdminCollectionsState = ReturnType<typeof useAdminCollections>

export function useAdminCollections(deps: UseAdminCollectionsDeps) {
  const userFreeTimeTermOptions = computed(() => {
    if (deps.courseTerms.value.length > 0) {
      return sortTermsForSelect(deps.courseTerms.value).map((item) => item.name)
    }
    const terms = new Set<string>([deps.userFreeTimeTerm.value, getCurrentAcademicTerm()])
    for (const item of deps.userFreeTimeItems.value) {
      terms.add(item.term)
    }
    return Array.from(terms).filter(Boolean).sort((left, right) => right.localeCompare(left, 'zh-Hans-CN'))
  })

  const filteredClassStudents = computed(() =>
    (deps.classStudents.value ?? []).filter((item) => {
      const byStudentId = !deps.classStudentFilters.studentId || item.student_id.includes(deps.classStudentFilters.studentId.trim())
      const byRealName = !deps.classStudentFilters.realName || item.real_name.includes(deps.classStudentFilters.realName.trim())
      return byStudentId && byRealName
    }),
  )

  const pageUsers = computed(() => deps.users.value)
  const pageClasses = computed(() => deps.classes.value)
  const pageStudents = computed(() => deps.students.value)
  const pageCourses = computed(() => deps.courses.value)

  const courseSelection = useSelection({
    allItems: deps.courses,
    pageItems: pageCourses,
    getId: (item) => item.id,
  })

  const classSelection = useSelection({
    allItems: deps.classes,
    pageItems: pageClasses,
    getId: (item) => item.id,
  })

  const userSelection = useSelection({
    allItems: deps.users,
    pageItems: pageUsers,
    getId: (item) => item.login_id,
    canSelect: (item) => item.id !== deps.currentUserId.value,
  })

  const studentSelection = useSelection({
    allItems: deps.students,
    pageItems: pageStudents,
    getId: (item) => item.id,
  })

  function clearAdminSelections() {
    courseSelection.clearSelection()
    classSelection.clearSelection()
    userSelection.clearSelection()
    studentSelection.clearSelection()
  }

  return {
    userFreeTimeTermOptions,
    defaultUserFreeTimeTerm: computed(() => selectDefaultTermName(deps.courseTerms.value)),
    filteredClassStudents,
    paginatedUsers: pageUsers,
    paginatedCourses: pageCourses,
    paginatedClasses: pageClasses,
    paginatedStudents: pageStudents,
    paginatedAttendanceLogs: computed(() => deps.attendanceLogs.value),
    selectedCourseIds: courseSelection.selectedIds,
    selectedClassIds: classSelection.selectedIds,
    selectedStudentIds: studentSelection.selectedIds,
    selectedUserStudentIds: userSelection.selectedIds,
    clearAdminSelections,
    toggleCourseSelection: courseSelection.toggleSelection,
    toggleCoursePageSelection: courseSelection.togglePageSelection,
    toggleClassSelection: classSelection.toggleSelection,
    toggleClassPageSelection: classSelection.togglePageSelection,
    toggleStudentSelection: studentSelection.toggleSelection,
    toggleStudentPageSelection: studentSelection.togglePageSelection,
    toggleUserSelection: userSelection.toggleSelection,
    toggleUserPageSelection: userSelection.togglePageSelection,
  }
}
