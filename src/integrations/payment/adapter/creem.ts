import crypto from "node:crypto"
import { desc, eq } from "drizzle-orm"
import { getPlanById, getPriceById } from "@/config/payment-config"
import { type DbTransaction, db } from "@/db"
import { payment } from "@/db/payment.schema"
import type {
  CheckoutResult,
  CreateCheckoutParams,
  getSubscriptionsParams,
  PaymentAdapter,
} from "@/integrations/payment/adapter/interface"
import { processIncreaseCredits } from "@/integrations/payment/adapter/utils"
import { logger } from "@/shared/lib/tools/logger"
import type { PaymentStatus, Subscription } from "@/shared/types/payment"
import { PaymentTypes, PlanIntervals } from "@/shared/types/payment"

interface CreemWebhookEvent {
  eventType: string
  type?: string
  object: CreemCheckoutCompletedData | CreemSubscriptionData
}

interface CreemCheckoutCompletedData {
  id: string
  customer?: {
    id: string
    email: string
  }
  order?: {
    id: string
    type: "recurring" | "one-time" | "onetime"
    amount: number
    currency: string
  }
  subscription?: CreemSubscriptionData
  product?: {
    id: string
    billing_period?: string
  }
  metadata?: Record<string, any>
}

interface CreemSubscriptionData {
  id: string
  customer?: string
  product?: {
    id: string
    billing_period?: string
  }
  status: string
  current_period_start_date?: string
  current_period_end_date?: string
  canceled_at?: string
  trial_start?: string
  trial_end?: string
  interval?: string
  billingCycle?: string
  items?: Array<{
    product_id: string
  }>
  productId?: string
  priceId?: string
  metadata?: Record<string, any>
}

export class CreemAdapter implements PaymentAdapter {
  private domain: string
  private apiKey: string
  private version = "v1"
  private webhookSecret: string

