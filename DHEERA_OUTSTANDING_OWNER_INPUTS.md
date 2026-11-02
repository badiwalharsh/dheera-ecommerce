# DHEERA — Outstanding Business Owner Inputs & Pre-Launch Actions

**Brand:** DHEERA — Apparel & Lifestyle  
**Descriptor:** Indian Heritage, Contemporary Soul  
**Tagline:** Made in India | For the World.  
**Platform Version:** Phase 8.7 Complete  

---

## 1. Overview

The technical implementation of the DHEERA digital commerce platform is 100% complete and fully verified with **368/368 passing automated tests** across all 16 test suites, and a **79-route Next.js production build**.

The application has been engineered with strict safety mechanisms to protect customer data and brand reputation. Before the website is opened to the public, the business owner must provide the authentic commercial credentials, legal identifiers, and product assets detailed in this document.

---

## 2. Itemized Pre-Launch Checklist

### Category A: Payment Gateway & Banking (Mandatory for Commercial Orders)
- [ ] **Razorpay Live API Keys:**
  - `RAZORPAY_KEY_ID`: Live key starting with `rzp_live_...`
  - `RAZORPAY_KEY_SECRET`: Live secret from Razorpay Dashboard
  - *Current Status:* Running strictly on Sandbox Test Key (`rzp_test_...`).
- [ ] **Razorpay Live Webhook:**
  - `RAZORPAY_WEBHOOK_SECRET`: Configured in Razorpay dashboard pointing to `https://dheera.in/api/webhooks/razorpay`.
  - Subscribed events: `payment.captured`, `payment.failed`, `order.paid`.
- [ ] **Settlement Bank Account:** Verified current account for daily/weekly UPI/card payouts.

### Category B: Commercial Garment Inventory & Photography
- [ ] **Initial Garment Batch (Minimum 6–12 Real Products):**
  - High-resolution photographs (2400 × 3200 px, 3:4 portrait) covering Front, Back, Detail, Border, Fabric, and Styling.
  - Verified fabric composition labels (e.g., "100% Handloom Chanderi Silk", "Mulmul Cotton").
  - Confirmed retail selling prices (INR) and GST tax rates (typically 5% for apparel ≤ ₹1,000; 12% for apparel > ₹1,000).
  - Confirmed SKU numbering system.
  - Actual stock counts per size (XS, S, M, L, XL, XXL).
- [ ] **Retire Prototype Garments:**
  - Click "Archive Prototypes" in `/admin/products` to ensure only authentic commercial inventory is visible to shoppers.

### Category C: Legal & Business Contact Information
- [ ] **Registered Business Legal Entity:**
  - Official registered entity name (e.g., "Dheera Apparel Private Limited" or LLP/Sole Proprietorship).
  - GSTIN (15-digit Goods and Services Tax Identification Number).
  - Official physical address of atelier/registered office for invoice footers, Terms, and Privacy Policy.
- [ ] **Customer Care Communication:**
  - Official customer support telephone / helpline number (to replace placeholder in footer and contact page).
  - Official WhatsApp support number for customer inquiries.
  - Official support email address (`care@dheera.in` DNS setup for inbound replies).

### Category D: Logistics & Courier Integration
- [ ] **Domestic Logistics Carrier Partnership:**
  - Shipping partner account (e.g., Shiprocket, Delhivery, BlueDart).
  - Return pickup policy rules and designated warehouse return address.
  - Domestic free-shipping threshold confirmation (currently set to provisional ₹5,000).
- [ ] **International Shipping Carrier Partnership (Optional for Phase 1):**
  - DHL Express / FedEx cross-border account.
  - Customs HS codes (Harmonized System codes for Indian ethnic wear, e.g., 6204 for women's ensembles).

### Category E: Domain & DNS Configuration
- [ ] **Production Domain Activation:**
  - DNS `A` records and `CNAME` for `dheera.in` and `www.dheera.in` pointing to Vercel production edge IP.
  - SSL/TLS certificate auto-issuance through Vercel.
- [ ] **Transactional Email DNS Records:**
  - Resend or SendGrid SPF, DKIM, and DMARC DNS records for `dheera.in` to ensure transactional emails do not land in spam.

---

## 3. Safe Step-by-Step Launch Sequence

When the business owner is ready to launch:

1. **Upload Commercial Inventory:**
   - Log into `/admin/products` as Administrator.
   - Use the CSV import tool (`DHEERA_PRODUCT_CATALOGUE_TEMPLATE.csv`) or the "Create New Garment" form to add genuine inventory.
   - Upload high-resolution photographs and select primary cover images.
2. **Archive Prototypes:**
   - Click the "Archive Prototypes" button in the admin products toolbar.
3. **Connect Production Keys:**
   - In Vercel Project Settings > Environment Variables, update `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `NEXT_PUBLIC_APP_URL`.
4. **Link Custom Domain:**
   - Connect `dheera.in` in Vercel domains.
5. **Execute Smoke Test:**
   - Perform a live 1-rupee test checkout to verify bank settlement and automated invoice generation.
