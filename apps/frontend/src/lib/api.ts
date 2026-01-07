import type { ApiErrorShape, CreateFlagRequest, FeatureFlag, GetFlagsResponse, UpdateFlagRequest } from './types'

// Use || (not ??) so an empty string doesn't accidentally become the API base.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export class ApiError extends Error {
  code: string
  details?: ApiErrorShape['error']['details']

  constructor(code: string, message: string, details?: ApiErrorShape['error']['details']) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let body: unknown
  try {
    body = await res.json()
  } catch {
    // ignore
  }

  const shape = body as Partial<ApiErrorShape>
  const code = shape?.error?.code ?? `HTTP_${res.status}`
  const message = shape?.error?.message ?? res.statusText
  const details = shape?.error?.details
  return new ApiError(code, message, details)
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const hasBody = init?.body !== undefined && init?.body !== null

  // Normalize headers so we can safely remove Content-Type for body-less requests.
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')
  if (hasBody) {
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  } else {
    headers.delete('Content-Type')
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  })

  if (!res.ok) throw await parseError(res)
  if (res.status === 204) return null as T
  return (await res.json()) as T
}

export type FlagsQuery = {
  environment?: string
  search?: string
  enabled?: boolean
}

export function getFlags(params: FlagsQuery): Promise<GetFlagsResponse> {
  const qs = new URLSearchParams()
  if (params.environment && params.environment !== 'all') qs.set('environment', params.environment)
  if (params.search) qs.set('search', params.search)
  if (params.enabled !== undefined) qs.set('enabled', String(params.enabled))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return apiFetch<GetFlagsResponse>(`/flags${suffix}`)
}

export function createFlag(body: CreateFlagRequest): Promise<{ data: FeatureFlag }> {
  return apiFetch<{ data: FeatureFlag }>(`/flags`, { method: 'POST', body: JSON.stringify(body) })
}

export function toggleFlag(id: string): Promise<{ data: FeatureFlag; previousState: boolean }> {
  return apiFetch<{ data: FeatureFlag; previousState: boolean }>(`/flags/${id}/toggle`, { method: 'POST' })
}

export function updateFlag(id: string, body: UpdateFlagRequest): Promise<{ data: FeatureFlag }> {
  return apiFetch<{ data: FeatureFlag }>(`/flags/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
}

export function deleteFlag(id: string): Promise<null> {
  return apiFetch<null>(`/flags/${id}`, { method: 'DELETE' })
}


