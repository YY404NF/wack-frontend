<script setup lang="ts">
import { computed, ref } from 'vue'

import { attendanceStatusBadgeClass, sectionLabels, statusLabels, weekdayLabels } from '../../constants'
import type { AdminAttendanceDetailTarget } from './shared-types'
import type { AdminOverviewProps } from './types'

const props = defineProps<AdminOverviewProps>()
const emit = defineEmits<{
  openCourse: [courseId: number]
  openClass: [classId: number]
  openStudent: [studentRefId: number]
  openAttendanceDetail: [target: AdminAttendanceDetailTarget]
}>()

const courseRankAsc = ref(false)
const classRankAsc = ref(false)
const studentRankAsc = ref(false)
const courseVisibleCount = ref(8)
const classVisibleCount = ref(8)
const studentVisibleCount = ref(8)
const sessionVisibleCount = ref(8)
const abnormalVisibleCount = ref(12)

function sortByRate<T extends { attendance_rate: number; total_count: number }>(items: T[], asc: boolean) {
  return [...items].sort((left, right) => {
    if (left.attendance_rate !== right.attendance_rate) {
      return asc ? left.attendance_rate - right.attendance_rate : right.attendance_rate - left.attendance_rate
    }
    if (left.total_count !== right.total_count) {
      return right.total_count - left.total_count
    }
    return 0
  })
}

function withDisplayRank<T extends { attendance_rate: number; total_count: number }>(items: T[], asc: boolean) {
  const total = items.length
  return sortByRate(items, asc).map((item, index) => ({
    ...item,
    rank: asc ? total - index : index + 1,
  }))
}

const courseRankings = computed(() =>
  withDisplayRank(props.overviewData?.course_rankings ?? [], courseRankAsc.value),
)

const classRankings = computed(() =>
  withDisplayRank(props.overviewData?.class_rankings ?? [], classRankAsc.value),
)

const studentRankings = computed(() =>
  withDisplayRank(props.overviewData?.student_rankings ?? [], studentRankAsc.value),
)

const recentSessions = computed(() => props.overviewData?.recent_sessions ?? [])
const recentAbnormalStudents = computed(() => props.overviewData?.recent_abnormal_students ?? [])

const visibleCourseRankings = computed(() => courseRankings.value.slice(0, courseVisibleCount.value))
const visibleClassRankings = computed(() => classRankings.value.slice(0, classVisibleCount.value))
const visibleStudentRankings = computed(() => studentRankings.value.slice(0, studentVisibleCount.value))
const visibleRecentSessions = computed(() => recentSessions.value.slice(0, sessionVisibleCount.value))
const visibleRecentAbnormalStudents = computed(() =>
  recentAbnormalStudents.value.slice(0, abnormalVisibleCount.value),
)

function rateText(value: number) {
  const normalized = Number.isFinite(value) ? value : 0
  return `${(normalized * 100).toFixed(1).replace(/\.0$/, '')} %`
}

function weekSectionText(weekNo: number, weekday: number, section: number) {
  return `第${weekNo}周 · ${weekdayLabels[weekday] ?? `周${weekday}`} · ${sectionLabels[section] ?? `第 ${section} 段`}`
}

function sessionLeftTitleText(item: (typeof recentSessions.value)[number]) {
  return weekSectionText(item.week_no, item.weekday, item.section)
}

function sessionLeftSubtitleText(item: (typeof recentSessions.value)[number]) {
  return `${item.course_name} · ${item.teacher_name}`
}

function sessionRightTitleText(item: (typeof recentSessions.value)[number]) {
  return `签到 ${item.present_count} / 迟到 ${item.late_count} / 缺勤 ${item.absent_count} / 请假 ${item.leave_count} · ${rateText(item.attendance_rate)}`
}

function sessionRightSubtitleText(item: (typeof recentSessions.value)[number]) {
  return item.class_summary || '其他学生'
}

function abnormalStatusText(item: (typeof recentAbnormalStudents.value)[number]) {
  return statusLabels[item.status as 0 | 1 | 2 | 3] ?? '未知'
}

function abnormalLeftSubtitleText(item: (typeof recentAbnormalStudents.value)[number]) {
  return `${item.student_id} · ${item.class_name || '其他学生'}`
}

