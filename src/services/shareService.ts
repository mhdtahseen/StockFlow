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
  return `${window.location.origin}/public/view/${data.token}`;
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

