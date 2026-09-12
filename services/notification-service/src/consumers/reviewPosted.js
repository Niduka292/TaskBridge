// src/consumers/reviewPosted.js
// Event: events.REVIEW_POSTED — published by user-service.
// Payload: { revieweeId, reviewerName, rating, taskId, taskTitle, revealed }
// Notifies: the reviewee, but ONLY once `revealed === true` — TaskBridge
// uses a double-blind review system (both sides submit before either is
// shown), so notifying early would leak the review before reveal.

import { insertNotification } from '../db.js'

export async function handleReviewPosted(payload) {
  const { revieweeId, reviewerName, rating, taskId, taskTitle, revealed } = payload

  if (!revealed) {
    // Not an error — this is the expected "waiting on the other side"
    // state. Nothing to notify yet.
    return
  }

  await insertNotification({
    userId: revieweeId,
    type: 'REVIEW_POSTED',
    payload: { taskId, taskTitle, reviewerName, rating },
  })
}
