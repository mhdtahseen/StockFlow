-- ============================================================================
-- Support System v2: Full-text search, provenance, quality tracking
-- ============================================================================

-- 1. Add new columns to support_responses
ALTER TABLE support_responses
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'seed',
  ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. Mark all existing rows as verified seeds
UPDATE support_responses SET source = 'seed', verified = true WHERE source = 'seed';

-- 3. Populate search_vector for existing rows
UPDATE support_responses
SET search_vector = to_tsvector('english', coalesce(question_pattern, '') || ' ' || array_to_string(keywords, ' '));

-- 4. Create GIN index on search_vector
CREATE INDEX IF NOT EXISTS idx_support_responses_fts
  ON support_responses USING GIN (search_vector);

-- 5. Auto-populate trigger for search_vector on INSERT/UPDATE
CREATE OR REPLACE FUNCTION support_responses_search_vector_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.question_pattern, '') || ' ' || array_to_string(NEW.keywords, ' '));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_support_responses_search_vector ON support_responses;
CREATE TRIGGER trg_support_responses_search_vector
  BEFORE INSERT OR UPDATE ON support_responses
  FOR EACH ROW EXECUTE FUNCTION support_responses_search_vector_trigger();

-- 6. Full-text search RPC for the edge function (uses OR between terms for better recall)
CREATE OR REPLACE FUNCTION support_fts_search(search_query text)
RETURNS TABLE(id uuid, answer text, hit_count int, source text, verified boolean, rank real)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  tsq tsquery;
BEGIN
  -- Build OR-based tsquery from the input text for better recall
  -- e.g. "how do payments work" → 'payment' | 'work'
  SELECT string_agg(lexeme, ' | ')::tsquery
  INTO tsq
  FROM unnest(to_tsvector('english', search_query))
  WHERE length(lexeme) > 1;

  -- Fallback if no useful terms
  IF tsq IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    sr.id,
    sr.answer,
    sr.hit_count,
    sr.source,
    sr.verified,
    ts_rank(sr.search_vector, tsq) AS rank
  FROM support_responses sr
  WHERE sr.search_vector @@ tsq
    AND ts_rank(sr.search_vector, tsq) >= 0.02
  ORDER BY sr.verified DESC, ts_rank(sr.search_vector, tsq) DESC, sr.hit_count DESC
  LIMIT 3;
END;
$$;

-- 6. Seed new documentation-derived Q&A pairs (60+ items covering features not in original FAQ)
INSERT INTO support_responses (question_pattern, keywords, answer, source, verified) VALUES

-- Trade Network
('What is the Trade Network?',
 ARRAY['trade','network','connect','business','dealer'],
 'The **Trade Network** lets you connect with other Finventree shops (suppliers, buyers, retailers). Once connected, you can create transfer orders that sync between both parties. Available on the Enterprise plan.',
 'seed', true),

('How do I get my trade code?',
 ARRAY['trade','code','find','where','my','share'],
 'Your unique 6-character trade code is on your **Profile page**. You can copy it, share a connect link, or display your QR code for others to scan.',
 'seed', true),

('How do I connect with another shop?',
 ARRAY['connect','shop','scan','qr','code','link','supplier','buyer'],
 'Go to **Customers page → tap the violet QR button** to scan their QR code. Or tap **Connect** and type their 6-character trade code manually. Choose the relationship type (Supplier, Customer, or Retailer) and confirm.',
 'seed', true),

('What are transfer orders?',
 ARRAY['transfer','order','inter','tenant','linked','sync'],
 'Transfer orders are automatically created when you sell to a connected Trade Network partner. The order syncs between both shops — your sale appears as their purchase. Status updates are visible to both parties.',
 'seed', true),

('How do I scan a QR code to connect?',
 ARRAY['qr','scan','connect','camera','code','trade'],
 'On the **Customers page**, tap the **violet QR button** (bottom right). Point your camera at the other shop''s QR code — it connects automatically. You can also tap "Type code manually" if scanning doesn''t work.',
 'seed', true),

-- Billing & Plans (detailed)
('What are the available plans?',
 ARRAY['plans','pricing','tiers','subscription','options','cost'],
 'Finventree offers 3 paid plans: **Starter** (1 user, 100 phones, orders + invoices), **Pro** (10 users, unlimited phones, scanner + analytics + ledger), and **Enterprise** (unlimited users, trade network, bulk invoices, dedicated support). All start with a 6-month free trial.',
 'seed', true),