  constructor(apiKey?: string, isTestMode?: boolean, webhookSecret?: string) {
    if (!apiKey) {
      throw new Error("Creem secret key is not configured")
    }
    if (!webhookSecret) {
      throw new Error("webhook secret is not configured")
    }
    this.apiKey = apiKey
    this.webhookSecret = webhookSecret

    if (isTestMode) {
      this.domain = `https://test-api.creem.io/${this.version}`
    } else {
      this.domain = `https://api.creem.io/${this.version}`
    }
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const { planId, priceId, email, successUrl, metadata } = params
    try {
      const plan = getPlanById(planId)
      if (!plan) {
        throw new Error(`Plan not found for planId: ${planId}`)
      }

      const price = getPriceById(planId, priceId)
      if (!price) {
        throw new Error(`Price not found for planId: ${planId}, priceId: ${priceId}`)
      }
      logger.debug(`Creating Creem checkout for priceId: ${priceId}`)

      // create Creem checkout session
      const response = await fetch(`${this.domain}/checkouts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
        },
        body: JSON.stringify({
          // creem use priceId as productId
          product_id: priceId,
          customer: {
            email: email,
          },
          success_url: successUrl,
          metadata: {
            ...metadata,
            planId,
            priceId,
          },
        }),
      })
      const result = await response.json()
      logger.debug("Creem checkout response:", result)

      if (!result) {
        throw new Error("Failed to create checkout session")
      }

      return {
        id: result.id,
        checkoutUrl: result.checkout_url!,
      }
    } catch (error) {
      logger.error(`createCheckout, error: ${error}`)
      throw new Error(`Error creating checkout session: ${error}`)
    }
  }

  async getSubscriptionsByUserId(params: getSubscriptionsParams): Promise<Subscription[]> {
    const { userId } = params
    try {
      const paymentRecords = await db
        .select()
        .from(payment)
        .where(eq(payment.userId, userId))
        .orderBy(desc(payment.createdAt))

      return paymentRecords.map((record) => ({
        id: record.id,
        customerId: record.customerId,
        status: record.status as any,
        priceId: record.priceId,
        type: record.type as any,
        interval: record.interval as any,
        currentPeriodStart: record.periodStart || undefined,
        currentPeriodEnd: record.periodEnd || undefined,
        cancelAtPeriodEnd: record.cancelAtPeriodEnd || false,
        trialStartDate: record.trialStart || undefined,
        trialEndDate: record.trialEnd || undefined,
        createdAt: record.createdAt,
      }))
    } catch (error) {
      logger.error(`Error fetching subscriptions for user ${userId}`, error)
      return []
    }
  }

  async handleWebhookEvent(payload: string, signature: string): Promise<void> {
    try {
      // verify webhook signature
      if (this.webhookSecret && !this.verifyWebhookSignature(payload, signature)) {
        throw new Error("Invalid webhook signature")
      }

      const event: CreemWebhookEvent = JSON.parse(payload)
      const eventType = event.eventType || event.type
      console.log(event.object.metadata, "will access event")

      logger.info(`Handling Creem webhook event: ${eventType}`)

      // Handle event types according to Creem documentation
      switch (eventType) {
        case "checkout.completed":
          await this.handleCheckoutCompleted(event.object as CreemCheckoutCompletedData)
          break
        case "subscription.update":
          await this.handleSubscriptionUpdated(event.object as CreemSubscriptionData)
          break
        case "subscription.canceled":
          await this.handleSubscriptionCancelled(event.object as CreemSubscriptionData)
          break
        case "subscription.expired":
          await this.handleSubscriptionExpired(event.object as CreemSubscriptionData)
          break
        default:
          logger.warn(`Unhandled Creem webhook event type: ${eventType}`)
      }
    } catch (error) {
      logger.error(`Error handling Creem webhook event`, error)
      throw new Error(`Error handling webhook event: ${error}`)
    }
  }

  /**
   * Verify Creem webhook signature
   * Use HMAC-SHA256 algorithm for verification according to Creem documentation
   * Header: creem-signature
   */
  private verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      logger.warn("Webhook secret not configured, skipping signature verification")
      return true
    }

    try {
      // Use HMAC-SHA256 to verify signature according to Creem documentation
      const computedSignature = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(payload)
        .digest("hex")

      // Use timing-safe comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(computedSignature, "hex")
      )
    } catch (error) {
      logger.error("Error verifying webhook signature", error)
      return false
    }
  }

  private async handleCheckoutCompleted(data: CreemCheckoutCompletedData): Promise<void> {
    try {
      logger.info(`Processing checkout completed: ${data.id}`)

      // Validate required data
      const userId = data.metadata?.userId
      if (!userId) {
        throw new Error(`No userId found in metadata for checkout ${data.id}`)
      }

      const planId = data.metadata?.planId
      if (!planId) {
        throw new Error(`No planId found in metadata for checkout ${data.id}`)
      }

      // Use database transaction to ensure atomicity between payment and credit operations
      await db.transaction(async (tx) => {
        let paymentRecordId: string | undefined

        // Create payment record based on order type
        if (data.subscription && data.order?.type === "recurring") {
          const result = await this.createSubscription(data.subscription, data, tx)
          paymentRecordId = result?.id
        } else if (data.order?.type === "one-time" || data.order?.type === "onetime") {
          const result = await this.createOneTimePayment(data, tx)
          paymentRecordId = result?.id
        }

        if (!paymentRecordId) {
          throw new Error(`Failed to create payment record for checkout ${data.id}`)
        }

        // Process credits based on plan configuration
        const periodEnd = data.subscription?.current_period_end_date
          ? new Date(data.subscription.current_period_end_date)
          : undefined
        await processIncreaseCredits(planId, userId, paymentRecordId, periodEnd, tx)
        logger.info(`Checkout completed processed successfully: ${data.id}`)
      })
    } catch (error) {
      logger.error(`Error processing checkout completed for ${data.id}:`, error)
      throw error // Re-throw to ensure webhook processing fails if something goes wrong
    }
  }

  private async handleSubscriptionUpdated(data: CreemSubscriptionData): Promise<void> {
    try {
      logger.info(`Processing subscription updated: ${data.id}`)
      await this.updateSubscription(data)
    } catch (error) {
      logger.error(`Error processing subscription updated: ${error}`)
    }
  }

  private async handleSubscriptionCancelled(data: CreemSubscriptionData): Promise<void> {
    try {
      logger.info(`Processing subscription cancelled: ${data.id}`)
      await this.cancelSubscription(data)
    } catch (error) {
      logger.error(`Error processing subscription cancelled: ${error}`)
    }
  }

  private async handleSubscriptionExpired(data: CreemSubscriptionData): Promise<void> {
    try {
      logger.info(`Processing subscription expired: ${data.id}`)
      await this.expireSubscription(data)
    } catch (error) {
      logger.error(`Error processing subscription expired: ${error}`)
    }
  }

  /**
   * Create subscription record (based on Stripe implementation)
   */
  private async createSubscription(
    subscriptionData: CreemSubscriptionData,
    checkoutData?: CreemCheckoutCompletedData,
    tx?: DbTransaction
  ): Promise<{ id: string } | undefined> {
    logger.debug("Creating subscription with data:", subscriptionData)

    try {
      // Validate input data
      if (!subscriptionData?.id) {
        throw new Error("Invalid subscription object: missing ID")
      }

      const customerId = subscriptionData.customer || checkoutData?.customer?.id
      if (!customerId) {
        throw new Error(`No customer found for subscription ${subscriptionData.id}`)
      }

      const priceId = subscriptionData.product || checkoutData?.product?.id
      if (!priceId) {
        throw new Error(`No price ID found for subscription ${subscriptionData.id}`)
      }

      const userId = checkoutData?.metadata?.userId
      if (!userId) {
        throw new Error(`No userId found in metadata for subscription ${subscriptionData.id}`)
      }

      // Check if subscription already exists (idempotency check)
      const dbInstance = tx || db
      const existingSubscription = await dbInstance
        .select({ id: payment.id })
        .from(payment)
        .where(eq(payment.subscriptionId, subscriptionData.id))
        .limit(1)

      if (existingSubscription.length > 0) {
        logger.info(
          `Subscription ${subscriptionData.id} already exists, skipping creation (idempotent)`
        )
        return existingSubscription[0]
      }

      const [result] = await dbInstance
        .insert(payment)
        .values({
          // Product and price
          priceId: typeof priceId === "string" ? priceId : priceId?.id,
          type: PaymentTypes.SUBSCRIPTION,
          interval: this.transformCreemInterval(subscriptionData, checkoutData),

          // User information
          userId,
          customerId,

          // Subscription ID
          subscriptionId: subscriptionData.id,

          // Status and billing
          status: this.transformCreemStatus(subscriptionData.status),
          amount: checkoutData?.order?.amount,
          currency: checkoutData?.order?.currency?.toLowerCase() || "usd",

          // Subscription period
          periodStart: subscriptionData.current_period_start_date
            ? new Date(subscriptionData.current_period_start_date)
            : new Date(),
          periodEnd: subscriptionData.current_period_end_date
            ? new Date(subscriptionData.current_period_end_date)
            : null,
          cancelAtPeriodEnd: !!subscriptionData.canceled_at,

          // Trial period (if exists in future)
          trialStart: subscriptionData.trial_start ? new Date(subscriptionData.trial_start) : null,
          trialEnd: subscriptionData.trial_end ? new Date(subscriptionData.trial_end) : null,
        })
        .returning({ id: payment.id })

      if (!result) {
        throw new Error(`Database insert failed for subscription ${subscriptionData.id}`)
      }

      logger.info(`Successfully created subscription record ${result.id} for user ${userId}`)
      return result
    } catch (error) {
      logger.error(`Failed to create subscription ${subscriptionData.id}:`, error)
      throw error
    }
  }

  /**
   * Create one-time payment record
   */
  private async createOneTimePayment(
    checkoutData: CreemCheckoutCompletedData,
    tx?: DbTransaction
  ): Promise<{ id: string } | undefined> {
    try {
      // Validate input data
      if (!checkoutData?.id) {
        throw new Error("Invalid checkout object: missing ID")
      }

      const customerId = checkoutData.customer?.id
      if (!customerId) {
        throw new Error(`No customer found for checkout ${checkoutData.id}`)
      }

      const userId = checkoutData.metadata?.userId
      if (!userId) {
        throw new Error(`No userId found in metadata for checkout ${checkoutData.id}`)
      }

      const priceId = checkoutData.product?.id || checkoutData.metadata?.priceId
      if (!priceId) {
        throw new Error(`No priceId found for checkout ${checkoutData.id}`)
      }

      const paymentIntentId = checkoutData.order?.id

      // Check if payment already exists (idempotency check)
      const dbInstance = tx || db
      if (paymentIntentId) {
        const existingPayment = await dbInstance
          .select({ id: payment.id })
          .from(payment)
          .where(eq(payment.paymentId, paymentIntentId))
          .limit(1)

        if (existingPayment.length > 0) {
          logger.info(`Payment ${paymentIntentId} already exists, skipping creation (idempotent)`)
          return existingPayment[0]
        }
      }

      const currentTime = new Date()
      const [result] = await dbInstance
        .insert(payment)
        .values({
          priceId,
          type: PaymentTypes.ONE_TIME,

          // User information
          userId,
          customerId,

          paymentId: paymentIntentId,

          // Status and billing
          status: "completed",
          currency: checkoutData.order?.currency || "usd",
          amount: checkoutData.order?.amount,

          periodStart: currentTime,
          createdAt: currentTime,
          updatedAt: currentTime,
        })
        .returning({ id: payment.id })

      if (!result) {
        throw new Error(`Database insert failed for one-time payment ${checkoutData.id}`)
      }

      logger.info(`Successfully created one-time payment record ${result.id} for user ${userId}`)
      return result
    } catch (error) {
      logger.error(`Failed to create one-time payment ${checkoutData.id}:`, error)
      throw error
    }
  }

  /**
   * Update subscription record
   */
  private async updateSubscription(
    subscriptionData: CreemSubscriptionData
  ): Promise<{ id: string } | undefined> {
    try {
      // Validate input data
      if (!subscriptionData?.id) {
        throw new Error("Invalid subscription object: missing ID")
      }

      // For subscription.update events, the product info is in subscriptionData.product.id
      // For items array, we take the first item's product_id as fallback
      const priceId =
        subscriptionData.product?.id ||
        subscriptionData.items?.[0]?.product_id ||
        subscriptionData.productId ||
        subscriptionData.priceId

      const [result] = await db
        .update(payment)
        .set({
          ...(priceId && { priceId }),
          interval: this.transformCreemInterval(subscriptionData),
          status: this.transformCreemStatus(subscriptionData.status),

          periodStart: subscriptionData.current_period_start_date
            ? new Date(subscriptionData.current_period_start_date)
            : undefined,
          periodEnd: subscriptionData.current_period_end_date
            ? new Date(subscriptionData.current_period_end_date)
            : undefined,
          cancelAtPeriodEnd: !!subscriptionData.canceled_at,
          trialStart: subscriptionData.trial_start
            ? new Date(subscriptionData.trial_start)
            : undefined,
          trialEnd: subscriptionData.trial_end ? new Date(subscriptionData.trial_end) : undefined,

          updatedAt: new Date(),
        })
        .where(eq(payment.subscriptionId, subscriptionData.id))
        .returning({ id: payment.id })

      if (!result) {
        throw new Error(`No subscription found with ID ${subscriptionData.id} or update failed`)
      }

      logger.info(`Successfully updated subscription record ${result.id}`)
      return result
    } catch (error) {
      logger.error(`Failed to update subscription ${subscriptionData.id}:`, error)
      throw error
    }
  }

  /**
   * Cancel subscription
   */
  private async cancelSubscription(
    subscriptionData: CreemSubscriptionData
  ): Promise<{ id: string } | undefined> {
    try {
      // Validate input data
      if (!subscriptionData?.id) {
        throw new Error("Invalid subscription object: missing ID")
      }

      const [result] = await db
        .update(payment)
        .set({
          status: this.transformCreemStatus(subscriptionData.status || "canceled"),

          // Update period information if available
          periodStart: subscriptionData.current_period_start_date
            ? new Date(subscriptionData.current_period_start_date)
            : undefined,
          periodEnd: subscriptionData.current_period_end_date
            ? new Date(subscriptionData.current_period_end_date)
            : undefined,

          // Mark as canceled and set cancellation flag
          cancelAtPeriodEnd: true,

          updatedAt: new Date(),
        })
        .where(eq(payment.subscriptionId, subscriptionData.id))
        .returning({ id: payment.id })

      if (!result) {
        throw new Error(
          `No subscription found with ID ${subscriptionData.id} or cancellation failed`
        )
      }

      logger.info(
        `Successfully canceled subscription record ${result.id}, canceled at: ${subscriptionData.canceled_at}`
      )
      return result
    } catch (error) {
      logger.error(`Failed to cancel subscription ${subscriptionData.id}:`, error)
      throw error
    }
  }

  /**
   * Expire subscription
   */
  private async expireSubscription(
    subscriptionData: CreemSubscriptionData
  ): Promise<{ id: string } | undefined> {
    try {
      // Validate input data
      if (!subscriptionData?.id) {
        throw new Error("Invalid subscription object: missing ID")
      }

      const [result] = await db
        .update(payment)
        .set({
          // Force status to expired regardless of the data.status value
          status: "canceled", // Map expired to canceled in our system

          // Update period information if available
          periodStart: subscriptionData.current_period_start_date
            ? new Date(subscriptionData.current_period_start_date)
            : undefined,
          periodEnd: subscriptionData.current_period_end_date
            ? new Date(subscriptionData.current_period_end_date)
            : undefined,

          // Mark as expired (canceled at period end)
          cancelAtPeriodEnd: true,

          updatedAt: new Date(),
        })
        .where(eq(payment.subscriptionId, subscriptionData.id))
        .returning({ id: payment.id })

      if (!result) {
        throw new Error(`No subscription found with ID ${subscriptionData.id} or expiration failed`)
      }

      logger.info(`Successfully expired subscription record ${result.id}`)
      return result
    } catch (error) {
      logger.error(`Failed to expire subscription ${subscriptionData.id}:`, error)
      throw error
    }
  }

  /**
   * Transform Creem subscription interval to internal enum
   */
  private transformCreemInterval(
    subscription: CreemSubscriptionData,
    checkoutData?: CreemCheckoutCompletedData
  ): PlanIntervals {
    try {
      // Try to get interval from multiple sources:
      // 1. subscription.interval or subscription.billingCycle (legacy)
      // 2. subscription.product.billing_period (subscription.update events)
      // 3. checkoutData.product.billing_period (checkout.completed events)
      const interval =
        subscription.interval ||
        subscription.billingCycle ||
        subscription.product?.billing_period ||
        checkoutData?.product?.billing_period

      if (!interval) {
        logger.warn(`No interval found for subscription ${subscription.id}, defaulting to month`)
        return PlanIntervals.MONTH
      }

      switch (interval.toLowerCase()) {
        case "monthly":
        case "month":
        case "every-month":
          return PlanIntervals.MONTH
        case "yearly":
        case "year":
        case "annual":
        case "every-year":
          return PlanIntervals.YEAR
        default:
          logger.warn(
            `Unknown interval "${interval}" for subscription ${subscription.id}, defaulting to month`
          )
          return PlanIntervals.MONTH
      }
    } catch (error) {
      logger.error(`Error transforming interval for subscription ${subscription.id}:`, error)
      return PlanIntervals.MONTH
    }
  }

  /**
   * Transform Creem subscription status to internal payment status
   */
  private transformCreemStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      active: "active",
      canceled: "canceled",
      cancelled: "canceled",
      expired: "canceled",
      incomplete: "incomplete",
      past_due: "past_due",
      trialing: "trialing",
      trial: "trialing",
      unpaid: "unpaid",
      paused: "paused",
      pending: "incomplete",
      failed: "failed",
      completed: "completed",
    }

    const mappedStatus = statusMap[status?.toLowerCase()]

    if (!mappedStatus) {
      logger.warn(`Unknown Creem status "${status}", defaulting to "failed"`)
      return "failed"
    }

    return mappedStatus
  }
}
