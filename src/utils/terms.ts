type TermLike = {
  name: string
  term_start_date?: string
}

export function parseAcademicTermName(name: string) {
  const matched = name.match(/^(\d{4})-(\d{4})-(1|2)$/)
  if (!matched) {
    return null
  }

  return {
    startYear: Number(matched[1]),
    endYear: Number(matched[2]),
    termNo: Number(matched[3]),
  }
}

function termStartTime(term: TermLike) {
  if (!term.term_start_date) {
    return Number.NEGATIVE_INFINITY
  }
  const parsed = new Date(`${term.term_start_date}T00:00:00`).getTime()
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed
}

export function sortTermsForSelect<T extends TermLike>(terms: T[]) {
  return [...terms].sort((left, right) => {
    const startDiff = termStartTime(right) - termStartTime(left)
    if (startDiff !== 0) {
      return startDiff
    }
    return right.name.localeCompare(left.name, 'zh-Hans-CN')
  })
}

export function selectDefaultTermName<T extends TermLike>(terms: T[], now = new Date()) {
  const sorted = sortTermsForSelect(terms)
  if (sorted.length === 0) {
    return ''
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const started = sorted.find((item) => {
    const start = termStartTime(item)
    return start !== Number.NEGATIVE_INFINITY && start <= today
  })
  return started?.name ?? sorted[0].name
}

export function selectDefaultTermId<T extends TermLike & { id: number }>(terms: T[], now = new Date()) {
  const name = selectDefaultTermName(terms, now)
  return terms.find((item) => item.name === name)?.id ?? null
}
