// src/consumers/escrowHeld.js
// Event: events.ESCROW_HELD — published by payment-service once PayHere
// payment clears and funds are held in escrow.
// Payload: { taskId, taskTitle, posterId, freelancerId, amountLkr }
// Notifies: both parties, and both get email (the second of the two
// events the README allows email for).

import { insertNotification, getEmailByUserId } from '../db.js'
import { sendEmail } from '../email.js'

export async function handleEscrowHeld(payload) {
  const { taskId, taskTitle, posterId, freelancerId, amountLkr } = payload

  await Promise.all([
    insertNotification({
      userId: posterId,
      type: 'ESCROW_HELD',
      payload: { taskId, taskTitle, amountLkr },
    }),
    insertNotification({
      userId: freelancerId,
      type: 'ESCROW_HELD',
      payload: { taskId, taskTitle, amountLkr },
    }),
  ])

  const [posterEmail, freelancerEmail] = await Promise.all([
    getEmailByUserId(posterId),
    getEmailByUserId(freelancerId),
  ])

  await Promise.all([
    sendEmail(
      posterEmail,
      'Payment confirmed',
      `Your payment of LKR ${amountLkr} for "${taskTitle}" is now held in escrow.`
    ),
    sendEmail(
      freelancerEmail,
      'Payment confirmed — you can start working',
      `Payment of LKR ${amountLkr} for "${taskTitle}" is now held in escrow. You're clear to begin.`
    ),
  ])
}
