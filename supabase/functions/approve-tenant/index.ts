import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { requestId, redirectTo: customRedirect } = await req.json()

    // 1. Get the request details
    const { data: tenantReq, error: fetchError } = await supabaseClient
      .from('tenant_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !tenantReq) throw new Error('Tenant request not found')

    // 2. Resolve Tenant
    const slug = tenantReq.org_name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
    const { data: existingTenant } = await supabaseClient
      .from('tenants')
      .select('id')
      .or(`slug.eq.${slug},name.eq.${tenantReq.org_name}`)
      .maybeSingle()

    let tenantId = existingTenant?.id;
    if (!tenantId) {
      const { data: newTenant, error: tenantError } = await supabaseClient
        .from('tenants')
        .insert({
          name: tenantReq.org_name,
          slug: slug,
          plan: 'trial',
          plan_expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          // Anti-abuse provenance fields from the original signup request
          signup_phone:              tenantReq.phone              ?? null,
          signup_device_fingerprint: tenantReq.device_fingerprint ?? null,
          signup_ip:                 tenantReq.request_ip         ?? null,
        })
        .select()
        .single()

      if (tenantError) throw tenantError
      tenantId = newTenant.id
    }

    // Check for duplicate device fingerprint across existing tenants (abuse signal)
    const duplicateWarnings: { type: string; tenantName: string }[] = []
    if (tenantReq.device_fingerprint) {
      const { data: fpMatches } = await supabaseClient
        .from('tenants')
        .select('name')
        .eq('signup_device_fingerprint', tenantReq.device_fingerprint)
        .neq('id', tenantId)
        .limit(3)
      if (fpMatches?.length) {
        duplicateWarnings.push(...fpMatches.map((t: { name: string }) => ({ type: 'device', tenantName: t.name })))
        console.warn(`[approve-tenant] ⚠ Duplicate device fingerprint for ${tenantReq.email} — matches: ${fpMatches.map((t: { name: string }) => t.name).join(', ')}`)
      }
    }

    const redirectTo = customRedirect || "https://finventree.com/activate"
    console.log(`Sending invitation. Redirect Target: ${redirectTo}`)

    // 2b. Clean up any existing user to ensure a fresh token is generated
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('email', tenantReq.email)
      .maybeSingle()

    let userIdToDelete = profile?.id

    if (!userIdToDelete) {
      const { data: { users }, error: listError } = await supabaseClient.auth.admin.listUsers()
      if (!listError && users) {
        const found = users.find((u: any) => u.email?.toLowerCase() === tenantReq.email.toLowerCase())
        if (found) {
          userIdToDelete = found.id
        }
      }
    }

    if (userIdToDelete) {
      console.log(`Deleting existing user: ${userIdToDelete} for email: ${tenantReq.email} to issue fresh invitation.`)
      await supabaseClient
        .from('profiles')
        .delete()
        .eq('id', userIdToDelete)

      const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userIdToDelete)
      if (deleteError) {
        console.error(`Failed to delete existing auth user: ${deleteError.message}`)
      }
    }

    // 3. Invite the user
    const { data: authUser, error: inviteError } = await supabaseClient.auth.admin.inviteUserByEmail(
      tenantReq.email,
      {
        redirectTo: redirectTo,
        data: {
          full_name: tenantReq.full_name,
          tenant_id: tenantId,
          role: 'admin'
        }
      }
    )

    if (inviteError) throw inviteError

    // 4. Create/Upsert the profile
    await supabaseClient
      .from('profiles')
      .upsert({
        id: authUser.user.id,
        tenant_id: tenantId,
        email: tenantReq.email,
        full_name: tenantReq.full_name,
        role: 'admin',
        is_active: true
      })

    // 5. Update request status
    await supabaseClient
      .from('tenant_requests')
      .update({ status: 'approved' })
      .eq('id', requestId)

    return new Response(
      JSON.stringify({ success: true, tenantId, redirectTo, duplicateWarnings }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
