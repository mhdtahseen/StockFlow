import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { WebPush } from 'https://esm.sh/web-push@3.6.6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── FCM Auth: exchange service account JSON for a short-lived OAuth2 token ───
async function getFirebaseAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson)
  const now = Math.floor(Date.now() / 1000)

  const b64url = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const signingInput = `${b64url({ alg: 'RS256', typ: 'JWT' })}.${b64url({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`

  const pemKey = sa.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '')

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    Uint8Array.from(atob(pemKey), (c) => c.charCodeAt(0)),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signingInput),
  )

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${signingInput}.${sigB64}`,
    }),
  })

  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) throw new Error(`FCM auth failed: ${JSON.stringify(tokenData)}`)
  return tokenData.access_token
}

// ── Send a single FCM HTTP v1 message ────────────────────────────────────────
async function sendFcmMessage(
  accessToken: string,
  projectId: string,
  deviceToken: string,
  title: string,
  body: string,
  url: string,
): Promise<void> {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          token: deviceToken,
          notification: { title, body },
          data: { url: url || '/' },
          android: { priority: 'high' },
          apns: {
            payload: { aps: { alert: { title, body }, sound: 'default', badge: 1 } },
          },
        },
      }),
    },
  )

  if (!res.ok) {
    const err = await res.json()
    const code = err?.error?.details?.[0]?.errorCode ?? err?.error?.status ?? 'UNKNOWN'
    throw { statusCode: res.status, code }
  }
}

serve(async (req) => {
  // Handle CORS preflight — must return 200 before any auth check
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    // ── Custom auth: validate the caller's JWT and check they are a super-admin
    // (verify_jwt is disabled on this function so the OPTIONS preflight succeeds,
    //  but we still protect POST requests ourselves using the caller's bearer token)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify the caller's JWT using the anon key client (no service role needed here)
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: userErr } = await callerClient.auth.getUser()
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check role via service role client (bypasses RLS for the lookup)
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'super-admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: super-admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { title, message, url, target_role, platform: targetPlatform } = await req.json()

    // 1. Fetch subscriptions, filtered by role if requested
    let query = serviceClient
      .from('user_push_subscriptions')
      .select('user_id, platform, native_token, subscription')

    if (target_role && target_role !== 'all') {
      const { data: usersWithRole, error: roleError } = await serviceClient
        .from('profiles')
        .select('id')
        .eq('role', target_role)
      if (roleError) throw roleError
      query = query.in('user_id', usersWithRole.map((u: any) => u.id))
    }

    // Filter by platform target ('mobile' | 'web' | 'all')
    if (targetPlatform === 'mobile') {
      query = query.in('platform', ['android', 'ios'])
    } else if (targetPlatform === 'web') {
      query = query.eq('platform', 'web')
    }

    const { data: subscriptions, error: subError } = await query
    if (subError) throw subError

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions found', successCount: 0, failureCount: 0, breakdown: { web: { success: 0, failed: 0 }, native: { success: 0, failed: 0 } } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
      )
    }

    // 2. Split into web (VAPID) and native (FCM) buckets
    const webSubs = subscriptions.filter((s: any) =>
      s.platform === 'web' || (!s.platform && !s.subscription?.native),
    )
    const nativeSubs = subscriptions.filter((s: any) =>
      s.platform === 'android' || s.platform === 'ios' || s.subscription?.native === true,
    )

    const expiredTokens: { user_id: string; platform: string }[] = []
    let webSuccess = 0, webFailed = 0, nativeSuccess = 0, nativeFailed = 0

    // 3. Web Push via VAPID
    if (webSubs.length > 0) {
      const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
      const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
      const vapidEmail = Deno.env.get('VAPID_EMAIL') || 'admin@finventree.com'

      if (vapidPublicKey && vapidPrivateKey) {
        const webPush = new WebPush({ publicKey: vapidPublicKey, privateKey: vapidPrivateKey, subject: `mailto:${vapidEmail}` })
        const payload = JSON.stringify({ title, message, url: url || '/' })

        const results = await Promise.allSettled(
          webSubs.map(async (sub: any) => {
            try {
              await webPush.sendNotification(sub.subscription, payload)
            } catch (error: any) {
              if (error.statusCode === 410 || error.statusCode === 404) {
                expiredTokens.push({ user_id: sub.user_id, platform: sub.platform || 'web' })
              }
              throw error
            }
          }),
        )
        webSuccess = results.filter((r) => r.status === 'fulfilled').length
        webFailed = results.filter((r) => r.status === 'rejected').length
      } else {
        console.warn('[push-broadcast] VAPID keys not configured — skipping web push')
        webFailed = webSubs.length
      }
    }

    // 4. Native Push via FCM HTTP v1
    if (nativeSubs.length > 0) {
      const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON')
      const firebaseProjectId = Deno.env.get('FIREBASE_PROJECT_ID')

      if (serviceAccountJson && firebaseProjectId) {
        const accessToken = await getFirebaseAccessToken(serviceAccountJson)

        const results = await Promise.allSettled(
          nativeSubs.map(async (sub: any) => {
            const deviceToken = sub.native_token || sub.subscription?.token
            if (!deviceToken) throw new Error('No device token')
            try {
              await sendFcmMessage(accessToken, firebaseProjectId, deviceToken, title, message, url || '/')
            } catch (error: any) {
              // UNREGISTERED or INVALID_ARGUMENT = stale token, clean it up
              if (
                error.statusCode === 404 ||
                error.code === 'UNREGISTERED' ||
                error.code === 'INVALID_ARGUMENT'
              ) {
                expiredTokens.push({ user_id: sub.user_id, platform: sub.platform || 'android' })
              }
              throw error
            }
          }),
        )
        nativeSuccess = results.filter((r) => r.status === 'fulfilled').length
        nativeFailed = results.filter((r) => r.status === 'rejected').length
      } else {
        console.warn('[push-broadcast] Firebase not configured — skipping native push')
        nativeFailed = nativeSubs.length
      }
    }

    // 5. Clean up expired / unregistered tokens
    for (const { user_id, platform } of expiredTokens) {
      await serviceClient
        .from('user_push_subscriptions')
        .delete()
        .eq('user_id', user_id)
        .eq('platform', platform)
    }

    return new Response(
      JSON.stringify({
        successCount: webSuccess + nativeSuccess,
        failureCount: webFailed + nativeFailed,
        breakdown: {
          web: { success: webSuccess, failed: webFailed },
          native: { success: nativeSuccess, failed: nativeFailed },
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
