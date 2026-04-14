import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { WebPush } from 'https://esm.sh/web-push@3.6.6'

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

    const { title, message, url, target_role } = await req.json()

    // 1. Fetch subscriptions based on role
    let query = supabaseClient
      .from('user_push_subscriptions')
      .select('user_id, subscription')

    if (target_role && target_role !== 'all') {
      // Join with profiles to filter by role
      const { data: usersWithRole, error: roleError } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('role', target_role)

      if (roleError) throw roleError
      const userIds = usersWithRole.map(u => u.id)
      query = query.in('user_id', userIds)
    }

    const { data: subscriptions, error: subError } = await query
    if (subError) throw subError

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'No subscriptions found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 2. Configure Web Push (VAPID)
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidEmail = Deno.env.get('VAPID_EMAIL') || 'admin@stockflow.app'

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured in Edge Environment')
    }

    const webPush = new WebPush({
      publicKey: vapidPublicKey,
      privateKey: vapidPrivateKey,
      subject: `mailto:${vapidEmail}`
    })

    const payload = JSON.stringify({
      title,
      message,
      url: url || '/'
    })

    // 3. Send notifications and cleanup stale subscriptions
    const expiredUserIds: string[] = []

    const results = await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        try {
          return await webPush.sendNotification(sub.subscription, payload)
        } catch (error) {
          // If 410 Gone or 404 Not Found, the subscription is expired/invalid
          if (error.statusCode === 410 || error.statusCode === 404) {
            expiredUserIds.push(sub.user_id)
          }
          throw error
        }
      })
    )

    // Parallel Cleanup: Remove stale subscriptions from DB
    if (expiredUserIds.length > 0) {
      console.log(`Cleaning up ${expiredUserIds.length} expired subscriptions...`)
      const { error: cleanupError } = await supabaseClient
        .from('user_push_subscriptions')
        .delete()
        .in('user_id', expiredUserIds)
      
      if (cleanupError) console.error('Cleanup Error:', cleanupError)
    }

    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failureCount = results.filter(r => r.status === 'rejected').length

    return new Response(
      JSON.stringify({ successCount, failureCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
