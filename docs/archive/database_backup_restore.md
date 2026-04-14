# Supabase Database Backup & Restore Guide

**Date of Snapshot Capture:** March 18, 2026
**Project Ref:** `lietpzxydupsxmlncrpi`

This guide details exactly how the standalone database snapshot was captured during the transition to MVP-2, and how to safely restore the database to this baseline in the event of an issue.

---

## 📦 What Was Backed Up?

A full, logical database snapshot was captured using the Supabase CLI, generating three separate files located in the `/backup` folder at the root of the project:

1. **`snapshot_schema.sql`**: Contains the exact structure of all tables, views, stored procedures, Triggers, and your Row Level Security (RLS) policies.
2. **`snapshot_roles.sql`**: Contains the user roles, which are required for Authentication constraints. 
3. **`snapshot_data.sql`**: Contains every single row of stored data (e.g., users, inventory logs, wallets) as pure `INSERT` SQL commands.

---

## 🛠️ How to Perform Future Backups

If you need to make *another* manual snapshot before a risky schema migration, follow these steps.

**Prerequisites:**
* Docker Desktop must be running on your Mac.
* A valid `SUPABASE_ACCESS_TOKEN` saved inside `.env.local` to securely link without entering a password.

**Execution:**
Open a terminal in the root of the project and run these three commands individually:

```bash
# Export the structure/schema
npx supabase db dump -f backup/snapshot_schema.sql

# Export user roles
npx supabase db dump --role-only -f backup/snapshot_roles.sql

# Export the raw data
npx supabase db dump --data-only -f backup/snapshot_data.sql
```

---

## ⏪ How to Restore the Backup

There are two methods to roll back and apply your backups. Choose the one that works best for your workflow.

### Method 1: The Easy Way (Via Supabase Web Editor)
Use this method if you simply want to refresh specific tables or if you are uncomfortable with command-line database connections.

1. Navigate to the **[Supabase Project Dashboard](https://supabase.com/dashboard/project/lietpzxydupsxmlncrpi/sql)**.
2. Click on the **SQL Editor** tab on the left.
3. Open `backup/snapshot_schema.sql` in VS Code, **Select All**, and **Copy**.
4. Paste the contents into the Supabase SQL editor and press **Run**. Everything will instantly rebuild.
5. Repeat the exact same steps for `backup/snapshot_data.sql` to repopulate the tables with your user inventory and records.

### Method 2: The Fast Way (Via `psql` Terminal)
Use this method for large data restores where copying and pasting into a browser tab might freeze or time out. You will need your project's Database Password to use this connection string.

1. Open your native terminal inside the project directory.
2. Run the `psql` commands against your secure Supabase URI connection string. Substitute `[YOUR_PASSWORD]` with your actual database password.

```bash
# 1. Restore the schema
psql --single-transaction --variable ON_ERROR_STOP=1 --file backup/snapshot_schema.sql "postgresql://postgres.lietpzxydupsxmlncrpi:[YOUR_PASSWORD]@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres"

# 2. Restore the data
psql --single-transaction --variable ON_ERROR_STOP=1 --file backup/snapshot_data.sql "postgresql://postgres.lietpzxydupsxmlncrpi:[YOUR_PASSWORD]@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres"
```

> **Warning:** Running these commands will blindly execute the SQL. If the structure of the database has radically changed, you may need to completely drop/reset the database tables within the Supabase dashboard before pushing these `.sql` files back in.
