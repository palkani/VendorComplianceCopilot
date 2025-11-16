-- Vendor Compliance Copilot - Database Schema
-- PostgreSQL Database Creation Script
-- Generated from Drizzle ORM Schema

-- =====================================================
-- ENUMS
-- =====================================================

-- User roles
CREATE TYPE user_role AS ENUM (
    'admin',
    'compliance_manager',
    'procurement_manager',
    'read_only'
);

-- Vendor status
CREATE TYPE vendor_status AS ENUM (
    'active',
    'inactive',
    'onboarding'
);

-- Risk levels
CREATE TYPE risk_level AS ENUM (
    'low',
    'medium',
    'high'
);

-- Document status
CREATE TYPE document_status AS ENUM (
    'missing',
    'pending',
    'approved',
    'rejected',
    'expired'
);

-- Audit action types
CREATE TYPE action_type AS ENUM (
    'created',
    'updated',
    'approved',
    'rejected',
    'status_change',
    'reminder_sent',
    'uploaded'
);

-- =====================================================
-- TABLES
-- =====================================================

-- Sessions table for Replit Auth (connect-pg-simple)
CREATE TABLE sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

CREATE INDEX IDX_session_expire ON sessions (expire);

COMMENT ON TABLE sessions IS 'Session storage for Replit authentication';

-- =====================================================

-- Users table
CREATE TABLE users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    role user_role NOT NULL DEFAULT 'read_only',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Application users authenticated via Replit Auth';
COMMENT ON COLUMN users.role IS 'User role determines access permissions';

-- =====================================================

