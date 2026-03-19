import { computed, type ComputedRef, type Ref } from 'vue'

import type { AttendanceRecordLogItem, ClassItem, ClassStudentItem, CourseItem, FreeTimeItem, StudentItem, UserItem } from '../../api'
import type {
  AdminAttendanceLogFilters,
  AdminClassFilters,
  AdminClassStudentFilters,
  AdminCourseFilters,
  AdminStudentFilters,
  AdminUserFilters,
} from '../../components/admin/form-types'
import { getCurrentAcademicTerm } from '../../utils/free-time'
import { selectDefaultTermName, sortTermsForSelect } from '../../utils/terms'
import { usePagedCollection } from './usePagedCollection'
import { useSelection } from './useSelection'

export type UseAdminCollectionsDeps = {
  users: Ref<UserItem[]>
  classes: Ref<ClassItem[]>
  students: Ref<StudentItem[]>
  courses: Ref<CourseItem[]>
  courseTerms: Ref<{ id: number; name: string; term_start_date: string }[]>
  attendanceLogs: Ref<AttendanceRecordLogItem[]>
  classStudents: Ref<ClassStudentItem[]>
  userFilters: AdminUserFilters
  classFilters: AdminClassFilters
  courseFilters: AdminCourseFilters
  attendanceLogFilters: AdminAttendanceLogFilters
  classStudentFilters: AdminClassStudentFilters
  studentFilters: AdminStudentFilters
  userFreeTimeItems: Ref<FreeTimeItem[]>
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

  const usersView = usePagedCollection({
    source: deps.users,
    predicate: (user) => {
      const byStudentId = !deps.userFilters.studentId || user.login_id.includes(deps.userFilters.studentId.trim())
      const byRealName = !deps.userFilters.realName || user.real_name.includes(deps.userFilters.realName.trim())
      const byManagedClassName =
        !deps.userFilters.managedClassName ||
        (() => {
          if (typeof user.managed_class_id !== 'number') {
            return false
          }
          const matched = deps.classes.value.find((item) => item.id === user.managed_class_id)
          return (matched?.class_name ?? '').includes(deps.userFilters.managedClassName.trim())
        })()
      const byRole = !deps.userFilters.role || String(user.role) === deps.userFilters.role
      const byStatus = !deps.userFilters.status || String(user.status) === deps.userFilters.status
      return byStudentId && byRealName && byManagedClassName && byRole && byStatus
    },
    resetDeps: () => [
      deps.userFilters.studentId,
      deps.userFilters.realName,
      deps.userFilters.managedClassName,
      deps.userFilters.role,
      deps.userFilters.status,
    ],
  })

  const classesView = usePagedCollection({
    source: deps.classes,
    predicate: (item) => {
      const byGrade = !deps.classFilters.grade || String(item.grade) === deps.classFilters.grade
      const byMajor = !deps.classFilters.majorName || item.major_name === deps.classFilters.majorName
      const byName = !deps.classFilters.className || item.class_name.includes(deps.classFilters.className.trim())
      return byGrade && byMajor && byName
    },
    resetDeps: () => [deps.classFilters.grade, deps.classFilters.majorName, deps.classFilters.className],
  })

  const studentsView = usePagedCollection({
    source: deps.students,
    predicate: (item) => {
      const byClassName =
        !deps.studentFilters.className ||
        (item.class_name ?? '').includes(deps.studentFilters.className.trim())
      const byStudentId = !deps.studentFilters.studentId || item.student_id.includes(deps.studentFilters.studentId.trim())
      const byRealName = !deps.studentFilters.realName || item.real_name.includes(deps.studentFilters.realName.trim())
      return byClassName && byStudentId && byRealName
    },
    resetDeps: () => [deps.studentFilters.className, deps.studentFilters.studentId, deps.studentFilters.realName],
  })

  const coursesView = usePagedCollection({
    source: deps.courses,
    predicate: (item) => {
      const byTerm = !deps.courseFilters.term || item.term === deps.courseFilters.term
      const byCourseName = !deps.courseFilters.courseName || item.course_name.includes(deps.courseFilters.courseName.trim())
      const byTeacher = !deps.courseFilters.teacherName || item.teacher_name.includes(deps.courseFilters.teacherName.trim())
      const byClass = !deps.courseFilters.classId || item.class_ids.includes(Number(deps.courseFilters.classId))
      return byTerm && byCourseName && byTeacher && byClass
    },
    resetDeps: () => [deps.courseFilters.term, deps.courseFilters.courseName, deps.courseFilters.teacherName, deps.courseFilters.classId],
  })

  const attendanceLogsView = usePagedCollection({
    source: deps.attendanceLogs,
    predicate: (item) => {
      const byStudent = !deps.attendanceLogFilters.studentId || item.student_id.includes(deps.attendanceLogFilters.studentId.trim())
      const byOperator = !deps.attendanceLogFilters.operatorStudentId || item.operator_login_id.includes(deps.attendanceLogFilters.operatorStudentId.trim())
      const byType = !deps.attendanceLogFilters.operationType || item.operation_type.includes(deps.attendanceLogFilters.operationType.trim())
      const byStatus = !deps.attendanceLogFilters.newStatus || String(item.new_status) === deps.attendanceLogFilters.newStatus
      const byDate = !deps.attendanceLogFilters.operatedDate || item.operated_at.startsWith(deps.attendanceLogFilters.operatedDate)
      return byStudent && byOperator && byType && byStatus && byDate
    },
    resetDeps: () => [
      deps.attendanceLogFilters.studentId,
      deps.attendanceLogFilters.operatorStudentId,
      deps.attendanceLogFilters.operationType,
      deps.attendanceLogFilters.newStatus,
      deps.attendanceLogFilters.operatedDate,
    ],
  })

  const filteredClassStudents = computed(() =>
    deps.classStudents.value.filter((item) => {
      const byStudentId = !deps.classStudentFilters.studentId || item.student_id.includes(deps.classStudentFilters.studentId.trim())
      const byRealName = !deps.classStudentFilters.realName || item.real_name.includes(deps.classStudentFilters.realName.trim())
      return byStudentId && byRealName
    }),
  )

  const courseSelection = useSelection({
    allItems: deps.courses,
    pageItems: coursesView.paginatedItems,
    getId: (item) => item.id,
  })

  const classSelection = useSelection({
    allItems: deps.classes,
    pageItems: classesView.paginatedItems,
    getId: (item) => item.id,
  })

  const userSelection = useSelection({
    allItems: deps.users,
    pageItems: usersView.paginatedItems,
    getId: (item) => item.login_id,
    canSelect: (item) => item.id !== deps.currentUserId.value,
  })

  const studentSelection = useSelection({
    allItems: deps.students,
    pageItems: studentsView.paginatedItems,
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
    usersView,
    classesView,
    coursesView,
    attendanceLogsView,
    paginatedUsers: usersView.paginatedItems,
    paginatedCourses: coursesView.paginatedItems,
    paginatedClasses: classesView.paginatedItems,
    paginatedStudents: studentsView.paginatedItems,
    paginatedAttendanceLogs: attendanceLogsView.paginatedItems,
    userPage: usersView.page,
    userPageSize: usersView.pageSize,
    userTotalPages: usersView.totalPages,
    coursePage: coursesView.page,
    coursePageSize: coursesView.pageSize,
    courseTotalPages: coursesView.totalPages,
    classPage: classesView.page,
    classPageSize: classesView.pageSize,
    classTotalPages: classesView.totalPages,
    studentPage: studentsView.page,
    studentPageSize: studentsView.pageSize,
    studentTotalPages: studentsView.totalPages,
    attendanceLogsPage: attendanceLogsView.page,
    attendanceLogsPageSize: attendanceLogsView.pageSize,
    attendanceLogsTotalPages: attendanceLogsView.totalPages,
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
    studentsView,
  }
}
