const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ??
  'http://localhost:3000'

export class ApiError extends Error {
  readonly status: number
  readonly details?: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

/**
 * Provedor de token — função injetada pelo AuthContext para que o cliente
 * permaneça desacoplado do mecanismo de persistência (localStorage,
 * sessionStorage, cookie etc.).
 */
type TokenProvider = () => string | null
let getToken: TokenProvider = () => null
let onUnauthorized: (() => void) | null = null

export function configureHttp(opts: {
  tokenProvider?: TokenProvider
  onUnauthorized?: () => void
}) {
  if (opts.tokenProvider) getToken = opts.tokenProvider
  if (opts.onUnauthorized !== undefined) onUnauthorized = opts.onUnauthorized
}

interface RequestOptions {
  /** Body JSON-serializável. Quando ausente, nenhum body é enviado. */
  body?: unknown
  /** Quando `true`, não anexa Authorization (rota pública). */
  skipAuth?: boolean
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  // FormData precisa que o browser defina o Content-Type (com boundary).
  // Outros bodies vão como JSON.
  const isFormData =
    typeof FormData !== 'undefined' && opts.body instanceof FormData

  if (opts.body !== undefined && !isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  if (!opts.skipAuth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body:
        opts.body === undefined
          ? undefined
          : isFormData
            ? (opts.body as FormData)
            : JSON.stringify(opts.body),
    })
  } catch (err) {
    throw new ApiError(0, 'Falha de conexão com o servidor. Verifique sua rede.', err)
  }

  if (response.status === 401 && !opts.skipAuth) {
    onUnauthorized?.()
  }

  // Sem corpo (204) — retorna `undefined as T`
  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''
  const payload: unknown = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null)

  if (!response.ok) {
    throw new ApiError(response.status, extractErrorMessage(payload, response.status), payload)
  }

  return payload as T
}

function extractErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const msg = (payload as { message: unknown }).message
    if (Array.isArray(msg)) return msg.join('; ')
    if (typeof msg === 'string') return msg
  }
  if (typeof payload === 'string' && payload) return payload
  return `Erro ${status}`
}

export const http = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('POST', path, { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('PATCH', path, { ...opts, body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('PUT', path, { ...opts, body }),
  delete: <T>(path: string, opts?: RequestOptions) =>
    request<T>('DELETE', path, opts),
}
