<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { api, type MetaTermItem } from '../../api'
import AdminDataList from './AdminDataList.vue'
import type { AdminSettingsProps } from './types'
import { getCurrentAcademicTerm } from '../../utils/free-time'
import { sortTermsForSelect } from '../../utils/terms'

const props = defineProps<AdminSettingsProps>()

const emit = defineEmits<{
  openProfileModal: []
  closeProfileModal: []
  updateProfile: []
  openPasswordModal: []
  closePasswordModal: []
  updateSystemSettings: [payload: { current_term_start_date: string }]
  changePassword: []
}>()

const termModalOpen = ref(false)
const termSaving = ref(false)
const termFormError = ref('')
const editingTermId = ref<number | null>(null)
const localTerms = ref<MetaTermItem[]>([])
const termForm = reactive({
  startYear: new Date().getFullYear(),
  termNo: 1,
  termStartDate: '',
})

const termColumns = [
  { key: 'name', label: '学期', colClass: 'col-pct-30' },
  { key: 'term_start_date', label: '开学时间（周一）', colClass: 'col-pct-30' },
] as const

const isEditingTerm = computed(() => editingTermId.value !== null)
const termPreviewName = computed(() => `${termForm.startYear}-${termForm.startYear + 1}-${termForm.termNo}`)

watch(
  () => props.courseTerms,
  (terms) => {
    localTerms.value = sortTermsForSelect(terms)
  },
  { immediate: true },
)

function parseTermName(name: string) {
  const matched = name.match(/^(\d{4})-(\d{4})-(1|2)$/)
  if (!matched) {
    return null
  }
  return {
    startYear: Number(matched[1]),
    termNo: Number(matched[3]),
  }
}

function resetTermForm() {
  const parsed = parseTermName(getCurrentAcademicTerm())
  termForm.startYear = parsed?.startYear ?? new Date().getFullYear()
  termForm.termNo = parsed?.termNo ?? 1
  termForm.termStartDate = ''
  termFormError.value = ''
  editingTermId.value = null
}

function openCreateTermModal() {
  resetTermForm()
  termModalOpen.value = true
}

function openEditTermModal(item: MetaTermItem) {
  const parsed = parseTermName(item.name)
  termForm.startYear = parsed?.startYear ?? new Date().getFullYear()
  termForm.termNo = parsed?.termNo ?? 1
  termForm.termStartDate = item.term_start_date
  editingTermId.value = item.id
  termModalOpen.value = true
}

function closeTermModal() {
  termModalOpen.value = false
  resetTermForm()
}

function isMondayDate(value: string) {
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!matched) {
    return false
  }
  const year = Number(matched[1])
  const month = Number(matched[2])
  const day = Number(matched[3])
  return new Date(year, month - 1, day).getDay() === 1
}

async function saveTerm() {
  termFormError.value = ''
  if (!isMondayDate(termForm.termStartDate)) {
    termFormError.value = '开学日期必须是周一'
    return
  }
  termSaving.value = true
  try {
    if (isEditingTerm.value && editingTermId.value !== null) {
      const saved = await api.updateMetaTerm(editingTermId.value, {
        term_start_date: termForm.termStartDate,
      })
      localTerms.value = localTerms.value
        .map((item) => (item.id === saved.id ? saved : item))
        .sort((left, right) => right.name.localeCompare(left.name, 'zh-Hans-CN'))
      closeTermModal()
      return
    }

    const created = await api.createMetaTerm({
      name: termPreviewName.value,
      term_start_date: termForm.termStartDate,
    })
    localTerms.value = [created, ...localTerms.value].sort((left, right) => right.name.localeCompare(left.name, 'zh-Hans-CN'))
    closeTermModal()
  } finally {
    termSaving.value = false
  }
}

function asMetaTermItem(row: Record<string, unknown>) {
  return row as unknown as MetaTermItem
}
</script>

