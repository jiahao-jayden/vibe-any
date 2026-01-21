import type { Locale } from "intlayer"
import type { Subscription } from "@/shared/types/payment"

/**
 * Parameters for creating a checkout session
 */
export interface CreateCheckoutParams {
  planId: string
  priceId: string
  email: string
  successUrl?: string
  cancelUrl?: string
  metadata?: Record<string, string>
  locale?: Locale
}

export interface CheckoutResult {
  id: string
  checkoutUrl: string
}

export interface getSubscriptionsParams {
  userId: string
}

export interface PaymentAdapter {
  /**
   * Create a checkout session
   */
  createCheckout: (params: CreateCheckoutParams) => Promise<CheckoutResult>

  /**
   * Get customer subscriptions
   */
  getSubscriptionsByUserId: (params: getSubscriptionsParams) => Promise<Subscription[]>

  /**
   * Handle webhook events
   */
  handleWebhookEvent: (payload: string, signature: string) => Promise<void>
}
