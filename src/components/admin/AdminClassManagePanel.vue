<script setup lang="ts">
import { computed } from 'vue'
import type { ClassItem } from '../../api'
import AdminDataList from './AdminDataList.vue'
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

function asClassItem(row: Record<string, unknown>) {
  return row as unknown as ClassItem
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
                <button class="ghost-button compact-button" type="button" @click="emit('closeClassStudentModal')">关闭</button>
            </div>
          </div>
          <p class="hint wide-modal-header-meta class-student-target-line">目标班级：{{ classStudentTargetName }}</p>
        </div>
        <div class="split-modal-layout">
          <div class="split-modal-main">
            <div class="section-heading modal-section-heading">
              <h4>学生列表</h4>
            </div>

            <div class="table-wrap class-student-table-wrap">
              <table class="data-table compact-table">
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
                  <tr v-for="student in classStudents" :key="student.id">
                    <td>
                      <input v-if="editingClassStudentId === student.id" v-model="editingClassStudentForm.studentId" />
                      <template v-else>{{ student.student_id }}</template>
                    </td>
                    <td>
                      <input v-if="editingClassStudentId === student.id" v-model="editingClassStudentForm.realName" />
                      <template v-else>{{ student.real_name }}</template>
                    </td>
                    <td class="actions-column">
                      <div class="inline-actions user-actions">
                        <button class="ghost-button compact-button" type="button" :disabled="student.id < 0 || editingClassStudentId === student.id || classStudentSaving" @click="emit('startEditClassStudent', student.id)">编辑</button>
                        <button class="ghost-button compact-button success-button" type="button" :disabled="student.id < 0 || editingClassStudentId !== student.id || classStudentSaving" @click="emit('saveEditingClassStudent')">保存</button>
                        <button class="ghost-button compact-button danger-button" type="button" :disabled="editingClassStudentId === student.id || classStudentSaving" @click="emit('deleteClassStudent', student.id)">删除</button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="classStudents.length === 0">
                    <td colspan="3" class="empty-cell">暂无班级学生</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <aside class="split-modal-side">
            <div class="course-section-heading">
              <h4>新增学生</h4>
            </div>
            <form class="form-grid single-column-form" @submit.prevent="emit('createClassStudent')">
              <label class="field">
                <span>学号</span>
                <input v-model="classStudentForm.studentId" />
              </label>
              <label class="field">
                <span>姓名</span>
                <input v-model="classStudentForm.realName" />
              </label>
              <button class="primary-button" type="submit" :disabled="classStudentSaving">创建学生</button>
            </form>

            <div class="class-student-footer">
              <button class="ghost-button narrow-button" type="button" @click="emit('closeClassStudentModal')">关闭</button>
            </div>
          </aside>
        </div>
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
