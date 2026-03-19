<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useSlots } from 'vue'

type ListColumn = {
  key: string
  label: string
  colClass?: string
  headerClass?: string
  cellClass?: string
  copyable?: boolean
  copyValue?: (row: Record<string, unknown>) => string
}

type PaginationConfig = {
  page: number
  pageSize: number
  totalPages: number
  pageOptions: number[]
}

type LazyLoadConfig = {
  hasMore: boolean
  loading?: boolean
  buttonText?: string
}

const props = withDefaults(defineProps<{
  rows: Array<Record<string, unknown>>
  columns: ListColumn[]
  rowKey: string | ((row: Record<string, unknown>) => string | number)
  wrapperClass?: string
  tableClass?: string
  actionColClass?: string
  emptyText?: string
  showSelection?: boolean
  selectedRowKeys?: Array<string | number>
  isRowSelectable?: (row: Record<string, unknown>) => boolean
  showActions?: boolean
  actionsLabel?: string
  pagination?: PaginationConfig | null
  lazyLoad?: LazyLoadConfig | null
}>(), {
  emptyText: '暂无数据',
  showSelection: false,
  selectedRowKeys: () => [],
  isRowSelectable: () => true,
  showActions: false,
  actionsLabel: '操作',
  pagination: null,
  lazyLoad: null,
})

const emit = defineEmits<{
  updatePage: [page: number]
  updatePageSize: [size: number]
  toggleRowSelection: [key: string | number]
  togglePageSelection: []
  loadMore: []
}>()

const slots = useSlots()
const copyToast = ref('')
const loadingMore = ref(false)
let copyToastTimer: number | null = null
let lazyLoadTimer: number | null = null

const selectedKeySet = computed(() => new Set(props.selectedRowKeys))
const visibleSelectableRows = computed(() => props.rows.filter((row) => props.isRowSelectable(row)))
const areAllRowsSelected = computed(
  () =>
    props.showSelection &&
    visibleSelectableRows.value.length > 0 &&
    visibleSelectableRows.value.every((row) => selectedKeySet.value.has(resolveRowKey(row))),
)

const totalColumnCount = computed(() => {
  let count = props.columns.length
  if (props.showSelection) {
    count += 1
  }
  if (props.showActions) {
    count += 1
  }
  return count
})

const hasFilterRow = computed(() =>
  props.columns.some((column) => !!slots[`filter-${column.key}`]) || !!slots['filter-actions'],
)

function resolveRowKey(row: Record<string, unknown>) {
  return typeof props.rowKey === 'function' ? props.rowKey(row) : (row[props.rowKey] as string | number)
}

function onPageSizeChange(event: Event) {
  emit('updatePageSize', Number((event.target as HTMLSelectElement).value))
}

function normalizeCopyValue(value: unknown) {
  if (value === null || value === undefined) {
    return ''
  }
  if (Array.isArray(value)) {
    return value.join('、')
  }
  return String(value)
}

async function copyText(text: string) {
  const value = text.trim()
  if (!value) {
    return
  }

  const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined
  if (clipboard?.writeText) {
    await clipboard.writeText(value)
  } else if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.setAttribute('readonly', 'true')
    textarea.style.position = 'fixed'
    textarea.style.top = '-9999px'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  } else {
    return
  }

  copyToast.value = '已复制'
  if (copyToastTimer !== null) {
    window.clearTimeout(copyToastTimer)
  }
  copyToastTimer = window.setTimeout(() => {
    copyToast.value = ''
    copyToastTimer = null
  }, 1400)
}

function cellCopyText(column: ListColumn, row: Record<string, unknown>) {
  if (column.copyable === false) {
    return ''
  }
  if (column.copyValue) {
    return column.copyValue(row)
  }
  return normalizeCopyValue(row[column.key])
}

function requestLazyLoad() {
  if (!props.lazyLoad?.hasMore || props.lazyLoad.loading || loadingMore.value) {
    return
  }
  loadingMore.value = true
  emit('loadMore')
  if (lazyLoadTimer !== null) {
    window.clearTimeout(lazyLoadTimer)
  }
  lazyLoadTimer = window.setTimeout(() => {
    loadingMore.value = false
    lazyLoadTimer = null
  }, 240)
}

