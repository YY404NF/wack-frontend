<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <section class="workspace-card">
    <div class="section-heading">
      <h2>{{ title }}</h2>
    </div>
    <p class="empty-hint">{{ description }}</p>
  </section>
</template>
