<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { StudentItem } from '../../api'
import AppDigitInput from '../common/AppDigitInput.vue'
import AdminDataList from './AdminDataList.vue'
import AppInputSelect from '../common/AppInputSelect.vue'
import type { AdminStudentManageProps } from './types'

const props = defineProps<AdminStudentManageProps>()

const emit = defineEmits<{
  openCreateStudentModal: []
  openEditStudentModal: [item: StudentItem]
  closeStudentModal: []
  openDeleteStudentModal: [item: StudentItem]
  closeDeleteStudentModal: []
  openBulkDeleteStudentModal: []
  closeBulkDeleteStudentModal: []
  saveStudent: []
  deleteStudent: []
  bulkDeleteStudents: []
  updateStudentPage: [page: number]
  updateStudentPageSize: [size: number]
  toggleStudentSelection: [studentId: number]
  toggleStudentPageSelection: []
}>()

const classKeyword = ref('')
const visibleClassCount = ref(12)

const classOptions = computed(() =>
  [...props.allClasses].sort((left, right) => {
    const selectedClassID = Number(props.studentForm.classId || 0)
    const leftSelected = left.id === selectedClassID
    const rightSelected = right.id === selectedClassID
    if (leftSelected !== rightSelected) {
      return leftSelected ? -1 : 1
    }
    if (left.grade !== right.grade) {
      return right.grade - left.grade
    }
    return `${left.major_name}${left.class_name}`.localeCompare(`${right.major_name}${right.class_name}`, 'zh-Hans-CN')
  }),
)

const studentColumns = [
  { key: 'student_id', label: '学号', width: 8 },
  { key: 'real_name', label: '姓名', width: 4 },
  { key: 'class_name', label: '所属班级', width: 6, copyable: false },
] as const

const filteredClassOptions = computed(() => {
  const keyword = classKeyword.value.trim()
  if (!keyword) {
    return classOptions.value
  }
  return classOptions.value.filter((item) =>
    `${item.grade} ${item.major_name} ${item.class_name}`.toLowerCase().includes(keyword.toLowerCase()),
  )
})

const studentFilterClassOptions = computed(() =>
  Array.from(
    new Set(props.allClasses.map((item) => item.class_name.trim())),
  )
    .filter((item) => item.length > 0)
    .sort((left, right) => left.localeCompare(right, 'zh-Hans-CN')),
)

const visibleClassOptions = computed(() => filteredClassOptions.value.slice(0, visibleClassCount.value))
const hasMoreClasses = computed(() => visibleClassOptions.value.length < filteredClassOptions.value.length)
const selectedClass = computed(() => classOptions.value.find((item) => item.id === props.studentForm.classId) ?? null)
const canSaveStudent = computed(
  () =>
    !props.studentSaving &&
    props.studentForm.studentId.trim().length > 0 &&
    props.studentForm.realName.trim().length > 0,
)

watch(
  () => [props.studentModalOpen, classKeyword.value] as const,
  () => {
    visibleClassCount.value = 12
  },
)

watch(
  () => props.studentModalOpen,
  (open) => {
    if (open) {
      classKeyword.value = ''
      visibleClassCount.value = 12
    }
  },
)

function toggleStudentClass(classId: number) {
  props.studentForm.classId = props.studentForm.classId === classId ? '' : classId
}

function loadMoreClasses() {
  visibleClassCount.value += 12
}

function asStudentItem(row: Record<string, unknown>) {
  return row as unknown as StudentItem
}
</script>

