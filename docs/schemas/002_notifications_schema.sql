-- ==========================================
-- NOTIFICATIONS ARCHITECTURE (Supabase Postgres)
-- ==========================================

-- 1. Create the Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    type TEXT NOT NULL CHECK (type IN ('PHONE_SOLD', 'ROLE_PROMOTED', 'LEDGER_ENTRY', 'SYSTEM_ALERT')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    reference_id UUID, -- Links to phone_id, ledger_id, etc.
    read_at TIMESTAMPTZ, -- null = unread
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications for their tenant"
    ON public.notifications FOR INSERT WITH CHECK (
      tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- Example Postgres Trigger (Automatically notify Admin when a phone is sold)
-- ==========================================

CREATE OR REPLACE FUNCTION notify_admin_on_phone_sale()
RETURNS TRIGGER AS $$
DECLARE
    admin_user_id UUID;
    seller_name TEXT;
BEGIN
    -- Only trigger when status changes to 'Sold'
    IF NEW.status = 'SOLD' AND OLD.status != 'SOLD' THEN
        
        -- Get the name of the associate who sold it
        SELECT full_name INTO seller_name FROM public.profiles WHERE id = auth.uid();

        -- Find the admin of this tenant
        SELECT id INTO admin_user_id FROM public.profiles 
        WHERE tenant_id = NEW.tenant_id AND role = 'admin' LIMIT 1;
        
        -- If an admin exists (and isn't the one who sold it), alert them!
        IF admin_user_id IS NOT NULL THEN
            INSERT INTO public.notifications (tenant_id, user_id, type, title, message, reference_id)
            VALUES (
                NEW.tenant_id, 
                admin_user_id, 
                'PHONE_SOLD', 
                'Item Sold by Team', 
                COALESCE(seller_name, 'An associate') || ' just sold a ' || NEW.brand || ' ' || NEW.model || ' for ₹' || NEW.sale_price,
                NEW.id
            );
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Attach trigger to phones table
DROP TRIGGER IF EXISTS trigger_notify_phone_sale ON public.phones;
CREATE TRIGGER trigger_notify_phone_sale
    AFTER UPDATE ON public.phones
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_on_phone_sale();
