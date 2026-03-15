<script setup lang="ts">
import type { AdminFreeTimeCalendarProps } from './types'

defineProps<AdminFreeTimeCalendarProps>()
</script>

<template>
  <section class="workspace-card">
    <div class="section-heading">
      <h2>查课学生空余时间日历</h2>
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
