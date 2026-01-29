import { redirect } from "@tanstack/react-router"
import { createMiddleware } from "@tanstack/react-start"

const ALLOWED_PATHS = [
  /^\/[a-z]{2}$/, // /{locale} root
  /^\/[a-z]{2}\/$/, // /{locale}/ root with trailing slash
  /^\/[a-z]{2}\/waitlist$/, // /{locale}/waitlist
  /^\/[a-z]{2}\/login$/, // /{locale}/login
  /^\/api\//, // API routes
]

function isPathAllowed(pathname: string): boolean {
  return ALLOWED_PATHS.some((pattern) => pattern.test(pathname))
}

/**
 * Block middleware for production environment
 * Only allows access to root, waitlist, login, and API routes
 */
export const blockMiddleware = createMiddleware().server(async ({ next, request }) => {
  if (import.meta.env.VITE_ENV === "production") {
    const { pathname } = new URL(request.url)
    if (!isPathAllowed(pathname)) {
      throw redirect({ to: "/{-$locale}/waitlist" })
    }
  }
  return await next()
})
