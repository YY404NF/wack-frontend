<script setup lang="ts">
import type { CourseCalendarItem, FreeTimeItem } from '../../api'

defineProps<{
  adminStats: Array<{ label: string; value: number; tone: string }>
  courseCalendar: CourseCalendarItem[]
  freeTimes: FreeTimeItem[]
  slotLabel: (weekday: number, section: number) => string
}>()
</script>

<template>
  <section class="workspace-card stats-grid">
    <article v-for="item in adminStats" :key="item.label" class="stat-card" :class="`tone-${item.tone}`">
      <span>{{ item.label }}</span>
      <strong>{{ item.value }}</strong>
    </article>
  </section>

  <section class="workspace-card">
    <div class="section-heading">
      <div>
        <p class="section-kicker">管理员端 · 全院课程表</p>
        <h2>课程日历</h2>
      </div>
      <span class="pill">{{ courseCalendar.length }} 条排课</span>
    </div>
    <div class="list-grid dense-grid">
      <article v-for="item in courseCalendar" :key="item.id" class="record-card">
        <strong>{{ item.course_name }}</strong>
        <p>{{ item.teacher_name }}</p>
        <small>{{ slotLabel(item.weekday, item.section) }} · {{ item.building_name }}-{{ item.room_name }}</small>
      </article>
    </div>
  </section>

  <section class="workspace-card">
    <div class="section-heading">
      <div>
        <p class="section-kicker">管理员端 · 空余时间</p>
        <h2>查课学生空闲视图</h2>
      </div>
      <span class="pill">{{ freeTimes.length }} 条空闲记录</span>
    </div>
    <div class="list-grid dense-grid">
      <article v-for="item in freeTimes" :key="item.id" class="record-card">
        <strong>{{ item.student_id }}</strong>
        <p>{{ slotLabel(item.weekday, item.section) }}</p>
        <small>{{ item.term }} · 空闲周 {{ item.free_weeks }}</small>
      </article>
    </div>
  </section>
</template>
