import { websiteConfig } from "@/config/website-config"
import { CreemAdapter } from "./adapter/creem"
import type { PaymentAdapter } from "./adapter/interface"
import { StripeAdapter } from "./adapter/stripe"

export class PaymentService {
  private readonly adapter: PaymentAdapter
  public readonly provider: string

  constructor() {
    this.provider = websiteConfig.payment?.provider || "stripe"

    switch (this.provider) {
      case "stripe":
        this.adapter = new StripeAdapter(
          process.env.STRIPE_SECRET_KEY,
          process.env.STRIPE_WEBHOOK_SECRET
        )
        break
      case "creem":
        this.adapter = new CreemAdapter(
          process.env.CREEM_X_API_KEY,
          process.env.CREEM_TEST_MODE === "true",
          process.env.CREEM_WEBHOOK_SECRET
        )
        break
      default:
        throw new Error(`Unsupported payment adapter: ${this.provider}`)
    }
  }

  /**
   * Create checkout session
   */
  async createCheckout(params: Parameters<PaymentAdapter["createCheckout"]>[0]) {
    return this.adapter.createCheckout(params)
  }

  /**
   * Get subscriptions by user ID
   */
  async getSubscriptionsByUserId(
    params: Parameters<PaymentAdapter["getSubscriptionsByUserId"]>[0]
  ) {
    return this.adapter.getSubscriptionsByUserId(params)
  }

  /**
   * Handle webhook events
   */
  async handleWebhookEvent(payload: string, signature: string) {
    return this.adapter.handleWebhookEvent(payload, signature)
  }
}
