<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type { AttendanceResultItem, MetaTermItem } from '../../api'
import type { AdminOverviewProps } from './types'
import { selectDefaultTermName, sortTermsForSelect } from '../../utils/terms'

const props = defineProps<AdminOverviewProps>()

const selectedTerm = ref('')
const courseRankAsc = ref(false)
const classRankAsc = ref(false)
const studentRankAsc = ref(false)

type RankedItem = {
  key: string
  label: string
  subline: string
  rate: number
  present: number
  total: number
}

type SessionSummary = {
  key: string
  term: string
  course_group_lesson_id: number
  course_name: string
  teacher_name: string
  week_no: number
  session_no: number
  present: number
  late: number
  absent: number
  leave: number
  unset: number
  total: number
}

const termOptions = computed(() => {
  if (props.courseTerms.length > 0) {
    return sortTermsForSelect(props.courseTerms)
  }
  const termMap = new Map<string, MetaTermItem>()
  for (const item of props.attendanceResults) {
    if (!termMap.has(item.term)) {
      termMap.set(item.term, {
        id: item.term_id,
        name: item.term,
        term_start_date: '',
      })
    }
  }
  return sortTermsForSelect(Array.from(termMap.values()))
})

watch(
  termOptions,
  (terms) => {
    const names = new Set(terms.map((item) => item.name))
    if (!selectedTerm.value || !names.has(selectedTerm.value)) {
      selectedTerm.value = selectDefaultTermName(terms)
    }
  },
  { immediate: true },
)

const filteredResults = computed(() =>
  props.attendanceResults.filter((item) => !selectedTerm.value || item.term === selectedTerm.value),
)

function attendanceRate(statuses: number[]) {
  const total = statuses.filter((status) => status !== 0).length
  const present = statuses.filter((status) => status === 1).length
  return {
    present,
    total,
    rate: total === 0 ? 0 : present / total,
  }
}

function sortRank(items: RankedItem[], asc: boolean) {
  return [...items].sort((left, right) => {
    if (left.rate !== right.rate) {
      return asc ? left.rate - right.rate : right.rate - left.rate
    }
    if (left.total !== right.total) {
      return right.total - left.total
    }
    return left.label.localeCompare(right.label, 'zh-Hans-CN')
  })
}

const courseRankings = computed(() => {
  const grouped = new Map<string, AttendanceResultItem[]>()
  for (const item of filteredResults.value) {
    const key = String(item.course_id)
    const current = grouped.get(key) ?? []
    current.push(item)
    grouped.set(key, current)
  }
  return sortRank(
    Array.from(grouped.entries()).map(([key, items]) => {
      const stats = attendanceRate(items.map((item) => item.status))
      return {
        key,
        label: items[0]?.course_name ?? key,
        subline: items[0]?.teacher_name ?? '-',
        rate: stats.rate,
        present: stats.present,
        total: stats.total,
      }
    }),
    courseRankAsc.value,
  ).slice(0, 8)
})

const classRankings = computed(() => {
  const grouped = new Map<string, AttendanceResultItem[]>()
  for (const item of filteredResults.value) {
    const key = item.class_name || '其他学生'
    const current = grouped.get(key) ?? []
    current.push(item)
    grouped.set(key, current)
  }
  return sortRank(
    Array.from(grouped.entries()).map(([key, items]) => {
      const stats = attendanceRate(items.map((item) => item.status))
      return {
        key,
        label: key,
        subline: `${items.length} 条记录`,
        rate: stats.rate,
        present: stats.present,
        total: stats.total,
      }
    }),
    classRankAsc.value,
  ).slice(0, 8)
})

const studentRankings = computed(() => {
  const grouped = new Map<string, AttendanceResultItem[]>()
  for (const item of filteredResults.value) {
    const key = item.student_id
    const current = grouped.get(key) ?? []
    current.push(item)
    grouped.set(key, current)
  }
  return sortRank(
    Array.from(grouped.entries()).map(([key, items]) => {
      const stats = attendanceRate(items.map((item) => item.status))
      return {
        key,
        label: items[0]?.real_name ?? key,
        subline: `${key} · ${items[0]?.class_name || '其他学生'}`,
        rate: stats.rate,
        present: stats.present,
        total: stats.total,
      }
    }),
    studentRankAsc.value,
  ).slice(0, 8)
})

const recentSessions = computed(() => {
  const grouped = new Map<string, SessionSummary>()
  for (const item of filteredResults.value) {
    const key = `${item.term}-${item.course_group_lesson_id}`
    const current = grouped.get(key)
    if (current) {
      current.total += 1
      if (item.status === 1) current.present += 1
      else if (item.status === 2) current.late += 1
      else if (item.status === 3) current.absent += 1
      else if (item.status === 4) current.leave += 1
      else current.unset += 1
      continue
    }
    grouped.set(key, {
      key,
      term: item.term,
      course_group_lesson_id: item.course_group_lesson_id,
      course_name: item.course_name,
      teacher_name: item.teacher_name,
      week_no: item.week_no,
      session_no: item.session_no,
      present: item.status === 1 ? 1 : 0,
      late: item.status === 2 ? 1 : 0,
      absent: item.status === 3 ? 1 : 0,
      leave: item.status === 4 ? 1 : 0,
      unset: item.status === 0 ? 1 : 0,
      total: 1,
    })
  }
  return Array.from(grouped.values())
    .sort((left, right) => {
      if (left.term !== right.term) {
        return right.term.localeCompare(left.term, 'zh-Hans-CN')
      }
      if (left.week_no !== right.week_no) {
        return right.week_no - left.week_no
      }
      if (left.session_no !== right.session_no) {
        return right.session_no - left.session_no
      }
      return right.course_group_lesson_id - left.course_group_lesson_id
    })
    .slice(0, 8)
})

