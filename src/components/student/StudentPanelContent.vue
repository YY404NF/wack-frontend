<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { InfoFilled, Search } from '@element-plus/icons-vue'

import { api, type AttendanceClassGroupItem, type AttendanceRecordStudentItem, type AttendanceSessionDetail } from '../../api'
import { type AppTab } from '../../constants'
import type { StudentGreeting, StudentWorkspaceProps } from './types'
import StudentFreeTimeModal from './StudentFreeTimeModal.vue'

const props = defineProps<StudentWorkspaceProps & {
  greeting: StudentGreeting
  scheduleLabel: string
  scheduleItems: ReadonlyArray<{ section: number; label: string; lines: readonly string[] }>
  activeScheduleSections: ReadonlyArray<number>
  sectionTimeText: (section: number) => string
}>()

const emit = defineEmits<{
  'update:activeTab': [value: AppTab]
  logout: []
  openAbout: []
  openFreeTimeModal: []
  openManagedClassStudentsModal: []
  closeManagedClassStudentsModal: []
  closeFreeTimeModal: []
  toggleFreeTimeWeek: [payload: { weekday: number; section: number; weekNo: number }]
  toggleFreeTimeBlock: [payload: { weekday: number; section: number }]
  saveFreeTimeDraft: []
  saveFreeTime: []
  editFreeTime: [item: StudentWorkspaceProps['freeTimes'][number]]
  removeFreeTime: [id: number]
  resetFreeTimeForm: []
  openPasswordModal: []
  closePasswordModal: []
  changePassword: []
}>()

type FocusMode = 'auto' | 'manual'
type AttendanceLocalDraft = {
  classKeys: string[]
  skippedIds: number[]
  statuses: Record<string, number>
  updatedAt: string
}

const ATTENDANCE_DRAFT_PREFIX = 'wack-attendance-draft'

const attendanceNotice = ref('')
const selectionModalOpen = ref(false)
const loadingCourseGroupLessonId = ref<number | null>(null)
const checkPageOpen = ref(false)
const statusUpdating = ref(false)
const checkSubmitting = ref(false)
const previewCourseGroupLessonId = ref<number | null>(null)
const previewCheckDetail = ref<AttendanceSessionDetail | null>(null)
const selectedClassKeys = ref<string[]>([])
const randomPercent = ref(100)
const activeCheckDetail = ref<AttendanceSessionDetail | null>(null)
const activeClassKeys = ref<string[]>([])
const activeSkippedIds = ref<number[]>([])
const localStatusDraft = ref<Record<number, number>>({})
const focusDetailId = ref<number | null>(null)
const focusMode = ref<FocusMode>('auto')
const searchKeyword = ref('')
const studentRowRefs = new Map<number, HTMLElement>()

const attendanceStatusOptions = [
  { value: 1, label: '迟到', className: 'late' },
  { value: 2, label: '缺勤', className: 'absent' },
  { value: 3, label: '请假', className: 'leave' },
  { value: 0, label: '签到', className: 'present' },
] as const

function sessionSummary(weekNo: number, weekday: number, section: number) {
  return `第${weekNo}周 · ${props.slotLabel(weekday, section)}`
}

function attendanceDraftKey(courseGroupLessonId: number) {
  return `${ATTENDANCE_DRAFT_PREFIX}:${courseGroupLessonId}`
}

function loadAttendanceDraft(courseGroupLessonId: number) {
  const raw = localStorage.getItem(attendanceDraftKey(courseGroupLessonId))
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw) as AttendanceLocalDraft
    if (!parsed || !Array.isArray(parsed.classKeys) || !Array.isArray(parsed.skippedIds) || typeof parsed.statuses !== 'object' || parsed.statuses === null) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function saveAttendanceDraft(courseGroupLessonId: number, draft: AttendanceLocalDraft) {
  localStorage.setItem(attendanceDraftKey(courseGroupLessonId), JSON.stringify(draft))
}

