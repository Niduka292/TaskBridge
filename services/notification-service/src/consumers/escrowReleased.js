// src/consumers/escrowReleased.js
// Event: events.ESCROW_RELEASED — published by payment-service when the
// poster confirms completion and escrow funds move to the freelancer's wallet.
// Payload: { taskId, taskTitle, freelancerId, amountLkr }
// Notifies: the freelancer only. In-app only.

import { insertNotification } from '../db.js'

export async function handleEscrowReleased(payload) {
  const { taskId, taskTitle, freelancerId, amountLkr } = payload

  await insertNotification({
    userId: freelancerId,
    type: 'ESCROW_RELEASED',
    payload: { taskId, taskTitle, amountLkr },
  })
}
