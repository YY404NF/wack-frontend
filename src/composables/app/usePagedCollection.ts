import { computed, ref, watch, type Ref } from 'vue'

type UsePagedCollectionOptions<T> = {
  source: Ref<T[]>
  predicate: (item: T) => boolean
  resetDeps: () => readonly unknown[]
  initialPageSize?: number
}

export function usePagedCollection<T>({
  source,
  predicate,
  resetDeps,
  initialPageSize = 10,
}: UsePagedCollectionOptions<T>) {
  const page = ref(1)
  const pageSize = ref(initialPageSize)

  const filteredItems = computed(() => source.value.filter(predicate))
  const totalPages = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / pageSize.value)))
  const paginatedItems = computed(() => {
    const start = (page.value - 1) * pageSize.value
    return filteredItems.value.slice(start, start + pageSize.value)
  })

  watch(resetDeps, () => {
    page.value = 1
  })

  watch(totalPages, (total) => {
    if (page.value > total) {
      page.value = total
    }
  })

  function setPage(nextPage: number) {
    page.value = nextPage
  }

  function setPageSize(nextPageSize: number) {
    pageSize.value = nextPageSize
    page.value = 1
  }

  return {
    filteredItems,
    page,
    pageSize,
    paginatedItems,
    setPage,
    setPageSize,
    totalPages,
  }
}
