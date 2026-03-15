export type AdminStatItem = {
  label: string
  value: number
  tone: string
}

export type AdminStatusName = (status: number) => string
export type AdminStatusClass = (status: number) => Record<string, boolean>
export type AdminSlotLabel = (weekday: number, section: number) => string
export type AdminRoleName = (role?: number) => string
