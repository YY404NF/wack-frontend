<script setup lang="ts">
import type { AdminOverviewProps } from './types'

defineProps<AdminOverviewProps>()
</script>

<template>
  <section class="workspace-card stats-grid">
    <article v-for="item in adminStats" :key="item.label" class="stat-card" :class="`tone-${item.tone}`">
      <span>{{ item.label }}</span>
      <strong>{{ item.value }}</strong>
    </article>
  </section>
</template>
