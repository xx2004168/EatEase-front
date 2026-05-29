const NO_AUTH_URLS = [
  '/auth/login',
  '/auth/register',
  '/file/upload',
]

const TOKEN_KEY = 'eatease_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

function shouldSkipAuth(url: string): boolean {
  return NO_AUTH_URLS.some((path) => url.includes(path))
}

export async function request(url: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  }

  if (!shouldSkipAuth(url)) {
    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  return response
}

export async function uploadRequest(url: string, formData: FormData) {
  const headers: Record<string, string> = {}

  if (!shouldSkipAuth(url)) {
    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  })

  return response
}
