import { supabase } from "@/lib/supabase";
import posthog from "@/lib/posthog";

type AnyAction = { type: string; payload?: any };

/** Discriminated result from a single sync attempt. The sync manager uses this
 *  to decide whether to remove, skip, park, or pause the outbox item. */
export type SyncResult =
  | "success"           // confirmed written (or idempotent hit)
  | "retry"             // transient failure — apply backoff and try again
  | "auth_expired"      // 401 / JWT expired — pause all processing until re-auth
  | "permanent_conflict"; // FK violation — will never succeed, mark item stuck

// Cache tenant ID to avoid redundant queries
let cachedTenantId: string | null = null;
export const getTenantId = async () => {
  if (cachedTenantId) return cachedTenantId;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", session.user.id)
    .single();

  if (data?.tenant_id) {
    cachedTenantId = data.tenant_id;
  }
  return cachedTenantId;
};

/** Call on sign-out to prevent tenant ID leakage between user sessions (A-002) */
export const clearTenantCache = () => {
  cachedTenantId = null;
};

// ─── Milestone survey triggers ───────────────────────────────────────────────
// Increments a per-device counter in localStorage. When the count first reaches
// the threshold, fires a one-time PostHog event that triggers a survey in the
// PostHog dashboard (Display conditions → "User sends event: milestone.*").
const MILESTONE_PFX = "finventree_milestone_";

function checkMilestone(metric: string, threshold: number, tenantId: string | null) {
  const scope = tenantId ?? "anon";
  const doneKey = `${MILESTONE_PFX}${scope}_${metric}_${threshold}`;
  if (localStorage.getItem(doneKey) === "done") return;

  const countKey = `${MILESTONE_PFX}${scope}_${metric}_count`;
  const next = parseInt(localStorage.getItem(countKey) || "0", 10) + 1;
  localStorage.setItem(countKey, String(next));

  if (next >= threshold) {
    localStorage.setItem(doneKey, "done");
    posthog.capture(`milestone.${metric}_${threshold}`);
  }
}

const doesPhoneExist = async (id: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from("phones")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.id);
};

