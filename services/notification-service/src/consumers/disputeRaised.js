// src/consumers/disputeRaised.js
// Event: events.DISPUTE_RAISED — published by task-service when either
// party opens a dispute on a task.
// Payload: { taskId, taskTitle, posterId, freelancerId, raisedBy, reason }
// Notifies: both parties. In-app only.

import { insertNotification } from '../db.js'

export async function handleDisputeRaised(payload) {
  const { taskId, taskTitle, posterId, freelancerId, raisedBy, reason } = payload

  await Promise.all([
    insertNotification({
      userId: posterId,
      type: 'DISPUTE_RAISED',
      payload: { taskId, taskTitle, raisedBy, reason },
    }),
    insertNotification({
      userId: freelancerId,
      type: 'DISPUTE_RAISED',
      payload: { taskId, taskTitle, raisedBy, reason },
    }),
  ])
}
