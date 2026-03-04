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
        if (payload.referenceId) {
          const exists = await doesPhoneExist(payload.referenceId);
          if (!exists) {
            return false;
          }
        }
        const { error } = await supabase.from("ledger").insert({
          id: payload.id,
          // tenant_id and user_id handled by DB trigger
          type: payload.type,
          reference_id: payload.referenceId,
          amount: payload.amount,
          note: payload.note ?? null,
          created_at: payload.createdAt,
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
    }

    return true; // Sync succeeded
  } catch (error: any) {
    console.warn("Supabase Sync Failed:", error.message || error);
    return false; // Sync failed
  }
};
