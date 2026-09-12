// src/consumers/escrowRefunded.js
// Event: events.ESCROW_REFUNDED — published by payment-service when a
// dispute resolves in the poster's favor and escrow funds are refunded.
// Payload: { taskId, taskTitle, posterId, amountLkr }
// Notifies: the poster only. In-app only.

import { insertNotification } from '../db.js'

export async function handleEscrowRefunded(payload) {
  const { taskId, taskTitle, posterId, amountLkr } = payload

  await insertNotification({
    userId: posterId,
    type: 'ESCROW_REFUNDED',
    payload: { taskId, taskTitle, amountLkr },
  })
}
