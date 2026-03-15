<script setup lang="ts">
defineProps<{
  adminStats: Array<{ label: string; value: number; tone: string }>
}>()
</script>

<template>
  <section class="workspace-card stats-grid">
    <article v-for="item in adminStats" :key="item.label" class="stat-card" :class="`tone-${item.tone}`">
      <span>{{ item.label }}</span>
      <strong>{{ item.value }}</strong>
    </article>
  </section>
</template>
