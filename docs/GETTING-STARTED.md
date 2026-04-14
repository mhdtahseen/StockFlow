# 🚀 Getting Started with stockflow

This guide will help you get stockflow up and running for the first time, whether you are a business user or a developer.

---

## 📱 For Business Users: PWA Installation

stockflow is designed to be a "Fast-App" that lives on your phone.

1.  **Open the URL**: Navigate to your stockflow deployment URL in Safari (iOS) or Chrome (Android).
2.  **Add to Home Screen**:
    - **iOS**: Tap the **Share** button → **Add to Home Screen**.
    - **Android**: Tap the **Menu (3 dots)** → **Install App**.
3.  **Sign Up**: Create your organization profile and request tenant access.

---

## 💻 For Developers: Machine Setup

### 1. Prerequisites
- **Node.js**: Version 20.x or higher.
- **Git**: For version control.
- **Supabase Account**: A free project is sufficient for development.

### 2. Local Installation
```bash
# Clone the repository
git clone https://github.com/your-repo/stockflow.git
cd stockflow

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local 
# (Fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)
```

### 3. Database Initialization
Before launch, you must initialize the `tenant_requests` table in your Supabase project:
1.  Go to the **SQL Editor** in your Supabase Dashboard.
2.  Copy the contents of `supabase_tenant_requests.sql` from the root of this repo.
3.  Click **Run**.

### 4. Running Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

---

## 🛠 Troubleshooting common issues

### Camera not opening?
- Ensure you are running on **HTTPS** or `localhost`. Browsers block camera access on unsecured HTTP sites.
- Check "Site Settings" in your mobile browser to ensure "Camera" permission is enabled.

### Ledger entries not appearing?
- The Ledger depends on the `sync` slice. If you are offline, entries will be stored locally and synced once you regain a connection. Check the `sync` dashboard in the app settings to view pending payloads.
