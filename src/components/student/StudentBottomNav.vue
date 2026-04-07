<script setup lang="ts">
import { computed } from 'vue'

import type { StudentTab } from '../../constants'

const props = defineProps<{
  activeTab: StudentTab
  navItems: Array<{ key: StudentTab; label: string; icon: unknown }>
}>()

const emit = defineEmits<{
  'update:activeTab': [value: StudentTab]
}>()

const activeIndex = computed(() => {
  const index = props.navItems.findIndex((item) => item.key === props.activeTab)
  return index >= 0 ? index : 0
})
</script>

<template>
  <nav class="student-bottom-nav" :style="{ '--nav-active-index': activeIndex }" aria-label="学生端导航">
    <span class="student-bottom-nav-indicator" aria-hidden="true"></span>
    <button
      v-for="item in navItems"
      :key="item.key"
      class="student-bottom-nav-button"
      :class="{ selected: activeTab === item.key }"
      type="button"
      @click="emit('update:activeTab', item.key)"
    >
      <component :is="item.icon" class="student-bottom-nav-icon" aria-hidden="true" />
      <span>{{ item.label }}</span>
    </button>
  </nav>
</template>
