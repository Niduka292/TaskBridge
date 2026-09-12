// ─────────────────────────────────────────────
//  Token storage
//  Stores the Spring Boot JWT in localStorage.
//  All auth state reads come through here.
// ─────────────────────────────────────────────

const KEY = 'tb_token'

export function saveToken(token: string) {
  localStorage.setItem(KEY, token)
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(KEY)
}

export function removeToken() {
  localStorage.removeItem(KEY)
}

/**
 * Decode the JWT payload without verifying the signature.
 * Verification happens on the gateway — we just need the claims here.
 */
export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

/**
 * Get the user ID from the stored JWT sub claim.
 * Returns null if no token or token is expired.
 */
export function getUserIdFromToken(): string | null {
  const token = getToken()
  if (!token) return null
  const decoded = decodeToken(token)
  if (!decoded) return null

  // Check expiry
  if (decoded.exp && typeof decoded.exp === 'number') {
    if (Date.now() / 1000 > decoded.exp) {
      removeToken()
      return null
    }
  }

  return decoded.sub as string ?? null
}

/**
 * Check if the current token has is_admin claim.
 */
export function getIsAdmin(): boolean {
  const token = getToken()
  if (!token) return false
  const decoded = decodeToken(token)
  return decoded?.is_admin === true
}