-- Vendors table
CREATE TABLE vendors (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    legal_entity_name TEXT,
    category TEXT NOT NULL,
    risk_level risk_level NOT NULL DEFAULT 'low',
    status vendor_status NOT NULL DEFAULT 'active',
    primary_contact_name TEXT,
    primary_contact_email TEXT,
    primary_contact_phone TEXT,
    tags TEXT[],
    portal_token VARCHAR UNIQUE,
    portal_token_expiry TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE vendors IS 'Supplier/vendor registry with contact information';
COMMENT ON COLUMN vendors.portal_token IS 'Unique token for external vendor portal access';
COMMENT ON COLUMN vendors.tags IS 'Flexible tagging system for vendor categorization';

-- =====================================================

-- Document Types table
CREATE TABLE document_types (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    applicable_categories TEXT[] NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    expiry_required BOOLEAN NOT NULL DEFAULT TRUE,
    default_validity_days INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE document_types IS 'Configuration for document types and requirements';
COMMENT ON COLUMN document_types.applicable_categories IS 'Vendor categories where this document type is required';
COMMENT ON COLUMN document_types.default_validity_days IS 'Default validity period for document renewal reminders';

-- =====================================================

-- Vendor Documents table
CREATE TABLE vendor_documents (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id VARCHAR NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    document_type_id VARCHAR NOT NULL REFERENCES document_types(id),
    status document_status NOT NULL DEFAULT 'missing',
    file_name TEXT,
    file_path TEXT,
    file_size INTEGER,
    issue_date TIMESTAMP,
    expiry_date TIMESTAMP,
    uploaded_by VARCHAR REFERENCES users(id),
    uploaded_at TIMESTAMP,
    approved_by VARCHAR REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE vendor_documents IS 'Compliance documents uploaded by or for vendors';
COMMENT ON COLUMN vendor_documents.status IS 'Document lifecycle status (missing -> pending -> approved/rejected)';
COMMENT ON COLUMN vendor_documents.expiry_date IS 'Document expiration date for renewal tracking';

-- =====================================================

-- Notification Rules table
CREATE TABLE notification_rules (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    days_before INTEGER NOT NULL,
    notify_vendor BOOLEAN NOT NULL DEFAULT TRUE,
    notify_internal BOOLEAN NOT NULL DEFAULT TRUE,
    internal_recipients TEXT[],
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notification_rules IS 'Automated notification rules for document expiry reminders';
COMMENT ON COLUMN notification_rules.days_before IS 'Number of days before expiry to send notification';
COMMENT ON COLUMN notification_rules.internal_recipients IS 'Email addresses for internal notification recipients';

-- =====================================================

-- Audit Logs table
CREATE TABLE audit_logs (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_document_id VARCHAR REFERENCES vendor_documents(id) ON DELETE CASCADE,
    vendor_id VARCHAR REFERENCES vendors(id) ON DELETE CASCADE,
    action_type action_type NOT NULL,
    actor_id VARCHAR REFERENCES users(id),
    actor_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for compliance tracking';
COMMENT ON COLUMN audit_logs.actor_type IS 'Type of actor: user, system, vendor';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context data in JSON format';

-- =====================================================

-- Notification Logs table
CREATE TABLE notification_logs (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_document_id VARCHAR REFERENCES vendor_documents(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL
);

COMMENT ON TABLE notification_logs IS 'Log of all sent notification emails';
COMMENT ON COLUMN notification_logs.status IS 'Email delivery status: sent, delivered, bounced, failed';

-- =====================================================
-- INDEXES (for performance)
-- =====================================================

-- Vendor Documents indexes
CREATE INDEX idx_vendor_documents_vendor_id ON vendor_documents(vendor_id);
CREATE INDEX idx_vendor_documents_document_type_id ON vendor_documents(document_type_id);
CREATE INDEX idx_vendor_documents_status ON vendor_documents(status);
CREATE INDEX idx_vendor_documents_expiry_date ON vendor_documents(expiry_date);

-- Audit Logs indexes
CREATE INDEX idx_audit_logs_vendor_document_id ON audit_logs(vendor_document_id);
CREATE INDEX idx_audit_logs_vendor_id ON audit_logs(vendor_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Notification Logs indexes
CREATE INDEX idx_notification_logs_vendor_document_id ON notification_logs(vendor_document_id);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at);

-- Vendors indexes
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_category ON vendors(category);

-- =====================================================
-- INITIAL DATA (Optional - seed data)
-- =====================================================

-- Default document types (matching server/seed.ts)
INSERT INTO document_types (name, description, applicable_categories, is_required, expiry_required, default_validity_days)
VALUES
    ('ISO 9001 Certificate', 'Quality management system certification', ARRAY['Packaging', 'Raw Material', 'Component Supplier'], TRUE, TRUE, 365),
    ('Safety Data Sheet (SDS)', 'Material safety information', ARRAY['Raw Material', 'Component Supplier'], TRUE, FALSE, NULL),
    ('Insurance Certificate', 'Liability insurance documentation', ARRAY['Logistics', 'Services'], TRUE, TRUE, 365),
    ('Environmental Compliance', 'Environmental certifications and permits', ARRAY['Raw Material', 'Packaging', 'Component Supplier'], FALSE, TRUE, 730),
    ('Carrier License', 'Transportation operating license', ARRAY['Logistics'], TRUE, TRUE, 365)
ON CONFLICT DO NOTHING;

-- =====================================================
-- NOTES
-- =====================================================

-- This schema uses:
-- - VARCHAR with gen_random_uuid() for all primary keys
-- - Proper foreign key constraints with CASCADE delete
-- - JSONB for flexible metadata storage
-- - Array types for tags and multi-value fields
-- - Timestamps with automatic NOW() defaults
-- - Comprehensive indexes for query performance
-- - Comment documentation for all tables and key columns

-- To apply this schema:
-- 1. Ensure PostgreSQL 12+ is installed
-- 2. Create database: CREATE DATABASE vendor_compliance_copilot;
-- 3. Run this script: psql -d vendor_compliance_copilot -f schema.sql

-- For production deployments:
-- - Review and adjust default values
-- - Consider partitioning for audit_logs if high volume
-- - Set up automated backups
-- - Configure proper user permissions and roles