<template>
  <section class="workspace-card user-manage-panel admin-settings-panel">
    <div class="settings-two-column">
      <aside class="settings-profile-column">
        <section class="settings-profile-card">
          <div class="section-heading">
            <h2>个人信息</h2>
            <div class="inline-actions">
              <button class="ghost-button" type="button" @click="emit('openProfileModal')">编辑信息</button>
              <button class="ghost-button" type="button" @click="emit('openPasswordModal')">更改密码</button>
            </div>
          </div>
          <div class="account-summary">
            <div class="account-line">
              <span>登录账号</span>
              <strong>{{ me.login_id }}</strong>
            </div>
            <div class="account-line">
              <span>姓名</span>
              <strong>{{ me.real_name }}</strong>
            </div>
            <div class="account-line">
              <span>角色</span>
              <strong>{{ me.role === 1 ? '管理员' : '用户' }}</strong>
            </div>
            <div class="account-line">
              <span>状态</span>
              <strong>{{ me.status === 1 ? '正常' : '冻结' }}</strong>
            </div>
          </div>
        </section>
      </aside>

      <section class="settings-terms-column">
        <section class="settings-terms-card">
          <div class="section-heading">
            <h2>学期设置</h2>
            <div class="inline-actions">
              <button class="primary-button" type="button" @click="openCreateTermModal">创建学期</button>
            </div>
          </div>

          <AdminDataList
            :rows="localTerms as unknown as Array<Record<string, unknown>>"
            :columns="termColumns as unknown as Array<{ key: string; label: string; colClass?: string }>"
            row-key="id"
            empty-text="暂无学期数据"
            :show-actions="true"
            action-col-class="col-pct-20"
            table-class="user-manage-table"
          >
            <template #actions="{ row }">
              <div class="inline-actions user-actions">
                <button class="ghost-button compact-button" type="button" @click="openEditTermModal(asMetaTermItem(row))">编辑学期</button>
              </div>
            </template>
          </AdminDataList>
        </section>
      </section>
    </div>

    <Transition name="modal-float" appear>
      <div v-if="termModalOpen" class="modal-backdrop">
        <article class="modal-card modal-card-narrow">
          <div class="modal-header">
            <h3>{{ isEditingTerm ? '编辑学期' : '创建学期' }}</h3>
            <button class="ghost-button compact-button modal-close" type="button" @click="closeTermModal">关闭</button>
          </div>
          <form class="form-grid single-column-form" @submit.prevent="saveTerm">
            <template v-if="!isEditingTerm">
              <label class="field">
                <span>学年开始年</span>
                <input v-model.number="termForm.startYear" type="number" min="2000" />
              </label>
              <label class="field">
                <span>学期</span>
                <select v-model.number="termForm.termNo">
                  <option :value="1">1</option>
                  <option :value="2">2</option>
                </select>
              </label>
            </template>
            <label class="field">
              <span>学期名称</span>
              <input
                class="term-name-preview-input"
                :value="isEditingTerm ? localTerms.find((item) => item.id === editingTermId)?.name ?? '' : termPreviewName"
                disabled
              />
            </label>
            <label class="field">
              <span>开学时间（周一）</span>
              <input v-model="termForm.termStartDate" type="date" @input="termFormError = ''" />
            </label>
            <p v-if="termFormError" class="hint form-error-text">{{ termFormError }}</p>
            <button class="primary-button" type="submit" :disabled="termSaving">
              <span v-if="termSaving" class="button-spinner" aria-hidden="true"></span>
              <span>{{ termSaving ? '保存中...' : '保存' }}</span>
            </button>
          </form>
        </article>
      </div>
    </Transition>

    <Transition name="modal-float" appear>
      <div v-if="profileModalOpen" class="modal-backdrop">
        <article class="modal-card modal-card-narrow">
          <div class="modal-header">
            <h3>更改信息</h3>
            <button class="ghost-button compact-button modal-close" type="button" @click="emit('closeProfileModal')">关闭</button>
          </div>
          <form class="form-grid single-column-form" @submit.prevent="emit('updateProfile')">
            <label class="field">
              <span>学号</span>
              <input v-model="profileForm.studentId" autocomplete="username" />
            </label>
            <label class="field">
              <span>姓名</span>
              <input v-model="profileForm.realName" />
            </label>
            <button class="primary-button" type="submit" :disabled="profileSaving">
              <span v-if="profileSaving" class="button-spinner" aria-hidden="true"></span>
              <span>{{ profileSaving ? '提交中...' : '保存' }}</span>
            </button>
          </form>
        </article>
      </div>
    </Transition>

    <Transition name="modal-float" appear>
      <div v-if="passwordModalOpen" class="modal-backdrop">
        <article class="modal-card modal-card-narrow">
          <div class="modal-header">
            <h3>更改密码</h3>
            <button class="ghost-button compact-button modal-close" type="button" @click="emit('closePasswordModal')">关闭</button>
          </div>
          <form class="form-grid single-column-form" @submit.prevent="emit('changePassword')">
            <label class="field">
              <span>旧密码</span>
              <input v-model="passwordForm.oldPassword" type="password" autocomplete="current-password" />
            </label>
            <label class="field">
              <span>新密码</span>
              <input v-model="passwordForm.newPassword" type="password" autocomplete="new-password" />
            </label>
            <label class="field">
              <span>确认新密码</span>
              <input v-model="passwordForm.confirmNewPassword" type="password" autocomplete="new-password" />
            </label>
            <button class="primary-button" type="submit" :disabled="changingPassword">
              <span v-if="changingPassword" class="button-spinner" aria-hidden="true"></span>
              <span>{{ changingPassword ? '提交中...' : '更改密码' }}</span>
            </button>
          </form>
        </article>
      </div>
    </Transition>
  </section>
</template>
