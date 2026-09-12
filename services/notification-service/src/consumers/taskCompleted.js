// src/consumers/taskCompleted.js
// Event: events.TASK_COMPLETED — published by task-service once the task
// reaches its final COMPLETED status.
// Payload: { taskId, taskTitle, posterId, freelancerId }
// Notifies: both parties, prompting them to leave a review. In-app only.

import { insertNotification } from '../db.js'

export async function handleTaskCompleted(payload) {
  const { taskId, taskTitle, posterId, freelancerId } = payload

  await Promise.all([
    insertNotification({
      userId: posterId,
      type: 'TASK_COMPLETED',
      payload: { taskId, taskTitle },
    }),
    insertNotification({
      userId: freelancerId,
      type: 'TASK_COMPLETED',
      payload: { taskId, taskTitle },
    }),
  ])
}
