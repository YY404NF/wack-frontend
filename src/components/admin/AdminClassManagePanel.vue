<script setup lang="ts">
import type { ClassItem } from '../../api'
import type { AdminClassManageProps } from './types'

defineProps<AdminClassManageProps>()

const emit = defineEmits<{
  openCreateClassModal: []
  openEditClassModal: [item: ClassItem]
  closeClassModal: []
  openDeleteClassModal: [item: ClassItem]
  closeDeleteClassModal: []
  saveClass: []
  deleteClass: []
  updateClassPage: [page: number]
  updateClassPageSize: [size: number]
}>()

function onPageSizeChange(event: Event) {
  emit('updateClassPageSize', Number((event.target as HTMLSelectElement).value))
}
</script>

<template>
  <section class="workspace-card user-manage-panel">
    <div class="section-heading">
      <h2>班级管理</h2>
      <button class="primary-button" type="button" @click="emit('openCreateClassModal')">创建班级</button>
    </div>

    <div v-if="classModalOpen" class="modal-backdrop" @click.self="emit('closeClassModal')">
      <article class="modal-card modal-card-narrow">
        <div class="modal-header">
          <h3>{{ isEditingClass ? '更改信息' : '创建班级' }}</h3>
          <button class="ghost-button compact-button modal-close" type="button" @click="emit('closeClassModal')">关闭</button>
        </div>
        <form class="form-grid single-column-form" @submit.prevent="emit('saveClass')">
          <label class="field">
            <span>班级名称</span>
            <input v-model="classForm.className" />
          </label>
          <label class="field">
            <span>年级</span>
            <input v-model.number="classForm.grade" type="number" min="2000" />
          </label>
          <label class="field">
            <span>专业名称</span>
            <input v-model="classForm.majorName" />
          </label>
          <button class="primary-button" type="submit" :disabled="classSaving">
            <span v-if="classSaving" class="button-spinner" aria-hidden="true"></span>
            <span>{{ classSaving ? '提交中...' : '确认保存' }}</span>
          </button>
        </form>
      </article>
    </div>

    <div v-if="deleteClassModalOpen" class="modal-backdrop" @click.self="emit('closeDeleteClassModal')">
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

    <div class="table-filters">
      <label class="field">
        <span>年级</span>
        <input v-model="classFilters.grade" inputmode="numeric" />
      </label>
      <label class="field">
        <span>专业名称</span>
        <input v-model="classFilters.majorName" />
      </label>
      <label class="field">
        <span>班级名称</span>
        <input v-model="classFilters.className" />
      </label>
      <label class="field">
        <span>人数</span>
        <input v-model="classFilters.studentCount" inputmode="numeric" />
      </label>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>年级</th>
            <th>专业名称</th>
            <th>班级名称</th>
            <th>人数</th>
            <th class="actions-column">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in classes" :key="item.id">
            <td>{{ item.grade }}</td>
            <td>{{ item.major_name }}</td>
            <td>{{ item.class_name }}</td>
            <td>{{ item.student_count }}</td>
            <td class="actions-column">
              <div class="inline-actions user-actions">
                <button class="ghost-button compact-button" type="button" @click="emit('openEditClassModal', item)">更改信息</button>
                <button class="ghost-button compact-button" type="button" disabled>更改学生</button>
                <button class="ghost-button compact-button danger-button" type="button" @click="emit('openDeleteClassModal', item)">删除</button>
              </div>
            </td>
          </tr>
          <tr v-if="classes.length === 0">
            <td colspan="5" class="empty-cell">暂无符合条件的班级</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination-bar">
      <div class="pagination-pages">
        <button
          v-for="page in classTotalPages"
          :key="page"
          class="ghost-button compact-button pagination-button"
          :class="{ selected: classPage === page }"
          type="button"
          @click="emit('updateClassPage', page)"
        >
          {{ page }}
        </button>
      </div>
      <div class="pagination-size">
        <select :value="classPageSize" @change="onPageSizeChange">
          <option v-for="size in classPageOptions" :key="size" :value="size">{{ size }}</option>
        </select>
      </div>
    </div>
  </section>
</template>
