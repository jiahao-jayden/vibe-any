import { desc, eq } from "drizzle-orm"
import Stripe from "stripe"
import { getPlanById, getPriceById } from "@/config/payment-config"
import { type DbTransaction, db } from "@/db"
import { user } from "@/db/auth.schema"
import { payment } from "@/db/payment.schema"
import { logger } from "@/shared/lib/tools/logger"
import type { PaymentStatus, Subscription } from "@/shared/types/payment"
import { PaymentTypes, PlanIntervals } from "@/shared/types/payment"
import type { CreateCheckoutParams, getSubscriptionsParams, PaymentAdapter } from "./interface"
import { processIncreaseCredits } from "./utils"

export class StripeAdapter implements PaymentAdapter {
  private stripe: Stripe
  private webhookSecret: string

  constructor(apiKey?: string, webhookSecret?: string) {
    if (!apiKey) {
      throw new Error("Stripe secret key is not configured")
    }

    if (!webhookSecret) {
      throw new Error("webhook secret is not configured.")
    }

    this.stripe = new Stripe(apiKey)
    this.webhookSecret = webhookSecret
  }

  public async getSubscriptionsByUserId(params: getSubscriptionsParams): Promise<Subscription[]> {
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
        status: record.status as any, // Cast to PaymentStatus
        priceId: record.priceId,
        type: record.type as any, // Cast to PaymentType
        interval: record.interval as any, // Cast to PlanInterval
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
      const event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret)
      const eventType = event.type

      logger.info(`Handling Stripe webhook event: ${eventType}`)
      const subscriptionEventHandlers: Record<
        string,
        (sub: Stripe.Subscription, tx?: DbTransaction) => Promise<{ id: string } | undefined>
      > = {
        "customer.subscription.created": this.createSubscription.bind(this),
        "customer.subscription.updated": this.updateSubscription.bind(this),
        "customer.subscription.deleted": this.cancelSubscription.bind(this),
      }
      let paymentId: string | undefined

