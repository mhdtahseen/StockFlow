import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { requestId } = await req.json()

    // 1. Get the request details
    const { data: tenantReq, error: fetchError } = await supabaseClient
      .from('tenant_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !tenantReq) {
      throw new Error('Tenant request not found')
    }

    if (tenantReq.status !== 'pending') {
      throw new Error('Request already processed')
    }

    // 2. Create the tenant
    const slug = tenantReq.org_name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
    const { data: tenant, error: tenantError } = await supabaseClient
      .from('tenants')
      .insert({
        name: tenantReq.org_name,
        slug: slug,
        plan: 'free',
        is_active: true
      })
      .select()
      .single()

    if (tenantError) throw tenantError

    // 3. Invite the user
    const { data: authUser, error: inviteError } = await supabaseClient.auth.admin.inviteUserByEmail(
      tenantReq.email,
      {
        data: {
          full_name: tenantReq.full_name,
          tenant_id: tenant.id,
          role: 'admin'
        }
      }
    )

    if (inviteError) throw inviteError

    // 4. Create the profile (optional if you have a trigger, but safe to do here)
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: authUser.user.id,
        tenant_id: tenant.id,
        email: tenantReq.email,
        full_name: tenantReq.full_name,
        role: 'admin',
        is_active: true
      })

    if (profileError) {
      console.error('Profile creation error (might be handled by trigger):', profileError)
    }

    // 5. Update request status
    const { error: updateError } = await supabaseClient
      .from('tenant_requests')
      .update({ status: 'approved' })
      .eq('id', requestId)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ success: true, tenantId: tenant.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
