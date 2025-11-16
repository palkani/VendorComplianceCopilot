# Vendor Compliance Copilot

## Overview

Vendor Compliance Copilot is a SaaS platform designed to help mid-sized manufacturers and procurement teams track supplier compliance documents, manage expiry dates, and automate vendor renewal reminders. The application replaces manual spreadsheet-based compliance tracking with a centralized system that reduces the risk of non-compliance, production disruptions, and failed audits.

**Core Purpose**: Provide a single source of truth for vendor compliance documentation, including certificates (ISO 9001, ISO 27001, HACCP), insurance documents, safety certifications, contracts, and ESG/sustainability documents.

**Target Users**: Procurement managers, compliance teams, quality assurance teams, and vendors themselves through a dedicated portal interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component System**: 
- Shadcn UI component library (New York variant) with Radix UI primitives
- Tailwind CSS for styling with a custom design system
- Design follows enterprise SaaS patterns inspired by Linear, Asana, and Notion
- Responsive layout with sidebar navigation for authenticated users

**State Management**:
- TanStack Query (React Query) for server state management and API data fetching
- Query client configured with infinite stale time and disabled automatic refetching
- Custom query functions with 401 error handling for authentication flows

**Routing**: Wouter for lightweight client-side routing

**Key UI Patterns**:
- Dashboard layout with persistent sidebar (collapsible on mobile)
- Card-based information display for metrics and compliance data
- Data tables for vendor and document listings
- Status badges and risk level indicators
- Chart visualizations using Recharts for compliance metrics

### Backend Architecture

**Runtime**: Node.js with Express.js framework

**Language**: TypeScript with ES modules

**API Design**: RESTful API structure with the following patterns:
- `/api/vendors` - Vendor CRUD operations
- `/api/documents` - Document management
- `/api/stats` - Compliance statistics and analytics
- `/api/auth` - Authentication endpoints

**Request Handling**:
- JSON request body parsing with raw body preservation for webhook verification
- Request/response logging middleware for API endpoints
- Session-based authentication with HTTP-only cookies

**File Upload**: Multer middleware for handling document uploads with 10MB file size limit, storing files in local `uploads` directory

### Authentication & Authorization

**Provider**: Replit Auth with OpenID Connect (OIDC)

**Session Management**:
- Express session with PostgreSQL session store (connect-pg-simple)
- 7-day session TTL with secure, HTTP-only cookies
- Session table stored in database

**User Roles**: Enum-based role system (admin, compliance_manager, procurement_manager, read_only)

**Vendor Portal**: Token-based authentication for external vendor access using unique portal tokens with expiry dates

### Data Layer

**ORM**: Drizzle ORM

**Database Driver**: Neon serverless PostgreSQL driver with WebSocket support

**Schema Design**:
- **Users**: Authentication-compatible user table with role-based access control
- **Vendors**: Core vendor information with status tracking (active, inactive, onboarding), risk levels (low, medium, high), and portal token generation
- **Document Types**: Configurable document categories with retention policies and compliance requirements
- **Vendor Documents**: Junction table linking vendors to documents with status tracking (missing, pending, approved, rejected, expired)
- **Notification Rules**: Configurable alert rules based on expiry dates and compliance thresholds
- **Audit Logs**: Complete audit trail of all system actions
- **Notification Logs**: History of sent notifications and reminders

**Key Database Features**:
- UUID primary keys using `gen_random_uuid()`
- Timestamp tracking (createdAt, updatedAt)
- Enumerated types for status fields, risk levels, and action types
- Indexed session expiry for efficient cleanup

### Design System

**Typography**: Inter font family via Google Fonts CDN

**Color System**: HSL-based color variables supporting light and dark themes with custom CSS variables for semantic colors (primary, secondary, muted, accent, destructive)

**Spacing**: Tailwind utility classes with consistent spacing primitives (2, 4, 6, 8, 12 units)

**Component Styling**:
- Custom border radius values (9px large, 6px medium, 3px small)
- Elevation system using box shadows and opacity-based overlays
- Hover and active state transitions with elevate utilities

## External Dependencies

### Third-Party Services

**Database**: Neon serverless PostgreSQL (accessed via DATABASE_URL environment variable)

**Authentication**: Replit Auth OIDC provider (configurable via ISSUER_URL and REPL_ID)

### Key NPM Packages

**UI & Styling**:
- `@radix-ui/*` - Headless UI primitives for accessible components
- `tailwindcss` - Utility-first CSS framework
- `class-variance-authority` - Type-safe component variants
- `recharts` - Charting library for compliance visualizations
- `lucide-react` - Icon library
- `date-fns` - Date formatting and manipulation

**Backend**:
- `express` - Web application framework
- `drizzle-orm` - TypeScript ORM
- `@neondatabase/serverless` - Neon PostgreSQL driver
- `multer` - File upload middleware
- `passport` - Authentication middleware
- `openid-client` - OIDC client for Replit Auth

**Development**:
- `vite` - Build tool and dev server
- `tsx` - TypeScript execution for development
- `esbuild` - Production bundling
- `drizzle-kit` - Database migration tool

### Environment Variables

**Required**:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `REPL_ID` - Replit application identifier
- `ISSUER_URL` - OIDC provider URL (defaults to Replit OIDC)

**Optional**:
- `NODE_ENV` - Environment mode (development/production)