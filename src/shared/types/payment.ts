export type PaymentProviderType = "stripe" | "creem"

/**
 * Interval types for subscription plans
 */
export enum PlanIntervals {
  MONTH = "month",
  YEAR = "year",
}

export type PlanInterval = PlanIntervals.MONTH | PlanIntervals.YEAR

/**
 * Payment type (subscription or one-time)
 */
export enum PaymentTypes {
  SUBSCRIPTION = "subscription",
  ONE_TIME = "one_time",
}

export type PaymentType = PaymentTypes.SUBSCRIPTION | PaymentTypes.ONE_TIME

/**
 * Plan type enumeration
 */
export enum PlanTypes {
  FREE = "free",
  SUBSCRIPTION = "subscription",
  LIFETIME = "lifetime",
  // To smooth out the differences between plans and credit packages
  CREDITS = "credits",
}

/**
 * Subscription or one-time payment status
 */
export type PaymentStatus =
  // Active States
  | "active" // Subscription is active and user has normal access
  | "trialing" // Subscription is in trial period with free access
  | "paused" // Subscription is paused, service temporarily stopped but can be resumed

  // Completed States
  | "completed" // One-time payment completed successfully

  // Failed/Incomplete States
  | "failed" // Payment failed, possibly due to insufficient funds, card issues, etc.
  | "incomplete" // Payment not completed, requires further user action
  | "incomplete_expired" // Payment not completed and expired, user needs to restart payment process
  | "past_due" // Payment is past due, recurring payment failed but subscription not canceled
  | "unpaid" // Payment failed, unpaid status

  // Terminated States
  | "canceled" // Subscription has been canceled, no longer renewing
  | "processing" // Payment is processing, not yet completed

/**
 * Providers and adapter types
 */
export type PaymentProvider = "stripe" | "creem"

export type PaymentAdapterType = "stripe" | "creem"

/**
 * Payment configuration
 */
export type PaymentConfig = {
  enabled: boolean
  provider: PaymentProvider
  createCustomerOnSignUp: boolean
  stripe?: {
    secretKey: string
    webhookSecret: string
  }
}

/**
 * Customer
 */
export type Customer = {
  id: string
  email: string
  name?: string
  metadata?: Record<string, any>
}

/**
 * Price definition for a plan
 */
export type Price = {
  type: PaymentType
  amount: number
  currency: string
  interval?: PlanInterval
  trialPeriodDays?: number
  priceId: string
  disabled?: boolean
}

/**
 * Plan definition
 */
export type Plan = {
  id: string
  name?: string
  description?: string
  features?: string[]
  prices: Price[]
  recommended?: boolean
  popular?: boolean
  disabled?: boolean
}

export type Credit = {
  amount: number
  // if expireDays is not set, the credit is valid forever
  expireDays?: number
}

export type PlanWithPrice = {
  id: string
  planType: PlanTypes
  credit?: Credit
  prices: {
    type: PaymentTypes
    priceId: string
    amount: number
    currency: string
    interval?: PlanInterval
  }[]
  recommended?: boolean
}

export type CreditPackageWithPrice = {
  id: string
  credit: Credit
  price: {
    priceId: string
    amount: number
    currency: string
  }
}

/**
 * Subscription data
 */
export type Subscription = {
  id: string
  customerId: string
  status: PaymentStatus
  priceId: string
  type: PaymentType
  interval?: PlanInterval
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  cancelAtPeriodEnd?: boolean
  trialStartDate?: Date
  trialEndDate?: Date
  createdAt: Date
}

/**
 * Payment
 */
export type Payment = {
  id: string
  customerId: string
  amount: number
  currency: string
  status: PaymentStatus
  createdAt: Date
  metadata?: Record<string, string>
}
