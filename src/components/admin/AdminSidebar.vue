<script setup lang="ts">
import type { SessionUser } from '../../api'
import { adminNavItems, type AppTab } from '../../constants'

defineProps<{
  me: SessionUser
  activeTab: AppTab
  roleName: (role?: number) => string
}>()

const emit = defineEmits<{
  'update:activeTab': [value: AppTab]
  logout: []
}>()
</script>

<template>
  <aside class="admin-sidebar">
    <div class="sidebar-brand">
      <p class="eyebrow">WACK / 管理员端</p>
      <h2>{{ me.real_name }}</h2>
      <p class="sidebar-text">PC 工作台采用左侧导航，右侧集中处理课程、查课结果和账号管理。</p>
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
