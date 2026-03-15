<script setup lang="ts">
import type { UserItem } from '../../api'

defineProps<{
  users: UserItem[]
  currentUserId?: number
  userForm: { studentId: string; realName: string; password: string; confirmPassword: string; role: number; status: number }
  userFilters: { studentId: string; realName: string; role: string; status: string }
  userModalOpen: boolean
  isEditingUser: boolean
  creatingUser: boolean
  userPage: number
  userPageSize: number
  userTotalPages: number
  userPageOptions: number[]
  userPasswordModalOpen: boolean
  userPasswordForm: { password: string; confirmPassword: string }
  passwordTargetName: string
  passwordResetting: boolean
  roleName: (role?: number) => string
}>()

const emit = defineEmits<{
  openCreateUserModal: []
  openEditUserModal: [user: UserItem]
  closeUserModal: []
  createUser: []
  setUserStatus: [studentId: string, status: number]
  openUserPasswordModal: [user: UserItem]
  closeUserPasswordModal: []
  resetUserPassword: []
  updateUserPage: [page: number]
  updateUserPageSize: [size: number]
}>()

function onPageSizeChange(event: Event) {
  emit('updateUserPageSize', Number((event.target as HTMLSelectElement).value))
}
</script>

<template>
  <section class="workspace-card user-manage-panel">
    <div class="section-heading">
      <h2>系统用户管理</h2>
      <button class="primary-button" type="button" @click="emit('openCreateUserModal')">创建用户</button>
    </div>

    <div v-if="userModalOpen" class="modal-backdrop" @click.self="emit('closeUserModal')">
      <article class="modal-card modal-card-narrow">
        <div class="modal-header">
          <h3>{{ isEditingUser ? '更改信息' : '创建用户' }}</h3>
          <button class="ghost-button compact-button modal-close" type="button" @click="emit('closeUserModal')">关闭</button>
        </div>
        <form class="form-grid single-column-form" @submit.prevent="emit('createUser')">
          <label class="field">
            <span>学号</span>
            <input v-model="userForm.studentId" autocomplete="username" />
          </label>
          <label class="field">
            <span>姓名</span>
            <input v-model="userForm.realName" />
          </label>
          <template v-if="!isEditingUser">
            <label class="field">
              <span>密码</span>
              <input v-model="userForm.password" type="password" autocomplete="new-password" />
            </label>
            <label class="field">
              <span>确认密码</span>
              <input v-model="userForm.confirmPassword" type="password" autocomplete="new-password" />
            </label>
          </template>
          <label class="field">
            <span>角色</span>
            <select v-model.number="userForm.role">
              <option :value="2">查课学生</option>
              <option :value="1">管理员</option>
            </select>
          </label>
          <button class="primary-button" type="submit" :disabled="creatingUser">
            <span v-if="creatingUser" class="button-spinner" aria-hidden="true"></span>
            <span>{{ creatingUser ? '提交中...' : '确认保存' }}</span>
          </button>
        </form>
      </article>
    </div>

    <div v-if="userPasswordModalOpen" class="modal-backdrop" @click.self="emit('closeUserPasswordModal')">
      <article class="modal-card modal-card-narrow">
        <div class="modal-header">
          <h3>更改密码</h3>
          <button class="ghost-button compact-button modal-close" type="button" @click="emit('closeUserPasswordModal')">关闭</button>
        </div>
        <p class="hint">目标账号：{{ passwordTargetName }}</p>
        <form class="form-grid single-column-form" @submit.prevent="emit('resetUserPassword')">
          <label class="field">
            <span>新密码</span>
            <input v-model="userPasswordForm.password" type="password" autocomplete="new-password" />
          </label>
          <label class="field">
            <span>确认新密码</span>
            <input v-model="userPasswordForm.confirmPassword" type="password" autocomplete="new-password" />
          </label>
          <button class="primary-button" type="submit" :disabled="passwordResetting">
            <span v-if="passwordResetting" class="button-spinner" aria-hidden="true"></span>
            <span>{{ passwordResetting ? '提交中...' : '确认修改' }}</span>
          </button>
        </form>
      </article>
    </div>

    <div class="table-filters">
      <label class="field">
        <span>学号</span>
        <input v-model="userFilters.studentId" />
      </label>
      <label class="field">
        <span>姓名</span>
        <input v-model="userFilters.realName" />
      </label>
      <label class="field">
        <span>角色</span>
        <select v-model="userFilters.role">
          <option value="">全部</option>
          <option value="1">管理员</option>
          <option value="2">查课学生</option>
        </select>
      </label>
      <label class="field">
        <span>状态</span>
        <select v-model="userFilters.status">
          <option value="">全部</option>
          <option value="1">正常</option>
          <option value="2">冻结</option>
        </select>
      </label>
    </div>

    <div class="table-wrap user-table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>学号</th>
            <th>姓名</th>
            <th>角色</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.student_id">
            <td>{{ user.student_id }}</td>
            <td>{{ user.real_name }}</td>
            <td>{{ roleName(user.role) }}</td>
            <td>{{ user.status === 1 ? '正常' : '冻结' }}</td>
            <td>
              <div class="inline-actions">
                <button class="ghost-button compact-button" type="button" :disabled="user.id === currentUserId" @click="emit('openEditUserModal', user)">更改信息</button>
                <button class="ghost-button compact-button" type="button" :disabled="user.id === currentUserId" @click="emit('openUserPasswordModal', user)">更改密码</button>
                <button class="ghost-button compact-button danger-button" type="button" :disabled="user.id === currentUserId || user.status === 2" @click="emit('setUserStatus', user.student_id, 2)">冻结</button>
                <button class="ghost-button compact-button success-button" type="button" :disabled="user.id === currentUserId || user.status === 1" @click="emit('setUserStatus', user.student_id, 1)">解冻</button>
              </div>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="5" class="empty-cell">暂无符合条件的用户</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination-bar">
      <div class="pagination-pages">
        <button
          v-for="page in userTotalPages"
          :key="page"
          class="ghost-button compact-button pagination-button"
          :class="{ selected: userPage === page }"
          type="button"
          @click="emit('updateUserPage', page)"
        >
          {{ page }}
        </button>
      </div>
      <div class="pagination-size">
        <select :value="userPageSize" @change="onPageSizeChange">
          <option v-for="size in userPageOptions" :key="size" :value="size">{{ size }}</option>
        </select>
      </div>
    </div>
  </section>
</template>
