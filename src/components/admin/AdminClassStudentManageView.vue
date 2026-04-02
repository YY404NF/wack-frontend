<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type { ClassItem, ClassStudentItem } from '../../api'
import AdminDataList from './AdminDataList.vue'
import AppDigitInput from '../common/AppDigitInput.vue'
import AppInputSelect from '../common/AppInputSelect.vue'

const props = defineProps<{
  allClasses: ClassItem[]
  classStudents: ClassStudentItem[]
  classStudentFilters: {
    studentId: string
    realName: string
  }
  classStudentSaving: boolean
  classStudentTargetClass: ClassItem | null
  classStudentTargetName: string
}>()

const emit = defineEmits<{
  deleteClassStudent: [studentId: number]
  bulkDeleteClassStudents: [studentIds: number[]]
}>()

const PAGE_OPTIONS = [100, 200, 500, 1000]
const classStudentColumns = [
  { key: 'student_id', label: '学号', width: 30 },
  { key: 'real_name', label: '姓名', width: 30 },
] as const

const classStudentPage = ref(1)
const classStudentPageSize = ref(100)
const selectedClassStudentIds = ref<number[]>([])
const deleteClassStudentModalOpen = ref(false)
const bulkDeleteClassStudentModalOpen = ref(false)
const pendingDeleteClassStudent = ref<ClassStudentItem | null>(null)

const resolvedClassStudentTargetClass = computed(() =>
  props.classStudentTargetClass ??
  props.allClasses.find((item) => item.class_name === props.classStudentTargetName) ??
  null,
)

const activeClassStudentSummary = computed(() => {
  const targetClass = resolvedClassStudentTargetClass.value
  return [
    { label: '年级', value: targetClass ? `${targetClass.grade}` : '--' },
    { label: '专业', value: targetClass?.major_name ?? '--' },
    { label: '班级', value: targetClass?.class_name ?? props.classStudentTargetName ?? '--' },
    { label: '人数', value: `${props.classStudents.length}` },
  ]
})

const filteredClassStudents = computed(() => {
  const studentIdKeyword = props.classStudentFilters.studentId.trim().toLowerCase()
  const realNameKeyword = props.classStudentFilters.realName.trim().toLowerCase()

  return props.classStudents.filter((item) => {
    if (studentIdKeyword && !item.student_id.toLowerCase().includes(studentIdKeyword)) {
      return false
    }
    if (realNameKeyword && !item.real_name.toLowerCase().includes(realNameKeyword)) {
      return false
    }
    return true
  })
})

const paginatedClassStudents = computed(() => {
  const start = (classStudentPage.value - 1) * classStudentPageSize.value
  return filteredClassStudents.value.slice(start, start + classStudentPageSize.value)
})

const classStudentTotalPages = computed(() => Math.max(1, Math.ceil(filteredClassStudents.value.length / classStudentPageSize.value)))
const selectedClassStudentIdSet = computed(() => new Set(selectedClassStudentIds.value))
const areAllVisibleClassStudentsSelected = computed(
  () =>
    paginatedClassStudents.value.length > 0 &&
    paginatedClassStudents.value.every((item) => selectedClassStudentIdSet.value.has(item.id)),
)

const classStudentNameOptions = computed(() =>
  Array.from(
    new Set(
      props.classStudents
        .map((item) => item.real_name)
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ),
  ).sort((left, right) => left.localeCompare(right, 'zh-Hans-CN')),
)

watch(
  () => [
    props.classStudentFilters.studentId,
    props.classStudentFilters.realName,
    props.classStudents.length,
    classStudentPageSize.value,
  ],
  () => {
    classStudentPage.value = 1
    selectedClassStudentIds.value = selectedClassStudentIds.value.filter((id) => props.classStudents.some((item) => item.id === id))
  },
)

function asClassStudentItem(row: Record<string, unknown>) {
  return row as unknown as ClassStudentItem
}

function toggleClassStudentSelection(studentId: number) {
  if (selectedClassStudentIdSet.value.has(studentId)) {
    selectedClassStudentIds.value = selectedClassStudentIds.value.filter((id) => id !== studentId)
    return
  }
  selectedClassStudentIds.value = [...selectedClassStudentIds.value, studentId]
}

function toggleClassStudentPageSelection() {
  const pageIds = paginatedClassStudents.value.map((item) => item.id)
  if (pageIds.length === 0) {
    return
  }
  if (pageIds.every((id) => selectedClassStudentIdSet.value.has(id))) {
    selectedClassStudentIds.value = selectedClassStudentIds.value.filter((id) => !pageIds.includes(id))
    return
  }
  selectedClassStudentIds.value = Array.from(new Set([...selectedClassStudentIds.value, ...pageIds]))
}

function openDeleteClassStudentModal(student: ClassStudentItem) {
  pendingDeleteClassStudent.value = student
  deleteClassStudentModalOpen.value = true
}

function closeDeleteClassStudentModal() {
  deleteClassStudentModalOpen.value = false
  pendingDeleteClassStudent.value = null
}

function confirmDeleteClassStudent() {
  if (!pendingDeleteClassStudent.value) {
    return
  }
  emit('deleteClassStudent', pendingDeleteClassStudent.value.id)
  selectedClassStudentIds.value = selectedClassStudentIds.value.filter((id) => id !== pendingDeleteClassStudent.value?.id)
  closeDeleteClassStudentModal()
}

