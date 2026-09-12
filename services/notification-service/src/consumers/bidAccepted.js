import { insertNotification } from '../db.js'

// Current Task Service payload:
// { taskId, bidId, posterId, freelancerId, amountLkr }
export async function handleBidAccepted(payload) {
  const { taskId, bidId, freelancerId, amountLkr } = payload

  if (!freelancerId) {
    console.warn('[bidAccepted] Missing freelancerId — skipping', payload)
    return
  }

  await insertNotification({
    userId: freelancerId,
    type: 'BID_ACCEPTED',
    payload: {
      taskId,
      bidId,
      amountLkr,
      result: 'ACCEPTED',
    },
  })
}
