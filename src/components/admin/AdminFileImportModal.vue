<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  open: boolean
  title?: string
  accept?: string
  selectedFileName?: string
  importDisabled?: boolean
  importing?: boolean
}>(), {
  title: '导入文件',
  accept: '.csv',
  selectedFileName: '',
  importDisabled: true,
  importing: false,
})

const emit = defineEmits<{
  close: []
  downloadSample: []
  selectFile: [file: File | null]
  submit: []
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)

function triggerFileSelect() {
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  fileInputRef.value?.click()
}

function handleFileChange(event: Event) {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) {
    emit('selectFile', null)
    return
  }
  emit('selectFile', target.files?.[0] ?? null)
}
</script>

<template>
  <Transition name="modal-float" appear>
    <div v-if="props.open" class="modal-backdrop nested-modal-backdrop">
      <article class="modal-card modal-card-narrow file-import-modal">
        <div class="wide-modal-header">
          <div class="wide-modal-header-top">
            <h3 class="wide-modal-header-title">{{ props.title }}</h3>
            <div class="wide-modal-header-actions">
              <button class="ghost-button compact-button" type="button" @click="emit('close')">关闭</button>
            </div>
          </div>
        </div>

        <div class="file-import-body">
          <input
            ref="fileInputRef"
            class="file-import-input"
            type="file"
            :accept="props.accept"
            @change="handleFileChange"
          />
          <button class="ghost-button file-import-select-button" type="button" @click="triggerFileSelect">选择文件</button>
          <p v-if="props.selectedFileName" class="hint file-import-file-name">{{ props.selectedFileName }}</p>
          <p v-else class="hint file-import-file-name">未选择文件</p>
        </div>

        <div class="file-import-footer">
          <button class="ghost-button compact-button" type="button" @click="emit('downloadSample')">下载示例</button>
          <button class="primary-button wide-action-button" type="button" :disabled="props.importDisabled" @click="emit('submit')">
            <span v-if="props.importing" class="button-spinner" aria-hidden="true"></span>
            <span>{{ props.importing ? '导入中...' : '导入' }}</span>
          </button>
        </div>
      </article>
    </div>
  </Transition>
</template>
