import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';


const PUBLIC_VAPID_KEY = 'BHYiZ3JQs00FXpDgDFJGLlANMPq0y9RsIV8dubra9mWI2cv4iQZmPrPvXTYXr2TXhxst2ErB_w4Getkj30DssoY';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { session, tenant } = useAuth();

  const togglePushNotifications = async (enabled: boolean) => {
    if (!session?.user?.id || !tenant?.id) return false;

    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push notifications not supported by the browser.');
        return false;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');

      if (enabled) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
          });

          const { error } = await supabase.from('user_push_subscriptions').upsert(
            {
              user_id: session.user.id,
              tenant_id: tenant.id,
              subscription: JSON.parse(JSON.stringify(subscription)),
            },
            { onConflict: 'user_id' }
          );

          if (error) throw error;
          return true;
        }
        return false;
      } else {
        // Disable
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
        await supabase.from('user_push_subscriptions').delete().eq('user_id', session.user.id);
        return false;
      }
    } catch (e) {
      console.error('Error toggling push notifications', e);
      return false;
    }
  };

  useEffect(() => {
    // Optionally auto-subscribe on mount if permission was already granted
    if (Notification.permission === 'granted') {
      const timer = setTimeout(() => togglePushNotifications(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [session, tenant?.id]);

  return { togglePushNotifications };
}
