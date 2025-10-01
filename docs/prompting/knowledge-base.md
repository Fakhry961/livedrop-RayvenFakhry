# Shoplite Knowledge Base

## Document 01: Shoplite User Registration Process
**Topic:** User registration & account types

To create a Shoplite account, users visit the registration page and provide an email address, password, and a display name. After submitting, a verification email is sent; users must verify within 24 hours or the registration token expires. Shoplite supports two primary account types: Buyer and Seller. Buyer accounts are free and enable browsing, buying, saving favorites, writing reviews, and tracking orders. Seller accounts require additional business information: company name, registration ID/tax ID, bank or payout information, and a short description of the seller's product categories.

Seller verification requires uploading supporting documents (business license or tax ID) and typically takes 2–3 business days for manual review. During this time, sellers can complete their storefront setup but cannot create public product listings until verification completes. Password policy: minimum 10 characters, at least one uppercase letter, one digit, and one special character. Two-factor authentication (2FA) via SMS or authenticator apps is optional but recommended for sellers. For account recovery, users can request a recovery link sent to the registered email; the link expires after 1 hour.

**Word Count:** 261

---

## Document 02: Product Search and Filtering
**Topic:** Search, filters, and personalization

Shoplite’s search engine supports keyword queries, category navigation, and natural language phrases such as “red running shoes under $50.” The search algorithm considers product title, description, and seller tags. Results can be sorted by relevance, price, popularity, or newest listings. Filters allow narrowing by price range, brand, size, material, shipping method, and seller rating. Multiple filters may be combined, and users can save preferred filter sets to their profile.

Personalized search results are generated using a combination of browsing history, wishlist items, and prior purchases. For example, a user who frequently shops for electronics will see more technology-related recommendations higher in search. Sponsored products are clearly labeled and appear alongside organic results but never replace them. Search latency is optimized to return results within 300 ms at the 95th percentile. Search history can be cleared at any time through account settings.

**Word Count:** 237

---

## Document 03: Shopping Cart and Checkout
**Topic:** Cart features and checkout workflow

The Shoplite shopping cart allows users to add multiple items, adjust quantities, and remove products before checkout. The cart supports cross-seller purchases, meaning items from multiple sellers can be checked out in a single order. Items remain in the cart for up to 30 days unless purchased or removed. Cart persistence is enabled across devices for logged-in users.

At checkout, users confirm shipping address, shipping method, and payment option. Shipping costs and estimated delivery dates are displayed before payment confirmation. Taxes and duties are calculated automatically based on the delivery region. The checkout process consists of three steps: (1) Review items, (2) Enter or confirm delivery details, (3) Confirm and pay. To improve conversion, Shoplite saves partially completed checkouts for 24 hours and can send a reminder notification. Payment methods include credit/debit cards, PayPal, and Shoplite Wallet.

**Word Count:** 226

---

## Document 04: Payment Methods and Security
**Topic:** Supported payment methods & compliance

Shoplite accepts major credit and debit cards, PayPal, Shoplite Wallet, and select region-specific methods (e.g., SEPA in Europe). All transactions are processed by PCI-DSS compliant payment processors. Shoplite itself does not store raw card numbers; instead, it stores payment tokens provided by processors. These tokens allow repeat billing without re-entering card information.

TLS 1.3 encryption secures all payment traffic between the user’s device and Shoplite servers. Multi-factor authentication may be required for high-value transactions in accordance with local Strong Customer Authentication (SCA) rules. Fraud detection algorithms monitor suspicious activity such as unusual order amounts, mismatched shipping addresses, or repeated failed attempts. If flagged, orders may require manual review before processing. Users can manage saved payment methods under Account → Payment Settings, where they can delete cards at any time. Refunds are always processed back to the original payment method.

**Word Count:** 242

---

## Document 05: Order Tracking and Notifications
**Topic:** Order lifecycle and real-time tracking

Once an order is placed, Shoplite generates a unique order ID and sends a confirmation email. Sellers must confirm order acceptance within 24 hours or the order is automatically canceled. When the seller ships the item, they upload tracking information from partnered carriers such as DHL, FedEx, and UPS. Buyers can track real-time status updates on their Orders page. Typical statuses include: “Processing,” “Shipped,” “In Transit,” “Out for Delivery,” and “Delivered.”

