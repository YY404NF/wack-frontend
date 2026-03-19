<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ClassItem, StudentItem } from '../../api'
import AdminDataList from './AdminDataList.vue'
import AdminFileImportModal from './AdminFileImportModal.vue'
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
}>()

const gradeOptions = computed(() =>
  Array.from(new Set(props.classes.map((item) => item.grade))).sort((left, right) => right - left),
)
const majorOptions = computed(() =>
  Array.from(new Set(props.classes.map((item) => item.major_name))).sort((left, right) => left.localeCompare(right, 'zh-Hans-CN')),
)
const selectedClassIdSet = computed(() => new Set(props.selectedClassIds))
const areAllClassesSelected = computed(() => props.classes.length > 0 && props.classes.every((item) => selectedClassIdSet.value.has(item.id)))
const classColumns = [
  { key: 'grade', label: '年级', colClass: 'col-pct-14' },
  { key: 'major_name', label: '专业名称', colClass: 'col-pct-24' },
  { key: 'class_name', label: '班级名称', colClass: 'col-pct-24' },
  { key: 'student_count', label: '人数', colClass: 'col-pct-18' },
] as const
const CLASS_STUDENT_BATCH_SIZE = 20
const visibleClassStudentCount = ref(CLASS_STUDENT_BATCH_SIZE)
const visibleUnboundStudentCount = ref(CLASS_STUDENT_BATCH_SIZE)
const importModalOpen = ref(false)
const importFile = ref<File | null>(null)

const filteredUnboundStudents = computed(() => {
  const studentIdKeyword = props.classStudentFilters.studentId.trim().toLowerCase()
  const realNameKeyword = props.classStudentFilters.realName.trim().toLowerCase()

  return props.students.filter((item) => {
    if (item.class_id !== null && item.class_id !== undefined) {
      return false
    }
    if (studentIdKeyword && !item.student_id.toLowerCase().includes(studentIdKeyword)) {
      return false
    }
    if (realNameKeyword && !item.real_name.toLowerCase().includes(realNameKeyword)) {
      return false
    }
    return true
  })
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
const visibleClassStudents = computed(() => filteredClassStudents.value.slice(0, visibleClassStudentCount.value))
const visibleUnboundStudents = computed(() => filteredUnboundStudents.value.slice(0, visibleUnboundStudentCount.value))

watch(
  () => [
    props.classStudentModalOpen,
    props.classStudentFilters.studentId,
    props.classStudentFilters.realName,
    props.classStudents.length,
    props.students.length,
  ],
  () => {
    visibleClassStudentCount.value = CLASS_STUDENT_BATCH_SIZE
    visibleUnboundStudentCount.value = CLASS_STUDENT_BATCH_SIZE
  },
)

watch(
  () => props.classStudentModalOpen,
  (open) => {
    if (!open) {
      closeImportModal()
    }
  },
)

function asClassItem(row: Record<string, unknown>) {
  return row as unknown as ClassItem
}

function loadMoreClassStudents() {
  visibleClassStudentCount.value += CLASS_STUDENT_BATCH_SIZE
}

function loadMoreUnboundStudents() {
  visibleUnboundStudentCount.value += CLASS_STUDENT_BATCH_SIZE
}

function handleClassStudentScroll(event: Event) {
  const target = event.currentTarget
  if (!(target instanceof HTMLElement)) {
    return
  }
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 24) {
    loadMoreClassStudents()
  }
}

function handleUnboundStudentScroll(event: Event) {
  const target = event.currentTarget
  if (!(target instanceof HTMLElement)) {
    return
  }
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 24) {
    loadMoreUnboundStudents()
  }
}

function addStudentToClass(student: StudentItem) {
  props.classStudentForm.studentId = student.student_id
  props.classStudentForm.realName = student.real_name
  emit('createClassStudent')
}

const selectedImportFileName = computed(() => importFile.value?.name ?? '')
const importActionDisabled = computed(() => !importFile.value || props.classStudentImporting)

function openImportModal() {
  importModalOpen.value = true
}

function closeImportModal() {
  importModalOpen.value = false
  importFile.value = null
}

function handleImportFileSelect(file: File | null) {
  importFile.value = file
}

function submitImport() {
  if (!importFile.value) {
    return
  }
  emit('importClassStudents', importFile.value)
}

