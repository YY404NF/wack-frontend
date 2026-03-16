import type { AttendanceCheckDetail, AvailableCourseItem, FreeTimeItem, SessionUser, SystemSetting } from '../../api'
import type { AppTab } from '../../constants'

export type StudentWorkspaceProps = {
  me: SessionUser
  activeTab: AppTab
  pageError: string
  toast: string
  systemSettings: SystemSetting | null
  availableCourses: AvailableCourseItem[]
  activeCheck: AttendanceCheckDetail | null
  selectedStudent: AttendanceCheckDetail['students'][number] | null
  selectedStudentId: number | null
  freeTimes: FreeTimeItem[]
  freeTimeForm: { term: string; weekday: number; section: number; freeWeeks: string }
  editingFreeTimeId: number | null
  passwordForm: { oldPassword: string; newPassword: string; confirmNewPassword: string }
  savingFreeTime: boolean
  completingAttendance: boolean
  changingPassword: boolean
  roleName: (role?: number) => string
  statusName: (status: number) => string
  statusClass: (status: number) => Record<string, boolean>
  slotLabel: (weekday: number, section: number) => string
}

export type StudentGreeting = {
  emoji: string
  label: string
}