function clearAttendanceDraft(courseGroupLessonId: number) {
  localStorage.removeItem(attendanceDraftKey(courseGroupLessonId))
}

function classKey(group: Pick<AttendanceClassGroupItem, 'class_id'>) {
  return typeof group.class_id === 'number' ? `class:${group.class_id}` : 'other'
}

function studentClassKey(student: Pick<AttendanceRecordStudentItem, 'class_id'>) {
  return typeof student.class_id === 'number' ? `class:${student.class_id}` : 'other'
}

function persistedStatus(student: AttendanceRecordStudentItem) {
  return student.status ?? null
}

function effectiveStatus(student: AttendanceRecordStudentItem) {
  return localStatusDraft.value[student.id] ?? student.status ?? null
}

function isStudentLocked(student: AttendanceRecordStudentItem) {
  return persistedStatus(student) !== null
}

function buildClassGroupsFromStudents(students: AttendanceRecordStudentItem[], baseGroups: AttendanceClassGroupItem[] = []) {
  const counts = new Map<string, { class_id: number | null; class_name: string; student_count: number }>()
  for (const student of students) {
    const key = studentClassKey(student)
    const current = counts.get(key)
    if (current) {
      current.student_count += 1
      continue
    }
    counts.set(key, {
      class_id: student.class_id ?? null,
      class_name: student.class_name || '其他学生',
      student_count: 1,
    })
  }

  if (baseGroups.length === 0) {
    return [...counts.values()]
  }

  const result = baseGroups.map((group) => {
    const matched = counts.get(classKey(group))
    return {
      class_id: group.class_id ?? null,
      class_name: group.class_name || matched?.class_name || '其他学生',
      student_count: matched?.student_count ?? 0,
    }
  })

  for (const [key, group] of counts.entries()) {
    if (result.some((item) => classKey(item) === key)) {
      continue
    }
    result.push({
      class_id: group.class_id,
      class_name: group.class_name,
      student_count: group.student_count,
    })
  }

  return result
}

const previewClassGroups = computed(() => {
  if (!previewCheckDetail.value) {
    return []
  }
  return buildClassGroupsFromStudents(previewCheckDetail.value.students, previewCheckDetail.value.class_groups ?? [])
})

const previewSelectableCount = computed(() => {
  if (!previewCheckDetail.value) {
    return 0
  }
  return previewCheckDetail.value.students.filter((student) => {
    return selectedClassKeys.value.includes(studentClassKey(student)) && persistedStatus(student) === null
  }).length
})

const previewRecordedCount = computed(() => {
  if (!previewCheckDetail.value) {
    return 0
  }
  return previewCheckDetail.value.students.filter((student) => {
    return selectedClassKeys.value.includes(studentClassKey(student)) && persistedStatus(student) !== null
  }).length
})

const previewRandomTargetCount = computed(() => {
  return Math.round(previewSelectableCount.value * randomPercent.value / 100)
})

const activeSkippedIdSet = computed(() => new Set(activeSkippedIds.value))
const activeStudentsInScope = computed(() => {
  if (!activeCheckDetail.value) {
    return []
  }
  return activeCheckDetail.value.students.filter((student) => activeClassKeys.value.includes(studentClassKey(student)))
})

const normalizedSearchKeyword = computed(() => searchKeyword.value.trim().toLowerCase())
const activeVisibleStudents = computed(() => {
  if (!normalizedSearchKeyword.value) {
    return activeStudentsInScope.value
  }
  return activeStudentsInScope.value.filter((student) => {
    const keyword = normalizedSearchKeyword.value
    return student.student_id.toLowerCase().includes(keyword) || student.real_name.toLowerCase().includes(keyword)
  })
})