function handleTableScroll(event: Event) {
  if (!props.lazyLoad || props.pagination) {
    return
  }
  const target = event.currentTarget
  if (!(target instanceof HTMLElement)) {
    return
  }
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 32) {
    requestLazyLoad()
  }
}

onBeforeUnmount(() => {
  if (copyToastTimer !== null) {
    window.clearTimeout(copyToastTimer)
  }
  if (lazyLoadTimer !== null) {
    window.clearTimeout(lazyLoadTimer)
  }
})
</script>

<template>
  <div class="admin-data-list">
    <Teleport to="body">
      <div v-if="copyToast" class="toast-banner admin-data-list-copy-toast">{{ copyToast }}</div>
    </Teleport>
    <div :class="['table-wrap', wrapperClass]" @scroll="handleTableScroll">
      <table :class="['data-table', tableClass]">
        <colgroup>
          <col v-if="showSelection" class="selection-column" />
          <col v-for="column in columns" :key="column.key" :class="column.colClass" />
          <col v-if="showActions" :class="actionColClass" />
        </colgroup>
        <thead>
          <tr>
            <th v-if="showSelection" class="selection-column">
              <span class="visually-hidden">选择</span>
            </th>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="column.headerClass"
            >
              {{ column.label }}
            </th>
            <th v-if="showActions" class="actions-column">{{ actionsLabel }}</th>
          </tr>
          <tr
            v-if="hasFilterRow"
            class="table-filter-row"
          >
            <th v-if="showSelection" class="table-filter-spacer" aria-hidden="true"></th>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="slots[`filter-${column.key}`] ? 'table-filter-cell' : 'table-filter-spacer'"
              :aria-hidden="slots[`filter-${column.key}`] ? undefined : 'true'"
            >
              <slot
                v-if="slots[`filter-${column.key}`]"
                :name="`filter-${column.key}`"
              />
            </th>
            <th
              v-if="showActions && slots['filter-actions']"
              class="table-filter-cell table-filter-actions-cell"
            >
              <div class="table-filter-actions">
                <slot
                  name="filter-actions"
                  :are-all-rows-selected="areAllRowsSelected"
                />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="resolveRowKey(row)">
            <td v-if="showSelection" class="selection-column">
              <input
                type="checkbox"
                :checked="selectedKeySet.has(resolveRowKey(row))"
                :disabled="!isRowSelectable(row)"
                :aria-label="`选择 ${String(resolveRowKey(row))}`"
                @change="emit('toggleRowSelection', resolveRowKey(row))"
              />
            </td>
          <td
            v-for="column in columns"
            :key="column.key"
            :class="column.cellClass"
          >
            <slot
              :name="`cell-${column.key}`"
              :row="row"
              :value="row[column.key]"
              :copy-text="copyText"
            >
              <button
                v-if="cellCopyText(column, row)"
                class="copyable-inline-button data-list-copy-cell"
                type="button"
                @click.stop="copyText(cellCopyText(column, row))"
              >
                {{ row[column.key] }}
              </button>
              <div v-else class="data-list-copy-cell">{{ row[column.key] }}</div>
            </slot>
          </td>
            <td v-if="showActions" class="actions-column">
              <slot name="actions" :row="row" />
            </td>
          </tr>
          <tr v-if="rows.length === 0">
            <td :colspan="totalColumnCount" class="empty-cell">
              <slot name="empty">{{ emptyText }}</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="pagination" class="pagination-bar">
      <div class="pagination-pages">
        <button
          v-for="page in pagination.totalPages"
          :key="page"
          class="ghost-button compact-button pagination-button"
          :class="{ selected: pagination.page === page }"
          type="button"
          @click="emit('updatePage', page)"
        >
          {{ page }}
        </button>
      </div>
      <div class="pagination-size">
        <select :value="pagination.pageSize" @change="onPageSizeChange">
          <option v-for="size in pagination.pageOptions" :key="size" :value="size">{{ size }}</option>
        </select>
      </div>
    </div>

    <div v-else-if="lazyLoad" class="pagination-bar pagination-bar-lazy">
      <div class="hint">
        {{
          lazyLoad.loading
            ? '加载中...'
            : lazyLoad.hasMore
              ? lazyLoad.buttonText ?? '滚动到底部继续加载'
              : '已加载全部内容'
        }}
      </div>
    </div>
  </div>
</template>
