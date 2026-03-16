import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'

type UseSelectionOptions<TItem, TId> = {
  allItems: Ref<TItem[]>
  pageItems: ComputedRef<TItem[]>
  getId: (item: TItem) => TId
  canSelect?: (item: TItem) => boolean
}

export function useSelection<TItem, TId>({
  allItems,
  pageItems,
  getId,
  canSelect = () => true,
}: UseSelectionOptions<TItem, TId>) {
  const selectedIds: Ref<TId[]> = ref([])

  const validSelectedIds = computed(() => {
    const ids = new Set<TId>()
    for (const item of allItems.value) {
      if (canSelect(item)) {
        ids.add(getId(item))
      }
    }
    return ids
  })

  const pageSelectableIds = computed(() =>
    pageItems.value.filter((item) => canSelect(item)).map((item) => getId(item)),
  )

  watch(validSelectedIds, (ids) => {
    selectedIds.value = selectedIds.value.filter((id) => ids.has(id))
  })

  function clearSelection() {
    selectedIds.value = []
  }

  function toggleSelection(id: TId) {
    if (!validSelectedIds.value.has(id)) {
      return
    }
    const next = new Set(selectedIds.value)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    selectedIds.value = Array.from(next)
  }

  function togglePageSelection() {
    const ids = pageSelectableIds.value
    if (ids.length === 0) {
      return
    }
    const next = new Set(selectedIds.value)
    const isAllSelected = ids.every((id) => next.has(id))
    for (const id of ids) {
      if (isAllSelected) {
        next.delete(id)
      } else {
        next.add(id)
      }
    }
    selectedIds.value = Array.from(next)
  }

  return {
    clearSelection,
    pageSelectableIds,
    selectedCount: computed(() => selectedIds.value.length),
    selectedIds,
    togglePageSelection,
    toggleSelection,
  }
}