const groupedVisibleStudents = computed(() => {
  if (!activeCheckDetail.value) {
    return []
  }
  const activeGroups = buildClassGroupsFromStudents(
    activeCheckDetail.value.students,
    activeCheckDetail.value.class_groups ?? [],
  )
  return activeGroups
    .filter((group) => activeClassKeys.value.includes(classKey(group)))
    .map((group) => ({
      key: classKey(group),
      className: group.class_name || '其他学生',
      students: activeVisibleStudents.value.filter((student) => studentClassKey(student) === classKey(group)),
    }))
    .filter((group) => group.students.length > 0)
})

const orderedVisibleStudents = computed(() => {
  return groupedVisibleStudents.value.flatMap((group) => group.students)
})

const focusedStudent = computed(() => {
  return orderedVisibleStudents.value.find((student) => student.id === focusDetailId.value) ?? null
})

function openCourseSelection(courseGroupLessonId: number) {
  return props.availableCourses.find((course) => course.course_group_lesson_id === courseGroupLessonId) ?? null
}

async function handleOpenAttendance(courseGroupLessonId: number) {
  const course = openCourseSelection(courseGroupLessonId)
  if (!course || loadingCourseGroupLessonId.value !== null) {
    return
  }
  attendanceNotice.value = ''
  loadingCourseGroupLessonId.value = courseGroupLessonId
  try {
    const detail = await api.enterAttendanceSession(course.course_group_lesson_id)
    if (await tryRestoreAttendanceDraft(detail)) {
      return
    }
    previewCourseGroupLessonId.value = course.course_group_lesson_id
    previewCheckDetail.value = detail
    selectedClassKeys.value = buildClassGroupsFromStudents(detail.students, detail.class_groups ?? []).map((group) => classKey(group))
    randomPercent.value = 100
    selectionModalOpen.value = true
  } catch (error) {
    attendanceNotice.value = error instanceof Error ? error.message : '进入查课失败'
  } finally {
    loadingCourseGroupLessonId.value = null
  }
}

function chooseRandomStudentIds(students: AttendanceRecordStudentItem[], targetCount: number) {
  const pool = [...students]
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]]
  }
  return new Set(pool.slice(0, targetCount).map((student) => student.id))
}

function statusLabel(student: AttendanceRecordStudentItem) {
  if (effectiveStatus(student) === 0) {
    return '签到'
  }
  if (effectiveStatus(student) === 1) {
    return '迟到'
  }
  if (effectiveStatus(student) === 2) {
    return '缺勤'
  }
  if (effectiveStatus(student) === 3) {
    return '请假'
  }
  if (effectiveStatus(student) === null && activeSkippedIdSet.value.has(student.id)) {
    return '跳过'
  }
  return ''
}

function statusClassName(student: AttendanceRecordStudentItem) {
  if (effectiveStatus(student) === 0) {
    return 'present'
  }
  if (effectiveStatus(student) === 1) {
    return 'late'
  }
  if (effectiveStatus(student) === 2) {
    return 'absent'
  }
  if (effectiveStatus(student) === 3) {
    return 'leave'
  }
  if (effectiveStatus(student) === null && activeSkippedIdSet.value.has(student.id)) {
    return 'skip'
  }
  return 'unset'
}

function setStudentRowRef(studentId: number, element: Element | null) {
  if (!(element instanceof HTMLElement)) {
    studentRowRefs.delete(studentId)
    return
  }
  studentRowRefs.set(studentId, element)
}

async function focusStudent(studentId: number, source: FocusMode) {
  focusDetailId.value = studentId
  focusMode.value = source
  await nextTick()
  studentRowRefs.get(studentId)?.scrollIntoView({
    block: 'center',
    inline: 'nearest',
    behavior: 'smooth',
  })
}

function findNextFocusableStudent(currentId: number) {
  const currentIndex = orderedVisibleStudents.value.findIndex((student) => student.id === currentId)
  if (currentIndex < 0) {
    return null
  }
  for (let index = currentIndex + 1; index < orderedVisibleStudents.value.length; index += 1) {
    const student = orderedVisibleStudents.value[index]
    if (!(effectiveStatus(student) === null && activeSkippedIdSet.value.has(student.id))) {
      return student
    }
  }
  return null
}

