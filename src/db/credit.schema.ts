import { relations } from "drizzle-orm"
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { getSnowId } from "@/shared/lib/tools/hash"
import { user } from "./auth.schema"
import { payment } from "./payment.schema"

export const credits = pgTable("credits", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  transactionId: text("transaction_id")
    .notNull()
    .unique()
    .$defaultFn(() => getSnowId()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // Credit source tracking
  paymentId: text("payment_id"), // Reference to payment table, null for admin grants

  // Transaction details
  transactionType: text("transaction_type").notNull(), // "credit", "debit"
  creditsType: text("credits_type").notNull(),
  credits: integer("credits").notNull(),
  description: text("description"),

  expiresAt: timestamp("expires_at"), // if null, the credit is valid forever
  createdAt: timestamp("created_at")
    .notNull()
    .$defaultFn(() => new Date()),
})

export const creditRelations = relations(credits, ({ one }) => ({
  user: one(user, {
    fields: [credits.userId],
    references: [user.id],
  }),
  payment: one(payment, {
    fields: [credits.paymentId],
    references: [payment.id],
  }),
}))
