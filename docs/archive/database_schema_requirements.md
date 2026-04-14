# Database Schema Requirements for TO & PO Implementation

## Missing Ledger Table Foreign Key Columns

The TO & PO implementation requires the following columns to be added to the `ledger` table:

```sql
ALTER TABLE ledger 
ADD COLUMN sale_order_id UUID REFERENCES sale_orders(id),
ADD COLUMN purchase_order_id UUID REFERENCES purchase_orders(id);
```

## Purpose

These foreign key columns enable:
1. **Ledger entry tracking** - Link financial entries to specific orders
2. **Reporting** - Generate order-specific financial reports
3. **Audit trail** - Trace all financial transactions back to their source orders

## Migration Notes

- Both columns are optional (NULLABLE)
- Existing ledger entries will have NULL values
- New entries from TO/PO flows will populate these columns
- RPC functions already handle these columns in the implementation

## Verification

After migration, verify:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ledger' 
AND column_name IN ('sale_order_id', 'purchase_order_id');
```