async function tryRestoreAttendanceDraft(detail: AttendanceSessionDetail) {
  const draft = loadAttendanceDraft(detail.course_group_lesson.id)
  if (!draft) {
    return false
  }

  const shouldRestore = window.confirm('检测到本地草稿，是否恢复继续查课？')
  if (!shouldRestore) {
    clearAttendanceDraft(detail.course_group_lesson.id)
    return false
  }

  const availableClassKeys = new Set(buildClassGroupsFromStudents(detail.students, detail.class_groups ?? []).map((group) => classKey(group)))
  const restoredClassKeys = draft.classKeys.filter((key) => availableClassKeys.has(key))
  const effectiveClassKeys = restoredClassKeys.length > 0 ? restoredClassKeys : [...availableClassKeys]
  const unlockedStudents = new Map(detail.students.filter((student) => student.status === null || student.status === undefined).map((student) => [student.id, student]))

  const restoredStatuses: Record<number, number> = {}
  for (const [detailId, status] of Object.entries(draft.statuses)) {
    const numericId = Number(detailId)
    if (!Number.isInteger(numericId)) {
      continue
    }
    if (!unlockedStudents.has(numericId)) {
      continue
    }
    if (status < 0 || status > 3) {
      continue
    }
    restoredStatuses[numericId] = status
  }

  const restoredSkippedIds = draft.skippedIds.filter((detailId) => {
    const student = unlockedStudents.get(detailId)
    if (!student) {
      return false
    }
    return !restoredStatuses[detailId] && effectiveClassKeys.includes(studentClassKey(student))
  })

  activeCheckDetail.value = detail
  activeClassKeys.value = effectiveClassKeys
  activeSkippedIds.value = restoredSkippedIds
  localStatusDraft.value = restoredStatuses
  searchKeyword.value = ''
  selectionModalOpen.value = false
  checkPageOpen.value = true

  const firstStudent = detail.students.find((student) => {
    return effectiveClassKeys.includes(studentClassKey(student)) && !(effectiveStatus(student) === null && restoredSkippedIds.includes(student.id))
  }) ?? detail.students.find((student) => effectiveClassKeys.includes(studentClassKey(student))) ?? null
  if (firstStudent) {
    await focusStudent(firstStudent.id, 'auto')
  }
  attendanceNotice.value = '已恢复本地草稿，服务端已提交学生保持锁定'
  return true
}

async function startAttendanceCheck() {
  if (!previewCheckDetail.value || previewSelectableCount.value === 0) {
    return
  }
  const selectedStudents = previewCheckDetail.value.students.filter((student) => selectedClassKeys.value.includes(studentClassKey(student)))
  const selectableStudents = selectedStudents.filter((student) => persistedStatus(student) === null)
  const randomTarget = previewRandomTargetCount.value
  const includedIds = chooseRandomStudentIds(selectableStudents, randomTarget)
  activeCheckDetail.value = previewCheckDetail.value
  activeClassKeys.value = [...selectedClassKeys.value]
  localStatusDraft.value = {}
  activeSkippedIds.value = selectedStudents
    .filter((student) => !includedIds.has(student.id) && persistedStatus(student) === null)
    .map((student) => student.id)
  searchKeyword.value = ''
  selectionModalOpen.value = false
  checkPageOpen.value = true
  const firstStudent = selectedStudents.find((student) => !(effectiveStatus(student) === null && activeSkippedIds.value.includes(student.id))) ?? selectedStudents[0] ?? null
  if (firstStudent) {
    await focusStudent(firstStudent.id, 'auto')
  }
}

async function closeSelectionModal() {
  selectionModalOpen.value = false
  previewCourseGroupLessonId.value = null
  previewCheckDetail.value = null
  selectedClassKeys.value = []
}

