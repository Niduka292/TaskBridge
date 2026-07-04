// src/index.js
import 'dotenv/config'
import express from 'express'
import notificationsRouter from './routes/notifications.js'

const app = express()

app.use(express.json())

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/api/v1/notifications', notificationsRouter)

// Health check — useful for Railway and the API gateway to confirm the service is up
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notification-service' })
})

// ---------------------------------------------------------------------------
// Event consumers — placeholder until other services are merged
// ---------------------------------------------------------------------------
function mountConsumers() {
  console.log('[consumers] skipped — event bus not connected yet')
}

mountConsumers()

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const PORT = process.env.PORT ?? 8084

app.listen(PORT, () => {
  console.log(`notification-service running on :${PORT}`)
})