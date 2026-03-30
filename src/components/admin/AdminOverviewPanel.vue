<script setup lang="ts">
import { computed, ref } from 'vue'

import { attendanceStatusBadgeClass, sectionLabels, statusLabels, weekdayLabels } from '../../constants'
import type { AdminOverviewProps } from './types'

const props = defineProps<AdminOverviewProps>()

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
  return `${(normalized * 100).toFixed(1)} %`
}

function weekSectionText(weekNo: number, weekday: number, section: number) {
  return `第${weekNo}周 · ${weekdayLabels[weekday] ?? `周${weekday}`} · ${sectionLabels[section] ?? `第 ${section} 段`}`
}

function sessionTitleText(item: (typeof recentSessions.value)[number]) {
  return `${item.course_name} · ${item.teacher_name} / ${weekSectionText(item.week_no, item.weekday, item.section)}`
}

function sessionMetaTitleText(item: (typeof recentSessions.value)[number]) {
  return `查课 ${item.record_count} 人 · ${rateText(item.attendance_rate)}`
}

function sessionMetaBodyText(item: (typeof recentSessions.value)[number]) {
  return `签到 ${item.present_count} 人 / 迟到 ${item.late_count} 人 / 缺勤 ${item.absent_count} 人 / 请假 ${item.leave_count} 人`
}

function abnormalTitleText(item: (typeof recentAbnormalStudents.value)[number]) {
  return `${item.real_name} · ${item.student_id} · ${item.class_name || '其他学生'}`
}

function abnormalSubtitleText(item: (typeof recentAbnormalStudents.value)[number]) {
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
          <div v-for="item in visibleCourseRankings" :key="item.course_id" class="overview-rank-item">
            <div class="overview-rank-leading">
              <span class="overview-rank-index">{{ item.rank }}</span>
              <div>
                <strong>{{ item.course_name }}</strong>
                <p>{{ item.teacher_name }} · {{ item.grade }}级</p>
              </div>
            </div>
            <div class="overview-rank-meta">
              <strong>{{ rateText(item.attendance_rate) }}</strong>
              <small>{{ item.arrived_count }} / {{ item.total_count }}</small>
            </div>
          </div>
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
          <div v-for="item in visibleClassRankings" :key="item.class_id" class="overview-rank-item">
            <div class="overview-rank-leading">
              <span class="overview-rank-index">{{ item.rank }}</span>
              <div>
                <strong>{{ item.class_name }}</strong>
                <p>{{ item.major_name }} · {{ item.grade }}级</p>
              </div>
            </div>
            <div class="overview-rank-meta">
              <strong>{{ rateText(item.attendance_rate) }}</strong>
              <small>{{ item.arrived_count }} / {{ item.total_count }}</small>
            </div>
          </div>
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
          <div v-for="item in visibleStudentRankings" :key="item.student_ref_id" class="overview-rank-item">
            <div class="overview-rank-leading">
              <span class="overview-rank-index">{{ item.rank }}</span>
              <div>
                <strong>{{ item.real_name }}</strong>
                <p>{{ item.student_id }} · {{ item.class_name || '其他学生' }}</p>
              </div>
            </div>
            <div class="overview-rank-meta">
              <strong>{{ rateText(item.attendance_rate) }}</strong>
              <small>{{ item.arrived_count }} / {{ item.total_count }}</small>
            </div>
          </div>
          <p v-if="studentRankings.length === 0" class="empty-hint">当前学期暂无个人出勤数据</p>
        </div>
      </article>

      <article class="overview-card overview-card-half">
        <div class="overview-card-header">
          <strong>最近完成查课的课次</strong>
        </div>
        <div class="overview-session-list" @scroll.passive="handleListScroll($event, 'session')">
          <div v-for="item in visibleRecentSessions" :key="item.course_group_lesson_id" class="overview-session-item">
            <div>
              <strong>{{ sessionTitleText(item) }}</strong>
              <p>{{ item.building_name }}-{{ item.room_name }} · {{ item.class_summary || '其他学生' }}</p>
            </div>
            <div class="overview-session-meta">
              <strong>{{ sessionMetaTitleText(item) }}</strong>
              <small>{{ sessionMetaBodyText(item) }}</small>
            </div>
          </div>
          <p v-if="recentSessions.length === 0" class="empty-hint">当前学期暂无已完成查课课次</p>
        </div>
      </article>

      <article class="overview-card overview-card-half">
        <div class="overview-card-header">
          <strong>最近迟到、缺勤、请假的学生</strong>
        </div>
        <div class="overview-session-list" @scroll.passive="handleListScroll($event, 'abnormal')">
          <div v-for="item in visibleRecentAbnormalStudents" :key="item.attendance_record_id" class="overview-session-item">
            <div>
              <strong>{{ abnormalTitleText(item) }}</strong>
              <p>{{ abnormalSubtitleText(item) }}</p>
            </div>
            <div class="overview-session-meta">
              <span class="status-badge" :class="attendanceStatusBadgeClass(item.status)">
                {{ statusLabels[item.status as 0 | 1 | 2 | 3] ?? '未知' }}
              </span>
              <small>{{ weekSectionText(item.week_no, item.weekday, item.section) }}</small>
            </div>
          </div>
          <p v-if="recentAbnormalStudents.length === 0" class="empty-hint">当前学期暂无异常考勤记录</p>
        </div>
      </article>
    </div>
  </section>
</template>
