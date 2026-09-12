// src/consumers/bidReceived.js
// Event: events.BID_RECEIVED — published by task-service on BidService#submitBid
// Payload: { taskId, taskTitle, posterId, bidId, bidderId, bidderName, amountLkr }
// Notifies: the task poster only. No email — in-app notification only.

import { insertNotification } from '../db.js'

export async function handleBidReceived(payload) {
  const { taskId, taskTitle, posterId, bidId, bidderId, bidderName, amountLkr } = payload

  if (!posterId) {
    console.warn('[bidReceived] Missing posterId — skipping', payload)
    return
  }

  await insertNotification({
    userId: posterId,
    type: 'BID_RECEIVED',
    payload: { taskId, taskTitle, bidId, bidderId, bidderName, amountLkr },
  })
}
