import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { insertVendorSchema, insertDocumentTypeSchema, insertVendorDocumentSchema, PLAN_LIMITS, type PlanType } from "@shared/schema";
import multer from "multer";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Middleware to validate vendor portal tokens
const validatePortalToken: RequestHandler = async (req, res, next) => {
  try {
    const token = req.params.token;
    if (!token) {
      return res.status(400).json({ message: "Portal token is required" });
    }

    const vendor = await storage.getVendorByPortalToken(token);
    if (!vendor) {
      return res.status(404).json({ message: "Invalid or expired portal link" });
    }

    // Attach vendor to request for downstream use
    (req as any).portalVendor = vendor;
    next();
  } catch (error) {
    console.error("Error validating portal token:", error);
    res.status(500).json({ message: "Failed to validate portal token" });
  }
};

// Set up file upload
const uploadDir = path.join(process.cwd(), "uploads");
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req: any, file: Express.Multer.File, cb: any) => {
      const uniqueName = `${randomUUID()}-${file.originalname}`;
      cb(null, uniqueName);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ===== Organization Routes =====
  
  app.get("/api/organization", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      const organization = await storage.getOrganization(user.organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(organization);
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  app.get("/api/organization/usage", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      const usage = await storage.getOrganizationUsage(user.organizationId);
      const organization = await storage.getOrganization(user.organizationId);
      const limits = PLAN_LIMITS[organization!.plan];
      
      res.json({
        usage,
        limits: {
          maxUsers: limits.maxUsers,
          maxVendors: limits.maxVendors,
          maxDocuments: limits.maxDocuments,
        },
      });
    } catch (error) {
      console.error("Error fetching organization usage:", error);
      res.status(500).json({ message: "Failed to fetch organization usage" });
    }
  });

  // ===== Stripe Payment Routes =====
  
  app.get("/api/create-checkout-session", isAuthenticated, async (req: any, res) => {
    try {
      const plan = req.query.plan as PlanType;
      if (!plan || !['pro', 'pro_plus'].includes(plan)) {
        return res.status(400).json({ message: "Invalid plan" });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.organizationId) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const organization = await storage.getOrganization(user.organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const planDetails = PLAN_LIMITS[plan];
      const priceInCents = Math.round(planDetails.price * 100);

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: planDetails.name,
                description: `${planDetails.maxUsers} users, ${planDetails.maxVendors === -1 ? 'Unlimited' : planDetails.maxVendors} vendors`,
              },
              recurring: {
                interval: 'month',
              },
              unit_amount: priceInCents,
            },
            quantity: 1,
          },
        ],
        success_url: `${req.protocol}://${req.hostname}/pricing?success=true`,
        cancel_url: `${req.protocol}://${req.hostname}/pricing?canceled=true`,
        client_reference_id: organization.id,
        customer_email: user.email || undefined,
        metadata: {
          organizationId: organization.id,
          plan: plan,
        },
      });

      res.redirect(303, session.url!);
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Stripe webhook handler
  app.post("/api/webhooks/stripe", async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    
    let event: Stripe.Event;

    if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err: any) {
        console.error(`Webhook signature verification failed:`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      event = req.body as Stripe.Event;
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const organizationId = session.metadata?.organizationId;
          const plan = session.metadata?.plan as PlanType;

          if (organizationId && plan) {
            await storage.updateOrganization(organizationId, {
              plan: plan,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              subscriptionStatus: 'active',
            });
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as any;
          const organization = await storage.getOrganizationByStripeSubscriptionId(subscription.id);
          
          if (organization) {
            await storage.updateOrganization(organization.id, {
              subscriptionStatus: subscription.status as any,
              currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined,
            });
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const organization = await storage.getOrganizationByStripeSubscriptionId(subscription.id);
          
          if (organization) {
            await storage.updateOrganization(organization.id, {
              plan: 'free',
              subscriptionStatus: 'canceled',
            });
          }
          break;
        }

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // ===== Vendor Routes =====
  
  // List all vendors with optional filters
  app.get("/api/vendors", isAuthenticated, async (req, res) => {
    try {
      const { category, status, riskLevel, search } = req.query;
      const vendors = await storage.listVendors({
        category: category as string,
        status: status as string,
        riskLevel: riskLevel as string,
        search: search as string,
      });
      res.json(vendors);
    } catch (error) {
      console.error("Error listing vendors:", error);
      res.status(500).json({ message: "Failed to list vendors" });
    }
  });

  // Get a single vendor
  app.get("/api/vendors/:id", isAuthenticated, async (req, res) => {
    try {
      const vendor = await storage.getVendor(req.params.id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      res.json(vendor);
    } catch (error) {
      console.error("Error fetching vendor:", error);
      res.status(500).json({ message: "Failed to fetch vendor" });
    }
  });

  // Create a new vendor
  app.post("/api/vendors", isAuthenticated, async (req: any, res) => {
    try {
      const vendorData = insertVendorSchema.parse(req.body);
      const vendor = await storage.createVendor(vendorData);
      
      // Create audit log
      await storage.createAuditLog({
        vendorId: vendor.id,
        actionType: "created",
        actorId: req.user.claims.sub,
        actorType: "user",
        description: `Vendor ${vendor.name} created`,
      });

      res.status(201).json(vendor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vendor data", errors: error.errors });
      }
      console.error("Error creating vendor:", error);
      res.status(500).json({ message: "Failed to create vendor" });
    }
  });

  // Update a vendor
  app.patch("/api/vendors/:id", isAuthenticated, async (req: any, res) => {
    try {
      const updates = req.body;
      const vendor = await storage.updateVendor(req.params.id, updates);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      await storage.createAuditLog({
        vendorId: vendor.id,
        actionType: "updated",
        actorId: req.user.claims.sub,
        actorType: "user",
        description: `Vendor ${vendor.name} updated`,
      });

      res.json(vendor);
    } catch (error) {
      console.error("Error updating vendor:", error);
      res.status(500).json({ message: "Failed to update vendor" });
    }
  });

  // Delete/archive a vendor
  app.delete("/api/vendors/:id", isAuthenticated, async (req: any, res) => {
    try {
      const vendor = await storage.getVendor(req.params.id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      // Soft delete by updating status to inactive
      await storage.updateVendor(req.params.id, { status: "inactive" });

      await storage.createAuditLog({
        vendorId: req.params.id,
        actionType: "updated",
        actorId: req.user.claims.sub,
        actorType: "user",
        description: `Vendor ${vendor.name} archived`,
      });

      res.json({ message: "Vendor archived successfully" });
    } catch (error) {
      console.error("Error archiving vendor:", error);
      res.status(500).json({ message: "Failed to archive vendor" });
    }
  });

  // Generate vendor portal token
  app.post("/api/vendors/:id/portal-token", isAuthenticated, async (req, res) => {
    try {
      const vendor = await storage.getVendor(req.params.id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      const { token, expiry } = await storage.generateVendorPortalToken(req.params.id);
      res.json({ token, expiry, portalUrl: `/portal/${token}` });
    } catch (error) {
      console.error("Error generating portal token:", error);
      res.status(500).json({ message: "Failed to generate portal token" });
    }
  });

  // ===== Document Type Routes =====
  
  app.get("/api/document-types", isAuthenticated, async (req, res) => {
    try {
      const documentTypes = await storage.listDocumentTypes();
      res.json(documentTypes);
    } catch (error) {
      console.error("Error listing document types:", error);
      res.status(500).json({ message: "Failed to list document types" });
    }
  });

  app.post("/api/document-types", isAuthenticated, async (req, res) => {
    try {
      const docTypeData = insertDocumentTypeSchema.parse(req.body);
      const docType = await storage.createDocumentType(docTypeData);
      res.status(201).json(docType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid document type data", errors: error.errors });
      }
      console.error("Error creating document type:", error);
      res.status(500).json({ message: "Failed to create document type" });
    }
  });

  // ===== Vendor Document Routes =====
  
  // List vendor documents with filters
  app.get("/api/vendor-documents", isAuthenticated, async (req, res) => {
    try {
      const { vendorId, status, documentTypeId } = req.query;
      const documents = await storage.listVendorDocuments({
        vendorId: vendorId as string,
        status: status as string,
        documentTypeId: documentTypeId as string,
      });
      res.json(documents);
    } catch (error) {
      console.error("Error listing vendor documents:", error);
      res.status(500).json({ message: "Failed to list vendor documents" });
    }
  });

  // List documents for a specific vendor (convenience route)
  app.get("/api/vendors/:id/documents", isAuthenticated, async (req, res) => {
    try {
      const documents = await storage.listVendorDocuments({ vendorId: req.params.id });
      res.json(documents);
    } catch (error) {
      console.error("Error listing vendor documents:", error);
      res.status(500).json({ message: "Failed to list vendor documents" });
    }
  });

  // Get a single vendor document
  app.get("/api/vendor-documents/:id", isAuthenticated, async (req, res) => {
    try {
      const document = await storage.getVendorDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  // Upload a vendor document
  app.post("/api/vendor-documents/upload", isAuthenticated, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { vendorId, documentTypeId, issueDate, expiryDate } = req.body;

      const document = await storage.createVendorDocument({
        vendorId,
        documentTypeId,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        issueDate: issueDate ? new Date(issueDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        uploadedBy: req.user.claims.sub,
        status: "pending",
      });

      await storage.createAuditLog({
        vendorDocumentId: document.id,
        vendorId,
        actionType: "uploaded",
        actorId: req.user.claims.sub,
        actorType: "user",
        description: `Document uploaded: ${req.file.originalname}`,
      });

      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Upload document for specific vendor (convenience route)
  app.post("/api/vendors/:id/documents", isAuthenticated, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { documentTypeId, issueDate, expiryDate } = req.body;
      const vendorId = req.params.id;

      const document = await storage.createVendorDocument({
        vendorId,
        documentTypeId,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        issueDate: issueDate ? new Date(issueDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        uploadedBy: req.user.claims.sub,
        uploadedAt: new Date(),
        status: "pending",
      });

      await storage.createAuditLog({
        vendorDocumentId: document.id,
        vendorId,
        actionType: "uploaded",
        actorId: req.user.claims.sub,
        actorType: "user",
        description: `Document uploaded: ${req.file.originalname}`,
      });

      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Approve a vendor document
  app.post("/api/vendor-documents/:id/approve", isAuthenticated, async (req: any, res) => {
    try {
      const { notes } = req.body;
      const document = await storage.updateVendorDocument(req.params.id, {
        status: "approved",
        approvedBy: req.user.claims.sub,
        approvedAt: new Date(),
        notes,
      });

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      await storage.createAuditLog({
        vendorDocumentId: document.id,
        vendorId: document.vendorId,
        actionType: "approved",
        actorId: req.user.claims.sub,
        actorType: "user",
        description: `Document approved`,
      });

      res.json(document);
    } catch (error) {
      console.error("Error approving document:", error);
      res.status(500).json({ message: "Failed to approve document" });
    }
  });

  // Approve document (convenience route)
  app.post("/api/documents/:id/approve", isAuthenticated, async (req: any, res) => {
    try {
      const { notes } = req.body;
      const document = await storage.updateVendorDocument(req.params.id, {
        status: "approved",
        approvedBy: req.user.claims.sub,
        approvedAt: new Date(),
        notes,
      });

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      await storage.createAuditLog({
        vendorDocumentId: document.id,
        vendorId: document.vendorId,
        actionType: "approved",
        actorId: req.user.claims.sub,
        actorType: "user",
        description: `Document approved`,
      });

      res.json(document);
    } catch (error) {
      console.error("Error approving document:", error);
      res.status(500).json({ message: "Failed to approve document" });
    }
  });

  // Reject a vendor document
  app.post("/api/vendor-documents/:id/reject", isAuthenticated, async (req: any, res) => {
    try {
      const { rejectionReason } = req.body;
      if (!rejectionReason) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }

      const document = await storage.updateVendorDocument(req.params.id, {
        status: "rejected",
        rejectionReason,
      });

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      await storage.createAuditLog({
        vendorDocumentId: document.id,
        vendorId: document.vendorId,
        actionType: "rejected",
        actorId: req.user.claims.sub,
        actorType: "user",
        description: `Document rejected: ${rejectionReason}`,
      });

      res.json(document);
    } catch (error) {
      console.error("Error rejecting document:", error);
      res.status(500).json({ message: "Failed to reject document" });
    }
  });

  // Reject document (convenience route)
  app.post("/api/documents/:id/reject", isAuthenticated, async (req: any, res) => {
    try {
      const { reason } = req.body;
      const rejectionReason = reason || req.body.rejectionReason;
      
      if (!rejectionReason) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }

      const document = await storage.updateVendorDocument(req.params.id, {
        status: "rejected",
        rejectionReason,
      });

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      await storage.createAuditLog({
        vendorDocumentId: document.id,
        vendorId: document.vendorId,
        actionType: "rejected",
        actorId: req.user.claims.sub,
        actorType: "user",
        description: `Document rejected: ${rejectionReason}`,
      });

      res.json(document);
    } catch (error) {
      console.error("Error rejecting document:", error);
      res.status(500).json({ message: "Failed to reject document" });
    }
  });

  // ===== Vendor Portal Routes (Public with token validation) =====
  
  app.get("/api/portal/:token", validatePortalToken, async (req: any, res) => {
    try {
      res.json(req.portalVendor);
    } catch (error) {
      console.error("Error fetching vendor by token:", error);
      res.status(500).json({ message: "Failed to fetch vendor" });
    }
  });

  app.get("/api/portal/:token/documents", validatePortalToken, async (req: any, res) => {
    try {
      const documents = await storage.listVendorDocuments({ vendorId: req.portalVendor.id });
      res.json(documents);
    } catch (error) {
      console.error("Error fetching portal documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // ===== Statistics Routes =====
  
  app.get("/api/stats/compliance", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getComplianceStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching compliance stats:", error);
      res.status(500).json({ message: "Failed to fetch compliance stats" });
    }
  });

  app.get("/api/stats/compliance-by-category", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getComplianceByCategory();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching compliance by category:", error);
      res.status(500).json({ message: "Failed to fetch compliance by category" });
    }
  });

  app.get("/api/stats/expiring-documents", isAuthenticated, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 90;
      const documents = await storage.getExpiringDocuments(days);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching expiring documents:", error);
      res.status(500).json({ message: "Failed to fetch expiring documents" });
    }
  });

  // ===== Audit Log Routes =====
  
  app.get("/api/audit-logs", isAuthenticated, async (req, res) => {
    try {
      const { vendorId, vendorDocumentId } = req.query;
      const logs = await storage.listAuditLogs({
        vendorId: vendorId as string,
        vendorDocumentId: vendorDocumentId as string,
      });
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