function toggleSelectedClass(classValue: string) {
  if (selectedClassKeys.value.includes(classValue)) {
    selectedClassKeys.value = selectedClassKeys.value.filter((item) => item !== classValue)
    return
  }
  selectedClassKeys.value = [...selectedClassKeys.value, classValue]
}

async function handlePickStatus(status: number) {
  const student = focusedStudent.value
  if (!student || statusUpdating.value || isStudentLocked(student)) {
    return
  }
  const hadRecord = effectiveStatus(student) !== null
  localStatusDraft.value = {
    ...localStatusDraft.value,
    [student.id]: status,
  }
  activeSkippedIds.value = activeSkippedIds.value.filter((id) => id !== student.id)
  const shouldAdvance = focusMode.value === 'auto' || !hadRecord
  const nextStudent = shouldAdvance ? findNextFocusableStudent(student.id) : null
  if (nextStudent) {
    await focusStudent(nextStudent.id, 'auto')
  }
}

async function handleBackFromCheck() {
  checkPageOpen.value = false
  activeCheckDetail.value = null
  activeClassKeys.value = []
  activeSkippedIds.value = []
  localStatusDraft.value = {}
  focusDetailId.value = null
  searchKeyword.value = ''
  attendanceNotice.value = '本地草稿已保留，下次进入可恢复'
}

async function handleSubmitCheck() {
  const activeCheckId = activeCheckDetail.value?.course_group_lesson.id
  const activeCourseGroupLessonId = activeCheckDetail.value?.course_group_lesson.id
  if (!activeCheckId || !activeCourseGroupLessonId || checkSubmitting.value || !activeCheckDetail.value) {
    return
  }
  checkSubmitting.value = true
  attendanceNotice.value = ''
  try {
    const items = activeCheckDetail.value.students
      .filter((student) => (student.status === null || student.status === undefined) && typeof localStatusDraft.value[student.id] === 'number')
      .map((student) => ({
        student_ref_id: student.id,
        status: localStatusDraft.value[student.id],
      }))

    if (items.length === 0) {
      attendanceNotice.value = '没有需要提交的变更'
      return
    }

    const result = await api.submitAttendanceStatuses(activeCheckId, items)
    clearAttendanceDraft(activeCourseGroupLessonId)
    if (result.ignored_count > 0 && result.applied_count > 0) {
      attendanceNotice.value = `已提交 ${result.applied_count} 人，另有 ${result.ignored_count} 人已被其他人先提交`
    } else if (result.ignored_count > 0) {
      attendanceNotice.value = `${result.ignored_count} 人已被其他人先提交，本次未覆盖`
    } else {
      attendanceNotice.value = `查课结果已提交，共 ${result.applied_count} 人`
    }
    checkPageOpen.value = false
    activeCheckDetail.value = null
    activeClassKeys.value = []
    activeSkippedIds.value = []
    localStatusDraft.value = {}
    focusDetailId.value = null
    searchKeyword.value = ''
  } catch (error) {
    attendanceNotice.value = error instanceof Error ? error.message : '提交查课结果失败'
  } finally {
    checkSubmitting.value = false
  }
}

watch(orderedVisibleStudents, (students) => {
  if (!checkPageOpen.value || students.length === 0) {
    return
  }
  const currentStillVisible = students.some((student) => student.id === focusDetailId.value)
  if (currentStillVisible) {
    return
  }
  const firstStudent = students[0]
  void focusStudent(firstStudent.id, 'auto')
})

watch([activeCheckDetail, activeClassKeys, activeSkippedIds, localStatusDraft, checkPageOpen], ([detail, classKeys, skippedIds, statuses, isOpen]) => {
  if (!detail || !isOpen) {
    return
  }
  saveAttendanceDraft(detail.course_group_lesson.id, {
    classKeys: [...classKeys],
    skippedIds: [...skippedIds],
    statuses: Object.fromEntries(Object.entries(statuses).map(([key, value]) => [String(key), value])),
    updatedAt: new Date().toISOString(),
  })
}, { deep: true })
</script>

