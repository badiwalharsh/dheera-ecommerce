# DHEERA — Business Owner Action Items & Commercial Launch Requirements

**Brand:** DHEERA — Apparel & Lifestyle  
**Descriptor:** Indian Heritage, Contemporary Soul  
**Tagline:** Made in India | For the World.  
**Version:** Final Handoff Edition  

---

## 1. Executive Summary for the Business Owner

The software engineering and digital storefront development for **DHEERA** is **100% complete**.

The website features an Indian luxury aesthetic, a complete garment cataloging and search system, a custom tailoring atelier workflow, high-resolution visual presentation, a mobile-optimized checkout, an encrypted customer account portal, an administrative dashboard with CSV import/export, and payment processing tested through Razorpay's sandbox.

To open the website to paying customers, the platform now requires your **authentic commercial assets, business identity details, and payment credentials**.

---

## 2. Priority Action Items (Owner Input Required)

### Action Item 1: Provide Genuine Commercial Garment Data
The website currently contains six prototype garments designed to test the layout and functionality. You can retire these with a single click using the **"Archive Prototypes"** button in `/admin/products`.

Please supply:
- **Product Names & SKUs:** Genuine names (e.g., *Noor Handloom Chanderi Anarkali*, SKU: `DHR-AK-001`).
- **Retail Selling Prices (INR):** Actual commercial prices and compare-at MRP prices.
- **Stock Quantities:** Units available per size (XS, S, M, L, XL, XXL) or flag as "Made to Order".
- **Fabric & Craftsmanship Details:** Authentic textile composition (e.g., *Pure Chanderi Silk*, *Tussar Silk*, *Mulmul Cotton*) and artisanal craft (e.g., *Zardozi hand-embroidery by master artisans in Lucknow*).
- **Care Instructions:** Real garment care specifications (e.g., *Dry clean only; store wrapped in unbleached muslin cloth*).

> **Tip:** You can populate your entire initial catalogue at once using the included spreadsheet: `DHEERA_PRODUCT_CATALOGUE_TEMPLATE.csv`, or add garments individually in `/admin/products/new`.

---

### Action Item 2: Provide High-Resolution Garment Photography
To preserve brand luxury and customer confidence:
- **Photo Ratio:** Strict **3:4 portrait aspect ratio** (e.g., 2400 × 3200 px).
- **Mandatory Angles per Garment:**
  1. *Hero Front View* (Full-length cover image)
  2. *Hero Back View* (Back yoke and silhouette)
  3. *Craftsmanship Detail* (Tight crop of neckline, embroidery, or zari work)
  4. *Border / Hem Work* (Scalloped edges, gota, or pallu)
  5. *Fabric Texture* (Close-up of weave and handloom texture)
  6. *Styling & Draping* (Complete look with paired accessories)
- **File Format:** JPEG, PNG, WebP, or AVIF (up to 10 MB per file).

---

### Action Item 3: Legal Entity, Taxation & Banking Details
Update the policy and footer placeholders with your registered company details:
- **Official Legal Entity Name:** (e.g., *Dheera Apparel Private Limited* or Sole Proprietorship).
- **GSTIN Number:** 15-digit GST registration number for customer tax invoices.
- **Official Registered Office / Atelier Address:** For `/contact`, `/terms`, `/privacy`, and printed shipping invoices.
- **Dedicated Customer Care Phone Number:** Official helpline for client queries.
- **WhatsApp Support Number:** (Optional) for direct styling consultations.

---

### Action Item 4: Razorpay Live Merchant Account
- **KYC Verification:** Submit company registration and bank details to Razorpay.
- **Retrieve Live API Credentials:**
  - `RAZORPAY_KEY_ID` (starts with `rzp_live_...`)
  - `RAZORPAY_KEY_SECRET`
  - `RAZORPAY_WEBHOOK_SECRET`
- **Bank Settlement Account:** Confirm linked bank account for receiving UPI, card, and net-banking payouts.

---

### Action Item 5: Production Domain Authorization
- **Domain Name:** Confirm ownership of `dheera.in` and `www.dheera.in`.
- **DNS Access:** Provide domain registrar login or update DNS records according to `DHEERA_PRODUCTION_LAUNCH_CHECKLIST.md`.

---

## 3. Recommended Launch Timeline

```
Week 1: Product Onboarding & Photography
  ├── Populate DHEERA_PRODUCT_CATALOGUE_TEMPLATE.csv
  ├── Upload high-resolution photographs at /admin/products
  └── Click "Archive Prototypes" in the admin dashboard

Week 2: Business Verification & Setup
  ├── Complete Razorpay live KYC
  ├── Confirm GSTIN and official registered address
  └── Authenticate domain email DNS (SPF, DKIM, DMARC)

Week 3: Production Deployment & Smoke Test
  ├── Connect production keys in Vercel
  ├── Connect custom domain dheera.in
  └── Perform a live ₹1 test transaction to verify banking payouts
```
