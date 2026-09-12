const BASE_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? 'http://localhost:8000'

export interface AuthResponse {
  accessToken: string
  userId: string
  fullName: string
}

export async function register(
  email: string,
  password: string,
  fullName: string
) {
  const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      fullName,
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.message ?? 'Registration failed')
  }

  localStorage.setItem('access_token', data.accessToken)
  localStorage.setItem('user_id', data.userId)
  localStorage.setItem('full_name', data.fullName)

  return data as AuthResponse
}

export async function login(
  email: string,
  password: string
) {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.message ?? 'Login failed')
  }

  localStorage.setItem('access_token', data.accessToken)
  localStorage.setItem('user_id', data.userId)
  localStorage.setItem('full_name', data.fullName)

  return data as AuthResponse
}

export function logout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user_id')
  localStorage.removeItem('full_name')
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

export function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('user_id')
}