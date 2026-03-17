export type GreetingTone = 'morning' | 'noon' | 'afternoon' | 'evening'

export function getGreetingMeta(now = new Date()): { tone: GreetingTone; label: string; emoji: string } {
  const hour = now.getHours()
  if (hour < 11) {
    return { tone: 'morning', label: '上午好', emoji: '🌤' }
  }
  if (hour < 14) {
    return { tone: 'noon', label: '中午好', emoji: '🌞' }
  }
  if (hour < 19) {
    return { tone: 'afternoon', label: '下午好', emoji: '🌇' }
  }
  return { tone: 'evening', label: '晚上好', emoji: '🌙' }
}
