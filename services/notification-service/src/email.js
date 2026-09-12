// src/email.js
//
// Thin wrapper around SendGrid. Only two consumers call this:
// bidAccepted.js and escrowHeld.js — per the "Only send email for
// BID_ACCEPTED and ESCROW_HELD" rule in the README (emailing on every
// event risks the sending domain getting flagged as spam).
//
// Fails soft: a broken/missing API key or a bad recipient address
// should never crash the consumer that called it — the in-app
// notification row is the source of truth, email is a bonus channel.

import sgMail from '@sendgrid/mail'

const apiKey = process.env.SENDGRID_API_KEY
const fromEmail = process.env.SENDGRID_FROM_EMAIL

if (apiKey) {
  sgMail.setApiKey(apiKey)
} else {
  console.warn('[email] SENDGRID_API_KEY not set — emails will be logged, not sent')
}

/**
 * Send a transactional email.
 * @param {string} to      recipient email address
 * @param {string} subject email subject line
 * @param {string} body    plain-text body (a simple HTML version is derived from it)
 */
export async function sendEmail(to, subject, body) {
  if (!to) {
    console.warn(`[email] Skipped "${subject}" — no recipient address`)
    return
  }

  if (!apiKey) {
    // Local/dev fallback so the rest of the flow can still be tested
    // without a real SendGrid account configured.
    console.log(`[email] (SENDGRID_API_KEY missing, not sent) → ${to}: ${subject}\n${body}`)
    return
  }

  try {
    await sgMail.send({
      to,
      from: fromEmail,
      subject,
      text: body,
      html: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
    })
    console.log(`[email] Sent "${subject}" → ${to}`)
  } catch (err) {
    // Never throw — a failed email must not fail the whole event handler,
    // since the in-app notification row has already been written.
    console.error(`[email] Failed to send "${subject}" → ${to}:`, err.response?.body ?? err.message)
  }
}
