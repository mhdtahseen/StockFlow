-- Support response cache: stores AI-generated answers keyed by keywords
-- so the same question from any user returns instantly without calling Gemini.
CREATE TABLE IF NOT EXISTS support_responses (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  question_pattern TEXT    NOT NULL,
  keywords     TEXT[]      NOT NULL DEFAULT '{}',
  answer       TEXT        NOT NULL,
  hit_count    INT         NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_responses_keywords
  ON support_responses USING GIN (keywords);

-- RLS: all authenticated users can read; only edge functions (service role) write
ALTER TABLE support_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can read support responses"
  ON support_responses FOR SELECT TO authenticated USING (true);

-- Rate limiter: single row tracks Gemini call count per 60s window
CREATE TABLE IF NOT EXISTS rate_limiter (
  key          TEXT        PRIMARY KEY,
  count        INT         NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO rate_limiter (key) VALUES ('gemini') ON CONFLICT (key) DO NOTHING;

-- Seed: 40 commonly-asked questions pre-generated so Day 1 users get instant answers
INSERT INTO support_responses (question_pattern, keywords, answer) VALUES
  ('How do I add a phone to inventory?',
   ARRAY['add','phone','new','device','inventory','create','enter'],
   'Tap the **+** button (blue circle, bottom center of any screen) to open the Add Phone form. Fill in brand, model, IMEI, and purchase price, then tap Save.'),

  ('How do I scan an IMEI?',
   ARRAY['scan','imei','barcode','camera','qr'],
   'On the Add Phone screen, tap the camera icon next to the IMEI field. Point your camera at the barcode on the phone box or the device itself — it captures automatically.'),

  ('What does the phone status mean?',
   ARRAY['status','stock','pending','sold','meaning','difference'],
   '**In Stock** = available for sale. **Pending** = reserved or awaiting payment. **Sold** = sale complete and payment settled.'),

  ('How do I create a sales order?',
   ARRAY['sales','order','sell','create','new','so'],
   'Go to **Menu → Sales Orders → +** (or tap the + button on the Sales Orders page). Select the customer, add phones from inventory, set the price, and save.'),

  ('How do I create a purchase order?',
   ARRAY['purchase','order','buy','po','supplier','create'],
   'Go to **Menu → Purchase Orders → +**. Enter the supplier name, add phones with quantities and prices, then save. Certify the PO once goods are received.'),

  ('What is the difference between a PO and an SO?',
   ARRAY['po','so','purchase','sales','difference','between'],
   'A **Purchase Order (PO)** is when you buy phones from a supplier. A **Sales Order (SO)** is when you sell phones to a customer.'),

  ('How do I record a payment?',
   ARRAY['payment','record','received','paid','collect','log'],
   'Open the sales or purchase order, scroll to the Payment section, and tap **Add Payment**. Enter the amount and payment mode (cash, UPI, bank transfer, etc.).'),

  ('How do I add a customer?',
   ARRAY['add','customer','new','create','contact','buyer'],
   'Go to **Menu → Customers → +**. Enter the customer name, phone number, and any other details. They will appear in your customer list and can be linked to orders.'),

  ('How do I see my profit?',
   ARRAY['profit','margin','earnings','revenue','dashboard','analytics'],
   'The **Dashboard** shows your net cash flow and average profit per device. For a detailed breakdown, go to **Menu → Analytics** (Pro plan required).'),

  ('Why is my data not syncing?',
   ARRAY['sync','not','syncing','offline','stuck','data','lost'],
   'Check your internet connection. If you see a yellow ! badge on the Menu icon, there are stuck sync items. Go to **Profile → Developer Tools** to retry. Data is saved locally and will sync when online.'),

  ('How do I open the navigation menu?',
   ARRAY['menu','navigate','open','drawer','navigation','sidebar'],
   'Tap the **☰ hamburger icon** in the top-left corner of any screen to open the full navigation menu with all app sections.'),

  ('How do I view inventory details?',
   ARRAY['view','detail','phone','inventory','info','specs'],
   'Go to **Inventory** (bottom right of screen or Menu → Inventory). Tap any phone card to open its full detail page showing IMEI, prices, orders, and status history.'),

  ('How do I edit a phone?',
   ARRAY['edit','update','change','phone','modify'],
   'Open the phone detail page from Inventory, then tap the **Edit** (pencil) icon at the top right. You can update any field and save.'),

  ('How do I delete a phone?',
   ARRAY['delete','remove','phone','inventory'],
   'Open the phone detail page and tap the **⋮ menu → Delete**. Note: phones linked to active orders cannot be deleted.'),

  ('How do I view the ledger?',
   ARRAY['ledger','accounts','balance','financial','money'],
   'Go to **Menu → Accounts Ledger** to see all transactions (income, expenses, customer balances) in real time. This feature requires the Starter plan or above.'),

  ('How do I add a team member?',
   ARRAY['team','add','member','staff','employee','invite','user'],
   'Go to **Menu → Manage Team → Invite Member**. Enter their email — they will receive an invitation to join your shop. Admins can manage team members.'),

  ('How do I change my password?',
   ARRAY['password','change','reset','security','login'],
   'Go to **Menu → My Profile → Change Password**. Enter your current password and your new one. Alternatively, use "Forgot Password" on the login screen.'),

  ('How do I upgrade my plan?',
   ARRAY['upgrade','plan','premium','pro','subscription','billing','paid'],
   'Go to **Menu → Upgrade Plan** (or tap the PRO badge on locked features). Choose a plan and complete payment via Razorpay. Your features unlock immediately.'),

  ('What is included in the free plan?',
   ARRAY['free','plan','trial','features','limit','included'],
   'The free trial includes up to 100 phones, 1 user seat, basic inventory, and sales/purchase orders for 6 months. After trial, you need a paid plan to continue.'),

  ('How do I certify a purchase order?',
   ARRAY['certify','po','purchase','order','confirm','complete'],
   'Open the Purchase Order and tap **Certify PO**. This confirms goods were received, adds the phones to your inventory, and records the purchase in your ledger.'),

  ('How do I filter inventory by status?',
   ARRAY['filter','inventory','status','stock','sold','pending','search'],
   'On the Inventory screen, tap the filter pills at the top (All / In Stock / Pending / Sold) to show only phones in that status.'),

  ('How do I search for a phone?',
   ARRAY['search','find','phone','imei','model','brand','inventory'],
   'On the Inventory screen, tap the search bar at the top and type an IMEI number, model name, or brand. Results update as you type.'),

  ('How do I share an invoice?',
   ARRAY['share','invoice','pdf','print','send','customer','bill'],
   'Open the Sales Order detail page and tap the **Share** icon (top right). You can generate a PDF invoice and share it via WhatsApp, email, or any other app.'),

  ('How do I track customer balances?',
   ARRAY['customer','balance','credit','due','owe','outstanding'],
   'Go to **Menu → Customers** and tap any customer to see their full balance: total sales, amount paid, and balance due. You can record payments directly from this screen.'),

  ('How do I use the app offline?',
   ARRAY['offline','no','internet','connection','work','sync'],
   'The app works fully offline — you can add phones, create orders, and record payments without internet. All changes sync automatically when you reconnect.'),

  ('How do I log out?',
   ARRAY['logout','sign','out','exit','session'],
   'Open the navigation drawer (☰ top left), scroll to the bottom, and tap **Sign Out**.'),

  ('How do I contact support?',
   ARRAY['contact','support','help','email','human','person'],
   'You can email us at **support@finventree.com** — we typically respond within 24 hours. For urgent issues, use the Contact Support button at the bottom of this page.'),

  ('My screen is blank or the app crashed',
   ARRAY['blank','crash','white','screen','frozen','error','not','working','loading'],
   'Try force-closing and reopening the app. If the issue persists, clear the app cache in your device settings. If data seems missing, check your internet connection — data syncs automatically when online.'),

  ('How do I view analytics?',
   ARRAY['analytics','chart','report','revenue','cogs','profit','trend'],
   'Go to **Menu → Analytics** to see revenue vs COGS charts, monthly trends, and profit breakdown. This feature requires the Pro plan or above.'),

  ('How do I record a supplier payment?',
   ARRAY['supplier','payment','pay','outgoing','purchase','settle'],
   'Open the Purchase Order and scroll to the Payment section. Tap **Add Payment** to record how much you paid the supplier (cash, UPI, or bank transfer).'),

  ('How do I partially pay a customer?',
   ARRAY['partial','payment','installment','customer','sale','order'],
   'Open the Sales Order and tap **Add Payment**. Enter only the partial amount — the order will show as Partially Paid. You can add more payments later.'),

  ('What is IMEI and why do I need it?',
   ARRAY['imei','what','why','number','unique','identification'],
   'IMEI (International Mobile Equipment Identity) is a unique 15-digit number for every phone. It helps track specific devices, avoid duplicates, and is required for warranty claims.'),

  ('How do I set up GST for invoices?',
   ARRAY['gst','tax','invoice','cgst','sgst','igst','billing'],
   'When creating a Sales Order, toggle the **GST** option and enter your GSTIN. The app calculates CGST/SGST automatically based on the order amount.'),

  ('Can I use this on multiple devices?',
   ARRAY['multiple','devices','phone','tablet','laptop','desktop','web'],
   'Yes! Finventree is available as a mobile app (Android/iOS) and as a web app at finventree.com. All devices sync to the same data — changes on one device appear on all others.'),

  ('How do I change the app theme?',
   ARRAY['theme','dark','light','mode','color','appearance'],
   'Go to **Menu → App Settings** and toggle between Light and Dark mode.'),

  ('I forgot my login email or password',
   ARRAY['forgot','email','password','login','access','locked','out'],
   'On the login screen, tap **Forgot Password** and enter your email to receive a reset link. If you forgot your email, contact support@finventree.com with your shop name.'),

  ('How do I view order history?',
   ARRAY['history','past','orders','previous','list','all'],
   'Go to **Menu → Sales Orders** or **Purchase Orders** to see the full list. Tap any order to view its details, payment history, and attached phones.'),

  ('What payment modes are supported?',
   ARRAY['payment','mode','cash','upi','bank','transfer','method'],
   'The app supports **Cash**, **UPI**, **Bank Transfer**, and **Cheque** as payment modes when recording transactions.'),

  ('How do I delete a customer?',
   ARRAY['delete','customer','remove'],
   'Go to **Customers**, tap the customer, then tap **⋮ → Delete**. Customers with active orders cannot be deleted.'),

  ('How do I see which phones are sold?',
   ARRAY['sold','phones','list','filter','completed'],
   'Go to **Inventory** and tap the **Sold** filter tab to see all phones that have been fully sold and settled.')
ON CONFLICT DO NOTHING;