function abnormalRightTitleText(item: (typeof recentAbnormalStudents.value)[number]) {
  return weekSectionText(item.week_no, item.weekday, item.section)
}

function abnormalRightSubtitleText(item: (typeof recentAbnormalStudents.value)[number]) {
  return [item.course_name, item.teacher_name, item.grade ? `${item.grade}级` : ''].filter(Boolean).join(' · ')
}

function growVisibleCount(target: 'course' | 'class' | 'student' | 'session' | 'abnormal') {
  if (target === 'course') courseVisibleCount.value += 8
  if (target === 'class') classVisibleCount.value += 8
  if (target === 'student') studentVisibleCount.value += 8
  if (target === 'session') sessionVisibleCount.value += 8
  if (target === 'abnormal') abnormalVisibleCount.value += 12
}

function handleListScroll(event: Event, target: 'course' | 'class' | 'student' | 'session' | 'abnormal') {
  const element = event.currentTarget as HTMLElement | null
  if (!element) {
    return
  }
  if (element.scrollTop + element.clientHeight >= element.scrollHeight - 24) {
    growVisibleCount(target)
  }
}

function openCourseDetail(courseId: number) {
  emit('openCourse', courseId)
}

function openClassDetail(classId: number) {
  emit('openClass', classId)
}

function openStudentDetail(studentRefId: number) {
  emit('openStudent', studentRefId)
}

function openRecentSessionDetail(item: (typeof recentSessions.value)[number]) {
  emit('openAttendanceDetail', {
    sessionId: item.course_group_lesson_id,
    courseId: item.course_id,
    groupId: item.course_group_id,
  })
}

function openRecentAbnormalDetail(item: (typeof recentAbnormalStudents.value)[number]) {
  emit('openAttendanceDetail', {
    sessionId: item.course_group_lesson_id,
    courseId: item.course_id,
    groupId: item.course_group_id,
    focusStudentRefId: item.student_ref_id,
  })
}
</script>

