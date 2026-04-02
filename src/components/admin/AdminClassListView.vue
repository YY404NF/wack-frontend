<script setup lang="ts">
import { computed } from 'vue'

import type { ClassItem } from '../../api'
import AppDigitInput from '../common/AppDigitInput.vue'
import AppInputSelect from '../common/AppInputSelect.vue'
import AdminDataList from './AdminDataList.vue'

const props = defineProps<{
  classes: ClassItem[]
  allClasses: ClassItem[]
  classFilters: {
    grade: string
    majorName: string
    className: string
  }
  selectedClassIds: number[]
  classDeleting: boolean
  classPage: number
  classPageSize: number
  classTotalPages: number
  classTotalItems: number
  classAllItems: number
  classPageOptions: number[]
  classFocusRowKey?: number | null
  classFocusToken?: number
}>()

const emit = defineEmits<{
  openCreateClassModal: []
  openEditClassModal: [item: ClassItem]
  openClassStudentModal: [item: ClassItem]
  openDeleteClassModal: [item: ClassItem]
  openBulkDeleteClassModal: []
  updateClassPage: [page: number]
  updateClassPageSize: [size: number]
  toggleClassSelection: [classId: number]
  toggleClassPageSelection: []
}>()

const majorOptions = computed(() =>
  Array.from(new Set(props.allClasses.map((item) => item.major_name))).sort((left, right) => left.localeCompare(right, 'zh-Hans-CN')),
)
const classNameOptions = computed(() =>
  Array.from(new Set(props.allClasses.map((item) => item.class_name))).sort((left, right) => left.localeCompare(right, 'zh-Hans-CN')),
)
const selectedClassIdSet = computed(() => new Set(props.selectedClassIds))
const areAllClassesSelected = computed(() => props.classes.length > 0 && props.classes.every((item) => selectedClassIdSet.value.has(item.id)))

const classColumns = [
  { key: 'grade', label: '年级', width: 7 },
  { key: 'major_name', label: '专业名称', width: 6 },
  { key: 'class_name', label: '班级名称', width: 8 },
  { key: 'student_count', label: '人数', width: 3 },
] as const

function asClassItem(row: Record<string, unknown>) {
  return row as unknown as ClassItem
}
</script>

<template>
  <div class="class-manage-page">
    <AdminDataList
      :rows="classes as unknown as Array<Record<string, unknown>>"
      :columns="classColumns as unknown as Array<{ key: string; label: string; width?: number }>"
      row-key="id"
      table-class="class-manage-table"
      empty-text="暂无符合条件的班级"
      :show-selection="true"
      :selected-row-keys="selectedClassIds"
      :show-actions="true"
      :action-col-width="24"
      :pagination="{ page: classPage, pageSize: classPageSize, totalPages: classTotalPages, pageOptions: classPageOptions, totalItems: classTotalItems }"
      :all-items="classAllItems"
      :selected-items="selectedClassIds.length"
      :highlight-row-key="classFocusRowKey ?? null"
      :highlight-token="classFocusToken ?? 0"
      :active-filter-keys="[
        ...(String(classFilters.grade ?? '').trim() ? ['grade'] : []),
        ...(classFilters.majorName ? ['major_name'] : []),
        ...(classFilters.className.trim() ? ['class_name'] : []),
      ]"
      :has-search-condition="!!(String(classFilters.grade ?? '').trim() || classFilters.majorName || classFilters.className.trim())"
      @update-page="emit('updateClassPage', $event)"
      @update-page-size="emit('updateClassPageSize', $event)"
      @toggle-row-selection="emit('toggleClassSelection', Number($event))"
    >
      <template #filter-grade>
        <AppDigitInput v-model="classFilters.grade" aria-label="按年级筛选班级" />
      </template>
      <template #filter-major_name>
        <AppInputSelect
          v-model="classFilters.majorName"
          :options="majorOptions"
          aria-label="按专业名称筛选班级"
        />
      </template>
      <template #filter-class_name>
        <AppInputSelect
          v-model="classFilters.className"
          :options="classNameOptions"
          aria-label="按班级名称筛选班级"
        />
      </template>
      <template #filter-actions>
        <button
          class="ghost-button compact-button"
          :class="{ selected: areAllClassesSelected }"
          type="button"
          @click="emit('toggleClassPageSelection')"
        >
          全选
        </button>
        <button class="ghost-button compact-button danger-button" type="button" :disabled="classDeleting || selectedClassIds.length === 0" @click="emit('openBulkDeleteClassModal')">
          批量删除
        </button>
        <button class="primary-button compact-button filter-action-push" type="button" @click="emit('openCreateClassModal')">
          创建班级
        </button>
      </template>
      <template #actions="{ row }">
        <div class="inline-actions user-actions">
          <button class="ghost-button compact-button" type="button" @click="emit('openEditClassModal', asClassItem(row))">编辑</button>
          <button class="ghost-button compact-button" type="button" @click="emit('openClassStudentModal', asClassItem(row))">学生管理</button>
          <button class="ghost-button compact-button danger-button" type="button" @click="emit('openDeleteClassModal', asClassItem(row))">删除</button>
        </div>
      </template>
    </AdminDataList>
  </div>
</template>
