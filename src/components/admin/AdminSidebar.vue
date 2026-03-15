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
    return `🌤 早上好，${props.me.real_name}~`
  }
  if (hour < 14) {
    return `☀ 中午好，${props.me.real_name}~`
  }
  if (hour < 19) {
    return `🌇 下午好，${props.me.real_name}~`
  }
  return `🌙 晚上好，${props.me.real_name}~`
})
</script>

<template>
  <aside class="admin-sidebar">
    <div class="sidebar-brand">
      <p class="eyebrow">WACK / 管理员端</p>
      <h2>{{ greeting }}</h2>
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
        <span>{{ item.desc }}</span>
      </button>
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-meta">
        <span>当前角色</span>
        <strong>{{ roleName(me.role) }}</strong>
      </div>
      <button class="ghost-button sidebar-logout" @click="emit('logout')">退出登录</button>
    </div>
  </aside>
</template>
