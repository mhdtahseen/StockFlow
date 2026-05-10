import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Capacitor } from '@capacitor/core';
import {
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed,
} from '@capacitor/push-notifications';

const PUBLIC_VAPID_KEY = 'BHYiZ3JQs00FXpDgDFJGLlANMPq0y9RsIV8dubra9mWI2cv4iQZmPrPvXTYXr2TXhxst2ErB_w4Getkj30DssoY';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
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
      // ── Native (Android / iOS via Capacitor) ──────────────────────────────
      if (Capacitor.isNativePlatform()) {
        if (!enabled) {
          await supabase.from('user_push_subscriptions').delete().eq('user_id', session.user.id);
          return false;
        }

        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }
        if (permStatus.receive !== 'granted') return false;

        await PushNotifications.register();
        return true;
      }

      // ── Web (PWA) ─────────────────────────────────────────────────────────
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
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) await subscription.unsubscribe();
        await supabase.from('user_push_subscriptions').delete().eq('user_id', session.user.id);
        return false;
      }
    } catch (e) {
      console.error('Error toggling push notifications', e);
      return false;
    }
  };

  // Register native push listeners and persist FCM/APNs token to Supabase
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !session?.user?.id || !tenant?.id) return;

    const registrationListener = PushNotifications.addListener(
      'registration',
      async (token: Token) => {
        await supabase.from('user_push_subscriptions').upsert(
          {
            user_id: session.user.id,
            tenant_id: tenant.id,
            // Store FCM/APNs token in a structure compatible with existing schema
            subscription: { native: true, token: token.value, platform: Capacitor.getPlatform() },
          },
          { onConflict: 'user_id' }
        );
      }
    );

    const errorListener = PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error:', err);
    });

    const notificationListener = PushNotifications.addListener(
      'pushNotificationReceived',
      (_notification: PushNotificationSchema) => {
        // Notifications received while app is in foreground — handled by Capacitor automatically
      }
    );

    const actionListener = PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (_action: ActionPerformed) => {
        // Handle notification tap — navigate if needed
      }
    );

    return () => {
      registrationListener.then((l) => l.remove());
      errorListener.then((l) => l.remove());
      notificationListener.then((l) => l.remove());
      actionListener.then((l) => l.remove());
    };
  }, [session?.user?.id, tenant?.id]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return; // Native uses listener above
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const timer = setTimeout(() => togglePushNotifications(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [session, tenant?.id]);

  return { togglePushNotifications };
}
