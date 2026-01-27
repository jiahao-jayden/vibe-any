import { type FetchOptions, ofetch } from "ofetch"
import { authClient } from "@/shared/lib/auth/auth-client"
import type { ApiResponse } from "./response"

export class HttpError extends Error {
  constructor(
    public code: number,
    message: string,
    public error?: string
  ) {
    super(message)
    this.name = "HttpError"
  }
}

type HttpOptions = FetchOptions & {
  requireAuth?: boolean
}

const baseFetch = ofetch.create({
  onResponse({ response }) {
    const data = response._data as ApiResponse
    if (data?.code !== 200) {
      throw new HttpError(data.code, data.message, data.error)
    }
    response._data = data.data
  },
  onResponseError({ response }) {
    if (response.status === 401) {
      throw new HttpError(401, "Unauthorized")
    }
  },
})

export async function http<T>(url: string, options?: HttpOptions): Promise<T | null> {
  const { requireAuth, ...fetchOptions } = options ?? {}

  if (requireAuth) {
    const { data: session } = await authClient.getSession()
    if (!session) {
      return null
    }
  }

  return baseFetch(url, fetchOptions) as Promise<T>
}

export type { HttpOptions }
