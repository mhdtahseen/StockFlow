import { supabase } from '@/lib/supabase';

export interface PublicOrderData {
  order: {
    id: string;
    totalAmount: number;
    amountPaid: number;
    status: string;
    createdAt: string;
    type: 'SALE' | 'PURCHASE';
    orderType?: string;
    items: any[]; // Polymorphic items (Sales include snapshots, Purchase include standard fields)
  };
  counterparty: {
    name: string;
    address?: string;
    phone?: string;
  };
  tenant: {
    name: string;
    address?: string;
    gstin?: string;
    phone?: string;
  };
  expires_at: string;
}


/**
 * Copies text to clipboard with a textarea fallback for environments
 * where the Clipboard API is unavailable (e.g., non-HTTPS, Capacitor WebView).
 */
export function copyToClipboard(text: string): boolean {
  // Modern Clipboard API (async, may require permissions)
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
    return true;
  }
  // Fallback: execCommand (deprecated but widely supported)
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(textarea);
  return ok;
}

/**
 * Creates a public sharing token for a document.
 * Valid for 30 days.
 */
export async function createShareLink(orderId: string, orderType: 'SALE' | 'PURCHASE', tenantId: string) {
  const { data, error } = await supabase
    .from('public_shares')
    .insert([
      {
        order_id: orderId,
        order_type: orderType,
        tenant_id: tenantId,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ])
    .select('token')
    .single();

  if (error) throw error;
  // Always use the configured public URL so native builds (capacitor://localhost)
  // and local dev both produce a valid shareable link.
  const base = (import.meta.env.VITE_APP_URL ?? window.location.origin).replace(/\/$/, '');
  return `${base}/public/view/${data.token}`;
}

/**
 * Fetches public order data using an obfuscated token.
 * Security is handled by the 'get_shared_order' security-definer function in Postgres.
 */
export async function fetchPublicOrder(token: string): Promise<PublicOrderData | null> {
  const cleanToken = token.trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(cleanToken)) {
    console.error('Invalid token format');
    return null;
  }

  const { data, error } = await supabase.rpc('get_shared_order', { share_token: cleanToken });

  if (error) {
    console.error('Database error fetching public order:', error.message, error.details);
    return null;
  }

  if (!data) {
    return null;
  }

  // Handle the custom error object from our robust RPC
  if (data.error === 'ORDER_NOT_FOUND') {
    console.warn('Order record no longer exists, but share token is valid.');
    return null;
  }

  return data as PublicOrderData;
}