<template>
  <Transition name="page-fade" mode="out-in">
    <section v-if="activeTab === 'home'" key="home" class="student-mobile-page student-home-page">
      <article class="student-hero-card">
        <button class="student-hero-about-button" type="button" aria-label="打开关于页面" @click="emit('openAbout')">
          <InfoFilled class="student-hero-about-button-icon" aria-hidden="true" />
        </button>
        <p class="student-hero-brand eyebrow">WACK / 网安查课</p>
        <div class="student-hero-body">
          <div class="student-hero-icon" aria-hidden="true">{{ greeting.emoji }}</div>
          <h2>{{ greeting.label }}，</h2>
          <h2>{{ me.real_name }}同学～</h2>
        </div>
      </article>

      <article class="student-summary-card">
        <div class="section-heading student-mobile-section-heading">
          <h2>概览</h2>
        </div>
        <article class="student-stat-card student-stat-card-strong">
          <strong>{{ scheduleLabel }}</strong>
          <div class="student-schedule-times">
            <p v-for="item in scheduleItems" :key="item.section">
              <span class="student-schedule-label">
                <span>{{ item.label }}</span>
                <span v-if="activeScheduleSections.includes(item.section)" class="pill tag-warn student-schedule-live-badge">正在上课</span>
              </span>
              <strong>{{ item.lines.join(' / ') }}</strong>
            </p>
          </div>
        </article>
        <button class="primary-button student-entry-button student-home-action" type="button" @click="emit('update:activeTab', 'student')">
          进入今日查课
        </button>
      </article>
    </section>

    <section v-else-if="activeTab === 'student'" key="student" class="student-mobile-page student-check-page">
      <div class="student-page-meta">
        <p class="student-brand eyebrow">WACK / 网安查课</p>
        <h2>今日查课</h2>
        <p v-if="attendanceNotice" class="student-inline-notice">{{ attendanceNotice }}</p>
      </div>

      <div v-if="availableCourses.length > 0" class="student-course-list">
        <article v-for="course in availableCourses" :key="course.course_group_lesson_id" class="student-course-card">
          <div class="student-course-info">
            <strong>{{ course.course_name }}</strong>
            <p>{{ course.teacher_name }}</p>
            <p>{{ slotLabel(course.weekday, course.section) }}</p>
            <small>{{ course.building_name }}-{{ course.room_name }} · {{ sectionTimeText(course.section) }}</small>
          </div>
          <button
            class="primary-button student-entry-button student-course-check-button"
            type="button"
            :disabled="loadingCourseGroupLessonId !== null || !course.can_enter"
            @click="handleOpenAttendance(course.course_group_lesson_id)"
          >
            {{
              loadingCourseGroupLessonId === course.course_group_lesson_id
                ? '加载中...'
                : course.can_enter
                  ? '查课'
                  : '已结束'
            }}
          </button>
        </article>
      </div>
      <p v-else class="empty-hint student-empty-hint">当前没有处于可查时间窗口内的课程。</p>

      <Transition name="modal-float" appear>
        <div v-if="selectionModalOpen && previewCheckDetail" class="modal-backdrop" @click.self="closeSelectionModal">
          <article class="modal-card student-attendance-modal">
            <div class="student-attendance-modal-head">
              <div class="student-attendance-modal-meta">
                <h3>{{ previewCheckDetail.course.course_name }}</h3>
                <p>{{ previewCheckDetail.course.teacher_name }}</p>
                <p>第{{ previewCheckDetail.course_group_lesson.session_no }}次课</p>
                <p>{{ sessionSummary(previewCheckDetail.course_group_lesson.week_no, previewCheckDetail.course_group_lesson.weekday, previewCheckDetail.course_group_lesson.section) }}</p>
              </div>
              <button class="ghost-button compact-button" type="button" @click="closeSelectionModal">关闭</button>
            </div>

            <div class="student-selection-class-list">
              <label
                v-for="group in previewClassGroups"
                :key="classKey(group)"
                class="student-selection-class-item"
              >
                <input
                  :checked="selectedClassKeys.includes(classKey(group))"
                  type="checkbox"
                  @change="toggleSelectedClass(classKey(group))"
                />
                <span>{{ group.class_name }}</span>
                <strong>{{ group.student_count }}人</strong>
              </label>
              <p v-if="previewClassGroups.length === 0" class="student-selection-empty">暂无班级数据</p>
            </div>

            <div class="student-selection-summary">
              <span>已查 {{ previewRecordedCount }} 人</span>
              <span>可查 {{ previewSelectableCount }} 人</span>
            </div>

            <label class="student-random-range">
              <span class="student-random-range-head">
                <span>随机查课</span>
                <strong>{{ previewRandomTargetCount }}人 / {{ randomPercent }}%</strong>
              </span>
              <input v-model="randomPercent" type="range" min="0" max="100" />
            </label>

            <button class="primary-button student-selection-start" type="button" :disabled="previewSelectableCount === 0" @click="startAttendanceCheck">
              开始查课
            </button>
          </article>
        </div>
      </Transition>

    </section>

    <section v-else key="settings" class="student-mobile-page student-settings-page">
      <div class="student-page-meta">
        <p class="student-brand eyebrow">WACK / 网安查课</p>
        <h2>设置</h2>
      </div>

      <article class="student-section-card">
        <div class="section-heading student-mobile-section-heading">
          <h3>账号信息</h3>
        </div>
        <div class="student-settings-summary">
          <div class="account-line">
            <span>学号</span>
            <strong>{{ me.login_id }}</strong>
          </div>
          <div class="account-line">
            <span>姓名</span>
            <strong>{{ me.real_name }}</strong>
          </div>
          <template v-if="me.role === 3">
            <div v-if="managedClass" class="account-line">
              <span>负责班级</span>
              <strong>{{ managedClass.class_name }}</strong>
            </div>
          </template>
          <div class="student-settings-actions">
            <button class="primary-button" type="button" @click="emit('openPasswordModal')">修改密码</button>
            <button v-if="me.role === 2" class="ghost-button" type="button" @click="emit('openFreeTimeModal')">修改空闲时间</button>
            <button v-if="me.role === 3 && managedClass" class="ghost-button" type="button" @click="emit('openManagedClassStudentsModal')">查看班级学生</button>
          </div>
        </div>
      </article>

      <button class="ghost-button danger-button student-logout-button" type="button" @click="emit('logout')">退出登录</button>
    </section>
  </Transition>

  <Transition name="page-fade">
    <section v-if="checkPageOpen && activeCheckDetail" class="student-attendance-screen">
      <div class="student-attendance-check-shell">
        <header class="student-attendance-check-header">
          <div>
            <h3>{{ activeCheckDetail.course.course_name }}</h3>
            <p>{{ slotLabel(activeCheckDetail.course_group_lesson.weekday, activeCheckDetail.course_group_lesson.section) }}</p>
          </div>
          <button class="ghost-button compact-button" type="button" @click="handleBackFromCheck">
            返回
          </button>
        </header>

        <label class="student-search-box">
          <Search class="student-search-icon" aria-hidden="true" />
          <input v-model="searchKeyword" type="search" placeholder="搜索学号或姓名" />
        </label>

        <div class="student-attendance-list">
          <div v-for="group in groupedVisibleStudents" :key="group.key" class="student-attendance-group">
            <div class="student-attendance-group-header">{{ group.className }}</div>
            <button
              v-for="student in group.students"
              :key="student.id"
              :ref="(element) => setStudentRowRef(student.id, element as Element | null)"
              class="student-attendance-row"
              :class="{
                'is-focused': focusDetailId === student.id,
                'is-submitted': false,
                'is-skipped': (student.status === null || student.status === undefined) && activeSkippedIdSet.has(student.id),
              }"
              type="button"
              @click="focusStudent(student.id, 'manual')"
            >
              <div class="student-attendance-row-main">
                <small>{{ student.student_id }}</small>
                <strong>{{ student.real_name }}</strong>
              </div>
              <span
                v-if="statusLabel(student)"
                class="student-attendance-status"
                :class="`is-${statusClassName(student)}`"
              >
                {{ statusLabel(student) }}
              </span>
            </button>
          </div>
          <div v-if="activeVisibleStudents.length === 0" class="student-attendance-empty-state">
            <p class="empty-hint">没有匹配到学生。</p>
          </div>
        </div>

        <div class="student-attendance-actions">
          <button
            v-for="item in attendanceStatusOptions"
            :key="item.value"
            class="student-attendance-action-button"
            :class="`is-${item.className}`"
              type="button"
              :disabled="!focusedStudent || statusUpdating || isStudentLocked(focusedStudent)"
              @click="handlePickStatus(item.value)"
            >
              {{ item.label }}
            </button>
          </div>

        <button class="student-submit-check-button" type="button" :disabled="checkSubmitting" @click="handleSubmitCheck">
          {{ checkSubmitting ? '提交中...' : '提交查课结果' }}
        </button>
      </div>
    </section>
  </Transition>

  <Transition name="modal-float" appear>
    <div v-if="managedClassStudentsModalOpen" class="modal-backdrop">
      <article class="modal-card modal-card-narrow student-managed-class-modal">
        <div class="modal-header">
          <h3>班级学生</h3>
          <button class="ghost-button compact-button modal-close" type="button" @click="emit('closeManagedClassStudentsModal')">关闭</button>
        </div>
        <p class="hint student-managed-class-meta" v-if="managedClass">
          {{ managedClass.class_name }} · {{ managedClass.student_count }}人
        </p>
        <div class="student-managed-class-student-list">
          <article v-for="student in managedClassStudents" :key="student.id" class="student-managed-class-student-item">
            <strong>{{ student.real_name }}</strong>
            <span>{{ student.student_id }}</span>
          </article>
          <p v-if="managedClassStudents.length === 0" class="empty-hint">暂无班级学生数据。</p>
        </div>
      </article>
    </div>
  </Transition>

  <Transition name="modal-float" appear>
    <div v-if="passwordModalOpen" class="modal-backdrop">
      <article class="modal-card modal-card-narrow">
        <div class="modal-header">
          <h3>更改密码</h3>
          <button class="ghost-button compact-button modal-close" type="button" @click="emit('closePasswordModal')">关闭</button>
        </div>
        <form class="form-grid single-column-form" @submit.prevent="emit('changePassword')">
          <label class="field">
            <span>旧密码</span>
            <input v-model="passwordForm.oldPassword" type="password" autocomplete="current-password" />
          </label>
          <label class="field">
            <span>新密码</span>
            <input v-model="passwordForm.newPassword" type="password" autocomplete="new-password" />
          </label>
          <label class="field">
            <span>确认新密码</span>
            <input v-model="passwordForm.confirmNewPassword" type="password" autocomplete="new-password" />
          </label>
          <button class="primary-button" type="submit" :disabled="changingPassword">
            <span v-if="changingPassword" class="button-spinner" aria-hidden="true"></span>
            <span>{{ changingPassword ? '提交中...' : '更改密码' }}</span>
          </button>
        </form>
      </article>
    </div>
  </Transition>

  <StudentFreeTimeModal
    :open="freeTimeModalOpen"
    :term="freeTimeTerm"
    :saving="savingFreeTime"
    :draft="freeTimeDraft"
    @close="emit('closeFreeTimeModal')"
    @toggle-week="emit('toggleFreeTimeWeek', $event)"
    @toggle-block="emit('toggleFreeTimeBlock', $event)"
    @save="emit('saveFreeTimeDraft')"
  />
</template>
