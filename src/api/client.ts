import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponseHeaders } from 'axios'

import type { ApiResponse } from './types'

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'
const TOKEN_KEY = 'wack-token'
const REQUEST_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 10000)

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) ?? ''
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: REQUEST_TIMEOUT,
})

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  const headers = config.headers ?? {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  config.headers = headers
  return config
})

function parseJsonBody(body: BodyInit | null | undefined, headers?: AxiosResponseHeaders | Record<string, unknown>) {
  if (typeof body !== 'string') {
    return body
  }
  const rawContentType = headers && 'Content-Type' in headers ? headers['Content-Type'] : headers && 'content-type' in headers ? headers['content-type'] : ''
  const contentType = typeof rawContentType === 'string' ? rawContentType : ''
  if (!contentType.includes('application/json')) {
    return body
  }
  try {
    return JSON.parse(body)
  } catch {
    return body
  }
}

function buildConfig(init?: RequestInit): AxiosRequestConfig {
  const headers = Object.fromEntries(new Headers(init?.headers ?? {}).entries())
  return {
    method: init?.method,
    headers,
    data: parseJsonBody(init?.body, headers),
  }
}

export async function request<T>(path: string, init?: RequestInit) {
  try {
    const response = await apiClient.request<ApiResponse<T>>({
      url: path,
      ...buildConfig(init),
    })
    const payload = response.data
    if (payload.code !== 0) {
      throw new Error(payload.message || '请求失败')
    }
    return payload.data
  } catch (error) {
    if (error instanceof AxiosError) {
      const message =
        error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data && typeof error.response.data.message === 'string'
          ? error.response.data.message
          : error.message || '请求失败'
      throw new Error(message)
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error('请求失败')
  }
}
