import { computed, type ComputedRef, type Ref } from 'vue'

import type {
  AdminOperationLogItem,
  AttendanceDetailLogItem,
  ClassItem,
  ClassStudentCandidateItem,
  ClassStudentItem,
  CourseItem,
  FreeTimeItem,
  UserItem,
} from '../../api'
import type {
  AdminAttendanceLogFilters,
  AdminClassFilters,
  AdminClassStudentFilters,
  AdminCourseFilters,
  AdminSystemLogFilters,
  AdminUserFilters,
} from '../../components/admin/form-types'
import { getCurrentAcademicTerm } from '../../utils/free-time'
import { usePagedCollection } from './usePagedCollection'
import { useSelection } from './useSelection'

export type UseAdminCollectionsDeps = {
  users: Ref<UserItem[]>
  classes: Ref<ClassItem[]>
  courses: Ref<CourseItem[]>
  logs: Ref<AdminOperationLogItem[]>
  attendanceLogs: Ref<AttendanceDetailLogItem[]>
  classStudents: Ref<ClassStudentItem[]>
  courseStudentCandidates: Ref<ClassStudentCandidateItem[]>
  courseStudentClassStudentMap: Ref<Record<number, ClassStudentItem[]>>
  courseStudentLooseStudents: Ref<Array<{ student_id: string; real_name: string }>>
  courseStudentSelectedStudentIds: Ref<string[]>
  userFilters: AdminUserFilters
  classFilters: AdminClassFilters
  courseFilters: AdminCourseFilters
  logFilters: AdminSystemLogFilters
  attendanceLogFilters: AdminAttendanceLogFilters
  classStudentFilters: AdminClassStudentFilters
  userFreeTimeItems: Ref<FreeTimeItem[]>
  userFreeTimeTerm: Ref<string>
  currentUserId: ComputedRef<number | undefined>
}

export type AdminCollectionsState = ReturnType<typeof useAdminCollections>

export function useAdminCollections(deps: UseAdminCollectionsDeps) {
  const userFreeTimeTermOptions = computed(() => {
    const terms = new Set<string>([deps.userFreeTimeTerm.value, getCurrentAcademicTerm()])
    for (const item of deps.userFreeTimeItems.value) {
      terms.add(item.term)
    }
    return Array.from(terms).filter(Boolean).sort((left, right) => right.localeCompare(left, 'zh-Hans-CN'))
  })

  const usersView = usePagedCollection({
    source: deps.users,
    predicate: (user) => {
      const byStudentId = !deps.userFilters.studentId || user.student_id.includes(deps.userFilters.studentId.trim())
      const byRealName = !deps.userFilters.realName || user.real_name.includes(deps.userFilters.realName.trim())
      const byRole = !deps.userFilters.role || String(user.role) === deps.userFilters.role
      const byStatus = !deps.userFilters.status || String(user.status) === deps.userFilters.status
      return byStudentId && byRealName && byRole && byStatus
    },
    resetDeps: () => [deps.userFilters.studentId, deps.userFilters.realName, deps.userFilters.role, deps.userFilters.status],
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

  const logsView = usePagedCollection({
    source: deps.logs,
    predicate: (item) => {
      const byOperator = !deps.logFilters.operatorStudentId || item.operator_student_id.includes(deps.logFilters.operatorStudentId.trim())
      const byTargetTable = !deps.logFilters.targetTable || item.target_table.includes(deps.logFilters.targetTable.trim())
      const byActionType = !deps.logFilters.actionType || item.action_type.includes(deps.logFilters.actionType.trim())
      const byTargetId = !deps.logFilters.targetId || String(item.target_id).includes(deps.logFilters.targetId.trim())
      const byKeyword = !deps.logFilters.keyword || (item.new_value ?? '').includes(deps.logFilters.keyword.trim())
      const byDate = !deps.logFilters.createdDate || item.created_at.startsWith(deps.logFilters.createdDate)
      return byOperator && byTargetTable && byActionType && byTargetId && byKeyword && byDate
    },
    resetDeps: () => [
      deps.logFilters.operatorStudentId,
      deps.logFilters.targetTable,
      deps.logFilters.actionType,
      deps.logFilters.targetId,
      deps.logFilters.keyword,
      deps.logFilters.createdDate,
    ],
  })

  const attendanceLogsView = usePagedCollection({
    source: deps.attendanceLogs,
    predicate: (item) => {
      const byStudent = !deps.attendanceLogFilters.studentId || item.student_id.includes(deps.attendanceLogFilters.studentId.trim())
      const byOperator = !deps.attendanceLogFilters.operatorStudentId || item.operator_student_id.includes(deps.attendanceLogFilters.operatorStudentId.trim())
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
    getId: (item) => item.student_id,
    canSelect: (item) => item.id !== deps.currentUserId.value,
  })

  const courseStudentSelectedStudents = computed(() => {
    const realNameByStudentId = new Map<string, string>()
    for (const item of deps.courseStudentCandidates.value) {
      realNameByStudentId.set(item.student_id, item.real_name)
    }
    for (const students of Object.values(deps.courseStudentClassStudentMap.value)) {
      for (const student of students) {
        realNameByStudentId.set(student.student_id, student.real_name)
      }
    }
    for (const student of deps.courseStudentLooseStudents.value) {
      realNameByStudentId.set(student.student_id, student.real_name)
    }
    return deps.courseStudentSelectedStudentIds.value.map((studentId) => ({
      student_id: studentId,
      real_name: realNameByStudentId.get(studentId) ?? studentId,
    }))
  })

  function clearAdminSelections() {
    courseSelection.clearSelection()
    classSelection.clearSelection()
    userSelection.clearSelection()
  }

  return {
    userFreeTimeTermOptions,
    filteredClassStudents,
    usersView,
    classesView,
    coursesView,
    logsView,
    attendanceLogsView,
    paginatedUsers: usersView.paginatedItems,
    paginatedCourses: coursesView.paginatedItems,
    paginatedClasses: classesView.paginatedItems,
    paginatedLogs: logsView.paginatedItems,
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
    logsPage: logsView.page,
    logsPageSize: logsView.pageSize,
    logsTotalPages: logsView.totalPages,
    attendanceLogsPage: attendanceLogsView.page,
    attendanceLogsPageSize: attendanceLogsView.pageSize,
    attendanceLogsTotalPages: attendanceLogsView.totalPages,
    selectedCourseIds: courseSelection.selectedIds,
    selectedClassIds: classSelection.selectedIds,
    selectedUserStudentIds: userSelection.selectedIds,
    courseStudentSelectedStudents,
    clearAdminSelections,
    toggleCourseSelection: courseSelection.toggleSelection,
    toggleCoursePageSelection: courseSelection.togglePageSelection,
    toggleClassSelection: classSelection.toggleSelection,
    toggleClassPageSelection: classSelection.togglePageSelection,
    toggleUserSelection: userSelection.toggleSelection,
    toggleUserPageSelection: userSelection.togglePageSelection,
  }
}
