// src/middleware/auth.js
import jwt from 'jsonwebtoken'

/**
 * Validates the Supabase JWT from the Authorization header.
 * Attaches the decoded payload to req.user on success.
 *
 * Supabase JWTs carry:
 *   sub       — the user's UUID (this is your userId throughout the service)
 *   email     — user's email
 *   role      — 'authenticated'
 *   exp       — expiry timestamp
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET, {
      algorithms: ['HS256'],  // Supabase always signs with HS256 — be explicit
    })

    req.user = {
      id: decoded.sub,        // use req.user.id everywhere — consistent with Supabase's auth.users.id
      email: decoded.email,
    }

    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' })
    }
    return res.status(401).json({ error: 'Invalid token' })
  }
}