<template>
  <section class="workspace-card user-manage-panel">
    <Transition name="modal-float" appear>
    <div v-if="studentModalOpen" class="modal-backdrop">
      <article class="modal-card modal-card-wide student-bind-modal">
        <div class="modal-header">
          <h3>{{ isEditingStudent ? '编辑学生信息' : '创建学生' }}</h3>
          <button class="ghost-button compact-button modal-close" type="button" @click="emit('closeStudentModal')">关闭</button>
        </div>
        <div class="student-bind-layout">
          <section class="student-bind-class-panel">
            <div class="student-bind-panel-head">
              <strong>班级列表</strong>
              <span class="hint">绑定后自动置顶</span>
            </div>
            <label class="field student-bind-class-filter">
              <span>筛选</span>
              <input v-model="classKeyword" placeholder="按年级、专业、班级名筛选" />
            </label>
            <div class="student-bind-class-list">
              <article
                v-for="item in visibleClassOptions"
                :key="item.id"
                class="student-bind-class-item"
                :class="{ 'student-bind-class-item-selected': item.id === studentForm.classId }"
              >
                <div class="student-bind-class-main">
                  <strong>{{ item.class_name }}</strong>
                  <p>{{ item.grade }}级 {{ item.major_name }}</p>
                </div>
                <button
                  class="ghost-button compact-button"
                  :class="item.id === studentForm.classId ? 'danger-button' : ''"
                  type="button"
                  @click="toggleStudentClass(item.id)"
                >
                  {{ item.id === studentForm.classId ? '解绑' : '绑定' }}
                </button>
              </article>
              <div v-if="visibleClassOptions.length === 0" class="empty-cell student-bind-empty">
                暂无匹配班级
              </div>
            </div>
            <div v-if="hasMoreClasses" class="student-bind-loadmore">
              <button class="ghost-button compact-button" type="button" @click="loadMoreClasses">继续加载</button>
            </div>
          </section>

          <form class="form-grid single-column-form student-bind-form" @submit.prevent="emit('saveStudent')">
            <div class="student-bind-panel-head">
              <strong>学生信息</strong>
            </div>
            <div class="student-bind-current">
              <span class="hint">当前绑定班级</span>
              <strong v-if="selectedClass" class="class-display-text">
                <span>{{ selectedClass.grade }}级</span>
                <span class="copy-token-separator" aria-hidden="true">&nbsp;&nbsp;</span>
                <span>{{ selectedClass.major_name }}</span>
                <span class="copy-token-separator" aria-hidden="true">&nbsp;&nbsp;</span>
                <span>{{ selectedClass.class_name }}</span>
              </strong>
              <strong v-else>未绑定班级</strong>
            </div>
            <label class="field">
              <span>学号</span>
              <input v-model="studentForm.studentId" />
            </label>
            <label class="field">
              <span>姓名</span>
              <input v-model="studentForm.realName" />
            </label>
            <button class="primary-button" type="submit" :disabled="!canSaveStudent">
              <span v-if="studentSaving" class="button-spinner" aria-hidden="true"></span>
              <span>{{ studentSaving ? '保存中...' : '保存' }}</span>
            </button>
          </form>
        </div>
      </article>
    </div>
    </Transition>

    <Transition name="modal-float" appear>
    <div v-if="deleteStudentModalOpen" class="modal-backdrop">
      <article class="modal-card modal-card-narrow">
        <div class="modal-header">
          <h3>确认删除</h3>
          <button class="ghost-button compact-button modal-close" type="button" @click="emit('closeDeleteStudentModal')">关闭</button>
        </div>
        <p class="hint">删除后无法恢复。确定删除学生“{{ deletingStudentName }}”吗？</p>
        <div class="inline-actions">
          <button class="ghost-button" type="button" @click="emit('closeDeleteStudentModal')">取消</button>
          <button class="ghost-button danger-button" type="button" :disabled="studentDeleting" @click="emit('deleteStudent')">
            <span v-if="studentDeleting" class="button-spinner" aria-hidden="true"></span>
            <span>{{ studentDeleting ? '删除中...' : '确认删除' }}</span>
          </button>
        </div>
      </article>
    </div>
    </Transition>

    <Transition name="modal-float" appear>
    <div v-if="bulkDeleteStudentModalOpen" class="modal-backdrop">
      <article class="modal-card modal-card-narrow">
        <div class="modal-header">
          <h3>确认批量删除</h3>
          <button class="ghost-button compact-button modal-close" type="button" @click="emit('closeBulkDeleteStudentModal')">关闭</button>
        </div>
        <p class="hint">删除后无法恢复。确定删除已选中的 {{ selectedStudentCount }} 个学生吗？</p>
        <div class="inline-actions">
          <button class="ghost-button" type="button" @click="emit('closeBulkDeleteStudentModal')">取消</button>
          <button class="ghost-button danger-button" type="button" :disabled="studentDeleting" @click="emit('bulkDeleteStudents')">
            <span v-if="studentDeleting" class="button-spinner" aria-hidden="true"></span>
            <span>{{ studentDeleting ? '删除中...' : '确认删除' }}</span>
          </button>
        </div>
      </article>
    </div>
    </Transition>

    <AdminDataList
      :rows="students as unknown as Array<Record<string, unknown>>"
      :columns="studentColumns as unknown as Array<{ key: string; label: string; width?: number }>"
      row-key="id"
      table-class="student-manage-table"
      empty-text="暂无学生数据"
      :show-selection="true"
      :selected-row-keys="selectedStudentIds"
      :show-actions="true"
      :action-col-width="24"
      :pagination="{ page: studentPage, pageSize: studentPageSize, totalPages: studentTotalPages, pageOptions: studentPageOptions, totalItems: studentTotalItems }"
      :all-items="studentAllItems"
      :selected-items="selectedStudentIds.length"
      :highlight-row-key="studentFocusRowKey ?? null"
      :highlight-token="studentFocusToken ?? 0"
      :active-filter-keys="[
        ...(studentFilters.studentId.trim() ? ['student_id'] : []),
        ...(studentFilters.realName.trim() ? ['real_name'] : []),
        ...(studentFilters.className.trim() ? ['class_name'] : []),
      ]"
      :has-search-condition="!!(studentFilters.studentId.trim() || studentFilters.realName.trim() || studentFilters.className.trim())"
      @update-page="emit('updateStudentPage', $event)"
      @update-page-size="emit('updateStudentPageSize', $event)"
      @toggle-row-selection="emit('toggleStudentSelection', Number($event))"
    >
      <template #filter-student_id>
        <AppDigitInput v-model="studentFilters.studentId" aria-label="按学号筛选学生" />
      </template>
      <template #filter-real_name>
        <input v-model="studentFilters.realName" aria-label="按姓名筛选学生" />
      </template>
      <template #filter-class_name>
        <AppInputSelect
          v-model="studentFilters.className"
          :options="studentFilterClassOptions"
          aria-label="按班级名称筛选学生"
        />
      </template>
      <template #filter-actions>
        <button class="ghost-button compact-button" type="button" @click="emit('toggleStudentPageSelection')">
          全选
        </button>
        <button class="ghost-button compact-button danger-button" type="button" :disabled="studentDeleting || selectedStudentIds.length === 0" @click="emit('openBulkDeleteStudentModal')">
          批量删除
        </button>
        <button class="primary-button compact-button filter-action-push" type="button" @click="emit('openCreateStudentModal')">
          创建学生
        </button>
      </template>
      <template #cell-class_name="{ row }">
        {{ row.class_name || '未绑定班级' }}
      </template>
      <template #actions="{ row }">
        <div class="inline-actions user-actions">
          <button class="ghost-button compact-button" type="button" @click="emit('openEditStudentModal', asStudentItem(row))">编辑</button>
          <button class="ghost-button compact-button danger-button" type="button" @click="emit('openDeleteStudentModal', asStudentItem(row))">删除</button>
        </div>
      </template>
    </AdminDataList>
  </section>
</template>