('What is included in the Starter plan?',
 ARRAY['starter','plan','basic','features','included','first'],
 'The **Starter plan** includes: 1 user seat, up to 100 phones, Sales & Purchase Orders, Customer Directory, and PDF Invoice generation. It''s ideal for solo shop owners.',
 'seed', true),

('What is included in the Pro plan?',
 ARRAY['pro','plan','professional','features','included','advanced'],
 'The **Pro plan** includes everything in Starter plus: 10 user seats, unlimited phones, IMEI Scanner, Advanced P&L Ledger, Analytics dashboard, Credit Tracking, Public Share Links, and multi-device bulk orders.',
 'seed', true),

('What is included in the Enterprise plan?',
 ARRAY['enterprise','plan','features','unlimited','top','premium'],
 'The **Enterprise plan** includes everything in Pro plus: unlimited user seats, Bulk Invoice generation, full Trade Network access (connect with other shops), SLA guarantee, and dedicated support.',
 'seed', true),

('How long is the free trial?',
 ARRAY['trial','free','duration','long','days','months','period'],
 'The free trial lasts **6 months** with full feature access. After the trial expires, you''ll need to choose a paid plan (Starter, Pro, or Enterprise) to continue using the app.',
 'seed', true),

('What happens when my trial expires?',
 ARRAY['trial','expired','over','ended','access','blocked','what','happens'],
 'When your trial ends, you''ll see a paywall screen. You can still view your data but cannot create new orders or add phones. Choose a paid plan from **Menu → Upgrade Plan** to restore full access.',
 'seed', true),

('How do I manage my subscription?',
 ARRAY['subscription','manage','billing','payment','recurring','cancel','change'],
 'Go to **Menu → App Settings → Manage Subscription**. From there you can view your current plan, change plans, update payment method, or cancel. Cancellation takes effect at end of billing period.',
 'seed', true),

-- Team & Roles
('What roles are available for team members?',
 ARRAY['roles','team','admin','manager','associate','permissions','access'],
 'There are 3 roles: **Admin** (full access + team management + billing), **Manager** (most operations except settings/billing), and **Associate** (day-to-day tasks like adding phones and creating orders — cannot view profit or analytics).',
 'seed', true),

('How do team invites work?',
 ARRAY['invite','team','member','link','join','how','share'],
 'Go to **Menu → Manage Team → Invite Member**. This generates an invite link you can share via WhatsApp, SMS, or email. The recipient taps the link, signs up, and automatically joins your shop with the assigned role.',
 'seed', true),

('What is the seat limit on my plan?',
 ARRAY['seat','limit','users','team','members','how','many','maximum'],
 'Seat limits: **Starter** = 1 user, **Pro** = up to 10 users, **Enterprise** = unlimited users. If you hit your limit, you''ll see an upgrade prompt when trying to invite more members.',
 'seed', true),

('Can team members see my profit?',
 ARRAY['team','profit','see','view','hide','associate','privacy','analytics'],
 'Only **Admin** and **Manager** roles can see profit, analytics, and the full ledger. **Associates** can add phones and create orders but cannot view financial data or profit margins.',
 'seed', true),

-- Advance Credit & Payments
('What is advance credit?',
 ARRAY['advance','credit','overpayment','customer','balance','extra'],
 'When a customer overpays (pays more than the order total), the extra amount is stored as **advance credit**. This credit is automatically applied to their next order, reducing what they owe.',
 'seed', true),

('How does multi-order payment allocation work?',
 ARRAY['multi','order','payment','allocation','split','multiple','distribute'],
 'When recording a customer payment, you can split it across multiple outstanding orders. Tap **Add Payment** → the Payment Allocation Sheet lets you enter how much to apply to each order.',
 'seed', true),

('How do I see what a customer owes me?',
 ARRAY['customer','owes','outstanding','receivable','due','balance','ar'],
 'Go to **Menu → Customers** and tap any customer. Their detail page shows: total sales, total paid, and **balance due**. The Customers list also shows AR (Accounts Receivable) balance next to each name.',
 'seed', true),

('How do I settle a supplier balance?',
 ARRAY['supplier','settle','bulk','payment','owed','payable','multiple','po'],
 'Open **Menu → Purchase Orders**, tap the supplier, then use **Supplier Settlement**. You can allocate one payment across multiple POs at once via the Supplier Allocation Sheet.',
 'seed', true),

