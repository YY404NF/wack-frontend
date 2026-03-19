import type { AvailableCourseItem, ClassItem, ClassStudentItem, FreeTimeEditorItem, MetaSectionItem, SessionUser, SystemSetting } from '../../api'
import type { AppTab } from '../../constants'

export type StudentWorkspaceProps = {
  me: SessionUser
  activeTab: AppTab
  pageError: string
  toast: string
  systemSettings: SystemSetting | null
  currentSchedule: 'summer' | 'autumn'
  metaSections: MetaSectionItem[]
  availableCourses: AvailableCourseItem[]
  managedClass: ClassItem | null
  managedClassStudents: ClassStudentItem[]
  managedClassStudentsModalOpen: boolean
  freeTimes: FreeTimeEditorItem[]
  freeTimeModalOpen: boolean
  freeTimeDraft: Record<string, number[]>
  freeTimeTerm: string
  freeTimeForm: { term: string; weekday: number; section: number; freeWeeks: string }
  editingFreeTimeId: number | null
  passwordForm: { oldPassword: string; newPassword: string; confirmNewPassword: string }
  passwordModalOpen: boolean
  savingFreeTime: boolean
  changingPassword: boolean
  roleName: (role?: number) => string
  slotLabel: (weekday: number, section: number) => string
}

export type StudentGreeting = {
  emoji: string
  label: string
}
