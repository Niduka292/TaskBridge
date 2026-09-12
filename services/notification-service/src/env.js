import dotenv from 'dotenv'

dotenv.config()

const required = ['JWT_SECRET']
for (const name of required) {
  if (!process.env[name]) {
    console.warn(`[env] ${name} is not set`)
  }
}

console.log('[env] PostgreSQL:', process.env.DATABASE_URL ? 'DATABASE_URL' : `${process.env.DB_HOST ?? 'postgres'}:${process.env.DB_PORT ?? '5432'}`)
console.log('[env] Redis:', process.env.REDIS_URL ?? 'redis://redis:6379')
