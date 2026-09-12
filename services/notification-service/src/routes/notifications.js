import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getNotifications, markOneRead, markAllRead } from '../db.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  try {
    const unreadOnly = req.query.unreadOnly === 'true'
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20))

    const result = await getNotifications({
      userId: req.user.id,
      unreadOnly,
      page,
      limit,
    })

    res.json(result)
  } catch (err) {
    console.error('GET /notifications error:', err.message)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

router.put('/read', async (req, res) => {
  try {
    await markAllRead({ userId: req.user.id })
    res.json({ success: true })
  } catch (err) {
    console.error('PUT /notifications/read error:', err.message)
    res.status(500).json({ error: 'Failed to mark all notifications as read' })
  }
})

router.put('/:id/read', async (req, res) => {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid notification ID' })
    }

    const updated = await markOneRead({
      userId: req.user.id,
      notificationId: req.params.id,
    })

    if (!updated) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.json({ success: true })
  } catch (err) {
    console.error(`PUT /notifications/${req.params.id}/read error:`, err.message)
    res.status(500).json({ error: 'Failed to mark notification as read' })
  }
})

export default router
