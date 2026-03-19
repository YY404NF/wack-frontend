import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'

import type { SessionUser } from '../api/types'

const TOKEN_KEY = 'wack-token'
const USER_KEY = 'wack-session-user'

export const useSessionStore = defineStore('session', () => {
  const token = useStorage<string>(TOKEN_KEY, '')
  const me = useStorage<SessionUser | null>(USER_KEY, null)

  const isAuthenticated = computed(() => token.value.trim().length > 0)

  function setToken(value: string) {
    token.value = value
  }

  function setUser(value: SessionUser | null) {
    me.value = value
  }

  function setSession(input: { token: string; user: SessionUser }) {
    token.value = input.token
    me.value = input.user
  }

  function clearSession() {
    token.value = ''
    me.value = null
  }

  return {
    token,
    me,
    isAuthenticated,
    setToken,
    setUser,
    setSession,
    clearSession,
  }
})
