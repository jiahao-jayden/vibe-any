import { createFileRoute } from "@tanstack/react-router"
import { env } from "@/config/env"
import { PaymentService } from "@/integrations/payment"
import { auth } from "@/shared/lib/auth/auth-server"
import { logger } from "@/shared/lib/tools/logger"
import { Resp } from "@/shared/lib/tools/response"
import { authMiddleware } from "@/shared/middleware/auth"

export const Route = createFileRoute("/api/payment/checkout")({
  server: {
    middleware: [authMiddleware],
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          // Verify authentication
          const session = await auth.api.getSession({
            headers: request.headers,
          })

          if (!session?.user) {
            return Resp.error("Unauthorized", 401)
          }

          const body = await request.json()
          logger.info("Full body:", body)

          const { planId, priceId, successUrl, cancelUrl, metadata } = body

          if (!planId || !priceId) {
            logger.error("Missing params - planId:", planId, "priceId:", priceId)
            return Resp.error("Missing required parameters: planId and priceId")
          }
          logger.info("Extracted params:", { planId, priceId, successUrl, cancelUrl, metadata })

          const paymentService = new PaymentService()
          const result = await paymentService.createCheckout({
            planId,
            priceId,
            email: session.user.email,
            successUrl: successUrl || `${env.BETTER_AUTH_URL}/dashboard?success=true`,
            cancelUrl: cancelUrl || `${env.BETTER_AUTH_URL}/pricing`,
            metadata: {
              userId: session.user.id,
              planId,
              ...metadata,
            },
          })

          return Resp.success(result)
        } catch (error) {
          logger.error("Error creating checkout:", error)
          return Resp.error("Failed to create checkout session")
        }
      },
    },
  },
})
