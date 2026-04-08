<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import type { ClassItem } from '../../api'
import type { AdminClassManageProps } from './types'

const props = defineProps<AdminClassManageProps>()
const AdminClassListView = defineAsyncComponent(() => import('./AdminClassListView.vue'))
const AdminClassStudentManageView = defineAsyncComponent(() => import('./AdminClassStudentManageView.vue'))
const AdminClassAttendanceDetail = defineAsyncComponent(() => import('./AdminClassAttendanceDetail.vue'))

const emit = defineEmits<{
  openCreateClassModal: []
  openEditClassModal: [item: ClassItem]
  openClassStudentModal: [item: ClassItem]
  openClassAttendanceDetail: [item: ClassItem]
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

const showClassStudentView = computed(() => props.classManageRouteView === 'students')
const showClassAttendanceDetailView = computed(
  () => props.classManageRouteView === 'attendance-detail' && typeof props.classManageRouteClassId === 'number' && props.classManageRouteClassId > 0,
)
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

    <Transition name="subpage-fade" mode="out-in" appear>
      <AdminClassListView
        v-if="!showClassStudentView && !showClassAttendanceDetailView"
        key="class-list"
        :classes="classes"
        :all-classes="allClasses"
        :course-terms="courseTerms"
        :class-filters="classFilters"
        :selected-class-ids="selectedClassIds"
        :class-deleting="classDeleting"
        :class-page="classPage"
        :class-page-size="classPageSize"
        :class-total-pages="classTotalPages"
        :class-total-items="classTotalItems"
        :class-all-items="classAllItems"
        :class-page-options="classPageOptions"
        :class-focus-row-key="classFocusRowKey"
        :class-focus-token="classFocusToken"
        @open-create-class-modal="emit('openCreateClassModal')"
        @open-edit-class-modal="emit('openEditClassModal', $event)"
        @open-class-student-modal="emit('openClassStudentModal', $event)"
        @open-class-attendance-detail="emit('openClassAttendanceDetail', $event)"
        @open-delete-class-modal="emit('openDeleteClassModal', $event)"
        @open-bulk-delete-class-modal="emit('openBulkDeleteClassModal')"
        @update-class-page="emit('updateClassPage', $event)"
        @update-class-page-size="emit('updateClassPageSize', $event)"
        @toggle-class-selection="emit('toggleClassSelection', $event)"
        @toggle-class-page-selection="emit('toggleClassPageSelection')"
      />

      <AdminClassStudentManageView
        v-else-if="showClassStudentView"
        key="class-students"
        :all-classes="allClasses"
        :class-students="classStudents"
        :class-student-filters="classStudentFilters"
        :class-student-saving="classStudentSaving"
        :class-student-target-class="classStudentTargetClass"
        :class-student-target-name="classStudentTargetName"
        @delete-class-student="emit('deleteClassStudent', $event)"
        @bulk-delete-class-students="emit('bulkDeleteClassStudents', $event)"
      />

      <AdminClassAttendanceDetail
        v-else
        key="class-attendance-detail"
        :class-id="classManageRouteClassId ?? 0"
        :selected-term="classFilters.term"
        :course-terms="courseTerms"
        @update:selected-term="classFilters.term = $event"
      />
    </Transition>
  </section>
</template>
