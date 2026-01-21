import { relations } from "drizzle-orm"
import { boolean, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { user } from "./auth.schema"

export const paymentType = pgEnum("payment_type", ["subscription", "one_time"])

export const payment = pgTable("payment", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  // Product and pricing
  priceId: text("price_id").notNull(), // Stripe/Creem price ID
  type: paymentType("type").notNull(), // "subscription" | "one_time"
  interval: text("interval"),

  // User
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  customerId: text("customer_id").notNull(), // Provider customer ID

  // Payment/subscription IDs
  paymentId: text("payment_id"), // Payment intent ID for one-time payments
  subscriptionId: text("subscription_id"), // Subscription ID for recurring

  // Status and billing
  status: text("status").notNull(), // pending, active, canceled, etc.
  amount: integer("amount"), // Amount in cents, (for one-time payments)
  currency: text("currency").default("usd"),

  // Subscription periods
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),

  // Trial period
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),

  // Timestamps
  createdAt: timestamp("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
})

// Relations
export const paymentRelations = relations(payment, ({ one }) => ({
  user: one(user, {
    fields: [payment.userId],
    references: [user.id],
  }),
}))
