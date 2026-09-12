import { insertNotification } from '../db.js'

export async function handleEscrowHeld(payload) {
  const taskId = payload.taskId
  const posterId = payload.posterId ?? payload.payerId
  const freelancerId = payload.freelancerId ?? payload.payeeId
  const amountLkr = payload.amountLkr

  const writes = []

  if (posterId) {
    writes.push(insertNotification({
      userId: posterId,
      type: 'ESCROW_HELD',
      payload: { taskId, amountLkr },
    }))
  }

  if (freelancerId) {
    writes.push(insertNotification({
      userId: freelancerId,
      type: 'ESCROW_HELD',
      payload: { taskId, amountLkr },
    }))
  }

  if (writes.length === 0) {
    console.warn('[escrowHeld] Missing payer/poster and payee/freelancer IDs — skipping', payload)
    return
  }

  await Promise.all(writes)
}
