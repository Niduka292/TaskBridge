import './env.js'  
import express from 'express'
import notificationsRouter from './routes/notifications.js'

const app = express()

app.use(express.json())

app.use('/api/v1/notifications', notificationsRouter)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notification-service' })
})

function mountConsumers() {
  console.log('[consumers] skipped — event bus not connected yet')
}

mountConsumers()

const PORT = process.env.PORT ?? 8084

app.listen(PORT, () => {
  console.log(`notification-service running on :${PORT}`)
})