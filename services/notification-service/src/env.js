// src/env.js
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// src/ → notification-service/ → services/ → TaskBridge/ (monorepo root)
const result = dotenv.config({ path: resolve(__dirname, '../../../.env') })

if (result.error) {
  console.error('[env] Failed to load .env:', result.error.message)
} else {
  console.log('[env] SUPABASE_URL:', process.env.SUPABASE_URL ? 'found' : 'MISSING')
  console.log('[env] SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'found' : 'MISSING')
}