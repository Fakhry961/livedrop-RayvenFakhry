# Shoplite Ground-Truth Q&A

### Q01: How do I create a seller account on Shoplite?
**Expected retrieval context:** Document 08: Seller Account Setup and Verification  
**Authoritative answer:** To create a seller account, go to the Seller Registration page, provide business information (company name, tax ID), upload a business verification document, and configure payout details. Verification takes 2–3 business days; after approval you can publish listings.  
**Required keywords in LLM response:** ["seller registration", "business verification", "2–3 business days"]  
**Forbidden content:** ["instant approval", "no verification required"]

---

### Q02: What is Shoplite's return window and how do I request a refund?
**Expected retrieval context:** Document 06: Returns and Refund Policy  
**Authoritative answer:** Shoplite allows returns within a 30-day window from delivery for most items (exceptions listed in policy). To request a refund, open the order in your account, choose "Request Return," obtain a Return Authorization number, and ship the item back within 7 days. Refunds are issued to the original payment method within 3–7 business days after inspection.  
**Required keywords in LLM response:** ["30-day return window", "Return Authorization", "refund"]  
**Forbidden content:** ["lifetime returns", "no returns accepted"]

---

### Q03: Can I combine promo codes and how are discounts applied at checkout?
**Expected retrieval context:** Document 15: Promotional Codes and Discounts  
**Authoritative answer:** Only one promo code may be applied per order unless explicitly stated otherwise. Discounts are applied in order: item-level discounts, promo code, shipping discounts, then taxes.  
**Required keywords in LLM response:** ["one promo code", "order", "item-level discounts", "stacking only if specified"]  
**Forbidden content:** ["stack any codes", "automatic stacking"]

---

### Q04: How does Shoplite protect payment card data?
**Expected retrieval context:** Document 04: Payment Methods and Security  
**Authoritative answer:** Shoplite uses PCI-DSS compliant processors for card storage and tokenization. Card data is never stored on Shoplite servers; payment tokens are used for charges. All transactions are TLS 1.3 encrypted.  
**Required keywords in LLM response:** ["PCI-DSS", "tokenization", "TLS 1.3", "card not stored"]  
**Forbidden content:** ["we store raw card numbers"]

---

### Q05: How does inventory sync work for multi-warehouse sellers?
**Expected retrieval context:** Document 09: Inventory Management for Sellers  
**Authoritative answer:** Sellers can configure multiple warehouses. Inventory updates are synced every 5 minutes via scheduled delta updates or instantly via webhook push. Shoplite reserves stock from the closest warehouse at the moment of order to prevent overselling.  
**Required keywords in LLM response:** ["multi-warehouse", "delta updates", "webhook", "reserve inventory"]  
**Forbidden content:** ["instant global sync without reservation"]

---

### Q06: What are the password requirements for Shoplite accounts?
**Expected retrieval context:** Document 01: Shoplite User Registration Process  
**Authoritative answer:** Passwords must be at least 10 characters long, with one uppercase letter, one digit, and one special character.  
**Required keywords in LLM response:** ["10 characters", "uppercase", "digit", "special character"]  
**Forbidden content:** ["passwords can be short", "no restrictions"]

---

### Q07: How long does Shoplite keep past orders visible in my account?
**Expected retrieval context:** Document 05: Order Tracking and Notifications  
**Authoritative answer:** Orders remain visible for 2 years in the account dashboard, after which they are archived.  
**Required keywords in LLM response:** ["orders visible", "2 years", "archived"]  
**Forbidden content:** ["permanently visible", "deleted immediately"]

---

### Q08: How are reviews moderated on Shoplite?
**Expected retrieval context:** Document 07: Reviews and Ratings  
**Authoritative answer:** Only verified buyers can leave reviews. Reviews violating content rules (e.g., hate speech, personal info, spam) may be reported and removed after moderation. Sellers can respond but cannot delete reviews themselves.  
**Required keywords in LLM response:** ["verified buyers", "content rules", "reported", "moderation"]  
**Forbidden content:** ["sellers delete reviews directly"]

---

### Q09: What fees does Shoplite charge sellers per transaction?
**Expected retrieval context:** Document 10: Shoplite Commission and Fees  
**Authoritative answer:** Shoplite charges 10% commission per transaction on the subtotal before taxes and shipping. High-volume sellers may subscribe to plans with reduced rates as low as 6%.  
**Required keywords in LLM response:** ["10% commission", "subtotal before taxes", "subscription plan", "6%"]  
**Forbidden content:** ["free selling", "no commission"]

---

### Q10: What payment methods can buyers use on mobile devices?
**Expected retrieval context:** Document 12: Mobile App Features  
**Authoritative answer:** On mobile, buyers can use Apple Pay, Google Pay, credit/debit cards, PayPal, and Shoplite Wallet.  
**Required keywords in LLM response:** ["Apple Pay", "Google Pay", "credit/debit", "PayPal"]  
**Forbidden content:** ["cash on delivery"]

