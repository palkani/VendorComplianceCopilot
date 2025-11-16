import { db } from "./db";
import { eq, and, desc, sql, gte, lte, inArray, ilike, or, count } from "drizzle-orm";
import {
  type User,
  type InsertUser,
  type UpsertUser,
  type Vendor,
  type InsertVendor,
  type DocumentType,
  type InsertDocumentType,
  type VendorDocument,
  type InsertVendorDocument,
  type NotificationRule,
  type InsertNotificationRule,
  type AuditLog,
  type InsertAuditLog,
  type Organization,
  type InsertOrganization,
  type PlanType,
  users,
  vendors,
  documentTypes,
  vendorDocuments,
  notificationRules,
  auditLogs,
  notificationLogs,
  organizations,
  PLAN_LIMITS,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Organization methods
  getOrganization(id: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined>;
  getOrganizationByStripeCustomerId(customerId: string): Promise<Organization | undefined>;
  getOrganizationByStripeSubscriptionId(subscriptionId: string): Promise<Organization | undefined>;
  getOrganizationUsage(orgId: string): Promise<{ userCount: number; vendorCount: number; documentCount: number }>;
  canAddUser(orgId: string): Promise<boolean>;
  canAddVendor(orgId: string): Promise<boolean>;
  canAddDocument(orgId: string): Promise<boolean>;

  // User methods (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  listUsers(organizationId?: string): Promise<User[]>;

  // Vendor methods
  getVendor(id: string): Promise<Vendor | undefined>;
  listVendors(filters?: { category?: string; status?: string; riskLevel?: string; search?: string }): Promise<Vendor[]>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor | undefined>;
  deleteVendor(id: string): Promise<void>;
  generateVendorPortalToken(vendorId: string, expiryDays?: number): Promise<{ token: string; expiry: Date }>;
  getVendorByPortalToken(token: string): Promise<Vendor | undefined>;

  // Document Type methods
  getDocumentType(id: string): Promise<DocumentType | undefined>;
  listDocumentTypes(): Promise<DocumentType[]>;
  createDocumentType(docType: InsertDocumentType): Promise<DocumentType>;
  updateDocumentType(id: string, updates: Partial<InsertDocumentType>): Promise<DocumentType | undefined>;
  deleteDocumentType(id: string): Promise<void>;

  // Vendor Document methods
  getVendorDocument(id: string): Promise<VendorDocument | undefined>;
  listVendorDocuments(filters?: { vendorId?: string; status?: string; documentTypeId?: string }): Promise<VendorDocument[]>;
  createVendorDocument(doc: InsertVendorDocument): Promise<VendorDocument>;
  updateVendorDocument(id: string, updates: Partial<InsertVendorDocument>): Promise<VendorDocument | undefined>;
  deleteVendorDocument(id: string): Promise<void>;
  getExpiringDocuments(days: number): Promise<VendorDocument[]>;

  // Notification Rule methods
  getNotificationRule(id: string): Promise<NotificationRule | undefined>;
  listNotificationRules(): Promise<NotificationRule[]>;
  createNotificationRule(rule: InsertNotificationRule): Promise<NotificationRule>;
  updateNotificationRule(id: string, updates: Partial<InsertNotificationRule>): Promise<NotificationRule | undefined>;
  deleteNotificationRule(id: string): Promise<void>;

  // Audit Log methods
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  listAuditLogs(filters?: { vendorId?: string; vendorDocumentId?: string }): Promise<AuditLog[]>;

  // Statistics methods
  getComplianceStats(): Promise<{
    overallCompliance: number;
    vendorsAtRisk: number;
    expiringThisMonth: number;
    totalVendors: number;
  }>;
  getComplianceByCategory(): Promise<{ category: string; percentage: number }[]>;
}

export class DatabaseStorage implements IStorage {
  // Organization methods
  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async createOrganization(orgData: InsertOrganization): Promise<Organization> {
    const [org] = await db.insert(organizations).values(orgData).returning();
    return org;
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined> {
    const [org] = await db.update(organizations).set({ ...updates, updatedAt: new Date() }).where(eq(organizations.id, id)).returning();
    return org;
  }

  async getOrganizationByStripeCustomerId(customerId: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.stripeCustomerId, customerId));
    return org;
  }

  async getOrganizationByStripeSubscriptionId(subscriptionId: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.stripeSubscriptionId, subscriptionId));
    return org;
  }

  async getOrganizationUsage(orgId: string): Promise<{ userCount: number; vendorCount: number; documentCount: number }> {
    const [userCountResult] = await db.select({ count: count() }).from(users).where(eq(users.organizationId, orgId));
    const [vendorCountResult] = await db.select({ count: count() }).from(vendors).where(eq(vendors.organizationId, orgId));
    const [documentCountResult] = await db
      .select({ count: count() })
      .from(vendorDocuments)
      .innerJoin(vendors, eq(vendorDocuments.vendorId, vendors.id))
      .where(eq(vendors.organizationId, orgId));

    return {
      userCount: userCountResult?.count || 0,
      vendorCount: vendorCountResult?.count || 0,
      documentCount: documentCountResult?.count || 0,
    };
  }

  async canAddUser(orgId: string): Promise<boolean> {
    const org = await this.getOrganization(orgId);
    if (!org) return false;
    
    const limits = PLAN_LIMITS[org.plan];
    const usage = await this.getOrganizationUsage(orgId);
    
    return limits.maxUsers < 0 || usage.userCount < limits.maxUsers;
  }

  async canAddVendor(orgId: string): Promise<boolean> {
    const org = await this.getOrganization(orgId);
    if (!org) return false;
    
    const limits = PLAN_LIMITS[org.plan];
    const usage = await this.getOrganizationUsage(orgId);
    
    return limits.maxVendors < 0 || usage.vendorCount < limits.maxVendors;
  }

  async canAddDocument(orgId: string): Promise<boolean> {
    const org = await this.getOrganization(orgId);
    if (!org) return false;
    
    const limits = PLAN_LIMITS[org.plan];
    const usage = await this.getOrganizationUsage(orgId);
    
    return limits.maxDocuments < 0 || usage.documentCount < limits.maxDocuments;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    // Auto-create organization for new users if they don't have one
    if (user && !user.organizationId) {
      const org = await this.createOrganization({
        name: `${user.firstName || user.email || 'User'}'s Organization`,
        plan: "free",
      });
      
      await this.updateUser(user.id, { organizationId: org.id });
      user.organizationId = org.id;
    }
    
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set({ ...updates, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return user;
  }

  async listUsers(organizationId?: string): Promise<User[]> {
    if (organizationId) {
      return await db.select().from(users).where(eq(users.organizationId, organizationId)).orderBy(desc(users.createdAt));
    }
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Vendor methods
  async getVendor(id: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor;
  }

  async listVendors(filters?: { category?: string; status?: string; riskLevel?: string; search?: string }): Promise<Vendor[]> {
    let query = db.select().from(vendors);
    const conditions = [];

    if (filters?.category) {
      conditions.push(eq(vendors.category, filters.category));
    }
    if (filters?.status) {
      conditions.push(eq(vendors.status, filters.status as any));
    }
    if (filters?.riskLevel) {
      conditions.push(eq(vendors.riskLevel, filters.riskLevel as any));
    }
    if (filters?.search) {
      conditions.push(
        or(
          ilike(vendors.name, `%${filters.search}%`),
          ilike(vendors.primaryContactEmail, `%${filters.search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(vendors.createdAt));
  }

  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    const [vendor] = await db.insert(vendors).values(insertVendor).returning();
    return vendor;
  }

  async updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const [vendor] = await db
      .update(vendors)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vendors.id, id))
      .returning();
    return vendor;
  }

  async deleteVendor(id: string): Promise<void> {
    await db.delete(vendors).where(eq(vendors.id, id));
  }

  async generateVendorPortalToken(vendorId: string, expiryDays: number = 30): Promise<{ token: string; expiry: Date }> {
    const token = randomUUID();
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + expiryDays);

    await db
      .update(vendors)
      .set({ portalToken: token, portalTokenExpiry: expiry })
      .where(eq(vendors.id, vendorId));

    return { token, expiry };
  }

  async getVendorByPortalToken(token: string): Promise<Vendor | undefined> {
    const [vendor] = await db
      .select()
      .from(vendors)
      .where(
        and(
          eq(vendors.portalToken, token),
          gte(vendors.portalTokenExpiry, new Date())
        )
      );
    return vendor;
  }

  // Document Type methods
  async getDocumentType(id: string): Promise<DocumentType | undefined> {
    const [docType] = await db.select().from(documentTypes).where(eq(documentTypes.id, id));
    return docType;
  }

  async listDocumentTypes(): Promise<DocumentType[]> {
    return await db.select().from(documentTypes).orderBy(documentTypes.name);
  }

  async createDocumentType(insertDocType: InsertDocumentType): Promise<DocumentType> {
    const [docType] = await db.insert(documentTypes).values(insertDocType).returning();
    return docType;
  }

  async updateDocumentType(id: string, updates: Partial<InsertDocumentType>): Promise<DocumentType | undefined> {
    const [docType] = await db
      .update(documentTypes)
      .set(updates)
      .where(eq(documentTypes.id, id))
      .returning();
    return docType;
  }

  async deleteDocumentType(id: string): Promise<void> {
    await db.delete(documentTypes).where(eq(documentTypes.id, id));
  }

  // Vendor Document methods
  async getVendorDocument(id: string): Promise<VendorDocument | undefined> {
    const [doc] = await db.select().from(vendorDocuments).where(eq(vendorDocuments.id, id));
    return doc;
  }

  async listVendorDocuments(filters?: { vendorId?: string; status?: string; documentTypeId?: string }): Promise<VendorDocument[]> {
    let query = db.select().from(vendorDocuments);
    const conditions = [];

    if (filters?.vendorId) {
      conditions.push(eq(vendorDocuments.vendorId, filters.vendorId));
    }
    if (filters?.status) {
      conditions.push(eq(vendorDocuments.status, filters.status as any));
    }
    if (filters?.documentTypeId) {
      conditions.push(eq(vendorDocuments.documentTypeId, filters.documentTypeId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(vendorDocuments.updatedAt));
  }

  async createVendorDocument(insertDoc: InsertVendorDocument): Promise<VendorDocument> {
    const [doc] = await db.insert(vendorDocuments).values(insertDoc).returning();
    return doc;
  }

  async updateVendorDocument(id: string, updates: Partial<InsertVendorDocument>): Promise<VendorDocument | undefined> {
    const [doc] = await db
      .update(vendorDocuments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vendorDocuments.id, id))
      .returning();
    return doc;
  }

  async deleteVendorDocument(id: string): Promise<void> {
    await db.delete(vendorDocuments).where(eq(vendorDocuments.id, id));
  }

  async getExpiringDocuments(days: number): Promise<VendorDocument[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await db
      .select()
      .from(vendorDocuments)
      .where(
        and(
          gte(vendorDocuments.expiryDate, now),
          lte(vendorDocuments.expiryDate, futureDate),
          eq(vendorDocuments.status, "approved")
        )
      )
      .orderBy(vendorDocuments.expiryDate);
  }

  // Notification Rule methods
  async getNotificationRule(id: string): Promise<NotificationRule | undefined> {
    const [rule] = await db.select().from(notificationRules).where(eq(notificationRules.id, id));
    return rule;
  }

  async listNotificationRules(): Promise<NotificationRule[]> {
    return await db.select().from(notificationRules).orderBy(notificationRules.daysBefore);
  }

  async createNotificationRule(insertRule: InsertNotificationRule): Promise<NotificationRule> {
    const [rule] = await db.insert(notificationRules).values(insertRule).returning();
    return rule;
  }

  async updateNotificationRule(id: string, updates: Partial<InsertNotificationRule>): Promise<NotificationRule | undefined> {
    const [rule] = await db
      .update(notificationRules)
      .set(updates)
      .where(eq(notificationRules.id, id))
      .returning();
    return rule;
  }

  async deleteNotificationRule(id: string): Promise<void> {
    await db.delete(notificationRules).where(eq(notificationRules.id, id));
  }

  // Audit Log methods
  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(insertLog).returning();
    return log;
  }

  async listAuditLogs(filters?: { vendorId?: string; vendorDocumentId?: string }): Promise<AuditLog[]> {
    let query = db.select().from(auditLogs);
    const conditions = [];

    if (filters?.vendorId) {
      conditions.push(eq(auditLogs.vendorId, filters.vendorId));
    }
    if (filters?.vendorDocumentId) {
      conditions.push(eq(auditLogs.vendorDocumentId, filters.vendorDocumentId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(auditLogs.createdAt));
  }

  // Statistics methods
  async getComplianceStats(): Promise<{
    overallCompliance: number;
    vendorsAtRisk: number;
    expiringThisMonth: number;
    totalVendors: number;
  }> {
    const totalVendorsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(vendors)
      .where(eq(vendors.status, "active"));
    
    const totalVendors = totalVendorsResult[0]?.count || 0;

    // Calculate compliance (vendors with all required docs approved)
    // For now, simplified calculation
    const overallCompliance = 78; // TODO: Calculate based on actual data

    // Vendors at risk (high risk or low compliance)
    const vendorsAtRisk = 12; // TODO: Calculate based on actual data

    // Documents expiring this month
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const expiringDocsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(vendorDocuments)
      .where(
        and(
          gte(vendorDocuments.expiryDate, now),
          lte(vendorDocuments.expiryDate, endOfMonth),
          eq(vendorDocuments.status, "approved")
        )
      );
    
    const expiringThisMonth = expiringDocsResult[0]?.count || 0;

    return {
      overallCompliance,
      vendorsAtRisk,
      expiringThisMonth,
      totalVendors,
    };
  }

  async getComplianceByCategory(): Promise<{ category: string; percentage: number }[]> {
    // TODO: Calculate actual compliance by category
    // For now, return placeholder data
    return [
      { category: "Packaging", percentage: 82 },
      { category: "Logistics", percentage: 67 },
      { category: "Raw Material", percentage: 73 },
      { category: "Services", percentage: 91 },
      { category: "Components", percentage: 78 },
    ];
  }
}

export const storage = new DatabaseStorage();