      await db.transaction(async (tx) => {
        if (eventType.startsWith("customer.subscription.")) {
          const stripeSubscription = event.data.object as Stripe.Subscription
          const handler = subscriptionEventHandlers[eventType]

          if (handler) {
            const result = await handler(stripeSubscription, tx)
            paymentId = result?.id
          }
        } else if (eventType === "checkout.session.completed") {
          const session = event.data.object as Stripe.Checkout.Session

          if (!session.metadata) {
            throw new Error(`No metadata found for session ${session.id}`)
          }

          const { userId, planId } = session.metadata as { userId?: string; planId?: string }

          if (!userId || !planId) {
            throw new Error(`Missing userId or planId in metadata for session ${session.id}`)
          }

          if (session.mode === "payment") {
            const result = await this.createOneTimePayment(session, tx)
            paymentId = result?.id

            if (paymentId) {
              // one-time payment does not have a billing period end, pass undefined
              await processIncreaseCredits(planId, userId, paymentId, undefined, tx)
            }
          }
        }
      })
    } catch (error) {
      logger.error(`Error handling webhook event`, error)
      throw new Error(`Error handling webhook event`)
    }
  }

  public async createCheckout(params: CreateCheckoutParams) {
    const { planId, priceId, email, successUrl, cancelUrl, metadata } = params
    try {
      const plan = getPlanById(planId)
      if (!plan) {
        throw new Error(`plan not found`)
      }

      const price = getPriceById(planId, priceId)
      if (!price) {
        throw new Error(`price not found`)
      }

      const userId = metadata?.userId

      // Create or get customer
      const customerId = await this.createOrGetCustomer(email, userId)

      const toAbsoluteUrl = (url: string) => {
        const hasScheme = /^https?:\/\//i.test(url)
        if (!hasScheme) {
          throw new Error(`Invalid URL provided to Stripe: ${url}`)
        }
        return url
      }

      const checkoutParams: Stripe.Checkout.SessionCreateParams = {
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: price.type === PaymentTypes.SUBSCRIPTION ? "subscription" : "payment",
        success_url: toAbsoluteUrl(successUrl ?? ""),
        cancel_url: toAbsoluteUrl(cancelUrl ?? ""),
        metadata: {
          ...metadata,
          planId,
          priceId,
        },
        customer: customerId,
        locale: "auto",
      }

      if (price.type === PaymentTypes.SUBSCRIPTION) {
        checkoutParams.subscription_data = {
          metadata: {
            ...metadata,
            planId,
            priceId,
          },
        }
        if (price.trialPeriodDays && price.trialPeriodDays > 0) {
          checkoutParams.subscription_data.trial_period_days = price.trialPeriodDays
        }
      }
      if (price.type === PaymentTypes.ONE_TIME) {
        checkoutParams.payment_intent_data = {
          metadata: {
            ...metadata,
            planId,
            priceId,
          },
        }
        checkoutParams.invoice_creation = {
          enabled: true,
        }
      }
      // Create the checkout session
      const session = await this.stripe.checkout.sessions.create(checkoutParams)
      return {
        id: session.id,
        checkoutUrl: session.url!,
      }
    } catch (error) {
      logger.error(`Error creating checkout session`, error)
      throw new Error(`Error creating checkout session`)
    }
  }

  private async createOrGetCustomer(email: string, userId?: string) {
    try {
      if (!userId) {
        throw new Error("user id is not defined in metadata")
      }

      const existingCustomer = await this.stripe.customers.list({
        email,
        limit: 1,
      })

      // update user with customer id if it exists
      if (existingCustomer.data && existingCustomer.data.length > 0) {
        const customerId = existingCustomer.data[0].id
        const userId = await this.getUserIdByCustomerId(customerId)
        // in case you deleted user in database, but forgot to delete customer in Stripe
        if (!userId) {
          console.log(`User ${email} does not exist, update with customer id ${customerId}`)
          await this.updateUserWithCustomerId(customerId, email)
        }
        return customerId
      }

      // Create new customer
      const customer = await this.stripe.customers.create({
        email,
        metadata: { userId },
      })

      // Update user record in database with the new customer ID
      await this.updateUserWithCustomerId(customer.id, email)
      return customer.id
    } catch (error) {
      logger.error(`Error creating or getting customer for email ${email}`, error)
      throw new Error(`Error creating or getting customer for email ${email}`)
    }
  }

  private async updateUserWithCustomerId(customerId: string, email: string) {
    try {
      await db
        .update(user)
        .set({
          customerId,
          updatedAt: new Date(),
        })
        .where(eq(user.email, email))
    } catch (error) {
      logger.error(`Error updating user with customer id ${customerId} and email ${email}`, error)
      throw new Error(`Error updating user with customer id ${customerId} and email ${email}`)
    }
  }

  private async getUserIdByCustomerId(customerId: string): Promise<string | undefined> {
    try {
      const [result] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.customerId, customerId))
        .limit(1)
      return result?.id
    } catch (error) {
      logger.error(`Error getting user id by customer id ${customerId}`, error)
      throw new Error(`Error getting user id by customer id ${customerId}`)
    }
  }

  /**
   * Creates a new subscription record in the database
   * @param stripeSubscription The Stripe subscription object
   * @returns Promise<{ id: string } | undefined> The created payment record ID
   * @throws Error if required fields are missing or database operation fails
   */
  private async createSubscription(
    stripeSubscription: Stripe.Subscription,
    tx?: DbTransaction
  ): Promise<{ id: string } | undefined> {
    try {
      // Validate input structure
      if (!stripeSubscription?.id) {
        throw new Error("Invalid subscription object: missing ID")
      }

      if (!stripeSubscription.customer) {
        throw new Error(`No customer found for subscription ${stripeSubscription.id}`)
      }

      if (!stripeSubscription.items?.data?.length) {
        throw new Error(`No subscription items found for subscription ${stripeSubscription.id}`)
      }

      const customerId = stripeSubscription.customer as string
      const firstItem = stripeSubscription.items.data[0]

      if (!firstItem?.price?.id) {
        throw new Error(`No price ID found for subscription ${stripeSubscription.id}`)
      }

      const priceId = firstItem.price.id
      const userId = stripeSubscription.metadata?.userId

      if (!userId) {
        throw new Error(`No userId found in metadata for subscription ${stripeSubscription.id}`)
      }

      // Check if subscription already exists (idempotency check)
      const existingSubscription = await (tx || db)
        .select({ id: payment.id })
        .from(payment)
        .where(eq(payment.subscriptionId, stripeSubscription.id))
        .limit(1)

      if (existingSubscription.length > 0) {
        logger.info(
          `Subscription ${stripeSubscription.id} already exists, skipping creation (idempotent)`
        )
        return existingSubscription[0]
      }

      const [result] = await (tx || db)
        .insert(payment)
        .values({
          // product and pricing
          priceId,
          type: PaymentTypes.SUBSCRIPTION,
          interval: this.transformStripeInterval(stripeSubscription),

          // user information
          userId,
          customerId,

          // payment/subscription id
          subscriptionId: stripeSubscription.id,

          // Status and billing
          status: this.transformStripeStatus(stripeSubscription.status),
          amount: firstItem.price.unit_amount,
          currency: firstItem.price.currency,

          // subscription periods
          periodStart: firstItem.current_period_start
            ? new Date(firstItem.current_period_start * 1000)
            : null,
          periodEnd: firstItem.current_period_end
            ? new Date(firstItem.current_period_end * 1000)
            : null,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,

          // trial period
          trialStart: stripeSubscription.trial_start
            ? new Date(stripeSubscription.trial_start * 1000)
            : null,
          trialEnd: stripeSubscription.trial_end
            ? new Date(stripeSubscription.trial_end * 1000)
            : null,
        })
        .returning({ id: payment.id })

      if (!result) {
        throw new Error(`Database insert failed for subscription ${stripeSubscription.id}`)
      }

      // Process credits (if necessary information is in subscription metadata)
      const planId = stripeSubscription.metadata?.planId
      if (planId && userId) {
        const periodEnd = firstItem.current_period_end
          ? new Date(firstItem.current_period_end * 1000)
          : undefined
        await processIncreaseCredits(planId, userId, result.id, periodEnd, tx)
      }

      logger.info(`Successfully created subscription record ${result.id} for user ${userId}`)
      return result
    } catch (error) {
      logger.error(`Failed to create subscription ${stripeSubscription.id}:`, error)
      throw error
    }
  }

  /**
   * Creates a one-time payment record in the database
   * @param session The Stripe checkout session object
   * @returns Promise<{ id: string } | undefined> The created payment record ID
   * @throws Error if required fields are missing or database operation fails
   */
  private async createOneTimePayment(
    session: Stripe.Checkout.Session,
    tx?: DbTransaction
  ): Promise<{ id: string } | undefined> {
    try {
      // Validate input structure
      if (!session?.id) {
        throw new Error("Invalid session object: missing ID")
      }

      if (!session.customer) {
        throw new Error(`No customer found for session ${session.id}`)
      }

      const customerId = session.customer as string
      const userId = session.metadata?.userId

      if (!userId) {
        throw new Error(`No userId found in metadata for session ${session.id}`)
      }

      const priceId = session.metadata?.priceId

      if (!priceId) {
        throw new Error(`No priceId found in metadata for session ${session.id}`)
      }

      const paymentIntentId = session.payment_intent as string

      // Check if payment already exists (idempotency check)
      const [existingPayment] = await (tx || db)
        .select({ id: payment.id })
        .from(payment)
        .where(eq(payment.paymentId, paymentIntentId))
        .limit(1)

      if (existingPayment) {
        logger.info(`Payment ${paymentIntentId} already exists, skipping creation (idempotent)`)
        return existingPayment
      }

      const currentTime = new Date()
      const [result] = await (tx || db)
        .insert(payment)
        .values({
          priceId: priceId,
          type: PaymentTypes.ONE_TIME,

          // user information
          userId: userId,
          customerId: customerId,

          paymentId: paymentIntentId,

          // Status and billing
          status: "completed",
          currency: session.currency,
          amount: session.amount_total,

          periodStart: currentTime,
          createdAt: currentTime,
          updatedAt: currentTime,
        })
        .returning({ id: payment.id })

      if (!result) {
        throw new Error(`Database insert failed for one-time payment ${session.id}`)
      }

      logger.info(`Successfully created one-time payment record ${result.id} for user ${userId}`)
      return result
    } catch (error) {
      logger.error(`Failed to create one-time payment ${session.id}:`, error)
      throw error
    }
  }

  /**
   * Updates an existing subscription record in the database
   * @param stripeSubscription The Stripe subscription object with updated data
   * @returns Promise<{ id: string } | undefined> The updated payment record ID
   * @throws Error if required fields are missing or database operation fails
   */
  private async updateSubscription(
    stripeSubscription: Stripe.Subscription,
    tx?: DbTransaction
  ): Promise<{ id: string } | undefined> {
    try {
      // Validate input structure
      if (!stripeSubscription?.id) {
        throw new Error("Invalid subscription object: missing ID")
      }

      if (!stripeSubscription.items?.data?.length) {
        throw new Error(`No subscription items found for subscription ${stripeSubscription.id}`)
      }

      const firstItem = stripeSubscription.items.data[0]
      if (!firstItem?.price?.id) {
        throw new Error(`No price ID found for subscription ${stripeSubscription.id}`)
      }

      const priceId = firstItem.price.id

      const [result] = await (tx || db)
        .update(payment)
        .set({
          priceId,
          interval: this.transformStripeInterval(stripeSubscription),
          status: this.transformStripeStatus(stripeSubscription.status),

          periodStart: firstItem.current_period_start
            ? new Date(firstItem.current_period_start * 1000)
            : undefined,
          periodEnd: firstItem.current_period_end
            ? new Date(firstItem.current_period_end * 1000)
            : undefined,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          trialStart: stripeSubscription.trial_start
            ? new Date(stripeSubscription.trial_start * 1000)
            : undefined,
          trialEnd: stripeSubscription.trial_end
            ? new Date(stripeSubscription.trial_end * 1000)
            : undefined,

          updatedAt: new Date(),
        })
        .where(eq(payment.subscriptionId, stripeSubscription.id))
        .returning({ id: payment.id })

      if (!result) {
        throw new Error(`No subscription found with ID ${stripeSubscription.id} or update failed`)
      }

      logger.info(`Successfully updated subscription record ${result.id}`)
      return result
    } catch (error) {
      logger.error(`Failed to update subscription ${stripeSubscription.id}:`, error)
      throw error
    }
  }

  /**
   * Cancels/updates the status of an existing subscription in the database
   * @param stripeSubscription The Stripe subscription object with cancellation data
   * @returns Promise<{ id: string } | undefined> The updated payment record ID
   * @throws Error if required fields are missing or database operation fails
   */
  private async cancelSubscription(
    stripeSubscription: Stripe.Subscription,
    tx?: DbTransaction
  ): Promise<{ id: string } | undefined> {
    try {
      // Validate input structure
      if (!stripeSubscription?.id) {
        throw new Error("Invalid subscription object: missing ID")
      }

      const [result] = await (tx || db)
        .update(payment)
        .set({
          status: this.transformStripeStatus(stripeSubscription.status),
          updatedAt: new Date(),
        })
        .where(eq(payment.subscriptionId, stripeSubscription.id))
        .returning({ id: payment.id })

      if (!result) {
        throw new Error(
          `No subscription found with ID ${stripeSubscription.id} or cancellation failed`
        )
      }

      logger.info(`Successfully canceled subscription record ${result.id}`)
      return result
    } catch (error) {
      logger.error(`Failed to cancel subscription ${stripeSubscription.id}:`, error)
      throw error
    }
  }

  /**
   * Safely transforms Stripe subscription interval to internal enum
   * @param subscription The Stripe subscription object
   * @returns The corresponding PlanIntervals enum value
   */
  private transformStripeInterval(subscription: Stripe.Subscription): PlanIntervals {
    try {
      const interval = subscription.items?.data?.[0]?.plan?.interval

      if (!interval) {
        logger.warn(`No interval found for subscription ${subscription.id}, defaulting to month`)
        return PlanIntervals.MONTH
      }

      switch (interval) {
        case "month":
          return PlanIntervals.MONTH
        case "year":
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
   * Transforms Stripe subscription status to internal payment status
   * @param status The Stripe subscription status
   * @returns The corresponding internal PaymentStatus
   */
  private transformStripeStatus(status: Stripe.Subscription.Status): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      active: "active",
      canceled: "canceled",
      incomplete: "incomplete",
      incomplete_expired: "incomplete_expired",
      past_due: "past_due",
      trialing: "trialing",
      unpaid: "unpaid",
      paused: "paused",
    }

    const mappedStatus = statusMap[status]

    if (!mappedStatus) {
      logger.warn(`Unknown Stripe status "${status}", defaulting to "failed"`)
      return "failed"
    }

    return mappedStatus
  }
}
