import { request } from './client'
import { apiPaths } from './paths'
import type { MetaSectionsData, MetaTermItem } from './types'

export const metaApi = {
  listMetaTerms() {
    return request<{ list: MetaTermItem[] | null }>(apiPaths.shared.metaTerms).then((payload) => payload.list ?? [])
  },
  createMetaTerm(input: { name: string; term_start_date: string }) {
    return request<MetaTermItem>(apiPaths.admin.terms, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
  updateMetaTerm(termId: number, input: { term_start_date: string }) {
    return request<MetaTermItem>(`${apiPaths.admin.terms}/${termId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },
  getMetaSections() {
    return request<MetaSectionsData>(apiPaths.shared.metaSections)
  },
}
