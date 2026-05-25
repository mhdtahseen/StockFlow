/**
 * useFreshFetch — Per-page DB fetch hook.
 *
 * On mount, fetches fresh data from Supabase and dispatches to Redux.
 * Shows cached Redux data immediately (no blank screen), then updates
 * when the DB response arrives. Falls back silently if offline/error.
 *
 * Also exports standalone fetch functions (e.g. fetchCounterparties) that
 * can be called imperatively (e.g. after a trade connect RPC).
 */
import { useEffect, useRef } from "react";
import { useAppDispatch } from "@/app/hooks";
import { supabase } from "@/lib/supabase";
import { getTenantId } from "@/app/supabaseApi";
import type { AppDispatch } from "@/app/store";

// ── Standalone fetch functions (can be called without the hook) ──────────────

export async function fetchCounterparties(dispatch: AppDispatch) {
  const tenantId = await getTenantId();
  if (!tenantId) return;

  const { data } = await supabase
    .from("counterparties")
    .select("*, linked_tenant:tenants!counterparties_linked_tenant_id_fkey(name)")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("name");

  if (data) {
    dispatch({
      type: "customers/setAll",
      payload: data.map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        phone: c.phone,
        email: c.email,
        platformName: c.platform_name,
        linkedTenantId: c.linked_tenant_id,
        linkedTenantName: c.linked_tenant?.name ?? undefined,
        notes: c.notes,
        gstin: c.gstin ?? undefined,
        state: c.state ?? undefined,
        createdAt: c.created_at,
      })),
    });
  }
}

export async function fetchSaleOrders(dispatch: AppDispatch) {
  const tenantId = await getTenantId();
  if (!tenantId) return;

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
  const { data } = await supabase
    .from("sale_orders")
    .select("*, sale_order_items(*)")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .gte("created_at", ninetyDaysAgo)
    .order("created_at", { ascending: false });

  if (data) {
    dispatch({
      type: "billing/setOrders",
      payload: data.map((o: any) => ({
        id: o.id, counterpartyId: o.counterparty_id, orderType: o.order_type,
        totalAmount: o.total_amount, amountPaid: o.amount_paid,
        status: o.status, paymentMode: o.payment_mode, dueDate: o.due_date,
        notes: o.notes, createdAt: o.created_at,
        gstEnabled: o.gst_enabled ?? false, gstType: o.gst_type ?? undefined,
        gstRate: o.gst_rate ?? undefined, subtotal: o.subtotal ?? undefined,
        cgstAmount: o.cgst_amount ?? undefined, sgstAmount: o.sgst_amount ?? undefined,
        igstAmount: o.igst_amount ?? undefined, buyerGstin: o.buyer_gstin ?? undefined,
        items: o.sale_order_items.map((i: any) => ({
          id: i.id, saleOrderId: i.sale_order_id, phoneId: i.phone_id,
          salePrice: i.sale_price, discountAmount: i.discount_amount,
          effectivePrice: i.sale_price - i.discount_amount,
          imeiSnapshot: i.imei_snapshot || [], brandSnapshot: i.brand_snapshot,
          modelSnapshot: i.model_snapshot, storageSnapshot: i.storage_snapshot,
          colorSnapshot: i.color_snapshot, hsnCode: i.hsn_code ?? undefined,
        })),
      })),
    });
  }
}

export async function fetchPurchaseOrders(dispatch: AppDispatch) {
  const tenantId = await getTenantId();
  if (!tenantId) return;

  const { data } = await supabase
    .from("purchase_orders")
    .select("*, purchase_order_items(*)")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .in("status", ["AWAITING_RECEIPT", "RECEIVED", "PARTIAL", "SETTLED", "CANCELLED"])
    .order("created_at", { ascending: false });

  if (data) {
    dispatch({
      type: "purchasing/setPurchaseOrders",
      payload: data.map((o: any) => ({
        id: o.id, counterpartyId: o.counterparty_id,
        acquisitionChannel: o.acquisition_channel, platformFee: o.platform_fee,
        phonesOrdered: o.phones_ordered, phonesReceived: o.phones_received,
        totalAmount: o.total_amount, amountPaid: o.amount_paid,
        status: o.status, paymentMode: o.payment_mode, dueDate: o.due_date,
        notes: o.notes, createdAt: o.created_at,
        gstEnabled: o.gst_enabled ?? false, gstType: o.gst_type ?? undefined,
        gstRate: o.gst_rate ?? undefined, subtotal: o.subtotal ?? undefined,
        cgstAmount: o.cgst_amount ?? undefined, sgstAmount: o.sgst_amount ?? undefined,
        igstAmount: o.igst_amount ?? undefined, sellerGstin: o.seller_gstin ?? undefined,
        items: o.purchase_order_items.map((i: any) => ({
          id: i.id, purchaseOrderId: i.purchase_order_id, phoneId: i.phone_id,
          purchasePrice: i.purchase_price, status: i.status,
          rejectionReason: i.rejection_reason, brand: i.brand, model: i.model,
          storage: i.storage, ram: i.ram, color: i.color, imei: i.imei,
          hsnCode: i.hsn_code ?? undefined,
        })),
      })),
    });
  }
}

export async function fetchInventory(dispatch: AppDispatch) {
  const { data } = await supabase
    .from("phones")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (data) {
    dispatch({
      type: "inventory/setPhones",
      payload: data.map((p: any) => ({
        id: p.id, brand: p.brand, model: p.model, storage: p.storage,
        ram: p.ram, color: p.color, imeis: p.imeis || [],
        purchasePrice: Number(p.purchase_price),
        salePrice: p.sale_price ? Number(p.sale_price) : undefined,
        status: p.status, issueTags: p.issue_tags, createdAt: p.created_at,
      })),
    });
  }
}

export async function fetchLedger(dispatch: AppDispatch) {
  const { data } = await supabase
    .from("ledger")
    .select("*")
    .order("created_at", { ascending: false });

  if (data) {
    dispatch({
      type: "ledger/setEntries",
      payload: data.map((e: any) => ({
        id: e.id, type: e.type, referenceId: e.reference_id ?? undefined,
        amount: Number(e.amount), paymentMode: e.payment_mode ?? undefined,
        note: e.note ?? undefined, settlementCount: e.settlement_count ?? undefined,
        customerPaymentId: e.customer_payment_id ?? undefined,
        supplierPaymentId: e.supplier_payment_id ?? undefined,
        saleOrderId: e.sale_order_id ?? undefined,
        purchaseOrderId: e.purchase_order_id ?? undefined, createdAt: e.created_at,
        isVoided: e.is_voided ?? false,
      })),
    });
  }
}

// ── Map of fetch functions by slice name ─────────────────────────────────────

const FETCHERS: Record<string, (dispatch: AppDispatch) => Promise<void>> = {
  customers: fetchCounterparties,
  orders: fetchSaleOrders,
  purchaseOrders: fetchPurchaseOrders,
  inventory: fetchInventory,
  ledger: fetchLedger,
};

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetches fresh data from DB on mount and dispatches to Redux.
 * Cached Redux data is shown immediately — this runs in the background.
 * @param slice - Which data slice to refresh: "customers" | "orders" | "purchaseOrders" | "inventory"
 */
export function useFreshFetch(slice: keyof typeof FETCHERS) {
  const dispatch = useAppDispatch();
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetcher = FETCHERS[slice];
    if (fetcher) {
      fetcher(dispatch).catch((err) => {
        console.warn(`[useFreshFetch] ${slice} fetch failed (using cache):`, err.message);
      });
    }
  }, [slice, dispatch]);
}