const recentAbnormalStudents = computed(() =>
  filteredResults.value
    .filter((item) => item.status === 2 || item.status === 3 || item.status === 4)
    .sort((left, right) => {
      if (left.term !== right.term) {
        return right.term.localeCompare(left.term, 'zh-Hans-CN')
      }
      if (left.week_no !== right.week_no) {
        return right.week_no - left.week_no
      }
      if (left.session_no !== right.session_no) {
        return right.session_no - left.session_no
      }
      return right.attendance_record_id - left.attendance_record_id
    })
    .slice(0, 12),
)

function rateText(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

function sessionSummaryText(item: SessionSummary) {
  return `签到 ${item.present} / 迟到 ${item.late} / 缺勤 ${item.absent} / 请假 ${item.leave} / 未设置 ${item.unset}`
}
</script>

<template>
  <section class="workspace-card overview-panel">
    <div class="overview-toolbar">
      <label class="field overview-term-field">
        <select v-model="selectedTerm">
          <option v-for="term in termOptions" :key="term.id || term.name" :value="term.name">{{ term.name }}</option>
        </select>
      </label>
    </div>

    <div class="overview-grid">
      <article class="overview-card">
        <div class="overview-card-header">
          <strong>课程出勤率</strong>
          <button class="ghost-button compact-button" type="button" @click="courseRankAsc = !courseRankAsc">
            {{ courseRankAsc ? '正序' : '逆序' }}
          </button>
        </div>
        <div class="overview-rank-list">
          <div v-for="item in courseRankings" :key="item.key" class="overview-rank-item">
            <div>
              <strong>{{ item.label }}</strong>
              <p>{{ item.subline }}</p>
            </div>
            <div class="overview-rank-meta">
              <strong>{{ rateText(item.rate) }}</strong>
              <small>{{ item.present }} / {{ item.total }}</small>
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
        <div class="overview-rank-list">
          <div v-for="item in classRankings" :key="item.key" class="overview-rank-item">
            <div>
              <strong>{{ item.label }}</strong>
              <p>{{ item.subline }}</p>
            </div>
            <div class="overview-rank-meta">
              <strong>{{ rateText(item.rate) }}</strong>
              <small>{{ item.present }} / {{ item.total }}</small>
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
        <div class="overview-rank-list">
          <div v-for="item in studentRankings" :key="item.key" class="overview-rank-item">
            <div>
              <strong>{{ item.label }}</strong>
              <p>{{ item.subline }}</p>
            </div>
            <div class="overview-rank-meta">
              <strong>{{ rateText(item.rate) }}</strong>
              <small>{{ item.present }} / {{ item.total }}</small>
            </div>
          </div>
          <p v-if="studentRankings.length === 0" class="empty-hint">当前学期暂无个人出勤数据</p>
        </div>
      </article>

      <article class="overview-card overview-card-wide">
        <div class="overview-card-header">
          <strong>最近完成查课的课次</strong>
        </div>
        <div class="overview-session-list">
          <div v-for="item in recentSessions" :key="item.key" class="overview-session-item">
            <div>
              <strong>{{ item.course_name }}</strong>
              <p>{{ item.teacher_name }} · {{ item.term }} · 第 {{ item.week_no }} 周 / 第 {{ item.session_no }} 次</p>
            </div>
            <div class="overview-session-meta">
              <strong>{{ sessionSummaryText(item) }}</strong>
              <small>ID {{ item.course_group_lesson_id }}</small>
            </div>
          </div>
          <p v-if="recentSessions.length === 0" class="empty-hint">当前学期暂无已完成查课课次</p>
        </div>
      </article>

      <article class="overview-card overview-card-wide">
        <div class="overview-card-header">
          <strong>最近缺勤、迟到、请假的学生</strong>
        </div>
        <div class="overview-session-list">
          <div v-for="item in recentAbnormalStudents" :key="item.attendance_record_id" class="overview-session-item">
            <div>
              <strong>{{ item.real_name }}（{{ item.student_id }}）</strong>
              <p>{{ item.class_name || '其他学生' }} · {{ item.course_name }} · {{ item.teacher_name }}</p>
            </div>
            <div class="overview-session-meta">
              <strong>{{ item.term }} · 第 {{ item.week_no }} 周 / 第 {{ item.session_no }} 次</strong>
              <small>{{ item.status === 2 ? '迟到' : item.status === 3 ? '缺勤' : '请假' }}</small>
            </div>
          </div>
          <p v-if="recentAbnormalStudents.length === 0" class="empty-hint">当前学期暂无异常考勤记录</p>
        </div>
      </article>
    </div>
  </section>
</template>