Shoplite also provides push notifications and optional SMS alerts when key status changes occur. Delivery estimates are calculated using historical carrier performance and provided at checkout. Buyers can report delivery issues directly from the order page, triggering support workflows for late or lost shipments. Orders remain visible for two years, after which they are archived for compliance.

**Word Count:** 225

---

## Document 06: Returns and Refund Policy
**Topic:** Return eligibility, process, and refunds

Shoplite offers a 30-day return window for most items, beginning from the delivery date. Certain categories such as perishable goods, digital downloads, and hygiene products are non-returnable unless defective. To initiate a return, buyers must log in, open the order details, and select “Request Return.” A Return Authorization (RA) number is generated, along with printable shipping instructions. The buyer must ship the item back within 7 days of RA approval.

Once the seller receives the returned item, they have 5 business days to inspect and confirm condition. If approved, a refund is issued to the original payment method within 3–7 business days depending on the bank. Partial refunds may apply if the product shows wear inconsistent with normal testing. If a dispute arises, Shoplite mediation ensures fair resolution. All return shipping costs are displayed during the return initiation process; in some cases, sellers cover shipping fees.

**Word Count:** 251

---

## Document 07: Reviews and Ratings
**Topic:** Buyer reviews & seller reputation

After receiving an order, buyers can rate products on a 1–5 star scale and leave written reviews. Reviews can include photos, but videos are limited to 30 seconds. Only verified buyers can post reviews. Reviews appear on product pages and contribute to a seller’s overall reputation score. Sellers may publicly respond to reviews but cannot delete them. Reviews violating content guidelines (e.g., hate speech, personal info, irrelevant promotion) can be reported for moderation.

Review scores impact search ranking, as higher-rated items are prioritized in results. Sellers with consistently low ratings may be flagged for account review. Shoplite encourages authentic feedback by sending email reminders to customers 7 days after delivery. Buyers can edit or delete their reviews within 14 days of posting. Reviews older than 24 months are archived and no longer affect rankings.

**Word Count:** 236

---

## Document 08: Seller Account Setup and Verification
**Topic:** Seller onboarding requirements

To open a seller account, businesses must provide legal business details including company registration number, tax ID, and banking information for payouts. Sellers must upload official documentation such as a business license or certificate of incorporation. Shoplite reviews these documents within 2–3 business days. During this review, sellers may set up storefront branding, product categories, and inventory but cannot publish items for sale until approval.

Once approved, sellers gain access to the Seller Dashboard, which includes analytics, order management, and customer messaging tools. All payouts are issued weekly via bank transfer, subject to a minimum threshold of $50. Sellers must comply with Shoplite’s prohibited items policy and failure to do so may result in suspension. Two-factor authentication is strongly recommended for all seller accounts to protect sensitive data.

**Word Count:** 232

---

## Document 09: Inventory Management for Sellers
**Topic:** Stock management across warehouses

Sellers manage inventory using the Seller Dashboard or via API. Shoplite supports multiple warehouses per seller. Inventory updates are synced every 5 minutes via scheduled delta updates or instantly via webhook push if configured. When an order is placed, Shoplite reserves stock from the warehouse closest to the buyer’s address to optimize delivery speed.

Low-stock alerts are triggered when inventory drops below a seller-defined threshold. Out-of-stock items are automatically hidden from search and purchasing. Sellers can also enable backorders with expected restock dates, visible to buyers. The system prevents overselling by decrementing stock in real-time at order confirmation. Inventory reports can be exported as CSV for reconciliation.

**Word Count:** 224

---

## Document 10: Shoplite Commission and Fees
**Topic:** Seller fees and revenue breakdown

Shoplite charges sellers a commission fee of 10% per successful transaction, calculated on the subtotal before taxes and shipping. Additional fees apply for premium placements (sponsored ads) and optional features such as accelerated payouts. No listing fees are charged for uploading products. Monthly subscription plans are available for high-volume sellers, offering reduced commission rates as low as 6%.

