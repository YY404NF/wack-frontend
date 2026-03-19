<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'

import { api, type AttendanceClassGroupItem, type AttendanceRecordStudentItem, type AttendanceSessionDetail, type AvailableCourseItem } from '../../api'

const props = defineProps<{
  availableCourses: AvailableCourseItem[]
  slotLabel: (weekday: number, section: number) => string
  sectionTimeText: (section: number) => string
}>()

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
const focusMode = ref<'auto' | 'manual'>('auto')
const searchKeyword = ref('')
const studentRowRefs = new Map<number, HTMLElement>()

const attendanceStatusOptions = [
  { value: 1, label: '迟到', className: 'late' },
  { value: 2, label: '缺勤', className: 'absent' },
  { value: 3, label: '请假', className: 'leave' },
  { value: 0, label: '签到', className: 'present' },
] as const

type AttendanceLocalDraft = {
  classKeys: string[]
  skippedIds: number[]
  statuses: Record<string, number>
  updatedAt: string
}

function sessionSummary(weekNo: number, weekday: number, section: number) {
  return `第${weekNo}周 · ${props.slotLabel(weekday, section)}`
}

function attendanceDraftKey(courseGroupLessonId: number) {
  return `${ATTENDANCE_DRAFT_PREFIX}:${courseGroupLessonId}`
}

function loadAttendanceDraft(courseGroupLessonId: number) {
  const raw = localStorage.getItem(attendanceDraftKey(courseGroupLessonId))
  if (!raw) return null
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
  if (baseGroups.length === 0) return [...counts.values()]
  const result = baseGroups.map((group) => {
    const matched = counts.get(classKey(group))
    return {
      class_id: group.class_id ?? null,
      class_name: group.class_name || matched?.class_name || '其他学生',
      student_count: matched?.student_count ?? 0,
    }
  })
  for (const [key, group] of counts.entries()) {
    if (result.some((item) => classKey(item) === key)) continue
    result.push({
      class_id: group.class_id,
      class_name: group.class_name,
      student_count: group.student_count,
    })
  }
  return result
}

const previewClassGroups = computed(() => {
  if (!previewCheckDetail.value) return []
  return buildClassGroupsFromStudents(previewCheckDetail.value.students, previewCheckDetail.value.class_groups ?? [])
})

const previewSelectableCount = computed(() => {
  if (!previewCheckDetail.value) return 0
  return previewCheckDetail.value.students.filter((student) => selectedClassKeys.value.includes(studentClassKey(student)) && persistedStatus(student) === null).length
})

const previewRecordedCount = computed(() => {
  if (!previewCheckDetail.value) return 0
  return previewCheckDetail.value.students.filter((student) => selectedClassKeys.value.includes(studentClassKey(student)) && persistedStatus(student) !== null).length
})

const previewRandomTargetCount = computed(() => Math.round(previewSelectableCount.value * randomPercent.value / 100))
const activeSkippedIdSet = computed(() => new Set(activeSkippedIds.value))
const activeStudentsInScope = computed(() => {
  if (!activeCheckDetail.value) return []
  return activeCheckDetail.value.students.filter((student) => activeClassKeys.value.includes(studentClassKey(student)))
})
const normalizedSearchKeyword = computed(() => searchKeyword.value.trim().toLowerCase())
const activeVisibleStudents = computed(() => {
  if (!normalizedSearchKeyword.value) return activeStudentsInScope.value
  return activeStudentsInScope.value.filter((student) => {
    const keyword = normalizedSearchKeyword.value
    return student.student_id.toLowerCase().includes(keyword) || student.real_name.toLowerCase().includes(keyword)
  })
})
const groupedVisibleStudents = computed(() => {
  if (!activeCheckDetail.value) return []
  const activeGroups = buildClassGroupsFromStudents(activeCheckDetail.value.students, activeCheckDetail.value.class_groups ?? [])
  return activeGroups
    .filter((group) => activeClassKeys.value.includes(classKey(group)))
    .map((group) => ({
      key: classKey(group),
      className: group.class_name || '其他学生',
      students: activeVisibleStudents.value.filter((student) => studentClassKey(student) === classKey(group)),
    }))
    .filter((group) => group.students.length > 0)
})
const orderedVisibleStudents = computed(() => groupedVisibleStudents.value.flatMap((group) => group.students))
const focusedStudent = computed(() => orderedVisibleStudents.value.find((student) => student.id === focusDetailId.value) ?? null)

