import type { ApiResponse } from './types'

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'
const TOKEN_KEY = 'wack-token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) ?? ''
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function request<T>(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers ?? {})
  const token = getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (!(init?.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  })

  const payload = (await response.json()) as ApiResponse<T>
  if (!response.ok || payload.code !== 0) {
    throw new Error(payload.message || `request failed: ${response.status}`)
  }
  return payload.data
}
