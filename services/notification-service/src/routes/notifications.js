// src/routes/notifications.js
import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getNotifications, markOneRead, markAllRead } from '../db.js'

const router = Router()
router.use(requireAuth)  // all three endpoints require auth

// ---------------------------------------------------------------------------
// GET /api/v1/notifications
// Query params: unreadOnly (boolean), page (int), limit (int)
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const unreadOnly = req.query.unreadOnly === 'true'
    const page  = Math.max(1, parseInt(req.query.page)  || 1)
    const limit = Math.min(50, parseInt(req.query.limit) || 20)  // cap at 50 per page

    const { data, unreadCount } = await getNotifications({
      userId: req.user.id,
      unreadOnly,
      page,
      limit,
    })

    res.json({
      data,
      unreadCount,
      pagination: { page, limit },
    })
  } catch (err) {
    console.error('GET /notifications error:', err.message)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

// ---------------------------------------------------------------------------
// PUT /api/v1/notifications/read   — mark ALL as read
// IMPORTANT: this route must be registered BEFORE /:id/read
// Otherwise Express resolves "read" as the :id param and hits the wrong handler
// ---------------------------------------------------------------------------
router.put('/read', async (req, res) => {
  try {
    await markAllRead({ userId: req.user.id })
    res.json({ success: true })
  } catch (err) {
    console.error('PUT /notifications/read error:', err.message)
    res.status(500).json({ error: 'Failed to mark all notifications as read' })
  }
})

// ---------------------------------------------------------------------------
// PUT /api/v1/notifications/:id/read   — mark a single notification as read
// ---------------------------------------------------------------------------
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params

    // Basic UUID format guard — avoids hitting Supabase with garbage input
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid notification ID' })
    }

    await markOneRead({ userId: req.user.id, notificationId: id })
    res.json({ success: true })
  } catch (err) {
    console.error(`PUT /notifications/${req.params.id}/read error:`, err.message)
    res.status(500).json({ error: 'Failed to mark notification as read' })
  }
})

export default router