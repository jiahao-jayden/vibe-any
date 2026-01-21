import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { user } from "./auth.schema"

// permission - permission definition
export const permission = pgTable(
  "permission",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(), // user:read
    resource: text("resource").notNull(), // user
    action: text("action").notNull(), // read
    title: text("title").notNull(),
    description: text("description"),
    sort: integer("sort").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("idx_permission_resource").on(t.resource)]
)

// role - role (supports inheritance)
export const role = pgTable("role", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  inherits: jsonb("inherits").$type<string[]>().default([]), // CASL: role inheritance
  isSystem: boolean("is_system").default(false).notNull(),
  status: text("status").default("active").notNull(),
  sort: integer("sort").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

// role_permission - CASL style ability rules
export const rolePermission = pgTable(
  "role_permission",
  {
    id: text("id").primaryKey(),
    roleId: text("role_id")
      .notNull()
      .references(() => role.id, { onDelete: "cascade" }),
    permissionCode: text("permission_code").notNull(), // user:read or user:* or *
    inverted: boolean("inverted").default(false).notNull(), // CASL: cannot
    conditions: jsonb("conditions").$type<{
      ownOnly?: boolean // CASL: conditional permission
      fields?: string[] // CASL: field permission
    }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_role_permission_role").on(t.roleId),
    uniqueIndex("idx_role_permission_unique").on(t.roleId, t.permissionCode),
  ]
)

// user_role
export const userRole = pgTable(
  "user_role",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => role.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_user_role_user").on(t.userId),
    uniqueIndex("idx_user_role_unique").on(t.userId, t.roleId),
  ]
)
