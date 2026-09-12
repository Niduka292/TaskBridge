// src/lib/redisClient.js
//
// notification-service is a pure event consumer — it never publishes.
// Publishers (task-service today; payment-service/user-service later)
// write to Redis channels named "events.<EVENT_NAME>", e.g.
// "events.BID_RECEIVED", using Spring's RedisTemplate#convertAndSend.
// See services/task-service/.../service/EventPublisher.java for the
// publishing side of this contract.
//
// This client subscribes with a pattern ("events.*") so adding a new
// event on the publisher side never requires a code change here —
// only a new entry in consumers/index.js's EVENT_HANDLERS map.

import Redis from 'ioredis'

export function createRedisSubscriber() {
  const url = process.env.REDIS_URL || 'redis://redis:6379'

  const client = new Redis(url, {
    retryStrategy: (times) => Math.min(times * 200, 5000),
    maxRetriesPerRequest: null,
  })

  client.on('connect', () => console.log('[redis] connected:', url))
  client.on('error', (err) => console.error('[redis] connection error:', err.message))
  client.on('reconnecting', () => console.warn('[redis] reconnecting...'))

  return client
}
