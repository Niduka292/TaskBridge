import './env.js'
import express from 'express'
import notificationsRouter from './routes/notifications.js'
import { mountConsumers } from './consumers/index.js'
import { initDb } from './db.js'

const app = express()
app.use(express.json())

app.use('/api/v1/notifications', notificationsRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'notification-service' })
})

const PORT = Number(process.env.PORT ?? 8004)

async function start() {
  try {
    await initDb()
    mountConsumers()

    app.listen(PORT, () => {
      console.log(`notification-service running on :${PORT}`)
    })
  } catch (err) {
    console.error('[startup] Failed to start notification-service:', err)
    process.exit(1)
  }
}

start()
