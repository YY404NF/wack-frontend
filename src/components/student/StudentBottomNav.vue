<script setup lang="ts">
import type { AppTab } from '../../constants'

defineProps<{
  activeTab: AppTab
  navItems: Array<{ key: 'home' | 'student' | 'settings'; label: string; icon: unknown }>
}>()

const emit = defineEmits<{
  'update:activeTab': [value: AppTab]
}>()
</script>

<template>
  <nav class="student-bottom-nav" aria-label="学生端导航">
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
