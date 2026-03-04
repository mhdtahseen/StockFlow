import { store } from "../app/store";
import { supabase } from "@/lib/supabase";
import { getTenantId } from "../app/supabaseApi";
import { Phone } from "../features/inventory/types";
import { LedgerEntry } from "../features/ledger/types";

interface SyncReport {
  phonesChecked: number;
  phonesUpdated: number;
  phonesInserted: number;
  ledgerChecked: number;
  ledgerUpdated: number;
  ledgerInserted: number;
  errors: string[];
}

export const verifyAndFixSupabaseSync = async (): Promise<SyncReport> => {
  const report: SyncReport = {
    phonesChecked: 0,
    phonesUpdated: 0,
    phonesInserted: 0,
    ledgerChecked: 0,
    ledgerUpdated: 0,
    ledgerInserted: 0,
    errors: [],
  };

  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      report.errors.push("No active tenant session found.");
      return report;
    }

    const state = store.getState();
    const localPhones = state.inventory.phones;
    const localLedger = state.ledger.entries;

    // ─── PHONES SYNC CHECK ────────────────────────────────────────────────
    report.phonesChecked = localPhones.length;

    // Fetch all remote phones for this tenant
    const { data: remotePhones, error: remotePhonesErr } = await supabase
      .from("phones")
      .select("*")
      .eq("tenant_id", tenantId);

    if (remotePhonesErr) throw remotePhonesErr;

    const remotePhonesMap = new Map(remotePhones?.map((p) => [p.id, p]));

    for (const localPhone of localPhones) {
      const remotePhone = remotePhonesMap.get(localPhone.id);

      if (!remotePhone) {
        // Phone exists locally but not in Supabase -> Insert it
        const { error } = await supabase.from("phones").insert({
          id: localPhone.id,
          brand: localPhone.brand,
          model: localPhone.model,
          storage: localPhone.storage,
          ram: localPhone.ram,
          color: localPhone.color,
          purchase_price: localPhone.purchasePrice,
          sale_price: localPhone.salePrice,
          status: localPhone.status,
          issue_tags: localPhone.issueTags || [],
          imeis: localPhone.imeis || [],
          created_at: localPhone.createdAt,
        });

        if (error) {
          report.errors.push(
            `Failed to insert missing phone ${localPhone.id}: ${error.message}`,
          );
        } else {
          report.phonesInserted++;
        }
      } else {
        // Phone exists remotely, check for data drift (especially missing IMEIs, missing ram, status mismatch)
        const needsUpdate =
          JSON.stringify(remotePhone.imeis || []) !==
            JSON.stringify(localPhone.imeis || []) ||
          remotePhone.brand !== localPhone.brand ||
          remotePhone.model !== localPhone.model ||
          remotePhone.storage !== localPhone.storage ||
          remotePhone.ram !== localPhone.ram ||
          remotePhone.color !== localPhone.color ||
          Number(remotePhone.purchase_price) !== localPhone.purchasePrice ||
          (remotePhone.sale_price
            ? Number(remotePhone.sale_price)
            : undefined) !== localPhone.salePrice ||
          remotePhone.status !== localPhone.status ||
          JSON.stringify(remotePhone.issue_tags || []) !==
            JSON.stringify(localPhone.issueTags || []);

        if (needsUpdate) {
          // Push local as source of truth
          const { error } = await supabase
            .from("phones")
            .update({
              brand: localPhone.brand,
              model: localPhone.model,
              storage: localPhone.storage,
              ram: localPhone.ram,
              color: localPhone.color,
              purchase_price: localPhone.purchasePrice,
              sale_price: localPhone.salePrice,
              status: localPhone.status,
              issue_tags: localPhone.issueTags || [],
              imeis: localPhone.imeis || [],
            })
            .eq("id", localPhone.id)
            .eq("tenant_id", tenantId);

          if (error) {
            report.errors.push(
              `Failed to update drifted phone ${localPhone.id}: ${error.message}`,
            );
          } else {
            report.phonesUpdated++;
          }
        }
      }
    }

    // ─── LEDGER SYNC CHECK ────────────────────────────────────────────────
    report.ledgerChecked = localLedger.length;

    const { data: remoteLedgers, error: remoteLedgersErr } = await supabase
      .from("ledger")
      .select("*")
      .eq("tenant_id", tenantId);

    if (remoteLedgersErr) throw remoteLedgersErr;

    const remoteLedgerMap = new Map(remoteLedgers?.map((l) => [l.id, l]));

    for (const localEntry of localLedger) {
      const remoteEntry = remoteLedgerMap.get(localEntry.id);

      if (!remoteEntry) {
        // Ledger exists locally but not in Supabase -> Insert it
        const { error } = await supabase.from("ledger").insert({
          id: localEntry.id,
          type: localEntry.type,
          reference_id: localEntry.referenceId || null,
          amount: localEntry.amount,
          note: localEntry.note || null,
          created_at: localEntry.createdAt,
        });

        if (error) {
          report.errors.push(
            `Failed to insert missing ledger entry ${localEntry.id}: ${error.message}`,
          );
        } else {
          report.ledgerInserted++;
        }
      } else {
        // Check for data drift in Ledger
        const needsUpdate =
          remoteEntry.type !== localEntry.type ||
          remoteEntry.reference_id !== (localEntry.referenceId || null) ||
          Number(remoteEntry.amount) !== localEntry.amount ||
          remoteEntry.note !== (localEntry.note || null);

        if (needsUpdate) {
          const { error } = await supabase
            .from("ledger")
            .update({
              type: localEntry.type,
              reference_id: localEntry.referenceId || null,
              amount: localEntry.amount,
              note: localEntry.note || null,
            })
            .eq("id", localEntry.id)
            .eq("tenant_id", tenantId);

          if (error) {
            report.errors.push(
              `Failed to update drifted ledger entry ${localEntry.id}: ${error.message}`,
            );
          } else {
            report.ledgerUpdated++;
          }
        }
      }
    }
  } catch (err: any) {
    report.errors.push(`Critical Sync Error: ${err.message || err}`);
  }

  return report;
};
