// src/consumers/index.js
//
// Subscribes to every "events.<NAME>" channel published by other
// services (see task-service's EventPublisher for the publishing side)
// and dispatches each message to the matching handler below.
//
// Uses Redis's pattern-subscribe (psubscribe) on "events.*" so adding a
// new event on the publisher side never requires touching this file's
// subscription logic — just add it to EVENT_HANDLERS.

import { createRedisSubscriber } from '../lib/redisClient.js'

import { handleBidReceived } from './bidReceived.js'
import { handleBidAccepted } from './bidAccepted.js'
import { handleEscrowHeld } from './escrowHeld.js'
import { handleWorkSubmitted } from './workSubmitted.js'
import { handleEscrowReleased } from './escrowReleased.js'
import { handleEscrowRefunded } from './escrowRefunded.js'
import { handleTaskCompleted } from './taskCompleted.js'
import { handleDisputeRaised } from './disputeRaised.js'
import { handleReviewPosted } from './reviewPosted.js'
import { handleDeadlineApproaching } from './deadlineApproaching.js'

const CHANNEL_PATTERN = 'events.*'

const EVENT_HANDLERS = {
  BID_RECEIVED: handleBidReceived,
  BID_ACCEPTED: handleBidAccepted,
  ESCROW_HELD: handleEscrowHeld,
  WORK_SUBMITTED: handleWorkSubmitted,
  ESCROW_RELEASED: handleEscrowReleased,
  ESCROW_REFUNDED: handleEscrowRefunded,
  TASK_COMPLETED: handleTaskCompleted,
  DISPUTE_RAISED: handleDisputeRaised,
  REVIEW_POSTED: handleReviewPosted,
  DEADLINE_APPROACHING: handleDeadlineApproaching,
}

export function mountConsumers() {
  const subscriber = createRedisSubscriber()

  subscriber.psubscribe(CHANNEL_PATTERN, (err, count) => {
    if (err) {
      console.error('[consumers] Failed to subscribe:', err.message)
      return
    }
    console.log(`[consumers] Subscribed to "${CHANNEL_PATTERN}" (${count} pattern)`)
  })

  subscriber.on('pmessage', async (_pattern, channel, message) => {
    // channel looks like "events.BID_RECEIVED" — the event name is
    // everything after the first dot.
    const eventName = channel.slice(channel.indexOf('.') + 1)
    const handler = EVENT_HANDLERS[eventName]

    if (!handler) {
      console.warn(`[consumers] No handler registered for event: ${eventName}`)
      return
    }

    let payload
    try {
      payload = JSON.parse(message)
    } catch (err) {
      console.error(`[consumers] Bad JSON payload on ${channel}:`, message)
      return
    }

    try {
      await handler(payload)
      console.log(`[consumers] Handled ${eventName}`)
    } catch (err) {
      // A single bad event must never crash the service or block the
      // next one — log and move on. (No retry/DLQ here; acceptable for
      // now since Realtime + the REST list endpoint are the fallback
      // for anything a user needs to see.)
      console.error(`[consumers] Handler for ${eventName} failed:`, err.message)
    }
  })

  return subscriber
}
