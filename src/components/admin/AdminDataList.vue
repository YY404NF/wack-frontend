<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useSlots, watch } from 'vue'

type ListColumn = {
  key: string
  label: string
  width?: number
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
  totalItems?: number
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
  actionColWidth?: number
  emptyText?: string
  showSelection?: boolean
  selectedRowKeys?: Array<string | number>
  isRowSelectable?: (row: Record<string, unknown>) => boolean
  showActions?: boolean
  actionsLabel?: string
  pagination?: PaginationConfig | null
  lazyLoad?: LazyLoadConfig | null
  totalItems?: number | null
  allItems?: number | null
  currentItems?: number | null
  selectedItems?: number | null
  activeFilterKeys?: string[]
  hasSearchCondition?: boolean
}>(), {
  emptyText: '暂无数据',
  showSelection: false,
  selectedRowKeys: () => [],
  isRowSelectable: () => true,
  showActions: false,
  actionsLabel: '操作',
  pagination: null,
  lazyLoad: null,
  totalItems: null,
  allItems: null,
  currentItems: null,
  selectedItems: null,
  activeFilterKeys: () => [],
  hasSearchCondition: false,
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
const jumpPageInput = ref('')
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
const activeFilterKeySet = computed(() => new Set(props.activeFilterKeys))
const resolvedSelectedCount = computed(() => props.selectedItems ?? props.selectedRowKeys.length)
const resolvedCurrentCount = computed(() => props.currentItems ?? props.rows.length)
const resolvedSearchCount = computed(() => props.pagination?.totalItems ?? props.totalItems ?? props.rows.length)
const resolvedTotalCount = computed(() => props.allItems ?? resolvedSearchCount.value)
const showSummaryStats = computed(() => props.rows.length > 0)
const shouldShowSearchSummary = computed(() => props.hasSearchCondition)
const COLUMN_UNIT_PX = 11
const DEFAULT_DATA_COL_UNITS = 14
const SELECTION_COL_PX = 44
const totalWidthUnits = computed(() => {
  return Math.max(1, props.columns.reduce((sum, column) => sum + normalizeWidthUnits(column.width, DEFAULT_DATA_COL_UNITS), 0))
})
const pageTokens = computed(() => {
  if (!props.pagination) {
    return []
  }
  const total = props.pagination.totalPages
  const current = props.pagination.page
  const appendEllipsis = (tokens: Array<{ type: 'page' | 'ellipsis'; value: number }>, count: number) => {
    for (let index = 0; index < Math.min(3, Math.max(1, count)); index += 1) {
      tokens.push({ type: 'ellipsis', value: index })
    }
  }
  const pushRange = (tokens: Array<{ type: 'page' | 'ellipsis'; value: number }>, start: number, end: number) => {
    for (let page = start; page <= end; page += 1) {
      tokens.push({ type: 'page', value: page })
    }
  }
  if (total <= 9) {
    return Array.from({ length: total }, (_, index) => ({ type: 'page' as const, value: index + 1 }))
  }
  const tokens: Array<{ type: 'page' | 'ellipsis'; value: number }> = []
  if (current <= 5) {
    pushRange(tokens, 1, 6)
    appendEllipsis(tokens, total - 9)
    pushRange(tokens, total - 2, total)
    return tokens
  }
  if (current >= total - 4) {
    pushRange(tokens, 1, 3)
    appendEllipsis(tokens, total - 9)
    pushRange(tokens, total - 5, total)
    return tokens
  }
  pushRange(tokens, 1, 3)
  appendEllipsis(tokens, current - 5)
  pushRange(tokens, current - 1, current + 1)
  appendEllipsis(tokens, total - current - 4)
  pushRange(tokens, total - 2, total)
  return tokens
})

function normalizeWidthUnits(value: unknown, fallback: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return Math.max(1, Math.round(parsed))
}

function resolveColumnWidthPx(width?: number, fallback = DEFAULT_DATA_COL_UNITS) {
  return normalizeWidthUnits(width, fallback) * COLUMN_UNIT_PX
}

function resolveColumnShare(width?: number, fallback = DEFAULT_DATA_COL_UNITS) {
  return `${(normalizeWidthUnits(width, fallback) / totalWidthUnits.value) * 100}%`
}

function resolveColumnColStyle(width?: number, fallback = DEFAULT_DATA_COL_UNITS) {
  return {
    width: resolveColumnShare(width, fallback),
  }
}

function resolveColumnCellStyle(width?: number, fallback = DEFAULT_DATA_COL_UNITS) {
  return {
    width: resolveColumnShare(width, fallback),
    minWidth: `${resolveColumnWidthPx(width, fallback)}px`,
  }
}

const resolvedTableMinWidth = computed(() => {
  let width = props.showSelection ? SELECTION_COL_PX : 0
  for (const column of props.columns) {
    width += resolveColumnWidthPx(column.width, DEFAULT_DATA_COL_UNITS)
  }
  return width
})

const rootStyle = computed(() => ({
  '--admin-list-col-unit': `${COLUMN_UNIT_PX}px`,
  '--admin-data-list-min-width': `${resolvedTableMinWidth.value}px`,
}))

watch(
  () => props.pagination?.page,
  (page) => {
    jumpPageInput.value = page ? String(page) : ''
  },
  { immediate: true },
)

function resolveRowKey(row: Record<string, unknown>) {
  return typeof props.rowKey === 'function' ? props.rowKey(row) : (row[props.rowKey] as string | number)
}

function isFilterCellActive(columnKey: string) {
  return activeFilterKeySet.value.has(columnKey)
}

function onPageSizeChange(event: Event) {
  emit('updatePageSize', Number((event.target as HTMLSelectElement).value))
}

function commitJumpPage() {
  if (!props.pagination) {
    return
  }
  const parsed = Number(jumpPageInput.value.trim())
  if (!Number.isFinite(parsed)) {
    jumpPageInput.value = String(props.pagination.page)
    return
  }
  const nextPage = Math.min(props.pagination.totalPages, Math.max(1, Math.trunc(parsed)))
  jumpPageInput.value = String(nextPage)
  if (nextPage !== props.pagination.page) {
    emit('updatePage', nextPage)
  }
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

function cellTitleText(column: ListColumn, row: Record<string, unknown>) {
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

function handleRootKeydown(event: KeyboardEvent) {
  if (!props.pagination) {
    return
  }
  const target = event.target
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
    return
  }
  if (event.key === 'ArrowLeft' && props.pagination.page > 1) {
    event.preventDefault()
    emit('updatePage', props.pagination.page - 1)
  }
  if (event.key === 'ArrowRight' && props.pagination.page < props.pagination.totalPages) {
    event.preventDefault()
    emit('updatePage', props.pagination.page + 1)
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
  <div
    class="admin-data-list"
    :class="{ 'admin-data-list-with-pagination': !!pagination, 'admin-data-list-empty': rows.length === 0 }"
    :style="rootStyle"
    tabindex="0"
    @keydown="handleRootKeydown"
  >
    <Teleport to="body">
      <div v-if="copyToast" class="toast-banner admin-data-list-copy-toast">{{ copyToast }}</div>
    </Teleport>
    <div :class="['table-wrap', wrapperClass]" @scroll="handleTableScroll">
      <table :class="['data-table', tableClass]">
        <colgroup>
          <col v-if="showSelection" class="selection-column" />
          <col v-for="column in columns" :key="column.key" :style="resolveColumnColStyle(column.width, DEFAULT_DATA_COL_UNITS)" />
          <col v-if="showActions" class="actions-column-col" />
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
              :style="resolveColumnCellStyle(column.width, DEFAULT_DATA_COL_UNITS)"
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
              :class="[
                slots[`filter-${column.key}`] ? 'table-filter-cell' : 'table-filter-spacer',
                slots[`filter-${column.key}`] && isFilterCellActive(column.key) ? 'table-filter-cell-active' : '',
              ]"
              :style="resolveColumnCellStyle(column.width, DEFAULT_DATA_COL_UNITS)"
              :aria-hidden="slots[`filter-${column.key}`] ? undefined : 'true'"
            >
              <slot
                v-if="slots[`filter-${column.key}`]"
                :name="`filter-${column.key}`"
              />
            </th>
            <th
              v-if="showActions"
              :class="slots['filter-actions'] ? 'table-filter-cell table-filter-actions-cell' : 'table-filter-spacer table-filter-actions-cell'"
              :aria-hidden="slots['filter-actions'] ? undefined : 'true'"
            >
              <div v-if="slots['filter-actions']" class="table-filter-actions">
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
            :style="resolveColumnCellStyle(column.width, DEFAULT_DATA_COL_UNITS)"
            :title="cellTitleText(column, row)"
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
                :title="cellTitleText(column, row)"
                @click.stop="copyText(cellCopyText(column, row))"
              >
                {{ row[column.key] }}
              </button>
              <div v-else class="data-list-copy-cell" :title="cellTitleText(column, row)">{{ row[column.key] }}</div>
            </slot>
          </td>
            <td v-if="showActions" class="actions-column">
              <slot v-if="row" name="actions" :row="row" />
            </td>
          </tr>
          <tr v-if="rows.length === 0">
            <td :colspan="totalColumnCount" class="empty-cell">
              <slot name="empty">{{ emptyText }}</slot>
            </td>
          </tr>
          <tr v-else-if="lazyLoad && (lazyLoad.loading || !lazyLoad.hasMore)">
            <td :colspan="totalColumnCount" class="empty-cell">
              {{ lazyLoad.loading ? '加载中...' : '已加载全部内容' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="data-list-summary-bar">
      <div class="data-list-summary-left">
        <span v-if="resolvedSelectedCount > 0" class="hint">已选中 {{ resolvedSelectedCount }} 项</span>
      </div>
      <div v-if="showSummaryStats" class="data-list-summary-right hint">
        本页 {{ resolvedCurrentCount }} 项
        <span v-if="shouldShowSearchSummary" class="data-list-summary-separator" aria-hidden="true">&nbsp;&nbsp;&nbsp;</span>
        <span v-if="shouldShowSearchSummary">搜索结果 {{ resolvedSearchCount }} 项</span>
        <span class="data-list-summary-separator" aria-hidden="true">&nbsp;&nbsp;&nbsp;</span>
        总计 {{ resolvedTotalCount }} 项
      </div>
    </div>

    <div v-if="pagination" class="pagination-bar">
      <div class="pagination-pages">
        <template v-for="(token, index) in pageTokens" :key="`${token.type}-${token.value}-${index}`">
          <button
            v-if="token.type === 'page'"
            class="ghost-button compact-button pagination-button"
            :class="{ selected: pagination.page === token.value }"
            type="button"
            @click="emit('updatePage', token.value)"
          >
            {{ token.value }}
          </button>
          <span v-else class="pagination-ellipsis" aria-hidden="true">·</span>
        </template>
      </div>
      <div class="pagination-controls">
        <label class="pagination-jump">
          <span>跳转到</span>
          <input
            v-model="jumpPageInput"
            inputmode="numeric"
            @blur="commitJumpPage"
            @keydown.enter.prevent="commitJumpPage"
          />
          <span>页</span>
        </label>
        <label class="pagination-size">
          <span>每页</span>
          <select :value="pagination.pageSize" @change="onPageSizeChange">
            <option v-for="size in pagination.pageOptions" :key="size" :value="size">{{ size }}</option>
          </select>
        </label>
        <div v-if="slots['footer-trailing']" class="pagination-trailing">
          <slot name="footer-trailing" />
        </div>
      </div>
    </div>

  </div>
</template>