export const syncActionToSupabase = async (
  action: AnyAction,
): Promise<SyncResult> => {
  try {
    const type = action.type;
    const payload = action.payload;
    const tenant_id = await getTenantId(); // Still useful for updates/deletes

    switch (type) {
      // ─── INVENTORY ──────────────────────────────────────────────────
      case "inventory/addPhone": {
        const { error } = await supabase.from("phones").insert({
          id: payload.id,
          // tenant_id and user_id handled by DB trigger
          brand: payload.brand,
          model: payload.model,
          storage: payload.storage,
          ram: payload.ram,
          color: payload.color,
          purchase_price: payload.purchasePrice,
          status: payload.status,
          issue_tags: payload.issueTags,
          imeis: payload.imeis || [],
          created_at: payload.createdAt,
        });
        if (error) throw error;
        posthog.capture("phone.added", { brand: payload.brand, model: payload.model, status: payload.status });
        checkMilestone("phones", 10, tenant_id);
        break;
      }
      case "inventory/updatePhone": {
        // The reducer payload shape is { id, phone: Partial<Phone>, prevPrice? }.
        // Only send fields that are actually defined to avoid overwriting with nulls.
        const { id, phone } = payload;
        const updates: Record<string, any> = {};
        if (phone.brand !== undefined)         updates.brand = phone.brand;
        if (phone.model !== undefined)         updates.model = phone.model;
        if (phone.storage !== undefined)       updates.storage = phone.storage;
        if (phone.ram !== undefined)           updates.ram = phone.ram;
        if (phone.color !== undefined)         updates.color = phone.color;
        if (phone.purchasePrice !== undefined) updates.purchase_price = phone.purchasePrice;
        if (phone.salePrice !== undefined)     updates.sale_price = phone.salePrice;
        if (phone.status !== undefined)        updates.status = phone.status;
        if (phone.issueTags !== undefined)     updates.issue_tags = phone.issueTags;
        if (phone.imeis !== undefined)         updates.imeis = phone.imeis;
        if (Object.keys(updates).length > 0) {
          const { error } = await supabase
            .from("phones")
            .update(updates)
            .eq("id", id)
            .eq("tenant_id", tenant_id);
          if (error) throw error;
        }
        break;
      }
      case "inventory/removePhone": {
        const { error } = await supabase
          .from("phones")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", payload)
          .eq("tenant_id", tenant_id);
        if (error) throw error;
        posthog.capture("phone.deleted");
        break;
      }
      case "inventory/markAsInStock": {
        const { error } = await supabase
          .from("phones")
          .update({
            status: "IN_STOCK",
            purchase_price: payload.finalPrice,
          })
          .eq("id", payload.id)
          .eq("tenant_id", tenant_id);
        if (error) throw error;
        break;
      }
      case "inventory/markAsSold": {
        const { error } = await supabase
          .from("phones")
          .update({
            status: "SOLD",
            sale_price: payload.salePrice,
          })
          .eq("id", payload.id)
          .eq("tenant_id", tenant_id);
        if (error) throw error;
        break;
      }

      // ─── LEDGER ─────────────────────────────────────────────────────
      case "ledger/addEntry": {
        let finalReferenceId = payload.referenceId;
        if (finalReferenceId) {
          const exists = await doesPhoneExist(finalReferenceId);
          // If the phone was deleted (e.g. reject unit -> removePhone),
          // we drop the referenceId to avoid foreign key violations,
          // but we MUST STILL insert the ledger entry (e.g. SUPPLIER_PAYMENT for refunds)
          if (!exists) {
            finalReferenceId = null;
          }
        }
        const { error } = await supabase.from("ledger").insert({
          id: payload.id,
          // tenant_id and user_id handled by DB trigger
          type: payload.type,
          reference_id: finalReferenceId,
          amount: payload.amount,
          payment_mode: payload.paymentMode ?? null, // ← financial channel tracking
          note: payload.note ?? null,
          created_at: payload.createdAt,
          // Audit metadata
          customer_payment_id: payload.customerPaymentId ?? null,
          supplier_payment_id: payload.supplierPaymentId ?? null,
          sale_order_id: payload.saleOrderId ?? null,
          purchase_order_id: payload.purchaseOrderId ?? null,
          settlement_count: payload.settlementCount ?? null,
        });
        if (error) throw error;
        break;
      }
      case "ledger/removeEntry": {
        const { error } = await supabase
          .from("ledger")
          .delete()
          .eq("id", payload)
          .eq("tenant_id", tenant_id);
        if (error) throw error;
        break;
      }

      // ─── MASTER DATA ────────────────────────────────────────────────
      case "masterData/addBrand":
      case "masterData/addModel":
      case "masterData/addColorOption":
      case "masterData/addRamOption":
      case "masterData/addStorageOption":
      case "masterData/addIssueTag": {
        const categoryMap: Record<string, string> = {
          "masterData/addBrand": "brand",
          "masterData/addModel": "model",
          "masterData/addColorOption": "color",
          "masterData/addRamOption": "ram",
          "masterData/addStorageOption": "storage",
          "masterData/addIssueTag": "issue_tag",
        };
        const category = categoryMap[type];
        if (!category) break;

        const { error } = await supabase.from("master_data").insert({
          // tenant_id and user_id handled by DB trigger
          category,
          value: payload,
        });
        // Ignore unique constraint violations silently
        if (error && error.code !== "23505") {
          throw error;
        }
        break;
      }
      // ─── BILLING ────────────────────────────────────────────────────
      case "billing/addOrder": {
        const { error } = await supabase.rpc("create_trade_order", {
          p_order_id: payload.id,
          p_counterparty_id: payload.counterpartyId,
          p_order_type: payload.orderType,
          p_payment_mode: payload.paymentMode ?? null,
          p_initial_payment: payload.amountPaid,
          p_due_date: payload.dueDate ?? null,
          p_notes: payload.notes ?? null,
          p_items: payload.items.map((i: any) => ({
            phone_id: i.phoneId,
            sale_price: i.salePrice,
            discount_amount: i.discountAmount,
            imei_snapshot: i.imeiSnapshot,
            brand: i.brandSnapshot,
            model: i.modelSnapshot,
            storage: i.storageSnapshot,
            color: i.colorSnapshot,
            // Item-level GST (present when gstEnabled; COALESCE→NULL in RPC if absent)
            hsn_code: i.hsnCode ?? null,
            gst_rate: i.gstRate ?? null,
            taxable_value: i.taxableValue ?? null,
            cgst_amount: i.cgstAmount ?? null,
            sgst_amount: i.sgstAmount ?? null,
            igst_amount: i.igstAmount ?? null,
          })),
          p_payment_note: payload.paymentNote ?? null,
          // Order-level GST (optional params — RPC defaults to no-GST if omitted)
          p_gst_enabled: payload.gstEnabled ?? false,
          p_gst_inclusive: payload.gstInclusive ?? true,
          p_gst_type: payload.gstType ?? null,
          p_gst_rate: payload.gstRate ?? null,
          p_subtotal: payload.subtotal ?? null,
          p_cgst_amount: payload.cgstAmount ?? null,
          p_sgst_amount: payload.sgstAmount ?? null,
          p_igst_amount: payload.igstAmount ?? null,
          p_buyer_gstin: payload.buyerGstin ?? null,
        });
        if (error) throw error;
        posthog.capture("order.created", { type: "sale", item_count: payload.items?.length ?? 1, amount: payload.totalAmount });
        checkMilestone("orders", 5, tenant_id);
        break;
      }
      case "billing/updateOrderPayment": {
        const { error } = await supabase
          .from("sale_orders")
          .update({
            amount_paid: payload.amountPaid,
            status: payload.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payload.id)
          .eq("tenant_id", tenant_id);
        if (error) throw error;
        if (payload.status === "SETTLED") {
          posthog.capture("order.settled", { type: "sale", amount: payload.amountPaid });
        }
        break;
      }
      case "billing/returnOrder": {
        const { error } = await supabase.rpc("return_order", {
          p_order_id: payload.orderId,
          p_refund_amount: payload.refundAmount ?? 0,
          p_payment_mode: payload.paymentMode ?? "CASH",
        });
        if (error) throw error;
        break;
      }
      case "billing/updateOrder": {
        const updates: Record<string, any> = {};
        if (payload.counterpartyId !== undefined) updates.counterparty_id = payload.counterpartyId;
        if (payload.notes !== undefined) updates.notes = payload.notes;
        if (payload.dueDate !== undefined) updates.due_date = payload.dueDate;
        if (payload.paymentMode !== undefined) updates.payment_mode = payload.paymentMode;
        if (Object.keys(updates).length > 0) {
          const { error } = await supabase
            .from("sale_orders")
            .update(updates)
            .eq("id", payload.id)
            .eq("tenant_id", tenant_id);
          if (error) throw error;
        }
        break;
      }
      // ─── INVENTORY ────────────────────────────────────────────────────
      case "inventory/addRepairLog": {
        // payload.id is a stable UUID generated at dispatch time — safe to retry
        const { id: repairId, phoneId, amount, note, recordedBy } = payload;
        const { error } = await supabase.from("ledger").insert({
          id: repairId,
          tenant_id,
          user_id: recordedBy,
          type: "REPAIR_COST",
          reference_id: phoneId,
          amount: -amount,
          note: `REPAIR - #${phoneId.slice(0, 8).toUpperCase()} : ${note}`,
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
        break;
      }

      case "inventory/removeRepairLog": {
        const { entryId } = payload;
        const { error } = await supabase
          .from("ledger")
          .delete()
          .eq("id", entryId)
          .eq("tenant_id", tenant_id);
        if (error) throw error;
        break;
      }

      case "inventory/linkPhoneToPO": {
        const { error } = await supabase.rpc("link_phone_to_po", {
          p_phone_id: payload.phoneId,
          p_purchase_order_id: payload.purchaseOrderId,
        });
        if (error) throw error;
        break;
      }
      // ─── PURCHASING ─────────────────────────────────────────────────
      case "purchasing/addPurchaseOrder": {
        const { error } = await supabase.rpc("create_purchase_order", {
          p_order_id: payload.id,
          p_counterparty_id: payload.counterpartyId,
          p_channel: payload.acquisitionChannel,
          p_platform_fee: payload.platformFee,
          p_payment_mode: payload.paymentMode ?? null,
          p_initial_payment: payload.amountPaid,
          p_due_date: payload.dueDate ?? null,
          p_notes: payload.notes ?? null,
          p_items: payload.items.map((i: any) => ({
            phone_id:       i.phoneId,
            purchase_price: i.purchasePrice,
            brand:          i.brand   ?? null,
            model:          i.model   ?? null,
            storage:        i.storage ?? null,
            color:          i.color   ?? null,
            ram:            i.ram     ?? null,
            imei:           i.imei    ?? (i.imeis?.[0] ?? null),
            issue_tags:     i.issueTags || [],
            // AddDevices phone-snapshot fields (null for inspection path — RPC ignores them)
            imeis:        i.imeis       ?? null,
            phone_status: i.phoneStatus ?? null,
            item_status:  i.itemStatus  ?? null,
            created_at:   i.createdAt   ?? null,
            // Item-level GST (present when gstEnabled; COALESCE→NULL in RPC if absent)
            hsn_code:      i.hsnCode      ?? null,
            gst_rate:      i.gstRate      ?? null,
            taxable_value: i.taxableValue ?? null,
            cgst_amount:   i.cgstAmount   ?? null,
            sgst_amount:   i.sgstAmount   ?? null,
            igst_amount:   i.igstAmount   ?? null,
          })),
          p_payment_note: payload.paymentNote ?? null,
          // Order-level GST (optional params — RPC defaults to no-GST if omitted)
          p_gst_enabled: payload.gstEnabled ?? false,
          p_gst_inclusive: payload.gstInclusive ?? true,
          p_gst_type: payload.gstType ?? null,
          p_gst_rate: payload.gstRate ?? null,
          p_subtotal: payload.subtotal ?? null,
          p_cgst_amount: payload.cgstAmount ?? null,
          p_sgst_amount: payload.sgstAmount ?? null,
          p_igst_amount: payload.igstAmount ?? null,
          p_seller_gstin: payload.sellerGstin ?? null,
        });
        if (error) throw error;
        posthog.capture("order.created", { type: "purchase", item_count: payload.items?.length ?? 1, channel: payload.acquisitionChannel, amount: payload.totalAmount });
        checkMilestone("orders", 5, tenant_id);
        break;
      }
      // ─── CUSTOMERS ──────────────────────────────────────────────────
      case "customers/addCustomerSettlement": {
        const { error } = await supabase.rpc("record_customer_settlement_fifo", {
          p_counterparty_id: payload.counterpartyId,
          p_amount: payload.amount,
          p_mode: payload.mode,
          p_note: payload.note ?? null,
          p_payment_id: payload.id,
        });
        if (error) throw error;
        break;
      }
      case "customers/addCustomerPayment": {
        const { error } = await supabase.rpc("record_customer_payment", {
          p_counterparty_id: payload.counterpartyId,
          p_total_received: payload.totalReceived,
          p_mode: payload.mode,
          p_allocations: payload.allocations.map((a: any) => ({
            saleOrderId: a.saleOrderId,
            amountAllocated: a.amountAllocated,
            note: a.note,
          })),
          p_note: payload.note ?? null,
          p_payment_id: payload.id,
        });
        if (error) throw error;
        posthog.capture("payment.logged", { direction: "inbound", mode: payload.mode, amount: payload.totalReceived });
        break;
      }
      case "purchasing/addSupplierSettlement": {
        const { error } = await supabase.rpc("record_supplier_settlement_fifo", {
          p_counterparty_id: payload.counterpartyId,
          p_amount: payload.amount,
          p_mode: payload.mode,
          p_note: payload.note ?? null,
          p_payment_id: payload.id,
        });
        if (error) throw error;
        break;
      }
      case "purchasing/addSupplierPayment": {
        const { error } = await supabase.rpc("record_supplier_payment", {
          p_counterparty_id: payload.counterpartyId,
          p_total_paid: payload.totalPaid,
          p_mode: payload.mode,
          p_allocations: payload.allocations.map((a: any) => ({
            purchaseOrderId: a.purchaseOrderId,
            amountAllocated: a.amountAllocated,
            note: a.note,
          })),
          p_note: payload.note ?? null,
          p_payment_id: payload.id,
        });
        if (error) throw error;
        posthog.capture("payment.logged", { direction: "outbound", mode: payload.mode, amount: payload.totalPaid });
        break;
      }
      case "purchasing/markPOItemAccepted": {
        const { error } = await supabase.rpc("mark_po_item_accepted", {
          p_item_id: payload.itemId,
          p_purchase_order_id: payload.purchaseOrderId,
          p_phone_id: payload.phoneId,
          p_final_price: payload.finalPrice,
        });
        if (error) throw error;
        break;
      }
      case "purchasing/markPOItemRejected": {
        const { error } = await supabase.rpc("mark_po_item_rejected", {
          p_item_id: payload.itemId,
          p_purchase_order_id: payload.purchaseOrderId,
          p_reason: payload.reason,
        });
        if (error) throw error;
        break;
      }
      case "purchasing/updatePurchaseOrder": {
        const updates: Record<string, any> = {};
        if (payload.counterpartyId !== undefined) updates.counterparty_id = payload.counterpartyId;
        if (payload.notes !== undefined) updates.notes = payload.notes;
        if (payload.dueDate !== undefined) updates.due_date = payload.dueDate;
        if (Object.keys(updates).length > 0) {
          const { error } = await supabase
            .from("purchase_orders")
            .update(updates)
            .eq("id", payload.id)
            .eq("tenant_id", tenant_id);
          if (error) throw error;
        }
        break;
      }
      case "purchasing/updatePOPayment": {
        // Local reducer updates amountPaid + status on a PO after a partial payment.
        // Without this handler the PO balance would reset to the server value on refresh.
        const { error } = await supabase
          .from("purchase_orders")
          .update({
            amount_paid: payload.amountPaid,
            status: payload.status,
          })
          .eq("id", payload.id)
          .eq("tenant_id", tenant_id);
        if (error) throw error;
        break;
      }
      case "purchasing/confirmReceipt": {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const { error } = await supabase.rpc("certify_po_receipt", {
          p_order_id: payload.id,
          p_items: payload.items,
          p_status: payload.status,
          p_phones_received: payload.phonesReceived,
          p_total_amount: payload.totalAmount,
          p_tenant_id: tenant_id,
          p_user_id: user?.id,
        });

        if (error) throw error;
        break;
      }
      case "purchasing/editPurchaseOrder": {
        const { data, error } = await supabase.rpc("edit_purchase_order", {
          p_order_id: payload.id,
          p_counterparty_id: payload.counterpartyId,
          p_channel: payload.acquisitionChannel,
          p_platform_fee: payload.platformFee,
          p_due_date: payload.dueDate ?? null,
          p_notes: payload.notes ?? null,
          p_items: payload.items.map((i: any) => ({
            id: i.id ?? null,
            purchase_price: i.purchasePrice,
            brand: i.brand,
            model: i.model,
            storage: i.storage,
            color: i.color,
            ram: i.ram ?? null,
            imei: i.imei ?? null,
            issue_tags: i.issueTags || [],
          })),
        });
        if (error) throw error;
        posthog.capture("order.edited", { type: "purchase", order_id: payload.id });
        break;
      }
      case "purchasing/softDeletePurchaseOrder": {
        const { error } = await supabase.rpc("soft_delete_purchase_order", {
          p_order_id: payload,
        });
        if (error) throw error;
        posthog.capture("order.deleted", { type: "purchase", order_id: payload });
        break;
      }
      case "billing/editSaleOrder": {
        const { data, error } = await supabase.rpc("edit_sale_order", {
          p_order_id: payload.id,
          p_counterparty_id: payload.counterpartyId,
          p_due_date: payload.dueDate ?? null,
          p_notes: payload.notes ?? null,
          p_items: payload.items.map((i: any) => ({
            id: i.id,
            sale_price: i.salePrice,
            discount_amount: i.discountAmount ?? 0,
          })),
        });
        if (error) throw error;
        posthog.capture("order.edited", { type: "sale", order_id: payload.id });
        break;
      }
      case "billing/softDeleteSaleOrder": {
        const { error } = await supabase.rpc("soft_delete_sale_order", {
          p_order_id: payload,
        });
        if (error) throw error;
        posthog.capture("order.deleted", { type: "sale", order_id: payload });
        break;
      }
      case "billing/cancelSaleOrder": {
        const { error } = await supabase.rpc("cancel_sale_order", {
          p_order_id: payload,
        });
        if (error) throw error;
        posthog.capture("order.cancelled", { type: "sale", order_id: payload });
        break;
      }
      case "purchasing/cancelPurchaseOrder": {
        const { error } = await supabase.rpc("cancel_purchase_order", {
          p_order_id: payload,
        });
        if (error) throw error;
        posthog.capture("order.cancelled", { type: "purchase", order_id: payload });
        break;
      }
      case "customers/addCustomer": {
        // Get tenant_id from current user's profile
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data: profile } = await supabase
          .from("profiles")
          .select("tenant_id")
          .eq("id", user.id)
          .single();

        if (!profile?.tenant_id) throw new Error("Tenant not found");

        // Map legacy types to valid DB values
        const validTypes: Record<string, string> = {
          RETAIL: "CUSTOMER",
          B2B: "ENTERPRISE",
        };
        const mappedType = validTypes[payload.type] || payload.type;

        const { error } = await supabase.from("counterparties").insert({
          id: payload.id,
          tenant_id: profile.tenant_id,
          name: payload.name,
          type: mappedType,
          phone: payload.phone ?? null,
          email: payload.email ?? null,
          platform_name: payload.platformName ?? null,
          linked_tenant_id: payload.linkedTenantId ?? null,
          notes: payload.notes ?? null,
          gstin: payload.gstin ?? null,
          state: payload.state ?? null,
          address: payload.address ?? null,
          pincode: payload.pincode ?? null,
          aadhaar_encrypted: payload.aadhaarEncrypted ?? null,
          aadhaar_last4: payload.aadhaarLast4 ?? null,
          tags: payload.tags ?? [],
          created_at: payload.createdAt,
        });
        if (error) throw error;
        posthog.capture("customer.added", { type: mappedType });
        checkMilestone("customers", 3, tenant_id);
        break;
      }
      case "customers/updateCustomer": {
        const { error } = await supabase
          .from("counterparties")
          .update({
            name: payload.name,
            type: payload.type,
            phone: payload.phone ?? null,
            email: payload.email ?? null,
            platform_name: payload.platformName ?? null,
            linked_tenant_id: payload.linkedTenantId ?? null,
            notes: payload.notes ?? null,
            gstin: payload.gstin ?? null,
            state: payload.state ?? null,
            address: payload.address ?? null,
            pincode: payload.pincode ?? null,
            aadhaar_encrypted: payload.aadhaarEncrypted ?? null,
            aadhaar_last4: payload.aadhaarLast4 ?? null,
            tags: payload.tags ?? [],
            updated_at: new Date().toISOString(),
          })
          .eq("id", payload.id)
          .eq("tenant_id", tenant_id);
        if (error) throw error;
        break;
      }
      case "customers/removeCustomer": {
        const { error } = await supabase
          .from("counterparties")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", payload)
          .eq("tenant_id", tenant_id);
        if (error) throw error;
        posthog.capture("customer.deleted");
        break;
      }
      case "tenant/updateTenant": {
        const { error } = await supabase
          .from("tenants")
          .update({
            name: payload.name,
            address: payload.address,
            gstin: payload.gstin,
            phone: payload.phone,
          })
          .eq("id", tenant_id);
        if (error) throw error;
        break;
      }
      case "tenant/updateMemberRole": {
        const { error } = await supabase
          .from("profiles")
          .update({
            role: payload.role,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payload.id)
          .eq("tenant_id", tenant_id);
        if (error) throw error;
        break;
      }
      default:
        // An action type was queued but has no handler. Log a warning so this is
        // caught in development, but return "success" to clear it from the outbox
        // rather than letting it block indefinitely.
        console.warn(`[Sync] No API handler for queued action: "${type}". Clearing from outbox.`);
        posthog.capture("sync.unhandled_action", { action: type });
        break;
    }

    return "success";
  } catch (error: any) {
    const pgErrorCode = error.code;

    // ── Idempotency hit ─────────────────────────────────────────────
    // A unique-key violation means the record was already written (the previous
    // sync attempt succeeded but the ACK was lost). Treat as success so the
    // outbox item is cleared and not retried.
    if (pgErrorCode === "23505" || (error.status === 409 && error.message?.toLowerCase().includes("already exists"))) {
      console.info("Supabase Sync: Idempotency hit — already exists.", action.type);
      return "success";
    }

    // ── Auth expired ─────────────────────────────────────────────────
    // JWT expired or session revoked. Do NOT increment retryCount — the item
    // should resume automatically when the session is refreshed.
    if (
      error.status === 401 ||
      pgErrorCode === "PGRST301" ||
      error.message?.includes("JWT") ||
      error.message?.includes("session_not_found") ||
      error.message?.includes("invalid claim")
    ) {
      console.warn("Supabase Sync: Auth expired — pausing outbox.", error.message);
      return "auth_expired";
    }

    // ── Foreign key violation ────────────────────────────────────────
    // A dependency record (phone, customer, PO) no longer exists on the server.
    // Retrying will never fix this — mark the item stuck for user resolution.
    if (pgErrorCode === "23503") {
      console.warn("Supabase Sync: FK violation — marking stuck.", action.type, error.message);
      posthog.capture("sync.stuck", { action: action.type, error_message: error.message ?? null });
      return "permanent_conflict";
    }

    // ── Retriable failure ────────────────────────────────────────────
    console.warn("Supabase Sync Failed:", error.message || error);
    posthog.capture("sync.failed", {
      action: action.type,
      error_code: pgErrorCode ?? null,
      error_message: error.message ?? null,
    });
    return "retry";
  }
};

// ─── UNIT REGISTRY & LIFECYCLE (PHASE 10) ──────────────────────────

/** Look up device specs in the global registry by IMEI */
export const lookupUnitByImei = async (imei: string) => {
  if (!imei || imei.length < 15) return null;
  
  const { data, error } = await supabase
    .from("unit_registry")
    .select("*")
    .or(`imei1.eq.${imei},imei2.eq.${imei}`)
    .maybeSingle();

  if (error) {
    console.error("Registry lookup failed:", error);
    return null;
  }
  return data;
};

/** Get global lifecycle history for a unit by its IMEIs */
export const getUnitHistory = async (imeis: string[]) => {
  if (!imeis || imeis.length === 0) return [];

  // 1. Find the unit ID from the registry
  const { data: unit, error: unitError } = await supabase
    .from("unit_registry")
    .select("id")
    .or(`imei1.in.(${imeis.join(",")}),imei2.in.(${imeis.join(",")})`)
    .maybeSingle();

  if (unitError || !unit) return [];

  // 2. Fetch all lifecycle events for this unit
  const { data, error } = await supabase
    .from("unit_lifecycle")
    .select("*")
    .eq("unit_id", unit.id)
    .order("event_date", { ascending: false });

  if (error) {
    console.error("Lifecycle fetch failed:", error);
    return [];
  }

  return data;
};

// ─── Trade Network RPCs ───────────────────────────────────────────────────────

/**
 * Look up a tenant by its 6-char Trade Code.
 * Returns `{ found: true, tenant_id, name, trade_code }` or `{ found: false }`.
 */
export const lookupTenantByTradeCode = async (code: string) => {
  const { data, error } = await supabase.rpc("lookup_tenant_by_trade_code", {
    p_code: code.trim().toUpperCase(),
  });
  if (error) throw new Error(error.message);
  return data as { found: boolean; tenant_id?: string; name?: string; trade_code?: string };
};

/**
 * Link a counterparty to a verified StockFlow tenant via Trade Code.
 * Returns `{ linked: true, tenant_id, tenant_name }`.
 */
export const linkCounterpartyToTenant = async (
  counterpartyId: string,
  tradeCode: string,
) => {
  const { data, error } = await supabase.rpc("link_counterparty_to_tenant", {
    p_counterparty_id: counterpartyId,
    p_trade_code: tradeCode.trim().toUpperCase(),
  });
  if (error) throw new Error(error.message);
  return data as { linked: boolean; tenant_id: string; tenant_name: string };
};

/**
 * Remove the StockFlow business link from a counterparty.
 */
export const unlinkCounterparty = async (counterpartyId: string) => {
  const { error } = await supabase.rpc("unlink_counterparty", {
    p_counterparty_id: counterpartyId,
  });
  if (error) throw new Error(error.message);
};

/**
 * Initiate a transfer: creates a mirror PO on the receiver's tenant.
 * Must be called immediately after a TRANSFER SO is committed.
 */
export const createTransfer = async (saleOrderId: string) => {
  const { data, error } = await supabase.rpc("create_transfer", {
    p_sale_order_id: saleOrderId,
  });
  if (error) throw new Error(error.message);
  return data as { po_id: string; receiver_tenant_id: string };
};

/**
 * Sync transfer status back to the sender's SO.
 * Called after certify_po_receipt on a transfer PO.
 */
export const syncTransferStatus = async (poId: string) => {
  const { error } = await supabase.rpc("sync_transfer_status", {
    p_po_id: poId,
  });
  if (error) throw new Error(error.message);
};

// ─── TRADE NETWORK: QR CONNECT ──────────────────────────────────────────────

/**
 * Connect two businesses mutually via Trade Code.
 * Creates a counterparty on BOTH sides and links them.
 * Idempotent — returns existing connection if already linked.
 */
export const connectByTradeCode = async (
  tradeCode: string,
  typeForMe: string,   // how I classify them
  typeForThem: string, // how they classify me
): Promise<{ counterpartyId: string; theirName: string; alreadyConnected: boolean }> => {
  const { data, error } = await supabase.rpc("connect_by_trade_code", {
    p_trade_code:    tradeCode,
    p_type_for_me:   typeForMe,
    p_type_for_them: typeForThem,
  });
  if (error) throw new Error(error.message);
  return {
    counterpartyId:   data.counterparty_id,
    theirName:        data.their_name,
    alreadyConnected: data.already_connected,
  };
};
