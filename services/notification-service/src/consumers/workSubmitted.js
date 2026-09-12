// src/consumers/workSubmitted.js
// Event: events.WORK_SUBMITTED — published by task-service when the
// freelancer submits their work for review.
// Payload: { taskId, taskTitle, posterId, freelancerId }
// Notifies: the poster only. In-app only.

import { insertNotification } from '../db.js'

export async function handleWorkSubmitted(payload) {
  const { taskId, taskTitle, posterId, freelancerId } = payload

  await insertNotification({
    userId: posterId,
    type: 'WORK_SUBMITTED',
    payload: { taskId, taskTitle, freelancerId },
  })
}
