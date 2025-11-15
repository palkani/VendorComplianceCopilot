import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { insertVendorSchema, insertDocumentTypeSchema, insertVendorDocumentSchema } from "@shared/schema";
import multer from "multer";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";

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

  // ===== Vendor Portal Routes (Public with token) =====
  
  app.get("/api/portal/:token", async (req, res) => {
    try {
      const vendor = await storage.getVendorByPortalToken(req.params.token);
      if (!vendor) {
        return res.status(404).json({ message: "Invalid or expired portal link" });
      }
      res.json(vendor);
    } catch (error) {
      console.error("Error fetching vendor by token:", error);
      res.status(500).json({ message: "Failed to fetch vendor" });
    }
  });

  app.get("/api/portal/:token/documents", async (req, res) => {
    try {
      const vendor = await storage.getVendorByPortalToken(req.params.token);
      if (!vendor) {
        return res.status(404).json({ message: "Invalid or expired portal link" });
      }

      const documents = await storage.listVendorDocuments({ vendorId: vendor.id });
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
