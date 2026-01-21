const isVite = typeof import.meta.env !== "undefined"

if (!isVite) {
  const dotenv = await import("dotenv")
  dotenv.config({ path: ".env.local" })
  dotenv.config({ path: ".env.development" })
  dotenv.config({ path: ".env" })
}

function getEnv(key: string): string | undefined {
  const value = isVite ? import.meta.env[key] : process.env[key]
  return value ?? undefined
}

export const env = {
  get DATABASE_URL() {
    return getEnv("DATABASE_URL")
  },
  get BETTER_AUTH_SECRET() {
    return getEnv("BETTER_AUTH_SECRET")
  },
  get BETTER_AUTH_URL() {
    return getEnv("VITE_BETTER_AUTH_URL")
  },
} as const
