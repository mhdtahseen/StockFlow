/**
 * printDocumentReactPdf.ts
 *
 * Option B — @react-pdf/renderer client-side PDF generation (selectable text).
 * Dynamically imports the heavy @react-pdf/renderer library so it does NOT
 * increase the main bundle. Generates the PDF as a Blob, then:
 *   - Native: writes to Filesystem.Cache → shares via @capacitor/share
 *   - Web: opens as a blob URL in a new tab
 *
 * ⚠️ TEST ONLY — does NOT modify the existing printDocument.tsx flow.
 */

import { Capacitor } from "@capacitor/core";
import * as React from "react";
import type { SaleOrder } from "@/features/billing/types";
import type { PurchaseOrder } from "@/features/purchasing/types";
import type { Customer } from "@/features/customers/types";
import type { TenantInfo } from "@/context/AuthContext";

export async function printDocumentReactPdf(
  order: SaleOrder | PurchaseOrder,
  counterparty: Customer | undefined,
  tenant: TenantInfo | null,
  isPurchaseOrder: boolean,
): Promise<void> {
  // Dynamic import — keeps @react-pdf/renderer out of the initial bundle
  const [{ pdf }, { InvoicePdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/shared/InvoicePdfDocument"),
  ]);

  const docElement = React.createElement(InvoicePdfDocument, {
    order,
    counterparty,
    tenant,
    type: isPurchaseOrder ? "PURCHASE" : "SALE",
  });

  const blob = await pdf(docElement).toBlob();

  const docLabel = isPurchaseOrder ? "PO" : "Invoice";
  const filename  = `${docLabel}_${(order.id || "").slice(0, 8).toUpperCase()}_ReactPDF.pdf`;

  if (Capacitor.isNativePlatform()) {
    // ── Native: write to cache, share via system sheet ──────────────────────
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");

    const arrayBuffer = await blob.arrayBuffer();
    const uint8       = new Uint8Array(arrayBuffer);
    let binary        = "";
    for (let i = 0; i < uint8.byteLength; i++) binary += String.fromCharCode(uint8[i]);
    const base64 = btoa(binary);

    const result = await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Cache,
    });

    await Share.share({
      title: filename,
      url: result.uri,
      dialogTitle: `Share ${docLabel} PDF (react-pdf)`,
    });
  } else {
    // ── Web: open blob in new tab ────────────────────────────────────────────
    const url    = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href   = url;
    anchor.target = "_blank";
    anchor.rel    = "noopener noreferrer";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}
