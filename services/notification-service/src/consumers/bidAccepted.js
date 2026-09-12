// src/consumers/bidAccepted.js
// Event: events.BID_ACCEPTED — published by task-service on BidService#acceptBid
// Payload: { taskId, taskTitle, winningBidderId, rejectedBidderIds: string[] }
// Notifies: the winning bidder (+ email) and every rejected bidder (in-app only).

import { insertNotification, getEmailByUserId } from '../db.js'
import { sendEmail } from '../email.js'

export async function handleBidAccepted(payload) {
  const { taskId, taskTitle, winningBidderId, rejectedBidderIds = [] } = payload

  if (!winningBidderId) {
    console.warn('[bidAccepted] Missing winningBidderId — skipping', payload)
    return
  }

  await insertNotification({
    userId: winningBidderId,
    type: 'BID_ACCEPTED',
    payload: { taskId, taskTitle, result: 'ACCEPTED' },
  })

  await Promise.all(
    rejectedBidderIds.map((bidderId) =>
      insertNotification({
        userId: bidderId,
        type: 'BID_ACCEPTED',
        payload: { taskId, taskTitle, result: 'REJECTED' },
      })
    )
  )

  // Email only the winner — the README's "only BID_ACCEPTED and
  // ESCROW_HELD get email" rule applies to the win, not the losses.
  const winnerEmail = await getEmailByUserId(winningBidderId)
  await sendEmail(
    winnerEmail,
    'Your bid was accepted 🎉',
    `Good news — your bid on "${taskTitle}" was accepted. You can start working on it now.`
  )
}