function openCourseSelection(courseGroupLessonId: number) {
  return props.availableCourses.find((course) => course.course_group_lesson_id === courseGroupLessonId) ?? null
}

async function handleOpenAttendance(courseGroupLessonId: number) {
  const course = openCourseSelection(courseGroupLessonId)
  if (!course || loadingCourseGroupLessonId.value !== null) return
  attendanceNotice.value = ''
  loadingCourseGroupLessonId.value = courseGroupLessonId
  try {
    const detail = await api.enterAttendanceSession(course.course_group_lesson_id)
    if (await tryRestoreAttendanceDraft(detail)) return
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

function closeSelectionModal() {
  selectionModalOpen.value = false
  previewCourseGroupLessonId.value = null
  previewCheckDetail.value = null
  selectedClassKeys.value = []
  randomPercent.value = 100
}

function toggleSelectedClass(key: string) {
  selectedClassKeys.value = selectedClassKeys.value.includes(key)
    ? selectedClassKeys.value.filter((item) => item !== key)
    : [...selectedClassKeys.value, key]
}

function buildSkippedIds(students: AttendanceRecordStudentItem[]) {
  const unlocked = students.filter((student) => persistedStatus(student) === null)
  const targetCount = Math.round(unlocked.length * randomPercent.value / 100)
  if (targetCount >= unlocked.length) return []
  const kept = unlocked.slice(0, targetCount).map((student) => student.id)
  return unlocked.filter((student) => !kept.includes(student.id)).map((student) => student.id)
}

async function tryRestoreAttendanceDraft(detail: AttendanceSessionDetail) {
  const draft = loadAttendanceDraft(detail.course_group_lesson.id)
  if (!draft) return false
  activeCheckDetail.value = detail
  activeClassKeys.value = draft.classKeys
  activeSkippedIds.value = draft.skippedIds
  localStatusDraft.value = Object.fromEntries(Object.entries(draft.statuses).map(([key, value]) => [Number(key), value]))
  selectionModalOpen.value = false
  previewCheckDetail.value = null
  previewCourseGroupLessonId.value = null
  checkPageOpen.value = true
  await nextTick()
  if (orderedVisibleStudents.value[0]) {
    await focusStudent(orderedVisibleStudents.value[0].id, 'auto')
  }
  return true
}

async function startAttendanceCheck() {
  if (!previewCheckDetail.value || !previewCourseGroupLessonId.value) return
  const students = previewCheckDetail.value.students.filter((student) => selectedClassKeys.value.includes(studentClassKey(student)))
  activeCheckDetail.value = previewCheckDetail.value
  activeClassKeys.value = [...selectedClassKeys.value]
  activeSkippedIds.value = buildSkippedIds(students)
  localStatusDraft.value = {}
  selectionModalOpen.value = false
  previewCheckDetail.value = null
  previewCourseGroupLessonId.value = null
  checkPageOpen.value = true
  await nextTick()
  if (orderedVisibleStudents.value[0]) {
    await focusStudent(orderedVisibleStudents.value[0].id, 'auto')
  }
}

function statusLabel(student: AttendanceRecordStudentItem) {
  if ((student.status === null || student.status === undefined) && activeSkippedIdSet.value.has(student.id)) return '跳过'
  const status = effectiveStatus(student)
  return attendanceStatusOptions.find((item) => item.value === status)?.label ?? ''
}

function statusClassName(student: AttendanceRecordStudentItem) {
  if ((student.status === null || student.status === undefined) && activeSkippedIdSet.value.has(student.id)) return 'skipped'
  const status = effectiveStatus(student)
  return attendanceStatusOptions.find((item) => item.value === status)?.className ?? 'pending'
}

function setStudentRowRef(studentId: number, element: Element | null) {
  if (element instanceof HTMLElement) studentRowRefs.set(studentId, element)
  else studentRowRefs.delete(studentId)
}

async function focusStudent(studentId: number, mode: 'auto' | 'manual') {
  focusDetailId.value = studentId
  focusMode.value = mode
  await nextTick()
  studentRowRefs.get(studentId)?.scrollIntoView({ behavior: mode === 'manual' ? 'smooth' : 'auto', block: 'nearest' })
}

async function moveFocusToNextStudent(currentId: number) {
  const students = orderedVisibleStudents.value.filter((student) => !activeSkippedIdSet.value.has(student.id) && !isStudentLocked(student))
  const index = students.findIndex((student) => student.id === currentId)
  const nextStudent = students[index + 1] ?? students[0] ?? null
  if (nextStudent) {
    await focusStudent(nextStudent.id, 'auto')
  }
}

async function handlePickStatus(status: number) {
  if (!activeCheckDetail.value || !focusedStudent.value || isStudentLocked(focusedStudent.value)) return
  statusUpdating.value = true
  try {
    localStatusDraft.value = {
      ...localStatusDraft.value,
      [focusedStudent.value.id]: status,
    }
    await moveFocusToNextStudent(focusedStudent.value.id)
  } finally {
    statusUpdating.value = false
  }
}

async function handleSubmitCheck() {
  if (!activeCheckDetail.value) return
  checkSubmitting.value = true
  attendanceNotice.value = ''
  try {
    const payload = activeCheckDetail.value.students
      .filter((student) => activeClassKeys.value.includes(studentClassKey(student)))
      .filter((student) => !activeSkippedIdSet.value.has(student.id))
      .flatMap((student) => {
        const status = localStatusDraft.value[student.id]
        return typeof status === 'number'
          ? [{ student_ref_id: student.id, status }]
          : []
      })

    await api.submitAttendanceStatuses(activeCheckDetail.value.course_group_lesson.id, payload)
    await api.completeAttendanceSession(activeCheckDetail.value.course_group_lesson.id)
    clearAttendanceDraft(activeCheckDetail.value.course_group_lesson.id)
    checkPageOpen.value = false
    activeCheckDetail.value = null
    activeClassKeys.value = []
    activeSkippedIds.value = []
    localStatusDraft.value = {}
    searchKeyword.value = ''
    attendanceNotice.value = '查课结果已提交'
  } catch (error) {
    attendanceNotice.value = error instanceof Error ? error.message : '提交查课失败'
  } finally {
    checkSubmitting.value = false
  }
}

async function handleBackFromCheck() {
  if (!activeCheckDetail.value) return
  clearAttendanceDraft(activeCheckDetail.value.course_group_lesson.id)
  try {
    await api.abandonAttendanceSession(activeCheckDetail.value.course_group_lesson.id)
  } catch {}
  checkPageOpen.value = false
  activeCheckDetail.value = null
  activeClassKeys.value = []
  activeSkippedIds.value = []
  localStatusDraft.value = {}
  searchKeyword.value = ''
}

watch(orderedVisibleStudents, (students) => {
  if (!checkPageOpen.value || students.length === 0) return
  const currentStillVisible = students.some((student) => student.id === focusDetailId.value)
  if (currentStillVisible) return
  const firstStudent = students[0]
  void focusStudent(firstStudent.id, 'auto')
})

watch([activeCheckDetail, activeClassKeys, activeSkippedIds, localStatusDraft, checkPageOpen], ([detail, classKeys, skippedIds, statuses, isOpen]) => {
  if (!detail || !isOpen) return
  saveAttendanceDraft(detail.course_group_lesson.id, {
    classKeys: [...classKeys],
    skippedIds: [...skippedIds],
    statuses: Object.fromEntries(Object.entries(statuses).map(([key, value]) => [String(key), value])),
    updatedAt: new Date().toISOString(),
  })
}, { deep: true })
</script>

<template>
  <section class="student-mobile-page student-check-page">
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
          {{ loadingCourseGroupLessonId === course.course_group_lesson_id ? '加载中...' : course.can_enter ? '查课' : '已结束' }}
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
            <label v-for="group in previewClassGroups" :key="classKey(group)" class="student-selection-class-item">
              <input :checked="selectedClassKeys.includes(classKey(group))" type="checkbox" @change="toggleSelectedClass(classKey(group))" />
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

    <Transition name="page-fade">
      <section v-if="checkPageOpen && activeCheckDetail" class="student-attendance-screen">
        <div class="student-attendance-check-shell">
          <header class="student-attendance-check-header">
            <div>
              <h3>{{ activeCheckDetail.course.course_name }}</h3>
              <p>{{ slotLabel(activeCheckDetail.course_group_lesson.weekday, activeCheckDetail.course_group_lesson.section) }}</p>
            </div>
            <button class="ghost-button compact-button" type="button" @click="handleBackFromCheck">返回</button>
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
                <span v-if="statusLabel(student)" class="student-attendance-status" :class="`is-${statusClassName(student)}`">
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
  </section>
</template>
