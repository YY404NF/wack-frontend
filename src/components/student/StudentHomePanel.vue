<script setup lang="ts">
import { InfoFilled } from '@element-plus/icons-vue'

import type { SessionUser } from '../../api'
import type { StudentGreeting } from './types'

defineProps<{
  me: SessionUser
  greeting: StudentGreeting
  scheduleLabel: string
  scheduleItems: ReadonlyArray<{ section: number; label: string; lines: readonly string[] }>
  activeScheduleSections: ReadonlyArray<number>
}>()

const emit = defineEmits<{
  openAbout: []
  enterStudentTab: []
}>()
</script>

<template>
  <section class="student-mobile-page student-home-page">
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
      <button class="primary-button student-entry-button student-home-action" type="button" @click="emit('enterStudentTab')">
        进入今日查课
      </button>
    </article>
  </section>
</template>