-- PO Inspection Details
('How do I inspect items in a purchase order?',
 ARRAY['inspect','item','po','purchase','accept','reject','check','quality'],
 'Open the Purchase Order → each item shows an inspection badge (Pending/Accepted/Rejected). Tap an item to mark it as **Accepted** or **Rejected**. Rejected items auto-create a refund-due entry in your ledger.',
 'seed', true),

('What happens when I reject a PO item?',
 ARRAY['reject','po','item','purchase','refund','supplier','return'],
 'When you reject an item: (1) it''s marked with a red REJECTED badge, (2) a refund-due ledger entry is auto-created against that supplier, and (3) the phone is NOT added to your inventory. The rejection appears on the PO PDF.',
 'seed', true),

('What does certifying a PO mean?',
 ARRAY['certify','po','purchase','order','what','mean','does','confirm'],
 'Certifying a PO confirms that goods have been received and inspected. It: (1) moves accepted phones into your inventory as IN_STOCK, (2) records the purchase cost in your ledger, and (3) locks the PO from further edits.',
 'seed', true),

-- Ledger & Watchtower Details
('What is the Watchtower?',
 ARRAY['watchtower','automatic','ledger','how','works','financial','auto'],
 'The Watchtower is Finventree''s automatic financial tracking system. It creates ledger entries automatically whenever you perform a business action — adding a PO creates expense entries, creating a sale creates income entries, logging a repair creates cost entries. You never need to manually enter financial data.',
 'seed', true),

('What transactions appear in the ledger automatically?',
 ARRAY['ledger','automatic','transactions','entries','types','what','tracked'],
 'The ledger auto-tracks: Purchase Orders (expense), Sales Orders (income), Customer payments received, Supplier payments made, Repair costs, PO item rejections (refund due), Price adjustments, and Debt settlements. Each entry links back to its source transaction.',
 'seed', true),

('How do I filter ledger entries?',
 ARRAY['ledger','filter','search','date','type','mode','view'],
 'On the Ledger page, use the filters at the top: filter by **entry type** (income/expense/adjustment), **date range** (today, 7 days, 30 days, or custom), and **payment mode** (Cash, UPI, Bank Transfer). Results update instantly.',
 'seed', true),

('How do I export ledger data?',
 ARRAY['export','ledger','excel','download','xlsx','spreadsheet','data'],
 'On the Ledger page, tap the **Export** button (top right). Choose your date range and filters, then tap **Export to Excel**. An XLSX file is generated with all matching transactions.',
 'seed', true),

-- Analytics Details
('What analytics can I see?',
 ARRAY['analytics','charts','reports','data','insights','metrics','see'],
 'The Analytics page (Pro plan) shows: Revenue vs COGS monthly charts, Profit breakdown by brand/model, Inventory aging & turnover, Payment distribution by mode, Credit aging (how long debts are outstanding), and Model velocity (which phones sell fastest).',
 'seed', true),

('What is on the dashboard?',
 ARRAY['dashboard','home','overview','summary','wallet','card'],
 'The Dashboard shows: **Wallet Card** (available balance, locked capital, total profit), **Inventory Summary** (In Stock / Sold / Pending counts), **Recent Activity** feed, net cash flow, and average profit per device.',
 'seed', true),

('What is model velocity?',
 ARRAY['model','velocity','fast','selling','popular','speed','turnover'],
 'Model velocity shows which phone models sell the fastest in your shop. It''s calculated from time-to-sell for each brand/model combination. Helps you stock more of what sells quickly and less of slow-moving inventory.',
 'seed', true),

-- Scanner & OCR
('The IMEI scanner is not working',
 ARRAY['scanner','not','working','camera','imei','broken','stuck','black'],
 'Ensure you''re on HTTPS or localhost (browsers block camera on HTTP). Check camera permissions in your device Settings. Try toggling the torch/flash. If the barcode doesn''t scan, the OCR fallback activates automatically for printed IMEIs. Make sure nothing is covering the camera lens.',
 'seed', true),

('Does the scanner work in low light?',
 ARRAY['scanner','low','light','dark','dim','night','flash','torch'],
 'Yes — the scanner has **adaptive thresholding** for low-light conditions and a **torch/flash toggle** button. Tap the flash icon in the scanner overlay to turn on your phone''s flashlight. Hardware zoom is also available for distant barcodes.',
 'seed', true),

