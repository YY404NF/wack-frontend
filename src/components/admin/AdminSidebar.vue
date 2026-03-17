<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { InfoFilled } from '@element-plus/icons-vue'
import type { SessionUser } from '../../api'
import { adminNavItems, type AppTab } from '../../constants'
import { getGreetingMeta } from '../../utils/greeting'

const props = defineProps<{
  me: SessionUser
  activeTab: AppTab
  roleName: (role?: number) => string
}>()

const emit = defineEmits<{
  'update:activeTab': [value: AppTab]
  logout: []
  openAbout: []
}>()

const now = ref(new Date())
let timerId = 0

const greeting = computed(() => {
  const meta = getGreetingMeta(now.value)
  return { emoji: meta.emoji, prefix: `${meta.label}，`, suffix: `${props.me.real_name}老师~` }
})

onMounted(() => {
  timerId = window.setInterval(() => {
    now.value = new Date()
  }, 30000)
})

onBeforeUnmount(() => {
  window.clearInterval(timerId)
})
</script>

<template>
  <aside class="admin-sidebar">
    <button class="sidebar-about-button" type="button" aria-label="打开关于页面" @click="emit('openAbout')">
      <InfoFilled class="sidebar-about-button-icon" aria-hidden="true" />
    </button>

    <div class="sidebar-brand">
      <p class="eyebrow">WACK / 网安查课</p>
      <div class="sidebar-emoji">{{ greeting.emoji }}</div>
      <h2>{{ greeting.prefix }}</h2>
      <h2>{{ greeting.suffix }}</h2>
    </div>

    <nav class="sidebar-nav">
      <button
        v-for="item in adminNavItems"
        :key="item.key"
        class="sidebar-link"
        :class="{ active: activeTab === item.key }"
        @click="emit('update:activeTab', item.key)"
      >
        <strong class="sidebar-link-label">{{ item.label }}</strong>
      </button>
    </nav>

    <div class="sidebar-footer">
      <button class="ghost-button sidebar-logout" @click="emit('logout')">退出登录</button>
    </div>
  </aside>
</template>
