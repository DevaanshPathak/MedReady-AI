import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "https://fit-osprey-6253.upstash.io",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "ARhtAAImcDJmOThmMDRlMzNlYzA0ZjAxYTQzNzFjNTQwYzc5OWUwOXAyNjI1Mw",
})

export { redis }
