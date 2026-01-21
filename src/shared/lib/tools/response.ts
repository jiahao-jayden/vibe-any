export type ApiResponse<T = unknown> = {
  code: number
  message: string
  error?: string
  data?: T
}

function createResponse<T = unknown>(code: number, message: string, data?: T, error?: string) {
  const response: ApiResponse<T> = { code, message }

  if (data !== undefined) {
    response.data = data
  }

  if (error !== undefined) {
    response.error = error
  }

  return Response.json(response, { status: code })
}

export const Resp = {
  success: <T = unknown>(data?: T) => createResponse(200, "success", data),
  error: (message: string, code = 500, error?: string) =>
    createResponse(code, message, undefined, error),
  json: <T = unknown>(code: number, message: string, data?: T) => createResponse(code, message, data),
}
