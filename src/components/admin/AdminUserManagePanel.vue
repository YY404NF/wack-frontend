<script setup lang="ts">
import { computed, ref } from 'vue'
import type { UserItem } from '../../api'
import { roleName } from '../../composables/app/view'
import AdminDataList from './AdminDataList.vue'
import AdminUserFreeTimeModal from './AdminUserFreeTimeModal.vue'
import type { AdminUserManageProps } from './types'
import { sortTermsForSelect } from '../../utils/terms'

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
  toggleUserFreeTimeCell: [payload: { weekday: number; section: number }]
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
  () => selectableUsers.value.length > 0 && selectableUsers.value.every((user) => selectedUserIdSet.value.has(user.login_id)),
)
const selectedUsers = computed(() => props.users.filter((user) => selectedUserIdSet.value.has(user.login_id)))
const canBulkFreezeUsers = computed(
  () => selectedUsers.value.length > 0 && selectedUsers.value.every((user) => user.id !== props.currentUserId && user.status !== 2),
)
const canBulkUnfreezeUsers = computed(
  () => selectedUsers.value.length > 0 && selectedUsers.value.every((user) => user.id !== props.currentUserId && user.status !== 1),
)
const freeTimeTermOptions = computed(() => sortTermsForSelect(props.courseTerms).map((item) => item.name))
const singleStatusConfirmOpen = ref(false)
const bulkStatusConfirmOpen = ref(false)
const pendingStatusTarget = ref<{ loginId: string; realName: string; status: number } | null>(null)
const pendingBulkStatus = ref<number | null>(null)

const userColumns = [
  { key: 'login_id', label: '登录账号', colClass: 'col-pct-13' },
  { key: 'real_name', label: '姓名', colClass: 'col-pct-7' },
  { key: 'role', label: '角色', colClass: 'col-pct-7', copyValue: (row: Record<string, unknown>) => roleName(Number(row.role)) },
  { key: 'managed_class_id', label: '负责班级', colClass: 'col-pct-12', copyValue: (row: Record<string, unknown>) => Number(row.role) === 3 ? managedClassName((row.managed_class_id as number | null | undefined) ?? null) : '-' },
  { key: 'status', label: '状态', colClass: 'col-pct-7', copyValue: (row: Record<string, unknown>) => Number(row.status) === 1 ? '正常' : '冻结' },
  { key: 'last_login_at', label: '上次登录时间', colClass: 'col-pct-18', copyValue: (row: Record<string, unknown>) => formatLastLogin((row.last_login_at as string | null | undefined) ?? null) },
] as const

function formatLastLogin(value?: string | null) {
  if (!value) {
    return '-'
  }
  return value.replace('T', ' ').slice(0, 19)
}

function managedClassName(classId?: number | null) {
  if (typeof classId !== 'number') {
    return '-'
  }
  const matched = props.allClasses.find((item) => item.id === classId)
  if (!matched) {
    return `班级 ${classId}`
  }
  return matched.class_name
}

function asUserItem(row: Record<string, unknown>) {
  return row as unknown as UserItem
}

function openSingleStatusConfirm(user: UserItem) {
  if (user.id === props.currentUserId) {
    return
  }
  pendingStatusTarget.value = {
    loginId: user.login_id,
    realName: user.real_name,
    status: user.status === 1 ? 2 : 1,
  }
  singleStatusConfirmOpen.value = true
}

function closeSingleStatusConfirm() {
  singleStatusConfirmOpen.value = false
  pendingStatusTarget.value = null
}

function confirmSingleStatusChange() {
  if (!pendingStatusTarget.value) {
    return
  }
  emit('setUserStatus', pendingStatusTarget.value.loginId, pendingStatusTarget.value.status)
  closeSingleStatusConfirm()
}

function openBulkStatusConfirm(status: number) {
  if ((status === 2 && !canBulkFreezeUsers.value) || (status === 1 && !canBulkUnfreezeUsers.value)) {
    return
  }
  pendingBulkStatus.value = status
  bulkStatusConfirmOpen.value = true
}

function closeBulkStatusConfirm() {
  bulkStatusConfirmOpen.value = false
  pendingBulkStatus.value = null
}

function confirmBulkStatusChange() {
  if (pendingBulkStatus.value === 2) {
    emit('bulkFreezeUsers')
  } else if (pendingBulkStatus.value === 1) {
    emit('bulkUnfreezeUsers')
  }
  closeBulkStatusConfirm()
}

const singleStatusActionLabel = computed(() => (pendingStatusTarget.value?.status === 2 ? '冻结' : '解冻'))
const bulkStatusActionLabel = computed(() => (pendingBulkStatus.value === 2 ? '冻结' : '解冻'))
</script>

