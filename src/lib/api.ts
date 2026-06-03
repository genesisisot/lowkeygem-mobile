// Central HTTP client for the Python FastAPI backend.
// Replaces direct Supabase data access. Handles JWT storage + auto-refresh.

// Resolve the API base:
//  - explicit VITE_API_URL wins (any value, including "" for same-origin)
//  - production build with none set → same origin (frontend + API on one Vercel domain)
//  - dev → local backend
const API_URL =
  import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:8000')

const ACCESS_KEY = 'lk_access_token'
const REFRESH_KEY = 'lk_refresh_token'

// ---- token storage ----
export const tokens = {
  get access() {
    return localStorage.getItem(ACCESS_KEY)
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY)
  },
  set({ access, refresh }: { access?: string; refresh?: string }) {
    if (access) localStorage.setItem(ACCESS_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

// ---- simple auth event bus so useAuth can react to login/logout/refresh ----
type AuthListener = () => void
const invalidatedListeners = new Set<AuthListener>()
const changedListeners = new Set<AuthListener>()

export function onAuthInvalidated(fn: AuthListener) {
  invalidatedListeners.add(fn)
  return () => invalidatedListeners.delete(fn)
}
function notifyAuthInvalidated() {
  invalidatedListeners.forEach((fn) => fn())
}

/** Fired when the user logs in/out so hooks can re-load the session. */
export function onAuthChanged(fn: AuthListener) {
  changedListeners.add(fn)
  return () => changedListeners.delete(fn)
}
export function notifyAuthChanged() {
  changedListeners.forEach((fn) => fn())
}

export const API_BASE = API_URL

async function tryRefresh(): Promise<boolean> {
  const refresh = tokens.refresh
  if (!refresh) return false
  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  })
  if (!res.ok) return false
  const data = await res.json()
  tokens.set({ access: data.access_token })
  return true
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  /** Skip auth header (used by login/signup/refresh). */
  noAuth?: boolean
  /** When body is FormData, don't JSON-encode or set Content-Type. */
  isForm?: boolean
}

/** Low-level request that THROWS on error. Prefer the `api` helpers below. */
export async function rawRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, noAuth, isForm, headers, ...rest } = opts

  const buildHeaders = (): HeadersInit => {
    const h: Record<string, string> = { ...(headers as Record<string, string>) }
    if (!isForm) h['Content-Type'] = 'application/json'
    const access = tokens.access
    if (!noAuth && access) h['Authorization'] = `Bearer ${access}`
    return h
  }

  const doFetch = () =>
    fetch(`${API_URL}${path}`, {
      ...rest,
      headers: buildHeaders(),
      body: isForm ? (body as BodyInit) : body !== undefined ? JSON.stringify(body) : undefined,
    })

  let res: Response
  try {
    res = await doFetch()
  } catch {
    // Network-level failure (server down, DNS, CORS, offline) — fetch rejects
    // with a TypeError. Surface a readable message instead of a raw crash.
    throw new Error("Can't reach the server. Check your connection and that the backend is running, then try again.")
  }

  // One transparent refresh-and-retry on 401.
  if (res.status === 401 && !noAuth && tokens.refresh) {
    const ok = await tryRefresh()
    if (ok) {
      res = await doFetch()
    } else {
      tokens.clear()
      notifyAuthInvalidated()
    }
  }

  if (res.status === 204) return undefined as T
  const text = await res.text()
  // Parse defensively: the backend may return an empty body or a non-JSON
  // error page (HTML/plain text). Never let JSON.parse throw "Unexpected token".
  let json: any = undefined
  if (text) {
    try {
      json = JSON.parse(text)
    } catch {
      json = undefined
    }
  }
  if (!res.ok) {
    const message =
      (json && (json.detail || json.message)) ||
      (text && !json ? `Server error (${res.status}). Please try again.` : `Request failed (${res.status})`)
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message))
  }
  // OK response that wasn't valid JSON (and wasn't empty) — treat as a soft success
  // when no body is expected; otherwise the caller gets undefined rather than a crash.
  return json as T
}

// ---- {data, error}-shaped helpers (match the old Supabase service contract) ----
export type Result<T> = { data: T | null; error: Error | null }

async function wrap<T>(p: Promise<T>): Promise<Result<T>> {
  try {
    return { data: await p, error: null }
  } catch (e) {
    return { data: null, error: e as Error }
  }
}

export const api = {
  raw: rawRequest,
  get: <T>(path: string) => wrap<T>(rawRequest<T>(path)),
  post: <T>(path: string, body?: unknown) => wrap<T>(rawRequest<T>(path, { method: 'POST', body })),
  patch: <T>(path: string, body?: unknown) =>
    wrap<T>(rawRequest<T>(path, { method: 'PATCH', body })),
  put: <T>(path: string, body?: unknown) => wrap<T>(rawRequest<T>(path, { method: 'PUT', body })),
  del: <T>(path: string) => wrap<T>(rawRequest<T>(path, { method: 'DELETE' })),

  /** Multipart upload to POST /api/storage/{bucket}. Returns {path, url}. */
  async upload(bucket: string, file: File, path?: string): Promise<{ path: string; url: string }> {
    const form = new FormData()
    form.append('file', file)
    if (path) form.append('path', path)
    return rawRequest(`/api/storage/${bucket}`, { method: 'POST', body: form, isForm: true })
  },
}

/** Build a query string from a record, skipping null/undefined. */
export function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
  if (!entries.length) return ''
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
}
