<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ClassItem, ClassStudentItem } from '../../api'
import AdminDataList from './AdminDataList.vue'
import AppDigitInput from '../common/AppDigitInput.vue'
import AppInputSelect from '../common/AppInputSelect.vue'
import type { AdminClassManageProps } from './types'

const props = defineProps<AdminClassManageProps>()

const emit = defineEmits<{
  openCreateClassModal: []
  openEditClassModal: [item: ClassItem]
  openClassStudentModal: [item: ClassItem]
  closeClassModal: []
  closeClassStudentModal: []
  openDeleteClassModal: [item: ClassItem]
  closeDeleteClassModal: []
  openBulkDeleteClassModal: []
  closeBulkDeleteClassModal: []
  saveClass: []
  deleteClass: []
  createClassStudent: []
  importClassStudents: [file: File]
  startEditClassStudent: [studentId: number]
  saveEditingClassStudent: []
  deleteClassStudent: [studentId: number]
  updateClassPage: [page: number]
  updateClassPageSize: [size: number]
  toggleClassSelection: [classId: number]
  toggleClassPageSelection: []
  bulkDeleteClasses: []
  bulkDeleteClassStudents: [studentIds: number[]]
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
const classStudentColumns = [
  { key: 'student_id', label: '学号', width: 30 },
  { key: 'real_name', label: '姓名', width: 30 },
] as const
const PAGE_OPTIONS = [100, 200, 500, 1000]
const classStudentPage = ref(1)
const classStudentPageSize = ref(100)
const selectedClassStudentIds = ref<number[]>([])
const deleteClassStudentModalOpen = ref(false)
const bulkDeleteClassStudentModalOpen = ref(false)
const pendingDeleteClassStudent = ref<ClassStudentItem | null>(null)

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

watch(
  () => [
    props.classStudentModalOpen,
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

watch(
  () => props.classStudentModalOpen,
  (open) => {
    if (open) {
      return
    }
    selectedClassStudentIds.value = []
    closeDeleteClassStudentModal()
    closeBulkDeleteClassStudentModal()
  },
)

function asClassItem(row: Record<string, unknown>) {
  return row as unknown as ClassItem
}

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
  <section class="workspace-card user-manage-panel">
    <Transition name="modal-float" appear>
    <div v-if="classModalOpen" class="modal-backdrop">
      <article class="modal-card modal-card-narrow">
        <div class="modal-header">
          <h3>{{ isEditingClass ? '更改信息' : '创建班级' }}</h3>
          <button class="ghost-button compact-button modal-close" type="button" @click="emit('closeClassModal')">关闭</button>
        </div>
        <form class="form-grid single-column-form" @submit.prevent="emit('saveClass')">
          <label class="field">
            <span>年级</span>
            <input v-model.number="classForm.grade" type="number" min="2000" />
          </label>
          <label class="field">
            <span>专业名称</span>
            <input v-model="classForm.majorName" />
          </label>
          <label class="field">
            <span>班级名称</span>
            <input v-model="classForm.className" />
          </label>
          <button class="primary-button" type="submit" :disabled="classSaving">
            <span v-if="classSaving" class="button-spinner" aria-hidden="true"></span>
            <span>{{ classSaving ? '保存中...' : '保存' }}</span>
          </button>
        </form>
      </article>
    </div>
    </Transition>

    <Transition name="modal-float" appear>
    <div v-if="deleteClassModalOpen" class="modal-backdrop">
      <article class="modal-card modal-card-narrow">
        <div class="modal-header">
          <h3>确认删除</h3>
          <button class="ghost-button compact-button modal-close" type="button" @click="emit('closeDeleteClassModal')">关闭</button>
        </div>
        <p class="hint">删除后无法恢复。确定删除班级“{{ deletingClassName }}”吗？</p>
        <div class="inline-actions">
          <button class="ghost-button" type="button" @click="emit('closeDeleteClassModal')">取消</button>
          <button class="ghost-button danger-button" type="button" :disabled="classDeleting" @click="emit('deleteClass')">
            <span v-if="classDeleting" class="button-spinner" aria-hidden="true"></span>
            <span>{{ classDeleting ? '删除中...' : '确认删除' }}</span>
          </button>
        </div>
      </article>
    </div>
    </Transition>

    <Transition name="modal-float" appear>
    <div v-if="bulkDeleteClassModalOpen" class="modal-backdrop">
      <article class="modal-card modal-card-narrow">
        <div class="modal-header">
          <h3>确认批量删除</h3>
          <button class="ghost-button compact-button modal-close" type="button" @click="emit('closeBulkDeleteClassModal')">关闭</button>
        </div>
        <p class="hint">删除后无法恢复。确定删除已选中的 {{ selectedClassCount }} 个班级吗？</p>
        <div class="inline-actions">
          <button class="ghost-button" type="button" @click="emit('closeBulkDeleteClassModal')">取消</button>
          <button class="ghost-button danger-button" type="button" :disabled="classDeleting" @click="emit('bulkDeleteClasses')">
            <span v-if="classDeleting" class="button-spinner" aria-hidden="true"></span>
            <span>{{ classDeleting ? '删除中...' : '确认删除' }}</span>
          </button>
        </div>
      </article>
    </div>
    </Transition>

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

    <Transition name="subpage-fade" mode="out-in" appear>
      <div v-if="!classStudentModalOpen" key="class-list" class="class-manage-page">
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

      <div v-else key="class-students" class="class-student-subpage-grid">
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
      </div>
    </Transition>
  </section>
</template>