Payouts are aggregated weekly, with detailed statements available in the Seller Dashboard. Fees are automatically deducted before transfer. Disputes over commission charges can be raised within 30 days of the statement date. Sellers can download financial summaries in CSV or PDF formats for accounting purposes. Shoplite issues annual tax summaries for participating regions to help sellers comply with regulations.

**Word Count:** 229

---

## Document 11: Customer Support Channels
**Topic:** Support contact methods

Shoplite provides multiple support channels for buyers and sellers. The Help Center offers self-service articles, FAQs, and troubleshooting guides. Buyers can submit support tickets directly through the app or website. Live chat support is available for urgent inquiries during business hours, while email support is available 24/7 with a typical response time of 12 hours. Sellers have access to a dedicated Seller Support line with priority routing.

Common support requests include payment disputes, order tracking, returns, and technical issues. Support agents may request screenshots, receipts, or tracking numbers to resolve cases. Escalations are handled by specialized teams for fraud, compliance, or platform bugs. Shoplite maintains a Service Level Agreement (SLA) of first response within 24 hours for 95% of tickets.

**Word Count:** 225

---

## Document 12: Mobile App Features
**Topic:** Mobile app functionality

Shoplite’s iOS and Android apps mirror most desktop functionality while adding mobile-specific features. Push notifications keep buyers informed of order status, promotions, and price drops. Camera integration allows sellers to scan barcodes or take product photos directly from the app. Buyers can use biometric login (Face ID or fingerprint) for faster access. Offline browsing mode caches product catalogs for viewing without internet, though checkout requires connectivity.

The mobile app supports Apple Pay and Google Pay, reducing checkout friction. Users can switch seamlessly between mobile and desktop; cart and wishlist items are synchronized in real time. In-app chat allows buyers to message sellers directly about products. Regular updates improve performance and introduce seasonal features such as holiday shopping events.

**Word Count:** 223

---

## Document 13: API and Developer Access
**Topic:** External integrations for developers

Shoplite provides a RESTful API enabling developers to integrate storefront data with external systems such as ERP, CRM, or analytics platforms. Available endpoints include product catalog, order management, inventory, and fulfillment. Authentication uses OAuth 2.0 tokens tied to seller accounts. Rate limits apply: 1000 requests per hour per app by default. Higher limits are available upon request.

Webhooks notify external systems of events like new orders, low stock, or refunds. API documentation is publicly available and updated quarterly. Developers must comply with Shoplite’s data security standards, including TLS 1.3 and secure token storage. Misuse, such as scraping buyer data, results in revocation of API access. Shoplite provides a sandbox environment for testing before deploying to production.

**Word Count:** 234

---

## Document 14: Privacy and Data Protection
**Topic:** Privacy policy and compliance

Shoplite complies with GDPR, CCPA, and other major privacy regulations. User data is collected only for essential functions such as order processing, fraud prevention, and personalized recommendations. Buyers can request a copy of their personal data or deletion through the Privacy Center. Deleted accounts are permanently removed within 30 days, except where retention is legally required.

Sensitive information such as payment details is never stored by Shoplite directly. Marketing emails are opt-in and can be unsubscribed at any time. Shoplite uses anonymized data for analytics but does not sell personal information to third parties. Data is encrypted at rest and in transit, with access restricted to authorized staff only. Annual third-party audits verify compliance.

**Word Count:** 224

---

## Document 15: Promotional Codes and Discounts
**Topic:** Promotions, coupons, and discount stacking

Shoplite supports percentage discounts, fixed-amount coupons, and free shipping codes. Promo codes are entered during checkout and validated in real time. Only one promo code can be applied per order, unless the promotion explicitly states stackability. Discounts apply in the following order: (1) item-level discounts, (2) promo code, (3) shipping discounts, then (4) taxes. This ensures transparent and predictable final pricing.

Sellers can create time-limited promotions and target them to specific buyer groups. Expired or misused codes automatically trigger error messages. Promo codes cannot be applied retroactively after purchase. To prevent abuse, each code has a maximum redemption limit per user. Shoplite Wallet credits and promo codes cannot be combined in the same order. Seasonal promotions are highlighted in the app and website banners.

**Word Count:** 231