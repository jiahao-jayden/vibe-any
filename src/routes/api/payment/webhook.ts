import { createFileRoute } from "@tanstack/react-router"
import { websiteConfig } from "@/config/website-config"
import { PaymentService } from "@/integrations/payment"
import { logger } from "@/shared/lib/tools/logger"
import { Resp } from "@/shared/lib/tools/response"

export const Route = createFileRoute("/api/payment/webhook")({
  server: {
    handlers: {
      GET: async () => {
        const paymentProvider = websiteConfig.payment?.provider || "stripe"

        return Resp.json(200, "Webhook endpoint is active", {
          status: "ready",
          provider: paymentProvider,
        })
      },
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.text()
          const headersList = request.headers
          const paymentService = new PaymentService()

          // Get signature for different payment providers
          let signature: string | null = null

          switch (paymentService.provider) {
            case "stripe":
              signature = headersList.get("stripe-signature")
              if (!signature) {
                logger.error("Missing stripe-signature header")
                return Resp.error("Missing stripe-signature header", 400)
              }
              break

            case "creem":
              signature = headersList.get("creem-signature")
              if (!signature) {
                logger.error("Missing creem-signature header")
                return Resp.error("Missing creem-signature header", 400)
              }
              break

            default:
              logger.error(`Unsupported payment provider: ${paymentService.provider}`)
              return Resp.error("Unsupported payment provider", 400)
          }

          try {
            await paymentService.handleWebhookEvent(body, signature)

            return Resp.json(200, "Webhook received")
          } catch (webhookError: any) {
            logger.error("Webhook verification failed:", webhookError)
            return Resp.error(`Webhook Error: ${webhookError.message}`, 400)
          }
        } catch (error) {
          logger.error("Webhook processing failed:", error)
          return Resp.error("Webhook processing failed", 500)
        }
      },
    },
  },
})
