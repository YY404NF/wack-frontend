<script setup lang="ts">
import type { CourseCalendarItem } from '../../api'

defineProps<{
  courseCalendar: CourseCalendarItem[]
  slotLabel: (weekday: number, section: number) => string
}>()
</script>

<template>
  <section class="workspace-card">
    <div class="section-heading">
      <h2>课程日历</h2>
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
</template>
