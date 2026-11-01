# DHEERA — Backup, Disaster Recovery & Restoration Runbook

**Brand:** DHEERA — Apparel & Lifestyle  
**Descriptor:** Indian Heritage, Contemporary Soul  
**Phase:** 8.1 Production Infrastructure Verification & Deployment Safety Audit  

---

## 1. Disaster Recovery Readiness & Verification Status

> [!IMPORTANT]
> **Status Classification:**
> - **Live Automated Backups & PITR:** **NOT VERIFIED**  
>   *(No live production Supabase Pro project is provisioned yet. Seven-day PITR and sub-minute RPO are architectural targets and recommendations; they cannot be confirmed as active until a paid production organization is linked.)*
> - **Logical Database Dump Procedure:** **VERIFIED (Documented & Runnable Script)**
> - **Restoration Sequencing & Rollback:** **VERIFIED (Documented Runbook)**

### Target Metrics vs. Current Verification State

| Capability | Target Metric | Classification | Implementation Status |
|---|---|---|---|
| **Point-In-Time Recovery (PITR)** | Sub-minute RPO, 7-day retention | **NOT VERIFIED** (Documented Recommendation) | Requires Supabase Pro/Team tier add-on ($100/mo). Cannot be claimed on free/local environments. |
| **Daily Logical Backup** | 24-hour RPO | **DOCUMENTED PROCEDURE** | Scheduled `pg_dump` or Supabase CLI automated snapshot. |
| **Recovery Time Objective (RTO)** | < 30 minutes | **ESTIMATED TARGET** | Estimated for standard database sizes (< 50 GB) based on network egress and restoration execution. |
| **Storage Asset Recovery** | 24-hour RPO | **DOCUMENTED PROCEDURE** | Storage bucket sync between Supabase S3/GCS backend and cold replica. |

---

## 2. Logical Database Backup Procedure

### 2.1 Supabase CLI Snapshot (Recommended for Dev/Staging/Pre-Prod)
```bash
# Export complete database schema and data
supabase db dump --data-only -f dheera_data_backup_$(date +%Y%m%d_%H%M%S).sql
supabase db dump --role-only -f dheera_roles_backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2.2 Direct PostgreSQL Logical Backup (`pg_dump`)
```bash
# Set connection string for production database (obtained from Supabase Settings -> Database)
# Format: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres

export PG_DUMP_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

# Dump entire schema and data with compression
pg_dump "$PG_DUMP_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --verbose \
  --file="dheera_prod_backup_$(date +%Y%m%d_%H%M%S).dump"
```

---

## 3. Storage Object Backup Considerations

Supabase Storage consists of two separate layers:
1. **Database Metadata Layer (`storage.buckets` and `storage.objects` tables):**
   Included within the standard PostgreSQL logical database backup. Contains file names, mime types, file sizes, owners, and bucket IDs.
2. **Binary Storage Layer (S3-compatible Object Storage):**
   The actual image files and customization documents reside in Supabase's underlying object store.
   - **Backup Strategy:** Use AWS CLI or S3-compatible tool with Supabase S3 credentials:
     ```bash
     # Sync product images and customization attachments to secondary secure cold storage
     aws s3 sync s3://product-images s3://dheera-cold-backup/product-images/ --endpoint-url https://[PROJECT_REF].supabase.co/storage/v1/s3
     ```

---

## 4. Environment Variables & Secret Recovery

Never store production secrets in database dumps or Git repositories. Maintain an encrypted offline secret vault (e.g. 1Password / AWS Secrets Manager) containing:
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_AUTH_SECRET`
- `RAZORPAY_KEY_ID` / `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `RESEND_API_KEY`

---

## 5. Restoration Ordering & Execution Sequence

When restoring a damaged or corrupted database, execute in strict dependency order:

1. **Step 1: Provision Clean Database Target**
   Ensure the destination instance is accessible and has matching PostgreSQL extensions (`uuid-ossp`, `pgcrypto`).
2. **Step 2: Apply Sequential Schema Migrations**
   Run `supabase migration up` to create all tables, indexes, constraints, enums, triggers, and RLS policies.
3. **Step 3: Restore Data Records**
   Restore table data in top-down relational order:
   - `users` (Auth)
   - `categories`, `fabrics`, `weaves`
   - `products`, `product_variants`, `product_images`
   - `coupons`, `orders`, `order_items`, `payments`, `webhook_events`
   - `admin_users`, `audit_logs`, `customization_requests`, `store_settings`
4. **Step 4: Restore Storage Objects**
   Ensure bucket entries exist in `storage.buckets` before restoring `storage.objects`.
5. **Step 5: Post-Restore Health & Integrity Validation**
   - Execute verification query: verify `orders` count, `products` count, `audit_logs` immutability.
   - Test admin login via `/admin/login`.
   - Test storefront product retrieval via `/api/products`.
   - Verify public image access from `product-images` bucket.

---

## 6. Disaster Rollback Procedure

If a deployed migration or infrastructure update causes an outage:
1. **Immediate Action:** Switch Vercel deployment back to previous stable deployment instant rollback in Vercel dashboard.
2. **Database Rollback:** If data corruption occurred, restore the pre-deployment logical dump to an isolated staging database, verify integrity, and switch the application connection pooler URL.
3. **Audit Trail:** Log the incident in `audit_logs` including trigger cause, downtime duration, and remediation steps.