function openBulkDeleteClassStudentModal() {
  if (selectedClassStudentIds.value.length === 0) {
    return
  }
  bulkDeleteClassStudentModalOpen.value = true
}

function closeBulkDeleteClassStudentModal() {
  bulkDeleteClassStudentModalOpen.value = false
}

function confirmBulkDeleteClassStudents() {
  if (selectedClassStudentIds.value.length === 0) {
    return
  }
  emit('bulkDeleteClassStudents', [...selectedClassStudentIds.value])
  selectedClassStudentIds.value = []
  closeBulkDeleteClassStudentModal()
}
</script>

<template>
  <section class="class-student-subpage-grid">
    <Transition name="modal-float" appear>
      <div v-if="deleteClassStudentModalOpen && pendingDeleteClassStudent" class="modal-backdrop">
        <article class="modal-card modal-card-narrow">
          <div class="modal-header">
            <h3>确认移除</h3>
            <button class="ghost-button compact-button modal-close" type="button" @click="closeDeleteClassStudentModal">关闭</button>
          </div>
          <p class="hint">确定移除学生“{{ pendingDeleteClassStudent.real_name }}”吗？</p>
          <div class="inline-actions">
            <button class="ghost-button" type="button" @click="closeDeleteClassStudentModal">取消</button>
            <button class="ghost-button danger-button" type="button" :disabled="classStudentSaving" @click="confirmDeleteClassStudent">
              <span v-if="classStudentSaving" class="button-spinner" aria-hidden="true"></span>
              <span>{{ classStudentSaving ? '移除中...' : '确认移除' }}</span>
            </button>
          </div>
        </article>
      </div>
    </Transition>

    <Transition name="modal-float" appear>
      <div v-if="bulkDeleteClassStudentModalOpen" class="modal-backdrop">
        <article class="modal-card modal-card-narrow">
          <div class="modal-header">
            <h3>确认批量移除</h3>
            <button class="ghost-button compact-button modal-close" type="button" @click="closeBulkDeleteClassStudentModal">关闭</button>
          </div>
          <p class="hint">确定移除已选中的 {{ selectedClassStudentIds.length }} 个学生吗？</p>
          <div class="inline-actions">
            <button class="ghost-button" type="button" @click="closeBulkDeleteClassStudentModal">取消</button>
            <button class="ghost-button danger-button" type="button" :disabled="classStudentSaving" @click="confirmBulkDeleteClassStudents">
              <span v-if="classStudentSaving" class="button-spinner" aria-hidden="true"></span>
              <span>{{ classStudentSaving ? '移除中...' : '确认移除' }}</span>
            </button>
          </div>
        </article>
      </div>
    </Transition>

    <aside class="workspace-card course-context-card">
      <div class="settings-profile-summary-list">
        <div class="workspace-card nested-context-card">
          <div class="section-heading section-heading-compact">
            <strong>班级</strong>
          </div>
          <div class="settings-profile-summary-list">
            <div v-for="item in activeClassStudentSummary" :key="item.label" class="settings-profile-summary-item">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <section class="class-student-subpage-main">
      <section class="workspace-card class-student-list-card">
        <AdminDataList
          :rows="paginatedClassStudents as unknown as Array<Record<string, unknown>>"
          :columns="classStudentColumns as unknown as Array<{ key: string; label: string; width?: number }>"
          row-key="id"
          table-class="class-student-manage-table"
          empty-text="暂无班级学生"
          :show-selection="true"
          :selected-row-keys="selectedClassStudentIds"
          :show-actions="true"
          :action-col-width="20"
          :pagination="{ page: classStudentPage, pageSize: classStudentPageSize, totalPages: classStudentTotalPages, pageOptions: PAGE_OPTIONS, totalItems: filteredClassStudents.length }"
          :all-items="classStudents.length"
          :selected-items="selectedClassStudentIds.length"
          :active-filter-keys="[
            ...(classStudentFilters.studentId.trim() ? ['student_id'] : []),
            ...(classStudentFilters.realName.trim() ? ['real_name'] : []),
          ]"
          :has-search-condition="!!(classStudentFilters.studentId.trim() || classStudentFilters.realName.trim())"
          @update-page="classStudentPage = $event"
          @update-page-size="classStudentPageSize = $event"
          @toggle-row-selection="toggleClassStudentSelection(Number($event))"
        >
          <template #filter-student_id>
            <AppDigitInput v-model="classStudentFilters.studentId" aria-label="按学号筛选班级学生" />
          </template>
          <template #filter-real_name>
            <AppInputSelect
              v-model="classStudentFilters.realName"
              :options="classStudentNameOptions"
              aria-label="按姓名筛选班级学生"
            />
          </template>
          <template #filter-actions>
            <button class="ghost-button compact-button" :class="{ selected: areAllVisibleClassStudentsSelected }" type="button" @click="toggleClassStudentPageSelection">
              全选
            </button>
            <button class="ghost-button compact-button danger-button" type="button" :disabled="classStudentSaving || selectedClassStudentIds.length === 0" @click="openBulkDeleteClassStudentModal">
              批量移除
            </button>
          </template>
          <template #actions="{ row }">
            <div class="inline-actions user-actions">
              <button class="ghost-button compact-button danger-button" type="button" :disabled="classStudentSaving" @click="openDeleteClassStudentModal(asClassStudentItem(row))">移除</button>
            </div>
          </template>
        </AdminDataList>
      </section>
    </section>
  </section>
</template>
