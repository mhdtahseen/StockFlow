# 🛡 stockflow: Premium Inventory & Ledger Analytics

**stockflow** is a professional-grade inventory management and financial integrity platform designed for high-turnover hardware businesses. It combines real-time inventory tracking with an automated "Watchtower" ledger system to ensure total financial transparency.

---

## 📱 User Guide: Business Operations

### 1. Smart Inventory (OCR Powered)
Never type an IMEI manually again. The integrated Scanner uses high-performance AI to capture barcodes and text simultaneously.
- **Universal Zoom**: Support for all cameras, including laptop webcams.
- **Flicker-Free HUD**: A premium, stable video feed for 60fps scanning.

### 2. The Ledger "Watchtower"
Every action in the system—whether it's a purchase, a repair, or a refund—automatically triggers an entry in the Financial Ledger.
- **True Profit Tracking**: See exactly how much you make after all expenses (repairs, fees, etc.) are deducted.
- **Audit Trails**: Every penny is accounted for with linked transaction IDs.

### 3. Order Management
Manage the full lifecycle of your stock:
- **Purchase Orders (PO)**: Record intake from suppliers.
- **Sales Orders (SO)**: Track sales to customers.
- **State Hydration**: Data stays safe even if you refresh the page or lose connection.

---

## 🛠 Developer Reference: Technical Architecture

### 🏗 Tech Stack
- **Frontend**: Vite + React 19 + TypeScript.
- **State Management**: Redux Toolkit (with `redux-persist` for offline safety).
- **Backend-as-a-Service**: Supabase (PostgreSQL + Realtime).
- **Styling**: Tailwind CSS 4 + Framer Motion (premium animations).

### ⚙️ Core Engines

#### 1. Passive Scanner HUD (`ImeiScannerModal.tsx`)
We use a **Passive Ref Pattern** to decouple scanning states from React's rendering engine.
- **Benefit**: Zero-latency UI. The video feed never "blinks" because the scan indicators are updated directly on the DOM, bypassing the React reconciliation loop.

#### 2. Automated Financial Listeners (`ledger/slice.ts`)
The Ledger slice uses `extraReducers` to listen for business events globally.
- **Example**: When a `PURCHASE_ORDER_REJECT` action occurs, the Ledger automatically calculates the refund due and logs an inventory adjustment entry without requiring manual input.

### 📂 Directory Map
- `/src/features`: Logic divided by business domain (Purchasing, Wallet, Analytics).
- `/src/pages`: High-level view components.
- `/docs/archive`: Legacy documentation and historical project logs.

---

## 🚀 Quick Launch
1. Ensure Node.js 20+ is installed.
2. Clone the repo and run `npm install`.
3. Start the dev server: `npm run dev`.
4. Open [localhost:5173](http://localhost:5173).

> [!TIP]
> **Mobile-First**: While stockflow works on all screens, the scanner is optimized for PWA usage on iOS/Android.
