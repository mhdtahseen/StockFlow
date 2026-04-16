import { supabase } from "@/lib/supabase";
import { AnyAction } from "redux";

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
): Promise<boolean> => {
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
        break;
      }
      case "inventory/updatePhone": {
        const { error } = await supabase
          .from("phones")
          .update({
            brand: payload.brand,
            model: payload.model,
            storage: payload.storage,
            ram: payload.ram,
            color: payload.color,
            purchase_price: payload.purchasePrice,
            sale_price: payload.salePrice,
            status: payload.status,
            issue_tags: payload.issueTags,
            imeis: payload.imeis || [],
          })
          .eq("id", payload.id)
          .eq("tenant_id", tenant_id);
        if (error) throw error;
        break;
      }
      case "inventory/removePhone": {
        const { error } = await supabase
          .from("phones")
          .delete()
          .eq("id", payload)
          .eq("tenant_id", tenant_id);
        if (error) throw error;
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
          // but we MUST STILL insert the ledger entry (e.g. FUNDS_RELEASED)
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
          })),
          p_payment_note: null,
        });
        if (error) throw error;
        break;
      }
      case "billing/updateOrderPayment": {
        const { error } = await supabase.rpc("update_order_payment", {
          p_order_id: payload.id,
          p_amount_paid: payload.amountPaid,
          p_status: payload.status,
        });
        if (error) throw error;
        break;
      }
      case "billing/returnOrder": {
        const { error } = await supabase.rpc("return_order", {
          p_order_id: payload,
        });
        if (error) throw error;
        break;
      }
      // ─── INVENTORY ────────────────────────────────────────────────────
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
            phone_id: i.phoneId,
            purchase_price: i.purchasePrice,
            brand: i.brand,
            model: i.model,
            storage: i.storage,
            color: i.color,
            ram: i.ram,
            imei: i.imei,
            issue_tags: i.issueTags || [],
          })),
        });
        if (error) throw error;
        break;
      }
      // ─── CUSTOMERS ──────────────────────────────────────────────────
      case "customers/addCustomerSettlement": {
        const { error } = await supabase.rpc("record_customer_settlement_fifo", {
          p_counterparty_id: payload.counterpartyId,
          p_amount: payload.amount,
          p_mode: payload.mode,
          p_note: payload.note ?? null,
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
        });
        if (error) throw error;
        break;
      }
      case "purchasing/addSupplierSettlement": {
        const { error } = await supabase.rpc("record_supplier_settlement_fifo", {
          p_counterparty_id: payload.counterpartyId,
          p_amount: payload.amount,
          p_mode: payload.mode,
          p_note: payload.note ?? null,
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
        });
        if (error) throw error;
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
      case "purchasing/confirmReceipt": {
        // 1. Update PO Status and Totals
        const { error: poError } = await supabase
          .from("purchase_orders")
          .upsert({
            id: payload.id,
            status: payload.status,
            phones_received: payload.phonesReceived,
            total_amount: payload.totalAmount,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });
        
        if (poError) throw poError;

        // 2. Update PO Items (Snapshots & Results)
        if (payload.items && payload.items.length > 0) {
          const itemUpdates = payload.items.map((it: any) => ({
            id: it.id,
            purchase_order_id: payload.id,
            status: it.status,
            phone_id: it.phoneId,
            rejection_reason: it.rejectionReason,
            purchase_price: it.purchasePrice,
            brand: it.brand,
            model: it.model,
            storage: it.storage,
            color: it.color,
            ram: it.ram,
            imei: it.imei,
            issue_tags: it.issueTags || [],
          }));

          const { error: itemsError } = await supabase
            .from("purchase_order_items")
            .upsert(itemUpdates);
          
          if (itemsError) throw itemsError;

          // 3. Insert ACCEPTED phones into Inventory
          const { data: { user } } = await supabase.auth.getUser();

          const phonesToInsert = payload.items
            .filter((it: any) => it.status === "ACCEPTED" && it.phone)
            .map((it: any) => ({
              id: it.phone.id,
              tenant_id: tenant_id,
              user_id: user?.id,
              brand: it.phone.brand,
              model: it.phone.model,
              ram: it.phone.ram || "N/A",
              storage: it.phone.storage,
              color: it.phone.color,
              imeis: it.phone.imeis || [],
              purchase_price: it.phone.purchasePrice,
              sale_price: it.phone.salePrice || null,
              status: it.phone.status || "IN_STOCK",
              issue_tags: it.phone.issueTags || [],
              purchase_order_id: payload.id, 
              created_at: it.phone.createdAt || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }));

          if (phonesToInsert.length > 0) {
            const { error: phonesError } = await supabase
              .from("phones")
              .upsert(phonesToInsert); 
            
            if (phonesError) throw phonesError;
          }
        }
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
          created_at: payload.createdAt,
        });
        if (error) throw error;
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
          .delete()
          .eq("id", payload)
          .eq("tenant_id", tenant_id);
        if (error) throw error;
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
    }

    return true; // Sync succeeded
  } catch (error: any) {
    // 409 Conflict logic: In an offline-sync context with client-generated UUIDs, 
    // a "Unique Violation" (23505) typically means the previous sync attempt 
    // succeeded but the ACK was lost. We treat this as a success.
    // However, a "Foreign Key Violation" (23503) means a required record (e.g. phone)
    // is missing. This MUST be treated as an error so it stays in the outbox.
    
    const pgErrorCode = error.code;
    const isUniqueViolation = pgErrorCode === "23505";
    const isIdempotencyHit = error.status === 409 && 
      (error.message && error.message.toLowerCase().includes("already exists"));

    if (isUniqueViolation || isIdempotencyHit) {
      console.info(
        "Supabase Sync: Record already exists (Idempotency), marking as success.",
        action.type,
      );
      return true;
    }

    // Explicitly log FK violations for debugging
    if (pgErrorCode === "23503") {
      console.warn("Supabase Sync: Foreign Key Violation. Dependency record missing.", error.message);
    } else {
      console.warn("Supabase Sync Failed:", error.message || error);
    }
    
    return false; // Sync failed
  }
};
