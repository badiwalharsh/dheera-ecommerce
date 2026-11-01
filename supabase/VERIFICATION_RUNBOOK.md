# DHEERA — Database Migration Verification & Idempotency Runbook

**Brand:** DHEERA — Apparel & Lifestyle  
**Descriptor:** Indian Heritage, Contemporary Soul  
**Phase:** 8.1 Production Infrastructure Verification & Deployment Safety Audit  

---

## 1. Executive Summary & Migration Inventory

The DHEERA PostgreSQL schema is managed across seven sequential SQL migration files within `supabase/migrations/`. Each migration builds upon previous schema definitions and security primitives.

| Sequence | Migration File | Scope & Target Objects | Target Role & Primitives | Classification |
|---|---|---|---|---|
| **01** | `20261031000000_initial_schema.sql` | `uuid-ossp`, `pgcrypto`, 15 tables, 5 enums, 30 RLS policies, updated_at triggers | Schema foundation, Storefront & Orders | **Run-Once** |
| **02** | `20261031000001_coupons_and_checkout.sql` | `coupons`, `coupon_redemptions`, order discount columns, 4 RLS policies | Promotions & Cart discounts | **Run-Once** |
| **03** | `20261031000002_payment_security_hardening.sql` | `webhook_events`, unique `event_id`, atomic inventory function | Payment verification & Idempotency | **Run-Once** |
| **04** | `20261031000003_customer_accounts.sql` | `saved_addresses`, `wishlist_items`, guest order association | Customer Portal & Profiles | **Run-Once** |
| **05** | `20261031000004_customer_security_hardening.sql` | Hardened `associate_guest_orders()`, `handle_new_user()` trigger | Supabase Auth Security | **Repeatable** |
| **06** | `20261031000005_admin_management.sql` | `admin_users`, `audit_logs`, `customization_requests`, `store_settings`, storage buckets | Administration & CMS | **Run-Once** |
| **07** | `20261031000006_admin_security_hardening.sql` | Append-only `audit_logs`, storage RLS policies, function privilege revocations | Enterprise Admin Security | **Repeatable** |

---

## 2. Run-Once vs. Repeatable Migrations

### 2.1 Why `CREATE TABLE IF NOT EXISTS` Is Insufficient for Naive Re-Execution
While `CREATE TABLE IF NOT EXISTS` prevents catastrophic table creation errors on existing tables, PostgreSQL will fail during re-execution of unadorned DDL statements:
1. **Policies (`CREATE POLICY`):** PostgreSQL throws `ERROR: policy "<name>" for relation "<table_name>" already exists`.
2. **Custom Enums (`CREATE TYPE ... AS ENUM`):** PostgreSQL throws `ERROR: type "<enum_name>" already exists`.
3. **Foreign Keys / Constraints (`ADD CONSTRAINT`):** Throws `ERROR: constraint "<constraint_name>" for relation "<table_name>" already exists`.

### 2.2 Classification Rules
- **Run-Once Migrations (000000, 000001, 000002, 000003, 000005):**
  These migrations are designed to be applied **once and only once** by the migration runner (`supabase migration up` or Supabase CLI). They record their applied state in `supabase_migrations.schema_migrations`.
- **Repeatable / Hardening Migrations (000004, 000006):**
  These migrations use defensive constructs:
  - `CREATE OR REPLACE FUNCTION ...`
  - `DROP POLICY IF EXISTS ... CREATE POLICY ...`
  - `DROP TRIGGER IF EXISTS ... CREATE TRIGGER ...`
  - `REVOKE ... / GRANT ...`
  - `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;`
  They can safely be re-executed multiple times without altering schema semantics or producing fatal SQL exceptions.

---

## 3. Disposable Database Verification Procedure

To verify migrations without touching production data, use a **disposable local or branched database container**.

### Step 3.1: Initialize Disposable Test Environment
```bash
# 1. Ensure local Supabase CLI is installed and running
supabase start

# 2. Reset the disposable database to pristine blank state
supabase db reset

# 3. Apply all migrations sequentially from clean state
supabase migration up
```

### Step 3.2: Verify Table & RLS Policy Creation
Execute the following verification query against the disposable database:
```sql
-- 1. Verify all 18 application tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Verify Row-Level Security is enabled on every public table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = FALSE;
-- Expected result: 0 rows (all public tables MUST have rowsecurity = true)

-- 3. Verify immutability of audit_logs (append-only)
SELECT polname, polcmd, polroles::regrole[] 
FROM pg_policy 
WHERE polrelid = 'public.audit_logs'::regclass;
-- Expected: SELECT policy and INSERT policy only. No UPDATE or DELETE policy.

-- 4. Verify storage buckets exist and have proper publicity
SELECT id, name, public 
FROM storage.buckets 
ORDER BY id;
-- Expected:
--   customization-attachments | false
--   customizations            | false
--   product-images            | true
--   products                  | true
```

### Step 3.3: Verify SECURITY DEFINER Function Privileges
```sql
-- Verify guest order association cannot be executed by anon
SELECT routine_name, grantee, privilege_type 
FROM information_schema.routine_privileges 
WHERE routine_schema = 'public' 
  AND routine_name = 'associate_guest_orders';
-- Expected: 'authenticated' role only. No 'anon' or 'public'.
```

---

## 4. Safety Guardrails Against Accidental Production Mutation

1. **Never run `supabase db reset` in production or staging environments.**
2. **Never execute raw SQL files directly against live databases without recording into `supabase_migrations.schema_migrations`.**
3. **Always take a pre-migration logical snapshot before running schema changes on live databases.**
