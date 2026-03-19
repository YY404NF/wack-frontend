import { request } from './client'
import { apiPaths } from './paths'
import type { MetaSectionsData, MetaTermItem } from './types'

export const metaApi = {
  listMetaTerms() {
    return request<{ list: MetaTermItem[] | null }>(apiPaths.shared.metaTerms).then((payload) => payload.list ?? [])
  },
  getMetaSections() {
    return request<MetaSectionsData>(apiPaths.shared.metaSections)
  },
}