---

### Q11: How do order notifications work for buyers?
**Expected retrieval context:** Document 05: Order Tracking and Notifications + Document 12: Mobile App Features  
**Authoritative answer:** Shoplite sends push notifications and optional SMS alerts for order status changes (Document 05). On mobile, buyers also receive in-app alerts and reminders about promotions (Document 12).  
**Required keywords in LLM response:** ["push notifications", "SMS alerts", "in-app notifications"]  
**Forbidden content:** ["no order updates"]

---

### Q12: How does Shoplite handle account recovery and data privacy?
**Expected retrieval context:** Document 01: Shoplite User Registration Process + Document 14: Privacy and Data Protection  
**Authoritative answer:** Account recovery is handled through email recovery links valid for 1 hour (Document 01). For privacy, users can request deletion of their account, which is processed within 30 days (Document 14).  
**Required keywords in LLM response:** ["email recovery link", "1 hour", "deletion within 30 days"]  
**Forbidden content:** ["recovery without verification", "data sold to third parties"]

---

### Q13: How can sellers reconcile inventory with external ERP systems?
**Expected retrieval context:** Document 09: Inventory Management for Sellers + Document 13: API and Developer Access  
**Authoritative answer:** Sellers can export inventory reports as CSV (Document 09) or integrate through the Shoplite API and webhooks (Document 13) to sync automatically with ERP systems.  
**Required keywords in LLM response:** ["CSV export", "API", "webhooks", "ERP"]  
**Forbidden content:** ["manual reconciliation only"]

---

### Q14: What happens if a seller fails to confirm an order in time?
**Expected retrieval context:** Document 05: Order Tracking and Notifications + Document 08: Seller Account Setup and Verification  
**Authoritative answer:** Orders must be confirmed by sellers within 24 hours (Document 05). If repeatedly missed, Shoplite may review or suspend the seller’s account (Document 08).  
**Required keywords in LLM response:** ["24 hours", "automatic cancellation", "seller suspension"]  
**Forbidden content:** ["no penalty"]

---

### Q15: How does Shoplite ensure compliance with payment regulations?
**Expected retrieval context:** Document 04: Payment Methods and Security + Document 14: Privacy and Data Protection  
**Authoritative answer:** Payments are handled via PCI-DSS compliant processors (Document 04) and all data handling follows GDPR/CCPA standards (Document 14).  
**Required keywords in LLM response:** ["PCI-DSS", "GDPR", "CCPA"]  
**Forbidden content:** ["non-compliant", "store raw card data"]

---

### Q16: Can buyers clear their search history on Shoplite?
**Expected retrieval context:** Document 02: Product Search and Filtering + Document 14: Privacy and Data Protection  
**Authoritative answer:** Buyers can clear their search history at any time from account settings (Document 02). Privacy controls ensure data is deleted upon request (Document 14).  
**Required keywords in LLM response:** ["clear search history", "account settings", "privacy controls"]  
**Forbidden content:** ["permanent storage"]

---

### Q17: How can sellers contact Shoplite support for urgent issues?
**Expected retrieval context:** Document 11: Customer Support Channels + Document 08: Seller Account Setup and Verification  
**Authoritative answer:** Sellers can use the dedicated Seller Support line with priority routing (Document 11). They also access support directly through the Seller Dashboard (Document 08).  
**Required keywords in LLM response:** ["Seller Support line", "priority routing", "Seller Dashboard"]  
**Forbidden content:** ["no seller support"]

---

### Q18: How are disputes about returns resolved?
**Expected retrieval context:** Document 06: Returns and Refund Policy + Document 11: Customer Support Channels  
**Authoritative answer:** If buyer and seller disagree on a return, Shoplite mediation resolves disputes (Document 06). Escalations are handled by specialized support teams (Document 11).  
**Required keywords in LLM response:** ["mediation", "dispute resolution", "support team"]  
**Forbidden content:** ["no resolution process"]

---

### Q19: What developer tools are available to test integrations before going live?
**Expected retrieval context:** Document 13: API and Developer Access + Document 14: Privacy and Data Protection  
**Authoritative answer:** Shoplite provides a sandbox API for testing integrations (Document 13). Data in sandbox mode is anonymized to protect privacy (Document 14).  
**Required keywords in LLM response:** ["sandbox", "API", "testing", "anonymized data"]  
**Forbidden content:** ["live data used in testing"]

---

### Q20: How do promotions affect seller payouts?
**Expected retrieval context:** Document 15: Promotional Codes and Discounts + Document 10: Shoplite Commission and Fees  
**Authoritative answer:** Discounts from promo codes reduce the item’s sale price before commission is calculated (Document 15). Seller payouts are based on the discounted subtotal, minus commission (Document 10).  
**Required keywords in LLM response:** ["promo code discount", "commission after discount", "subtotal"]  
**Forbidden content:** ["commission on full price regardless of discount"]