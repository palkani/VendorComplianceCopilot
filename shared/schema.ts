import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "compliance_manager", "procurement_manager", "read_only"]);
export const vendorStatusEnum = pgEnum("vendor_status", ["active", "inactive", "onboarding"]);
export const riskLevelEnum = pgEnum("risk_level", ["low", "medium", "high"]);
export const documentStatusEnum = pgEnum("document_status", ["missing", "pending", "approved", "rejected", "expired"]);
export const actionTypeEnum = pgEnum("action_type", ["created", "updated", "approved", "rejected", "status_change", "reminder_sent", "uploaded"]);

// Users table - compatible with Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default("read_only"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Vendors table
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  legalEntityName: text("legal_entity_name"),
  category: text("category").notNull(),
  riskLevel: riskLevelEnum("risk_level").notNull().default("low"),
  status: vendorStatusEnum("status").notNull().default("active"),
  primaryContactName: text("primary_contact_name"),
  primaryContactEmail: text("primary_contact_email"),
  primaryContactPhone: text("primary_contact_phone"),
  tags: text("tags").array(),
  portalToken: varchar("portal_token").unique(),
  portalTokenExpiry: timestamp("portal_token_expiry"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertVendorSchema = createInsertSchema(vendors).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  portalToken: true,
  portalTokenExpiry: true,
}).extend({
  tags: z.array(z.string()).optional(),
});

export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;

// Document Types table (configuration)
export const documentTypes = pgTable("document_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  applicableCategories: text("applicable_categories").array().notNull(),
  isRequired: boolean("is_required").notNull().default(true),
  expiryRequired: boolean("expiry_required").notNull().default(true),
  defaultValidityDays: integer("default_validity_days"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDocumentTypeSchema = createInsertSchema(documentTypes).omit({ 
  id: true, 
  createdAt: true 
}).extend({
  applicableCategories: z.array(z.string()).min(1),
});

export type InsertDocumentType = z.infer<typeof insertDocumentTypeSchema>;
export type DocumentType = typeof documentTypes.$inferSelect;

// Vendor Documents table
export const vendorDocuments = pgTable("vendor_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  documentTypeId: varchar("document_type_id").notNull().references(() => documentTypes.id),
  status: documentStatusEnum("status").notNull().default("missing"),
  fileName: text("file_name"),
  filePath: text("file_path"),
  fileSize: integer("file_size"),
  issueDate: timestamp("issue_date"),
  expiryDate: timestamp("expiry_date"),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  uploadedAt: timestamp("uploaded_at"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertVendorDocumentSchema = createInsertSchema(vendorDocuments).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
});

export type InsertVendorDocument = z.infer<typeof insertVendorDocumentSchema>;
export type VendorDocument = typeof vendorDocuments.$inferSelect;

// Notification Rules table
export const notificationRules = pgTable("notification_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  daysBefore: integer("days_before").notNull(),
  notifyVendor: boolean("notify_vendor").notNull().default(true),
  notifyInternal: boolean("notify_internal").notNull().default(true),
  internalRecipients: text("internal_recipients").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationRuleSchema = createInsertSchema(notificationRules).omit({ 
  id: true, 
  createdAt: true 
}).extend({
  internalRecipients: z.array(z.string()).optional(),
});

export type InsertNotificationRule = z.infer<typeof insertNotificationRuleSchema>;
export type NotificationRule = typeof notificationRules.$inferSelect;

// Audit Log table
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorDocumentId: varchar("vendor_document_id").references(() => vendorDocuments.id, { onDelete: "cascade" }),
  vendorId: varchar("vendor_id").references(() => vendors.id, { onDelete: "cascade" }),
  actionType: actionTypeEnum("action_type").notNull(),
  actorId: varchar("actor_id").references(() => users.id),
  actorType: text("actor_type").notNull(),
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ 
  id: true, 
  createdAt: true 
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Notification Log table (for tracking sent notifications)
export const notificationLogs = pgTable("notification_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorDocumentId: varchar("vendor_document_id").references(() => vendorDocuments.id, { onDelete: "cascade" }),
  recipientEmail: text("recipient_email").notNull(),
  subject: text("subject").notNull(),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  status: text("status").notNull(),
});

export type NotificationLog = typeof notificationLogs.$inferSelect;
