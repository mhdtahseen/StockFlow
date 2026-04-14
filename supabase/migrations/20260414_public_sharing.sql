-- MILESTONE 2: SECURE SHARING INFRASTRUCTURE
-- Enables 30-day viewable links for SO and PO documents

CREATE TABLE IF NOT EXISTS public.public_shares (
    token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    order_type TEXT NOT NULL CHECK (order_type IN ('SALE', 'PURCHASE')),
    tenant_id UUID NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.public_shares ENABLE ROW LEVEL SECURITY;

-- 1. Tenants can manage their own shares
CREATE POLICY "Tenants can manage their shared links"
ON public.public_shares
FOR ALL
USING (auth.uid() IN (
    SELECT user_id FROM tenant_users WHERE tenant_id = public_shares.tenant_id
));

-- 2. Anonymous users can read a specific share if not expired
CREATE POLICY "Anonymous users can read valid shares"
ON public.public_shares
FOR SELECT
USING (expires_at > now());

-- 3. Anonymous users need to fetch the ORDER and its ITEMS
-- To do this SECURELY without opening the orders table, we use a SECURITY DEFINER function.

CREATE OR REPLACE FUNCTION get_shared_order(share_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with creator (elevated) privileges
AS $$
DECLARE
    share_record RECORD;
    order_data JSONB;
    item_data JSONB;
    counterparty_data JSONB;
    tenant_data JSONB;
BEGIN
    -- 1. Validate Token & Expiry
    SELECT * INTO share_record 
    FROM public.public_shares 
    WHERE token = share_token AND expires_at > now();

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- 2. Fetch Order Data based on Type
    IF share_record.order_type = 'SALE' THEN
        SELECT jsonb_build_object(
            'id', o.id,
            'total_amount', o.total_amount,
            'amount_paid', o.amount_paid,
            'status', o.status,
            'created_at', o.created_at,
            'order_type', o.order_type,
            'type', 'SALE'
        ) INTO order_data
        FROM sale_orders o WHERE o.id = share_record.order_id;

        SELECT jsonb_agg(i) INTO item_data 
        FROM (SELECT * FROM sale_order_items WHERE sale_order_id = share_record.order_id) i;
        
    ELSIF share_record.order_type = 'PURCHASE' THEN
        SELECT jsonb_build_object(
            'id', o.id,
            'total_amount', o.total_amount,
            'amount_paid', o.amount_paid,
            'status', o.status,
            'created_at', o.created_at,
            'type', 'PURCHASE'
        ) INTO order_data
        FROM purchase_orders o WHERE o.id = share_record.order_id;

        SELECT jsonb_agg(i) INTO item_data 
        FROM (SELECT * FROM purchase_order_items WHERE purchase_order_id = share_record.order_id) i;
    END IF;

    -- 3. Fetch Metadata
    SELECT jsonb_build_object('name', c.name, 'address', c.address, 'phone', c.phone) INTO counterparty_data
    FROM customers c WHERE c.id = (
        SELECT counterparty_id FROM (
            SELECT counterparty_id FROM sale_orders WHERE id = share_record.order_id
            UNION
            SELECT counterparty_id FROM purchase_orders WHERE id = share_record.order_id
        ) q
    );

    SELECT jsonb_build_object('name', t.name, 'address', t.address, 'gstin', t.gstin, 'phone', t.phone) INTO tenant_data
    FROM tenant_requests t WHERE t.id = share_record.tenant_id;

    -- 4. Combine
    RETURN jsonb_build_object(
        'order', order_data,
        'items', item_data,
        'counterparty', counterparty_data,
        'tenant', tenant_data,
        'expires_at', share_record.expires_at
    );
END;
$$;