<template>
  <section class="workspace-card user-manage-panel">
    <div class="section-heading section-heading-titleless">
      <button class="primary-button" type="button" @click="emit('openCreateUserModal')">创建用户</button>
    </div>

    <Transition name="modal-float" appear>
    <div v-if="singleStatusConfirmOpen" class="modal-backdrop">
      <article class="modal-card modal-card-narrow">
        <div class="modal-header">
          <h3>确认{{ singleStatusActionLabel }}</h3>
          <button class="ghost-button compact-button modal-close" type="button" @click="closeSingleStatusConfirm">关闭</button>
        </div>
        <p class="hint">
          确定{{ singleStatusActionLabel }}用户“{{ pendingStatusTarget?.realName }}（{{ pendingStatusTarget?.loginId }}）”吗？
        </p>
        <div class="inline-actions">
          <button class="ghost-button" type="button" @click="closeSingleStatusConfirm">取消</button>
          <button
            class="ghost-button"
            :class="singleStatusActionLabel === '冻结' ? 'danger-button' : 'success-button'"
            type="button"
            :disabled="userStatusUpdating"
            @click="confirmSingleStatusChange"
          >
            <span v-if="userStatusUpdating" class="button-spinner" aria-hidden="true"></span>
            <span>{{ userStatusUpdating ? '处理中...' : `确认${singleStatusActionLabel}` }}</span>
          </button>
        </div>
      </article>
    </div>
    </Transition>

    <Transition name="modal-float" appear>
    <div v-if="bulkStatusConfirmOpen" class="modal-backdrop">
      <article class="modal-card modal-card-narrow">
        <div class="modal-header">
          <h3>确认批量{{ bulkStatusActionLabel }}</h3>
          <button class="ghost-button compact-button modal-close" type="button" @click="closeBulkStatusConfirm">关闭</button>
        </div>
        <p class="hint">确定{{ bulkStatusActionLabel }}已选中的 {{ selectedUserStudentIds.length }} 个用户吗？</p>
        <div class="inline-actions">
          <button class="ghost-button" type="button" @click="closeBulkStatusConfirm">取消</button>
          <button
            class="ghost-button"
            :class="bulkStatusActionLabel === '冻结' ? 'danger-button' : 'success-button'"
            type="button"
            :disabled="userStatusUpdating"
            @click="confirmBulkStatusChange"
          >
            <span v-if="userStatusUpdating" class="button-spinner" aria-hidden="true"></span>
            <span>{{ userStatusUpdating ? '处理中...' : `确认${bulkStatusActionLabel}` }}</span>
          </button>
        </div>
      </article>
    </div>
    </Transition>

    <Transition name="modal-float" appear>
    <div v-if="userModalOpen" class="modal-backdrop">
      <article class="modal-card modal-card-narrow">
        <div class="modal-header">
          <h3>{{ isEditingUser ? '更改信息' : '创建用户' }}</h3>
          <button class="ghost-button compact-button modal-close" type="button" @click="emit('closeUserModal')">关闭</button>
        </div>
        <form class="form-grid single-column-form" @submit.prevent="emit('createUser')">
          <label class="field">
            <span>登录账号</span>
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
              <option :value="3">学委</option>
              <option :value="1">管理员</option>
            </select>
          </label>
          <label v-if="userForm.role === 3" class="field">
            <span>负责班级</span>
            <select v-model.number="userForm.managedClassId">
              <option value="">请选择班级</option>
              <option v-for="item in allClasses" :key="item.id" :value="item.id">
                {{ item.grade }}级 {{ item.major_name }} {{ item.class_name }}
              </option>
            </select>
          </label>
          <button class="primary-button" type="submit" :disabled="creatingUser">
            <span v-if="creatingUser" class="button-spinner" aria-hidden="true"></span>
            <span>{{ creatingUser ? '保存中...' : '保存' }}</span>
          </button>
        </form>
      </article>
    </div>
    </Transition>

    <Transition name="modal-float" appear>
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
    </Transition>

    <AdminUserFreeTimeModal
      :open="userFreeTimeModalOpen"
      :target-name="freeTimeTargetName"
      :term="userFreeTimeTerm"
      :term-options="freeTimeTermOptions"
      :loading="userFreeTimeLoading"
      :saving="userFreeTimeSaving"
      :draft="userFreeTimeDraft"
      @close="emit('closeUserFreeTimeModal')"
      @save="emit('saveUserFreeTime')"
      @update:term="emit('updateUserFreeTimeTerm', $event)"
      @toggle-week="emit('toggleUserFreeTimeWeek', $event)"
      @toggle-cell-weeks="emit('toggleUserFreeTimeCell', $event)"
    />

    <AdminDataList
      table-class="user-manage-table"
      action-col-class="col-pct-33"
      :rows="users as unknown as Array<Record<string, unknown>>"
      :columns="userColumns as unknown as Array<{ key: string; label: string; colClass?: string }>"
      row-key="login_id"
      empty-text="暂无符合条件的用户"
      :show-selection="true"
      :selected-row-keys="selectedUserStudentIds"
      :is-row-selectable="(row) => Number(row.id) !== currentUserId"
      :show-actions="true"
      :pagination="{ page: userPage, pageSize: userPageSize, totalPages: userTotalPages, pageOptions: userPageOptions, totalItems: userTotalItems }"
      :all-items="userAllItems"
      :selected-items="selectedUserStudentIds.length"
      :active-filter-keys="[
        ...(userFilters.studentId.trim() ? ['login_id'] : []),
        ...(userFilters.realName.trim() ? ['real_name'] : []),
        ...(userFilters.role ? ['role'] : []),
        ...(userFilters.managedClassName.trim() ? ['managed_class_id'] : []),
        ...(userFilters.status ? ['status'] : []),
      ]"
      :has-search-condition="!!(userFilters.studentId.trim() || userFilters.realName.trim() || userFilters.role || userFilters.managedClassName.trim() || userFilters.status)"
      @update-page="emit('updateUserPage', $event)"
      @update-page-size="emit('updateUserPageSize', $event)"
      @toggle-row-selection="emit('toggleUserSelection', String($event))"
    >
      <template #filter-login_id>
        <input v-model="userFilters.studentId" aria-label="按登录账号筛选用户" />
      </template>
      <template #filter-real_name>
        <input v-model="userFilters.realName" aria-label="按姓名筛选用户" />
      </template>
      <template #filter-role>
        <select v-model="userFilters.role" aria-label="按角色筛选用户">
          <option value="">全部</option>
          <option value="1">管理员</option>
          <option value="2">查课学生</option>
          <option value="3">学委</option>
        </select>
      </template>
      <template #filter-managed_class_id>
        <input v-model="userFilters.managedClassName" aria-label="按负责班级筛选用户" />
      </template>
      <template #filter-status>
        <select v-model="userFilters.status" aria-label="按状态筛选用户">
          <option value="">全部</option>
          <option value="1">正常</option>
          <option value="2">冻结</option>
        </select>
      </template>
      <template #filter-actions>
        <button
          class="ghost-button compact-button"
          :class="{ selected: areAllUsersSelected }"
          type="button"
          @click="emit('toggleUserPageSelection')"
        >
          全选
        </button>
        <button class="ghost-button compact-button danger-button" type="button" :disabled="userStatusUpdating || !canBulkFreezeUsers" @click="openBulkStatusConfirm(2)">
          批量冻结
        </button>
        <button class="ghost-button compact-button success-button" type="button" :disabled="userStatusUpdating || !canBulkUnfreezeUsers" @click="openBulkStatusConfirm(1)">
          批量解冻
        </button>
      </template>
      <template #cell-role="{ row }">
        {{ roleName(Number(row.role)) }}
      </template>
      <template #cell-managed_class_id="{ row }">
        {{ Number(row.role) === 3 ? managedClassName((row.managed_class_id as number | null | undefined) ?? null) : '-' }}
      </template>
      <template #cell-status="{ row }">
        {{ Number(row.status) === 1 ? '正常' : '冻结' }}
      </template>
      <template #cell-last_login_at="{ row }">
        {{ formatLastLogin((row.last_login_at as string | null | undefined) ?? null) }}
      </template>
      <template #actions="{ row }">
        <div v-if="Number(row.id) !== currentUserId" class="inline-actions user-actions">
          <button v-if="Number(row.role) === 2" class="ghost-button compact-button" type="button" @click="emit('openUserFreeTimeModal', asUserItem(row))">空闲时间</button>
          <button class="ghost-button compact-button" type="button" @click="emit('openEditUserModal', asUserItem(row))">编辑</button>
          <button class="ghost-button compact-button" type="button" @click="emit('openUserPasswordModal', asUserItem(row))">更改密码</button>
          <button
            class="ghost-button compact-button"
            :class="Number(row.status) === 1 ? 'danger-button' : 'success-button'"
            type="button"
            :disabled="userStatusUpdating"
            @click="openSingleStatusConfirm(asUserItem(row))"
          >
            {{ Number(row.status) === 1 ? '冻结' : '解冻' }}
          </button>
        </div>
        <div v-else class="inline-actions user-actions user-actions-placeholder" aria-hidden="true">
          <span class="ghost-button compact-button">占位</span>
        </div>
      </template>
    </AdminDataList>
  </section>
</template>