<template>
  <section class="workspace-card overview-panel">
    <div class="overview-grid">
      <article class="overview-card">
        <div class="overview-card-header">
          <strong>课程出勤率</strong>
          <button class="ghost-button compact-button" type="button" @click="courseRankAsc = !courseRankAsc">
            {{ courseRankAsc ? '正序' : '逆序' }}
          </button>
        </div>
        <div class="overview-rank-list" @scroll.passive="handleListScroll($event, 'course')">
          <button
            v-for="item in visibleCourseRankings"
            :key="item.course_id"
            class="overview-rank-item overview-rank-item-button overview-entry overview-entry-with-lead"
            type="button"
            @click="openCourseDetail(item.course_id)"
          >
            <span class="overview-entry-lead overview-rank-index">{{ item.rank }}</span>
            <strong class="overview-entry-title overview-entry-title-left">{{ item.course_name }} · {{ item.teacher_name }}</strong>
            <strong class="overview-entry-title overview-entry-title-right">{{ rateText(item.attendance_rate) }}</strong>
            <p class="overview-entry-subtitle overview-entry-subtitle-left">{{ item.grade }}级</p>
            <small class="overview-entry-subtitle overview-entry-subtitle-right">{{ item.arrived_count }} / {{ item.total_count }}</small>
          </button>
          <p v-if="courseRankings.length === 0" class="empty-hint">当前学期暂无课程出勤数据</p>
        </div>
      </article>

      <article class="overview-card">
        <div class="overview-card-header">
          <strong>班级出勤率</strong>
          <button class="ghost-button compact-button" type="button" @click="classRankAsc = !classRankAsc">
            {{ classRankAsc ? '正序' : '逆序' }}
          </button>
        </div>
        <div class="overview-rank-list" @scroll.passive="handleListScroll($event, 'class')">
          <button
            v-for="item in visibleClassRankings"
            :key="item.class_id"
            class="overview-rank-item overview-rank-item-button overview-entry overview-entry-with-lead"
            type="button"
            @click="openClassDetail(item.class_id)"
          >
            <span class="overview-entry-lead overview-rank-index">{{ item.rank }}</span>
            <strong class="overview-entry-title overview-entry-title-left">{{ item.class_name }}</strong>
            <strong class="overview-entry-title overview-entry-title-right">{{ rateText(item.attendance_rate) }}</strong>
            <p class="overview-entry-subtitle overview-entry-subtitle-left">{{ item.major_name }} · {{ item.grade }}级</p>
            <small class="overview-entry-subtitle overview-entry-subtitle-right">{{ item.arrived_count }} / {{ item.total_count }}</small>
          </button>
          <p v-if="classRankings.length === 0" class="empty-hint">当前学期暂无班级出勤数据</p>
        </div>
      </article>

      <article class="overview-card">
        <div class="overview-card-header">
          <strong>个人出勤率</strong>
          <button class="ghost-button compact-button" type="button" @click="studentRankAsc = !studentRankAsc">
            {{ studentRankAsc ? '正序' : '逆序' }}
          </button>
        </div>
        <div class="overview-rank-list" @scroll.passive="handleListScroll($event, 'student')">
          <button
            v-for="item in visibleStudentRankings"
            :key="item.student_ref_id"
            class="overview-rank-item overview-rank-item-button overview-entry overview-entry-with-lead"
            type="button"
            @click="openStudentDetail(item.student_ref_id)"
          >
            <span class="overview-entry-lead overview-rank-index">{{ item.rank }}</span>
            <strong class="overview-entry-title overview-entry-title-left">{{ item.real_name }}</strong>
            <strong class="overview-entry-title overview-entry-title-right">{{ rateText(item.attendance_rate) }}</strong>
            <p class="overview-entry-subtitle overview-entry-subtitle-left">{{ item.student_id }} · {{ item.class_name || '其他学生' }}</p>
            <small class="overview-entry-subtitle overview-entry-subtitle-right">{{ item.arrived_count }} / {{ item.total_count }}</small>
          </button>
          <p v-if="studentRankings.length === 0" class="empty-hint">当前学期暂无个人出勤数据</p>
        </div>
      </article>

      <article class="overview-card overview-card-half">
        <div class="overview-card-header">
          <strong>最近完成查课的课次</strong>
        </div>
        <div class="overview-session-list" @scroll.passive="handleListScroll($event, 'session')">
          <button
            v-for="item in visibleRecentSessions"
            :key="item.course_group_lesson_id"
            class="overview-session-item overview-session-item-button overview-entry overview-entry-two-column"
            type="button"
            @click="openRecentSessionDetail(item)"
          >
            <strong class="overview-entry-title overview-entry-title-left">{{ sessionLeftTitleText(item) }}</strong>
            <strong class="overview-entry-title overview-entry-title-right">{{ sessionRightTitleText(item) }}</strong>
            <p class="overview-entry-subtitle overview-entry-subtitle-left">{{ sessionLeftSubtitleText(item) }}</p>
            <small class="overview-entry-subtitle overview-entry-subtitle-right">{{ sessionRightSubtitleText(item) }}</small>
          </button>
          <p v-if="recentSessions.length === 0" class="empty-hint">当前学期暂无已完成查课课次</p>
        </div>
      </article>

      <article class="overview-card overview-card-half">
        <div class="overview-card-header">
          <strong>最近迟到、缺勤、请假的学生</strong>
        </div>
        <div class="overview-session-list" @scroll.passive="handleListScroll($event, 'abnormal')">
          <button
            v-for="item in visibleRecentAbnormalStudents"
            :key="item.attendance_record_id"
            class="overview-session-item overview-session-item-button overview-entry overview-entry-with-lead"
            type="button"
            @click="openRecentAbnormalDetail(item)"
          >
            <div class="overview-entry-lead overview-abnormal-status">
              <span class="status-badge" :class="attendanceStatusBadgeClass(item.status)">
                {{ abnormalStatusText(item) }}
              </span>
            </div>
            <strong class="overview-entry-title overview-entry-title-left">{{ item.real_name }}</strong>
            <strong class="overview-entry-title overview-entry-title-right">{{ abnormalRightTitleText(item) }}</strong>
            <p class="overview-entry-subtitle overview-entry-subtitle-left">{{ abnormalLeftSubtitleText(item) }}</p>
            <small class="overview-entry-subtitle overview-entry-subtitle-right">{{ abnormalRightSubtitleText(item) }}</small>
          </button>
          <p v-if="recentAbnormalStudents.length === 0" class="empty-hint">当前学期暂无异常考勤记录</p>
        </div>
      </article>
    </div>
  </section>
</template>
