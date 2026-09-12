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
    const eventName = channel.slice(channel.indexOf('.') + 1)
    const handler = EVENT_HANDLERS[eventName]

    if (!handler) {
      console.warn(`[consumers] No handler registered for event: ${eventName}`)
      return
    }

    let payload
    try {
      payload = JSON.parse(message)
    } catch {
      console.error(`[consumers] Bad JSON payload on ${channel}:`, message)
      return
    }

    try {
      await handler(payload)
      console.log(`[consumers] Handled ${eventName}`)
    } catch (err) {
      console.error(`[consumers] Handler for ${eventName} failed:`, err.message)
    }
  })

  return subscriber
}
