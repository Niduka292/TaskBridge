import { insertNotification } from '../db.js'

export async function handleEscrowReleased(payload) {
  const taskId = payload.taskId
  const freelancerId = payload.freelancerId ?? payload.payeeId
  const amountLkr = payload.amountLkr

  if (!freelancerId) {
    console.warn('[escrowReleased] Missing freelancer/payee id — skipping', payload)
    return
  }

  await insertNotification({
    userId: freelancerId,
    type: 'ESCROW_RELEASED',
    payload: { taskId, amountLkr },
  })
}
