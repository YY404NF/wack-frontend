<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'

import { sectionLabels, weekdayLabels } from '../../constants'
import { FREE_TIME_VISIBLE_SECTIONS, FREE_TIME_VISIBLE_WEEKDAYS, FREE_TIME_WEEK_COUNT, buildFreeTimeCellKey } from '../../utils/free-time'

const props = defineProps<{
  open: boolean
  term: string
  saving: boolean
  draft: Record<string, number[]>
}>()

const emit = defineEmits<{
  close: []
  save: []
  toggleWeek: [payload: { weekday: number; section: number; weekNo: number }]
  toggleBlock: [payload: { weekday: number; section: number }]
}>()

const weekRows = computed(() =>
  Array.from({ length: FREE_TIME_WEEK_COUNT / 4 }, (_, rowIndex) =>
    Array.from({ length: 4 }, (_, columnIndex) => rowIndex * 4 + columnIndex + 1),
  ),
)

const sectionTextMap: Record<number, string> = {
  1: '上午\n1-2节',
  2: '上午\n3-4节',
  3: '下午\n5-6节',
  4: '下午\n7-8节',
  5: '晚上\n9-10节',
}

const longPressTimer = ref<number | null>(null)
const longPressTriggered = ref(false)
const activePointerKey = ref('')
const pressStartPoint = ref<{ x: number; y: number } | null>(null)

function cellWeeks(weekday: number, section: number) {
  return props.draft[buildFreeTimeCellKey(weekday, section)] ?? []
}

function isWeekSelected(weekday: number, section: number, weekNo: number) {
  return cellWeeks(weekday, section).includes(weekNo)
}

function beginWeekPress(event: PointerEvent, weekday: number, section: number, weekNo: number) {
  cancelLongPress()
  longPressTriggered.value = false
  activePointerKey.value = `${weekday}-${section}-${weekNo}`
  pressStartPoint.value = { x: event.clientX, y: event.clientY }
  longPressTimer.value = window.setTimeout(() => {
    longPressTriggered.value = true
    emit('toggleBlock', { weekday, section })
  }, 420)
}

function finishWeekPress(weekday: number, section: number, weekNo: number) {
  const key = `${weekday}-${section}-${weekNo}`
  const shouldToggleSingle = activePointerKey.value === key && !longPressTriggered.value
  cancelLongPress()
  if (shouldToggleSingle) {
    emit('toggleWeek', { weekday, section, weekNo })
  }
}

function handleWeekMove(event: PointerEvent) {
  if (!pressStartPoint.value) {
    return
  }

  const deltaX = Math.abs(event.clientX - pressStartPoint.value.x)
  const deltaY = Math.abs(event.clientY - pressStartPoint.value.y)
  if (deltaX > 8 || deltaY > 8) {
    cancelLongPress()
  }
}

function cancelLongPress() {
  if (longPressTimer.value !== null) {
    window.clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
  activePointerKey.value = ''
  pressStartPoint.value = null
}

onBeforeUnmount(() => {
  cancelLongPress()
})
</script>

<template>
  <Transition name="modal-float" appear>
    <div v-if="open" class="modal-backdrop">
      <article class="modal-card student-free-time-modal">
        <div class="student-free-time-modal-header">
          <div>
            <h3>修改空闲时间</h3>
          </div>
          <button class="ghost-button compact-button" type="button" :disabled="saving" @click="emit('close')">关闭</button>
        </div>

        <p class="hint student-free-time-modal-hint">
          当前学期：{{ term }}　长按快速选择
        </p>

        <div class="student-free-time-grid-scroll" @pointerleave="cancelLongPress">
          <div class="student-free-time-grid" :style="{ gridTemplateColumns: `64px repeat(${FREE_TIME_VISIBLE_WEEKDAYS.length}, minmax(132px, 1fr))` }">
            <div class="student-free-time-corner">空闲<br>周数</div>
            <div v-for="weekday in FREE_TIME_VISIBLE_WEEKDAYS" :key="weekday" class="student-free-time-day">
              {{ weekdayLabels[weekday] }}
            </div>

            <template v-for="section in FREE_TIME_VISIBLE_SECTIONS" :key="section">
              <div class="student-free-time-section">
                {{ sectionTextMap[section] ?? sectionLabels[section] }}
              </div>
              <div v-for="weekday in FREE_TIME_VISIBLE_WEEKDAYS" :key="`${weekday}-${section}`" class="student-free-time-cell">
                <div v-for="(row, rowIndex) in weekRows" :key="`${weekday}-${section}-${rowIndex}`" class="student-free-time-week-row">
                  <button
                    v-for="weekNo in row"
                    :key="`${weekday}-${section}-${weekNo}`"
                    class="student-free-time-week-button"
                    :class="{ selected: isWeekSelected(weekday, section, weekNo) }"
                    type="button"
                    @pointerdown="beginWeekPress($event, weekday, section, weekNo)"
                    @pointermove="handleWeekMove"
                    @pointerup="finishWeekPress(weekday, section, weekNo)"
                    @pointercancel="cancelLongPress"
                  >
                    {{ weekNo }}
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>

        <div class="student-free-time-modal-footer">
          <button class="primary-button student-free-time-save" type="button" :disabled="saving" @click="emit('save')">
            <span v-if="saving" class="button-spinner" aria-hidden="true"></span>
            <span>{{ saving ? '保存中...' : '保存' }}</span>
          </button>
        </div>
      </article>
    </div>
  </Transition>
</template>
