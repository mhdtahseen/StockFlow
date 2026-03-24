-- ==============================================================================
-- StockFlow: Additional Production Tables (V2 Catalog & Tenant Requests)
-- ==============================================================================

-- 1. Catalog Models V2 (Enhanced Global Catalog)
CREATE TABLE IF NOT EXISTS public.catalog_models_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    variants JSONB NOT NULL DEFAULT '[]', -- Stores [{ram, storage, colors: [{label, hex}]}]
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(brand, model)
);

-- 2. Tenant Requests (Feature requests, support, or data corrections)
CREATE TABLE IF NOT EXISTS public.tenant_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('FEATURE', 'BUG', 'DATA_CORRECTION', 'SUPPORT')),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for Tenant Requests
ALTER TABLE public.tenant_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tenant requests"
    ON public.tenant_requests FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can create tenant requests"
    ON public.tenant_requests FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id() AND auth.uid() = user_id);

CREATE POLICY "Users can update their own tenant requests"
    ON public.tenant_requests FOR UPDATE USING (tenant_id = get_user_tenant_id() AND auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tr_tenant ON public.tenant_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tr_status ON public.tenant_requests(status);
