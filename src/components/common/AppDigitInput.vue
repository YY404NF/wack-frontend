<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  modelValue: string | number | null | undefined
  disabled?: boolean
}>(), {
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const normalizedValue = computed(() =>
  props.modelValue === null || props.modelValue === undefined ? '' : String(props.modelValue),
)

function onInput(event: Event) {
  const input = event.target as HTMLInputElement | null
  const nextValue = String(input?.value ?? '').replace(/\D+/g, '')
  if (input && input.value !== nextValue) {
    input.value = nextValue
  }
  emit('update:modelValue', nextValue)
}
</script>

<template>
  <input
    v-bind="$attrs"
    :value="normalizedValue"
    type="text"
    inputmode="numeric"
    pattern="[0-9]*"
    :disabled="disabled"
    @input="onInput"
  />
</template>
