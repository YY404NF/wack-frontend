<script setup lang="ts">
import { computed } from 'vue'
import { ElAutocomplete } from 'element-plus'
import 'element-plus/es/components/autocomplete/style/css'

const props = withDefaults(defineProps<{
  modelValue: string
  options: string[]
  ariaLabel?: string
  disabled?: boolean
  allowCustom?: boolean
}>(), {
  ariaLabel: '输入并选择',
  disabled: false,
  allowCustom: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const normalizedOptions = computed(() =>
  props.options
    .map((item) => item.trim())
    .filter((item, index, array) => item && array.indexOf(item) === index),
)

const sortedOptions = computed(() =>
  [...normalizedOptions.value].sort((left, right) => right.localeCompare(left, 'zh-Hans-CN')),
)

function getSuggestions(queryString: string, callback: (items: Array<{ value: string }>) => void) {
  const keyword = queryString.trim().toLocaleLowerCase()
  const matched = sortedOptions.value
    .filter((item) => !keyword || item.toLocaleLowerCase().includes(keyword))
    .map((item) => ({ value: item }))
  callback(matched)
}

function onUpdate(value: string | number) {
  emit('update:modelValue', String(value ?? ''))
}

function onBlur(event: FocusEvent) {
  if (props.allowCustom) {
    return
  }
  const rawValue = String((event.target as HTMLInputElement | null)?.value ?? '').trim()
  if (!rawValue || normalizedOptions.value.includes(rawValue)) {
    emit('update:modelValue', rawValue)
    return
  }
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="app-input-select" :class="{ 'app-input-select-disabled': disabled }">
    <ElAutocomplete
      :model-value="modelValue"
      class="app-input-select-control"
      :fetch-suggestions="getSuggestions"
      value-key="value"
      :trigger-on-focus="true"
      :highlight-first-item="true"
      :teleported="true"
      popper-class="app-input-select-popper"
      :disabled="disabled"
      :aria-label="ariaLabel"
      placeholder=""
      @update:model-value="onUpdate"
      @select="onUpdate($event.value)"
      @blur="onBlur"
    />
  </div>
</template>

<style scoped>
.app-input-select {
  min-width: 0;
}

.app-input-select :deep(.el-autocomplete) {
  width: 100%;
}

.app-input-select :deep(.el-input__wrapper) {
  min-height: 46px;
  border-radius: 14px;
  box-shadow: 0 0 0 1px var(--line) inset;
  background: rgba(255, 255, 255, 0.9);
}

.app-input-select :deep(.el-input__inner) {
  width: 100%;
  border: 0;
  border-radius: 0;
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.app-input-select-disabled {
  opacity: 0.72;
}

:global(.app-input-select-popper) {
  z-index: 2600 !important;
}

:global(.app-input-select-popper .el-autocomplete-suggestion__list li) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
