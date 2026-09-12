// src/consumers/deadlineApproaching.js
// Event: events.DEADLINE_APPROACHING — published by a task-service
// scheduled job as a task's deadline nears.
// Payload: { taskId, taskTitle, posterId, freelancerId, deadline }
// Notifies: both parties. In-app only.

import { insertNotification } from '../db.js'

export async function handleDeadlineApproaching(payload) {
  const { taskId, taskTitle, posterId, freelancerId, deadline } = payload

  await Promise.all([
    insertNotification({
      userId: posterId,
      type: 'DEADLINE_APPROACHING',
      payload: { taskId, taskTitle, deadline },
    }),
    insertNotification({
      userId: freelancerId,
      type: 'DEADLINE_APPROACHING',
      payload: { taskId, taskTitle, deadline },
    }),
  ])
}