function downloadSampleCsv() {
  const csvContent = '\uFEFF学号,姓名\n'
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = '班级学生导入示例.csv'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

</script>

<template>
  <section class="workspace-card user-manage-panel">
    <div class="section-heading section-heading-titleless">
      <div class="inline-actions">
        <button class="primary-button" type="button" @click="emit('openCreateClassModal')">创建班级</button>
      </div>
    </div>

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
    <div v-if="classStudentModalOpen" class="modal-backdrop modal-backdrop-contained">
      <article class="modal-card modal-card-wide class-student-modal">
        <div class="wide-modal-header class-student-modal-header">
          <div class="wide-modal-header-top">
            <h3 class="wide-modal-header-title">编辑学生</h3>
            <div class="wide-modal-header-actions">
                <button class="ghost-button compact-button" type="button" @click="openImportModal">导入</button>
                <button class="ghost-button compact-button" type="button" @click="emit('closeClassStudentModal')">关闭</button>
            </div>
          </div>
          <p class="hint wide-modal-header-meta class-student-target-line">目标班级：{{ classStudentTargetName }}</p>
        </div>
        <div class="split-modal-layout">
          <div class="split-modal-main">
            <div class="section-heading modal-section-heading">
              <h4>班级学生</h4>
            </div>

            <div class="table-wrap class-student-table-wrap" @scroll="handleClassStudentScroll">
              <table class="data-table compact-table class-student-manage-table">
                <colgroup>
                  <col class="class-student-col-id" />
                  <col class="class-student-col-name" />
                  <col class="class-student-col-action" />
                </colgroup>
                <thead>
                  <tr>
                    <th>学号</th>
                    <th>姓名</th>
                    <th class="actions-column">操作</th>
                  </tr>
                  <tr class="table-filter-row">
                    <th class="table-filter-cell">
                      <input v-model="classStudentFilters.studentId" aria-label="按学号筛选班级学生" />
                    </th>
                    <th class="table-filter-cell">
                      <input v-model="classStudentFilters.realName" aria-label="按姓名筛选班级学生" />
                    </th>
                    <th class="table-filter-spacer" aria-hidden="true"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="student in visibleClassStudents" :key="student.id">
                    <td>{{ student.student_id }}</td>
                    <td>{{ student.real_name }}</td>
                    <td class="actions-column">
                      <div class="inline-actions user-actions">
                        <button class="ghost-button compact-button danger-button" type="button" :disabled="classStudentSaving" @click="emit('deleteClassStudent', student.id)">移除</button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="visibleClassStudents.length === 0">
                    <td colspan="3" class="empty-cell">暂无班级学生</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <aside class="split-modal-side">
            <div class="section-heading modal-section-heading">
              <h4>未绑定学生</h4>
            </div>

            <div class="table-wrap class-student-table-wrap" @scroll="handleUnboundStudentScroll">
              <table class="data-table compact-table class-student-manage-table">
                <colgroup>
                  <col class="class-student-col-id" />
                  <col class="class-student-col-name" />
                  <col class="class-student-col-action" />
                </colgroup>
                <thead>
                  <tr>
                    <th>学号</th>
                    <th>姓名</th>
                    <th class="actions-column">操作</th>
                  </tr>
                  <tr class="table-filter-row">
                    <th class="table-filter-cell">
                      <input v-model="classStudentFilters.studentId" aria-label="按学号筛选未绑定学生" />
                    </th>
                    <th class="table-filter-cell">
                      <input v-model="classStudentFilters.realName" aria-label="按姓名筛选未绑定学生" />
                    </th>
                    <th class="table-filter-spacer" aria-hidden="true"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="student in visibleUnboundStudents" :key="student.id">
                    <td>{{ student.student_id }}</td>
                    <td>{{ student.real_name }}</td>
                    <td class="actions-column">
                      <div class="inline-actions user-actions">
                        <button class="ghost-button compact-button success-button" type="button" :disabled="classStudentSaving" @click="addStudentToClass(student)">添加</button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="visibleUnboundStudents.length === 0">
                    <td colspan="3" class="empty-cell">暂无未绑定学生</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="class-student-footer">
              <button class="ghost-button narrow-button" type="button" @click="emit('closeClassStudentModal')">关闭</button>
            </div>
          </aside>
        </div>
        <AdminFileImportModal
          :open="importModalOpen"
          title="导入学生"
          accept=".csv,text/csv"
          :selected-file-name="selectedImportFileName"
          :import-disabled="importActionDisabled"
          :importing="classStudentImporting"
          @close="closeImportModal"
          @download-sample="downloadSampleCsv"
          @select-file="handleImportFileSelect"
          @submit="submitImport"
        />
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

    <AdminDataList
      :rows="classes as unknown as Array<Record<string, unknown>>"
      :columns="classColumns as unknown as Array<{ key: string; label: string; colClass?: string }>"
      row-key="id"
      empty-text="暂无符合条件的班级"
      :show-selection="true"
      :selected-row-keys="selectedClassIds"
      :show-actions="true"
      action-col-class="col-pct-20"
      :pagination="{ page: classPage, pageSize: classPageSize, totalPages: classTotalPages, pageOptions: classPageOptions }"
      @update-page="emit('updateClassPage', $event)"
      @update-page-size="emit('updateClassPageSize', $event)"
      @toggle-row-selection="emit('toggleClassSelection', Number($event))"
    >
      <template #filter-grade>
        <select v-model="classFilters.grade" aria-label="按年级筛选班级">
          <option value="">全部</option>
          <option v-for="grade in gradeOptions" :key="grade" :value="String(grade)">{{ grade }}</option>
        </select>
      </template>
      <template #filter-major_name>
        <select v-model="classFilters.majorName" aria-label="按专业名称筛选班级">
          <option value="">全部</option>
          <option v-for="major in majorOptions" :key="major" :value="major">{{ major }}</option>
        </select>
      </template>
      <template #filter-class_name>
        <input v-model="classFilters.className" aria-label="按班级名称筛选班级" />
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
      </template>
      <template #actions="{ row }">
        <div class="inline-actions user-actions">
          <button class="ghost-button compact-button" type="button" @click="emit('openEditClassModal', asClassItem(row))">编辑信息</button>
          <button class="ghost-button compact-button" type="button" @click="emit('openClassStudentModal', asClassItem(row))">编辑学生</button>
          <button class="ghost-button compact-button danger-button" type="button" @click="emit('openDeleteClassModal', asClassItem(row))">删除</button>
        </div>
      </template>
    </AdminDataList>
  </section>
</template>