('What types of codes can I scan?',
 ARRAY['scan','types','barcode','qr','code','imei','format','supported'],
 'The **IMEI Scanner** reads standard barcodes (Code 128, EAN, etc.) and uses OCR for printed/engraved IMEIs. The **QR Scanner** (on Customers page) reads QR codes for Trade Network connections. Both use the rear camera with full-screen overlay.',
 'seed', true),

-- Public Sharing
('How do public share links work?',
 ARRAY['public','share','link','token','view','without','login','access'],
 'When you share a Sales Order, Finventree generates a secure tokenized link (HMAC-signed, expires after 30 days). Anyone with the link can view the order details without logging in. Go to the order → tap **Share icon** → copy or send the link.',
 'seed', true),

('Can customers view their invoice without the app?',
 ARRAY['customer','view','invoice','without','app','login','link','web'],
 'Yes — use the **Public Share Link** feature. Open the Sales Order → tap Share → generate a public link. Send it to your customer via WhatsApp or SMS. They can view the full invoice in any browser without needing Finventree.',
 'seed', true),

-- Offline & Sync Details
('How does offline mode work exactly?',
 ARRAY['offline','mode','how','work','detail','sync','queue','outbox'],
 'All data is stored locally on your device. When you perform actions offline (add phone, create order, record payment), they''re queued in an outbox. When internet returns, the app automatically syncs everything in order. Up to 3 retry attempts per item. You''ll see a yellow ! badge on Menu if items are stuck.',
 'seed', true),

('I see a yellow badge on the menu icon',
 ARRAY['yellow','badge','menu','icon','warning','sync','stuck','issue'],
 'The yellow ! badge means some data hasn''t synced to the cloud yet. Go to **Menu → Profile → Developer Tools** to see stuck sync items and retry them manually. This usually happens after extended offline periods or if there was a network interruption.',
 'seed', true),

('Is my data safe if I lose my phone?',
 ARRAY['data','safe','lost','phone','backup','cloud','recover','new'],
 'Yes — all your data syncs to the cloud automatically. If you lose your phone, simply install Finventree on a new device, log in with the same email, and all your inventory, orders, customers, and ledger data will be restored.',
 'seed', true),

-- Notifications
('How do I enable push notifications?',
 ARRAY['push','notification','enable','turn','on','alerts','bell'],
 'Go to **Menu → App Settings** and toggle **Push Notifications** on. On the first enable, your device will ask for permission — tap Allow. You''ll receive alerts for connection requests, order events, and system updates.',
 'seed', true),

('What notifications does the app send?',
 ARRAY['notification','types','what','alerts','send','receive'],
 'Currently notifications include: **Connection Accepted** (when another shop accepts your Trade Network request), order-related events, and system alerts. Check the **bell icon** (top right) to see all notifications with read/unread status.',
 'seed', true),

-- Export & Documents
('How do I export my inventory to Excel?',
 ARRAY['export','inventory','excel','spreadsheet','download','list','xlsx'],
 'Go to the **Ledger page** or **Inventory page** and tap the **Export** button (usually top right). Select your date range or filters if applicable, then tap Export. An XLSX file will be generated that you can open in Excel or Google Sheets.',
 'seed', true),

('How do I generate a purchase order PDF?',
 ARRAY['purchase','order','pdf','generate','po','document','print','share'],
 'Open the Purchase Order detail page → tap the **Share/PDF icon** (top right). The PDF includes supplier details, item list with prices, inspection summary (accepted/rejected), and any rejected items section.',
 'seed', true),

-- Theme & Settings
('How do I change to dark mode?',
 ARRAY['dark','mode','theme','light','change','switch','appearance','night'],
 'Go to **Menu → App Settings** and select your theme: **Light**, **Dark**, or **System** (follows your device''s setting). The change applies immediately to the app, status bar, and keyboard.',
 'seed', true),

-- GST
('How does GST work in the app?',
 ARRAY['gst','tax','setup','configure','invoice','gstin','how'],
 'When creating a Sales Order, toggle the **GST** option on. Enter your GSTIN (GST Identification Number). The app auto-calculates CGST/SGST based on the order amount. GST details appear on the generated invoice PDF.',
 'seed', true),

