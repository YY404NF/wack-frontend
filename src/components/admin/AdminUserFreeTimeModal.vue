<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { sectionLabels, weekdayLabels } from '../../constants'
import { FREE_TIME_VISIBLE_SECTIONS, FREE_TIME_VISIBLE_WEEKDAYS, FREE_TIME_WEEK_COUNT, buildFreeTimeCellKey } from '../../utils/free-time'

const props = defineProps<{
  open: boolean
  targetName: string
  term: string
  termOptions: string[]
  loading: boolean
  saving: boolean
  draft: Record<string, number[]>
}>()

const emit = defineEmits<{
  close: []
  save: []
  'update:term': [value: string]
  toggleWeek: [payload: { weekday: number; section: number; weekNo: number }]
}>()

const weekRows = computed(() => [
  Array.from({ length: FREE_TIME_WEEK_COUNT / 2 }, (_, index) => index + 1),
  Array.from({ length: FREE_TIME_WEEK_COUNT / 2 }, (_, index) => index + 1 + FREE_TIME_WEEK_COUNT / 2),
])

const touchedKeys = ref<string[]>([])

function cellWeeks(weekday: number, section: number) {
  return props.draft[buildFreeTimeCellKey(weekday, section)] ?? []
}

function isWeekSelected(weekday: number, section: number, weekNo: number) {
  return cellWeeks(weekday, section).includes(weekNo)
}

function beginWeekDrag(weekday: number, section: number, weekNo: number) {
  emit('toggleWeek', { weekday, section, weekNo })
  touchedKeys.value = [`${weekday}-${section}-${weekNo}`]
}

function continueWeekDrag(event: PointerEvent, weekday: number, section: number, weekNo: number) {
  const key = `${weekday}-${section}-${weekNo}`
  if (event.buttons === 0 || touchedKeys.value.includes(key)) {
    return
  }
  emit('toggleWeek', { weekday, section, weekNo })
  touchedKeys.value = [...touchedKeys.value, key]
}

function stopWeekDrag() {
  touchedKeys.value = []
}

onMounted(() => {
  window.addEventListener('pointerup', stopWeekDrag)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointerup', stopWeekDrag)
})
</script>

<template>
  <div v-if="open" class="modal-backdrop modal-backdrop-contained">
    <article class="modal-card modal-card-wide user-free-time-modal">
      <div class="wide-modal-header">
        <div class="wide-modal-header-top">
          <h3 class="wide-modal-header-title">编辑空闲时间</h3>
          <div class="wide-modal-header-actions">
            <button class="ghost-button compact-button" type="button" @click="emit('close')">关闭</button>
          </div>
        </div>
        <p class="hint wide-modal-header-meta">目标账号：{{ targetName }}</p>
      </div>

      <div class="user-free-time-toolbar">
        <label class="field user-free-time-term-field">
          <span>学期</span>
          <select :value="term" @change="emit('update:term', ($event.target as HTMLSelectElement).value)">
            <option v-for="item in termOptions" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>
        <p class="hint">点击每个格子中的周数按钮即可切换该周是否空闲，最后统一保存。</p>
      </div>

      <div v-if="loading" class="user-free-time-loading">正在加载空闲时间...</div>

      <div v-else class="user-free-time-grid-wrap" @pointerleave="stopWeekDrag">
        <div class="user-free-time-grid" :style="{ gridTemplateColumns: `160px repeat(${FREE_TIME_VISIBLE_WEEKDAYS.length}, minmax(220px, 1fr))` }">
          <div class="user-free-time-corner"></div>
          <div v-for="weekday in FREE_TIME_VISIBLE_WEEKDAYS" :key="weekday" class="user-free-time-day">
            {{ weekdayLabels[weekday] }}
          </div>

          <template v-for="section in FREE_TIME_VISIBLE_SECTIONS" :key="section">
            <div class="user-free-time-section">
              {{ sectionLabels[section] }}
            </div>
            <div v-for="weekday in FREE_TIME_VISIBLE_WEEKDAYS" :key="`${weekday}-${section}`" class="user-free-time-cell">
              <div v-for="(row, rowIndex) in weekRows" :key="`${weekday}-${section}-${rowIndex}`" class="user-free-time-week-row">
                <button
                  v-for="weekNo in row"
                  :key="`${weekday}-${section}-${weekNo}`"
                  class="ghost-button compact-button user-free-time-week-button"
                  :class="{ selected: isWeekSelected(weekday, section, weekNo) }"
                  type="button"
                  @pointerdown.prevent="beginWeekDrag(weekday, section, weekNo)"
                  @pointerenter="continueWeekDrag($event, weekday, section, weekNo)"
                >
                  {{ weekNo }}
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="user-free-time-footer">
        <button class="primary-button narrow-button" type="button" :disabled="saving || loading" @click="emit('save')">
          <span v-if="saving" class="button-spinner" aria-hidden="true"></span>
          <span>{{ saving ? '保存中...' : '保存' }}</span>
        </button>
      </div>
    </article>
  </div>
</template>
