# Database Documentation

## Overview

This directory contains the database schema and migration scripts for the Vendor Compliance Copilot application.

## Files

- **schema.sql** - Complete PostgreSQL database schema with table definitions, indexes, and initial seed data
- **README.md** - This file

## Database Schema

### Core Tables

1. **users** - Application users (authenticated via Replit Auth)
2. **vendors** - Supplier/vendor registry
3. **document_types** - Configuration for required documents
4. **vendor_documents** - Compliance documents with lifecycle tracking
5. **notification_rules** - Automated reminder configuration
6. **audit_logs** - Comprehensive audit trail
7. **notification_logs** - Email notification history
8. **sessions** - Session storage for authentication

### Enums

- `user_role` - admin, compliance_manager, procurement_manager, read_only
- `vendor_status` - active, inactive, onboarding
- `risk_level` - low, medium, high
- `document_status` - missing, pending, approved, rejected, expired
- `action_type` - created, updated, approved, rejected, status_change, reminder_sent, uploaded

## Usage

### Development

The application uses **Drizzle ORM** for database management. The schema is defined in `shared/schema.ts`.

To sync schema changes:
```bash
npm run db:push
```

### Manual Database Setup

If you need to create the database manually:

```bash
# Create database
createdb vendor_compliance_copilot

# Apply schema
psql -d vendor_compliance_copilot -f database/schema.sql
```

### Production Setup

For production deployments:

1. **Create the database:**
   ```sql
   CREATE DATABASE vendor_compliance_copilot;
   ```

2. **Run the schema script:**
   ```bash
   psql -d vendor_compliance_copilot -f database/schema.sql
   ```

3. **Verify tables:**
   ```sql
   \dt
   ```

4. **Check seed data:**
   ```sql
   SELECT * FROM document_types;
   ```

## Environment Variables

Required database environment variables:

```bash
DATABASE_URL=postgresql://user:password@host:port/vendor_compliance_copilot
PGHOST=localhost
PGPORT=5432
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=vendor_compliance_copilot
```

## Seed Data

The schema includes default document types:
- ISO 9001 Certificate (required for Packaging, Raw Material, Component Supplier)
- Safety Data Sheet / SDS (required for Raw Material, Component Supplier)
- Insurance Certificate (required for Logistics, Services)
- Environmental Compliance (optional)
- Carrier License (required for Logistics)

To run custom seed scripts:
```bash
npm run seed
```

## Migrations

This project uses Drizzle Kit for migrations:

```bash
# Generate migration
npm run db:generate

# Apply migration (development)
npm run db:push

# Apply migration (production)
npm run db:migrate
```

## Backup and Restore

### Backup
```bash
pg_dump vendor_compliance_copilot > backup.sql
```

### Restore
```bash
psql vendor_compliance_copilot < backup.sql
```

## Security Considerations

1. **Never commit credentials** - Use environment variables
2. **Use connection pooling** - For production deployments
3. **Enable SSL** - For production database connections
4. **Regular backups** - Automated daily backups recommended
5. **Access control** - Use least privilege principle for database users

## Performance Optimization

The schema includes indexes on:
- Foreign keys
- Frequently queried columns (status, dates)
- Join columns

For large-scale deployments, consider:
- Partitioning `audit_logs` by date
- Adding materialized views for analytics
- Configuring connection pooling
- Monitoring slow queries

## Schema Changes

When modifying the schema:

1. Update `shared/schema.ts` (source of truth)
2. Run `npm run db:push` to sync changes
3. Update this `schema.sql` file for documentation
4. Test thoroughly in development
5. Create backup before applying to production

## Support

For issues or questions about the database schema, refer to:
- Drizzle ORM documentation: https://orm.drizzle.team/
- PostgreSQL documentation: https://www.postgresql.org/docs/
- Project documentation: ../README.md
