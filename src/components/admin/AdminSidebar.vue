<script setup lang="ts">
import { computed } from 'vue'
import type { SessionUser } from '../../api'
import { adminNavItems, type AppTab } from '../../constants'

const props = defineProps<{
  me: SessionUser
  activeTab: AppTab
  roleName: (role?: number) => string
}>()

const emit = defineEmits<{
  'update:activeTab': [value: AppTab]
  logout: []
}>()

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 11) {
    return { emoji: '🌤', text: `上午好，${props.me.real_name}老师~` }
  }
  if (hour < 14) {
    return { emoji: '☀', text: `中午好，${props.me.real_name}老师~` }
  }
  if (hour < 19) {
    return { emoji: '🌇', text: `下午好，${props.me.real_name}老师~` }
  }
  return { emoji: '🌙', text: `晚上好，${props.me.real_name}老师~` }
})
</script>

<template>
  <aside class="admin-sidebar">
    <div class="sidebar-brand">
      <p class="eyebrow">WACK / 网安查课</p>
      <div class="sidebar-emoji">{{ greeting.emoji }}</div>
      <h2>{{ greeting.text }}</h2>
    </div>

    <nav class="sidebar-nav">
      <button
        v-for="item in adminNavItems"
        :key="item.key"
        class="sidebar-link"
        :class="{ active: activeTab === item.key }"
        @click="emit('update:activeTab', item.key)"
      >
        <strong>{{ item.label }}</strong>
      </button>
    </nav>

    <div class="sidebar-footer">
      <button class="ghost-button sidebar-logout" @click="emit('logout')">退出登录</button>
    </div>
  </aside>
</template>
