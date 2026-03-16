<script setup lang="ts">
import { computed } from 'vue'
import type { UserItem } from '../../api'
import AdminUserFreeTimeModal from './AdminUserFreeTimeModal.vue'
import type { AdminUserManageProps } from './types'

const props = defineProps<AdminUserManageProps>()

const emit = defineEmits<{
  openCreateUserModal: []
  openEditUserModal: [user: UserItem]
  closeUserModal: []
  createUser: []
  setUserStatus: [studentId: string, status: number]
  openUserPasswordModal: [user: UserItem]
  closeUserPasswordModal: []
  openUserFreeTimeModal: [user: UserItem]
  closeUserFreeTimeModal: []
  updateUserFreeTimeTerm: [term: string]
  toggleUserFreeTimeWeek: [payload: { weekday: number; section: number; weekNo: number }]
  saveUserFreeTime: []
  resetUserPassword: []
  updateUserPage: [page: number]
  updateUserPageSize: [size: number]
  toggleUserSelection: [studentId: string]
  toggleUserPageSelection: []
  bulkFreezeUsers: []
  bulkUnfreezeUsers: []
}>()

const selectedUserIdSet = computed(() => new Set(props.selectedUserStudentIds))
const selectableUsers = computed(() => props.users.filter((user) => user.id !== props.currentUserId))
const areAllUsersSelected = computed(
  () => selectableUsers.value.length > 0 && selectableUsers.value.every((user) => selectedUserIdSet.value.has(user.student_id)),
)
const selectedUsers = computed(() => props.users.filter((user) => selectedUserIdSet.value.has(user.student_id)))
const canBulkFreezeUsers = computed(
  () => selectedUsers.value.length > 0 && selectedUsers.value.every((user) => user.id !== props.currentUserId && user.status !== 2),
)
const canBulkUnfreezeUsers = computed(
  () => selectedUsers.value.length > 0 && selectedUsers.value.every((user) => user.id !== props.currentUserId && user.status !== 1),
)

function onPageSizeChange(event: Event) {
  emit('updateUserPageSize', Number((event.target as HTMLSelectElement).value))
}

function formatLastLogin(value?: string | null) {
  if (!value) {
    return '-'
  }
  return value.replace('T', ' ').slice(0, 19)
}
</script>

<template>
  <section class="workspace-card user-manage-panel">
    <div class="section-heading">
      <h2>系统用户管理</h2>
      <button class="primary-button" type="button" @click="emit('openCreateUserModal')">创建用户</button>
    </div>

    <div v-if="userModalOpen" class="modal-backdrop">
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
            <span>{{ creatingUser ? '保存中...' : '保存' }}</span>
          </button>
        </form>
      </article>
    </div>

    <div v-if="userPasswordModalOpen" class="modal-backdrop">
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

    <AdminUserFreeTimeModal
      :open="userFreeTimeModalOpen"
      :target-name="freeTimeTargetName"
      :term="userFreeTimeTerm"
      :term-options="userFreeTimeTermOptions"
      :loading="userFreeTimeLoading"
      :saving="userFreeTimeSaving"
      :draft="userFreeTimeDraft"
      @close="emit('closeUserFreeTimeModal')"
      @save="emit('saveUserFreeTime')"
      @update:term="emit('updateUserFreeTimeTerm', $event)"
      @toggle-week="emit('toggleUserFreeTimeWeek', $event)"
    />

    <div class="table-wrap user-table-wrap">
      <table class="data-table user-manage-table">
        <colgroup>
          <col class="selection-column" />
          <col class="user-col-student-id" />
          <col class="user-col-name" />
          <col class="user-col-role" />
          <col class="user-col-status" />
          <col class="user-col-last-login" />
          <col class="user-col-actions" />
        </colgroup>
        <thead>
          <tr>
            <th class="selection-column">
              <span class="visually-hidden">选择</span>
            </th>
            <th>学号</th>
            <th>姓名</th>
            <th>角色</th>
            <th>状态</th>
            <th>上次登录时间</th>
            <th class="actions-column">操作</th>
          </tr>
          <tr class="table-filter-row">
            <th class="table-filter-spacer" aria-hidden="true"></th>
            <th class="table-filter-cell">
              <input v-model="userFilters.studentId" aria-label="按学号筛选用户" />
            </th>
            <th class="table-filter-cell">
              <input v-model="userFilters.realName" aria-label="按姓名筛选用户" />
            </th>
            <th class="table-filter-cell">
              <select v-model="userFilters.role" aria-label="按角色筛选用户">
                <option value="">全部</option>
                <option value="1">管理员</option>
                <option value="2">查课学生</option>
              </select>
            </th>
            <th class="table-filter-cell">
              <select v-model="userFilters.status" aria-label="按状态筛选用户">
                <option value="">全部</option>
                <option value="1">正常</option>
                <option value="2">冻结</option>
              </select>
            </th>
            <th class="table-filter-spacer" aria-hidden="true"></th>
            <th class="table-filter-cell table-filter-actions-cell">
              <div class="table-filter-actions">
                <button
                  class="ghost-button compact-button"
                  :class="{ selected: areAllUsersSelected }"
                  type="button"
                  @click="emit('toggleUserPageSelection')"
                >
                  全选
                </button>
                <button class="ghost-button compact-button danger-button" type="button" :disabled="userStatusUpdating || !canBulkFreezeUsers" @click="emit('bulkFreezeUsers')">
                  批量冻结
                </button>
                <button class="ghost-button compact-button success-button" type="button" :disabled="userStatusUpdating || !canBulkUnfreezeUsers" @click="emit('bulkUnfreezeUsers')">
                  批量解冻
                </button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.student_id">
            <td class="selection-column">
              <input
                type="checkbox"
                :checked="selectedUserIdSet.has(user.student_id)"
                :disabled="user.id === currentUserId"
                :aria-label="`选择用户 ${user.real_name}`"
                @change="emit('toggleUserSelection', user.student_id)"
              />
            </td>
            <td>{{ user.student_id }}</td>
            <td>{{ user.real_name }}</td>
            <td>{{ roleName(user.role) }}</td>
            <td>{{ user.status === 1 ? '正常' : '冻结' }}</td>
            <td>{{ formatLastLogin(user.last_login_at) }}</td>
            <td class="actions-column">
              <div class="inline-actions user-actions">
                <button class="ghost-button compact-button" type="button" :disabled="user.id === currentUserId" @click="emit('openEditUserModal', user)">编辑信息</button>
                <button class="ghost-button compact-button" type="button" :disabled="user.id === currentUserId" @click="emit('openUserPasswordModal', user)">更改密码</button>
                <button class="ghost-button compact-button" type="button" :disabled="user.role !== 2" @click="emit('openUserFreeTimeModal', user)">编辑空闲时间</button>
                <button class="ghost-button compact-button danger-button" type="button" :disabled="userStatusUpdating || user.id === currentUserId || user.status === 2" @click="emit('setUserStatus', user.student_id, 2)">冻结</button>
                <button class="ghost-button compact-button success-button" type="button" :disabled="userStatusUpdating || user.id === currentUserId || user.status === 1" @click="emit('setUserStatus', user.student_id, 1)">解冻</button>
              </div>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="7" class="empty-cell">暂无符合条件的用户</td>
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
