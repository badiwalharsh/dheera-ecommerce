# DHEERA — Production Launch & Infrastructure Configuration Checklist

**Brand:** DHEERA — Apparel & Lifestyle  
**Descriptor:** Indian Heritage, Contemporary Soul  
**Tagline:** Made in India | For the World.  
**Version:** Phase 8.8 Final Development Handoff  

---

## 1. Overview & Guardrails

This checklist provides the exact operational procedure for transitioning the DHEERA digital commerce platform from the completed local development baseline to live production infrastructure.

### Critical Safety Rules:
- **Do not enable live payment processing until bank KYC and catalog verification are complete.**
- **Do not purchase paid services or mutate production DNS until authorized by the business owner.**
- **Execute all database migrations in exact sequential order.**
- **Never expose `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_AUTH_SECRET`, or `RAZORPAY_KEY_SECRET` to the client browser.**

---

## 2. Infrastructure Setup & Verification Checklist

### Step 1: Supabase Production Project Setup
- [ ] **Create Production Supabase Organization & Project:**
  - Region: **ap-south-1 (Mumbai, India)** for low-latency domestic checkout.
  - Compute tier: Free/Pro (Pro recommended for automated daily backups and PITR).
- [ ] **Apply Database Migrations (in exact order):**
  1. `supabase/migrations/20261031000000_initial_schema.sql` (Core products, categories, orders)
  2. `supabase/migrations/20261031000001_coupons_and_checkout.sql` (Coupons & checkout session reservation)
  3. `supabase/migrations/20261031000002_payment_security_hardening.sql` (Payment signature verification & idempotency)
  4. `supabase/migrations/20261031000003_customer_accounts.sql` (User profiles, address book, customer orders)
  5. `supabase/migrations/20261031000004_customer_security_hardening.sql` (Customer RLS isolation & address security)
  6. `supabase/migrations/20261031000005_admin_management.sql` (Admin roles, CMS content, audit logs)
  7. `supabase/migrations/20261031000006_admin_security_hardening.sql` (Admin RLS restrictions & storage policies)
  8. `supabase/migrations/20261102000000_notification_queue.sql` (Authoritative durable email queue & lease recovery)
  9. `supabase/migrations/20261102000001_commercial_catalogue_readiness.sql` (Product lifecycle, tax rates, prototype deactivation)
- [ ] **Verify Row-Level Security (RLS):**
  - Verify RLS is enabled on all 11 tables (`products`, `categories`, `orders`, `order_items`, `coupons`, `profiles`, `addresses`, `customizations`, `cms_content`, `audit_logs`, `notification_queue`).
  - Verify public can only query `products` where `status = 'published' AND is_active = TRUE`.

---

### Step 2: Supabase Storage Buckets & Policies
- [ ] **Provision Canonical Public Bucket:**
  - Name: `product-images` (Public bucket = true)
  - Purpose: High-resolution garment photography (WebP, AVIF, JPEG, PNG).
  - Storage Policy: Public read; Authenticated Admin upload/delete.
- [ ] **Provision Canonical Private Bucket:**
  - Name: `customization-attachments` (Public bucket = false)
  - Purpose: Customer measurement attachments and atelier design briefs.
  - Storage Policy: Strictly service-role and authenticated owner read.

---

### Step 3: Vercel Production Deployment & Environment Variables
- [ ] **Connect Git Repository to Vercel:**
  - Framework: Next.js
  - Node.js Version: 18.x or 20.x
  - Build Command: `next build`
  - Output Directory: `.next`
- [ ] **Configure Production Environment Variables:**
  ```bash
  # Application Canonical URL
  NEXT_PUBLIC_APP_URL=https://dheera.in

  # Supabase Production Credentials
  NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-production-anon-key>
  SUPABASE_SERVICE_ROLE_KEY=<your-production-service-role-secret>

  # Administrative Security Secret (HMAC-SHA256, min 32 chars)
  ADMIN_AUTH_SECRET=<generate-via-openssl-rand-hex-32>

  # Razorpay Live Indian Payment Gateway (Only after business signoff)
  RAZORPAY_KEY_ID=rzp_live_<your-live-key>
  RAZORPAY_KEY_SECRET=<your-live-key-secret>
  RAZORPAY_WEBHOOK_SECRET=<your-live-webhook-secret>
  NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_<your-live-key>

  # Transactional Email Gateway
  RESEND_API_KEY=re_<your-live-resend-key>
  EMAIL_FROM=DHEERA Concierge <care@dheera.in>

  # Cron Authentication Token
  CRON_SECRET=<generate-via-openssl-rand-hex-32>
  ```

---

### Step 4: Custom Domain & DNS Configuration
- [ ] **Add Custom Domains in Vercel:**
  - Primary Domain: `dheera.in`
  - Redirect Domain: `www.dheera.in` -> `dheera.in` (308 Permanent Redirect)
- [ ] **Update DNS Records at Registrar:**
  - `A` Record: `@` -> `76.76.21.21` (Vercel Edge Anycast IP)
  - `CNAME` Record: `www` -> `cname.vercel-dns.com`
- [ ] **SSL/TLS Verification:**
  - Confirm Let's Encrypt / Vercel auto-issued certificate is active and serving TLS 1.3.

---

### Step 5: Transactional Email & Queue Processor
- [ ] **Authenticate Sending Domain (Resend/SendGrid):**
  - Add SPF TXT record: `v=spf1 include:amazonses.com ~all` (or provider specific).
  - Add DKIM CNAME records for cryptographic email signing.
  - Add DMARC TXT record: `v=DMARC1; p=quarantine; rua=mailto:dmarc@dheera.in`.
- [ ] **Configure Scheduled Queue Processor:**
  - Setup Vercel Cron or Cloudflare Worker to trigger `POST /api/cron/process-email-queue` every 2 minutes with header `Authorization: Bearer <CRON_SECRET>`.

---

### Step 6: Razorpay Production Activation & Webhook Lock
- [ ] **Complete Merchant KYC:**
  - Verify registered bank account, PAN, GSTIN, and website compliance pages (`/terms`, `/privacy`, `/shipping`, `/returns`, `/contact`).
- [ ] **Configure Live Webhook in Razorpay Dashboard:**
  - Webhook URL: `https://dheera.in/api/webhooks/razorpay`
  - Active Events:
    - `order.paid`
    - `payment.captured`
    - `payment.failed`
  - Secret: Matches `RAZORPAY_WEBHOOK_SECRET` in Vercel environment variables.

---

### Step 7: Database Backup & Recovery Runbook
- [ ] **Automated Backups:**
  - Enable Supabase automated daily backups (retained for 7 to 30 days).
- [ ] **Manual Backup Command:**
  - Run via Supabase CLI: `supabase db dump --data-only > dheera-backup-$(date +%Y%m%d).sql`
- [ ] **Point-In-Time Recovery (PITR):**
  - Verify PITR window is enabled in project settings for recovery down to the second.

---

### Step 8: Monitoring, Error Reporting & Observability
- [ ] **Application Error Tracking:** Connect Sentry or Vercel Error Monitoring.
- [ ] **Web Performance Analytics:** Enable Vercel Web Analytics and Speed Insights to monitor Real User Metrics (RUM), Core Web Vitals (LCP, FID, CLS).
- [ ] **Admin Audit Trail:** Regularly monitor the `audit_logs` table for administrative actions (exports, price changes, product deletions, and role assignments).