('Do I need to configure GST separately?',
 ARRAY['gst','configure','setup','settings','where','gstin','enter'],
 'No separate configuration needed. Simply toggle GST on when creating a Sales Order and enter your GSTIN. The calculation is automatic. Your GSTIN is remembered for future orders.',
 'seed', true),

-- Device Catalog
('What is the device catalog?',
 ARRAY['device','catalog','database','models','phones','autofill','specs'],
 'Finventree includes a pre-seeded database of 200+ phone models with specs (RAM, storage, colors). When you select a brand and model while adding a phone, the remaining specs auto-fill from the catalog. This saves typing and ensures data consistency.',
 'seed', true),

('What brands are in the catalog?',
 ARRAY['brands','catalog','supported','available','apple','samsung','list'],
 'The catalog includes major brands: Apple, Samsung, OnePlus, Xiaomi, Realme, Oppo, Vivo, Motorola, Nothing, Google Pixel, and more. Each brand has its popular models with accurate RAM, storage, and color options pre-loaded.',
 'seed', true),

-- Multiple Devices
('Can I use the app on my phone and computer?',
 ARRAY['multiple','device','computer','phone','tablet','web','browser','both'],
 'Yes — Finventree works on your phone (native app from Play Store/App Store), tablet, and computer (web app at app.finventree.com). All devices sync to the same data. Changes on one device appear on all others when connected to internet.',
 'seed', true),

-- Security & Privacy
('Is my data secure?',
 ARRAY['secure','security','data','privacy','safe','encrypted','protection'],
 'Yes — your data is protected by Row-Level Security (each shop''s data is completely isolated). Authentication uses industry-standard PKCE flow. All communication is encrypted via HTTPS. Only your team members can access your shop''s data.',
 'seed', true),

('Can other shops see my inventory?',
 ARRAY['other','shops','see','inventory','data','privacy','isolated','separate'],
 'No — each shop''s data is completely isolated. No other shop or user outside your team can see your inventory, orders, customers, or financial data. Even connected Trade Network partners only see transfer order status, not your full data.',
 'seed', true),

-- Repair Module
('How do I track repairs on a phone?',
 ARRAY['repair','track','log','cost','fix','issue','maintenance'],
 'Open the phone''s detail page → scroll to the Repairs section → tap **Add Repair**. Enter the issue, repair cost, date, and notes. The repair cost is automatically deducted from that phone''s profit margin in the ledger.',
 'seed', true),

('Do repair costs affect my profit calculations?',
 ARRAY['repair','cost','profit','affect','deduct','margin','calculation'],
 'Yes — when you log a repair, the Watchtower automatically creates a REPAIR_COST ledger entry (expense). This reduces the profit margin shown for that specific device. Your total profit on the Dashboard reflects repair costs accurately.',
 'seed', true),

-- Misc common questions
('How do I view a phone''s full history?',
 ARRAY['phone','history','timeline','events','lifecycle','track'],
 'Open the phone''s detail page → tap the **History tab**. This shows a vertical timeline of all events: purchase date, any repairs, status changes, and sale details — all with timestamps.',
 'seed', true),

('What is the + button for?',
 ARRAY['plus','button','blue','circle','bottom','center','fab','add'],
 'The **+ button** (large blue circle at the bottom center) is a quick-add shortcut available from any screen. Tapping it opens the Add Phone form directly, so you can add inventory without navigating to the Inventory page first.',
 'seed', true),

('How do I return a sold phone?',
 ARRAY['return','sold','phone','refund','reverse','undo','sale'],
 'Open the Sales Order that contains the phone → tap **Process Return**. This is available on settled (fully paid) orders. The return auto-creates a refund ledger entry, and the phone status changes back to available.',
 'seed', true),

('How do I see daily sales summary?',
 ARRAY['daily','sales','summary','today','report','total'],
 'The **Dashboard** shows today''s activity including recent sales. For detailed daily breakdowns, go to **Menu → Analytics** (Pro plan required) where you can see daily/weekly/monthly revenue and transaction charts.',
 'seed', true),

('What is the difference between Customers and Suppliers?',
 ARRAY['customer','supplier','difference','between','who','buy','sell'],
 'A **Customer** is someone you sell phones TO (they owe you money). A **Supplier** is someone you buy phones FROM (you owe them money). In the app, customers appear in Menu → Customers, while suppliers are linked to Purchase Orders.',
 'seed', true)

ON CONFLICT DO NOTHING;
