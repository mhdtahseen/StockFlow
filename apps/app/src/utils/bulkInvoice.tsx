import * as React from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import type { SaleOrder } from "@/features/billing/types";
import type { PurchaseOrder } from "@/features/purchasing/types";
import type { Customer } from "@/features/customers/types";
import type { TenantInfo } from "@/context/AuthContext";
import { OrderPrintView } from "@/components/shared/OrderPrintView";

export type BulkInvoiceMode = "combined" | "individual";

interface BulkInvoiceOptions {
  orders: Array<SaleOrder | PurchaseOrder>;
  counterpartyMap: Record<string, Customer>;
  tenant: TenantInfo | null;
  isPurchaseOrder: boolean;
  mode: BulkInvoiceMode;
  onProgress?: (current: number, total: number) => void;
  signal?: AbortSignal;
}

/**
 * Bulk invoice generator using the same approach as printDocument.tsx:
 * - Web: opens a new window with all invoices rendered, calls window.print()
 * - Native: html2canvas full-page capture → jsPDF → share sheet
 */
export async function generateBulkInvoice(opts: BulkInvoiceOptions): Promise<void> {
  if (opts.orders.length === 0) return;

  const type = opts.isPurchaseOrder ? "PURCHASE" : "SALE";
  const docLabel = opts.isPurchaseOrder ? "Purchase Order" : "Invoice";

  // ─── Native: html2canvas + jsPDF for each order ───
  if (Capacitor.isNativePlatform()) {
    const { jsPDF } = await import("jspdf");
    const html2canvas = (await import("html2canvas")).default;
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");

    if (opts.mode === "combined") {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      let isFirstPage = true;

      for (let i = 0; i < opts.orders.length; i++) {
        if (opts.signal?.aborted) return;
        const order = opts.orders[i];
        const counterparty = opts.counterpartyMap[order.counterpartyId];

        const container = document.createElement("div");
        container.style.cssText = "position:fixed;left:-9999px;top:0;width:210mm;background:#fff;";
        document.body.appendChild(container);

        const reactRoot = createRoot(container);
        try {
          await new Promise<void>((resolve) => {
            reactRoot.render(
              <React.StrictMode>
                <OrderPrintView
                  order={order}
                  counterparty={counterparty}
                  tenant={opts.tenant}
                  type={type}
                />
              </React.StrictMode>,
            );
            setTimeout(resolve, 1200);
          });

          const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            onclone: (clonedDoc) => {
              clonedDoc.documentElement.style.colorScheme = "light";
              // Remove oklch-using app styles from <head> only; preserve component's inline <style>
              clonedDoc.head.querySelectorAll("style, link:not([href*='fonts.googleapis.com'])").forEach((el) => el.remove());
              const el = clonedDoc.querySelector("[style*='-9999px']") as HTMLElement | null;
              if (el) { el.style.left = "0"; el.style.position = "static"; }
              clonedDoc.querySelectorAll(".pi-container").forEach((c: any) => { c.style.minHeight = "auto"; });
            },
          });

          const imgW = pageW;
          const ratio = canvas.width / imgW;
          const fullImgH = canvas.height / ratio;

          let yOffset = 0;
          while (yOffset < fullImgH) {
            if (!isFirstPage) pdf.addPage();
            isFirstPage = false;
            const sliceH = Math.min(pageH, fullImgH - yOffset);
            const slicePx = Math.round(sliceH * ratio);
            const sliceCanvas = document.createElement("canvas");
            sliceCanvas.width = canvas.width;
            sliceCanvas.height = slicePx;
            const ctx = sliceCanvas.getContext("2d")!;
            ctx.drawImage(canvas, 0, Math.round(yOffset * ratio), canvas.width, slicePx, 0, 0, canvas.width, slicePx);
            pdf.addImage(sliceCanvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, imgW, sliceH, undefined, "FAST");
            yOffset += sliceH;
          }
        } finally {
          reactRoot.unmount();
          if (container.parentNode) document.body.removeChild(container);
        }

        opts.onProgress?.(i + 1, opts.orders.length);
      }

      const filename = `Bulk_${opts.isPurchaseOrder ? "PO" : "INV"}_${opts.orders.length}.pdf`;
      const base64 = pdf.output("datauristring").split(",")[1];
      const result = await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache });
      await Share.share({ title: filename, url: result.uri, dialogTitle: `Share Bulk ${docLabel}` });
    } else {
      // Individual mode on native: generate each, zip
      const { zipSync } = await import("fflate");
      const files: Record<string, Uint8Array> = {};

      for (let i = 0; i < opts.orders.length; i++) {
        if (opts.signal?.aborted) return;
        const order = opts.orders[i];
        const counterparty = opts.counterpartyMap[order.counterpartyId];

        const container = document.createElement("div");
        container.style.cssText = "position:fixed;left:-9999px;top:0;width:210mm;background:#fff;";
        document.body.appendChild(container);

        const reactRoot = createRoot(container);
        try {
          await new Promise<void>((resolve) => {
            reactRoot.render(
              <React.StrictMode>
                <OrderPrintView
                  order={order}
                  counterparty={counterparty}
                  tenant={opts.tenant}
                  type={type}
                />
              </React.StrictMode>,
            );
            setTimeout(resolve, 1200);
          });

          const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            onclone: (clonedDoc) => {
              clonedDoc.documentElement.style.colorScheme = "light";
              // Remove oklch-using app styles from <head> only; preserve component's inline <style>
              clonedDoc.head.querySelectorAll("style, link:not([href*='fonts.googleapis.com'])").forEach((el) => el.remove());
              const el = clonedDoc.querySelector("[style*='-9999px']") as HTMLElement | null;
              if (el) { el.style.left = "0"; el.style.position = "static"; }
              clonedDoc.querySelectorAll(".pi-container").forEach((c: any) => { c.style.minHeight = "auto"; });
            },
          });

          const pdf = new jsPDF("p", "mm", "a4");
          const pageW = pdf.internal.pageSize.getWidth();
          const pageH = pdf.internal.pageSize.getHeight();
          const imgW = pageW;
          const ratio = canvas.width / imgW;
          const fullImgH = canvas.height / ratio;

          let yOffset = 0;
          let page = 0;
          while (yOffset < fullImgH) {
            if (page > 0) pdf.addPage();
            const sliceH = Math.min(pageH, fullImgH - yOffset);
            const slicePx = Math.round(sliceH * ratio);
            const sliceCanvas = document.createElement("canvas");
            sliceCanvas.width = canvas.width;
            sliceCanvas.height = slicePx;
            const ctx = sliceCanvas.getContext("2d")!;
            ctx.drawImage(canvas, 0, Math.round(yOffset * ratio), canvas.width, slicePx, 0, 0, canvas.width, slicePx);
            pdf.addImage(sliceCanvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, imgW, sliceH, undefined, "FAST");
            yOffset += sliceH;
            page++;
          }

          const base64 = pdf.output("datauristring").split(",")[1];
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
          files[`${opts.isPurchaseOrder ? "PO" : "INV"}_${order.id.slice(0, 8).toUpperCase()}.pdf`] = bytes;
        } finally {
          reactRoot.unmount();
          if (container.parentNode) document.body.removeChild(container);
        }

        opts.onProgress?.(i + 1, opts.orders.length);
      }

      const zipBytes = zipSync(files);
      const zipBlob = new Blob([zipBytes], { type: "application/zip" });
      const zipFilename = `Bulk_${opts.isPurchaseOrder ? "PO" : "INV"}_${opts.orders.length}.zip`;
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(zipBlob);
      });
      const result = await Filesystem.writeFile({ path: zipFilename, data: base64, directory: Directory.Cache });
      await Share.share({ title: zipFilename, url: result.uri, dialogTitle: `Share Bulk ${docLabel}s` });
    }
    return;
  }

  // ─── Web Combined: Open print window (identical to printDocument.tsx) ───
  if (opts.mode === "combined") {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      throw new Error("Could not open print window. Please allow popups for this site.");
    }

    const safeTitle = (opts.tenant?.name || "StockFlow").replace(/[<>"'&]/g, (c) =>
      ({ "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "&": "&amp;" }[c] || c),
    );

    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bulk ${docLabel}s - ${safeTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    html, body { margin: 0; padding: 0; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
    .invoice-page { page-break-after: always; }
    .invoice-page:last-child { page-break-after: auto; }
    @media print {
      body { background: none !important; padding: 0 !important; margin: 0 !important; }
      .no-print { display: none !important; }
      .pi-container { width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border: none !important; min-height: auto !important; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
      tr { page-break-inside: avoid; }
      @page { margin: 15mm; }
    }
    @media screen {
      .invoice-page { margin-bottom: 40px; }
    }
  </style>
</head>
<body style="background:#f3f4f6;margin:0;padding:20px;">
  <div id="print-root"></div>
  <div class="no-print" style="position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;gap:12px;align-items:center;">
    <span style="background:white;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;color:#374151;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
      ${opts.orders.length} ${docLabel.toLowerCase()}${opts.orders.length > 1 ? "s" : ""}
    </span>
    <button onclick="window.print()" style="background:#2563eb;color:white;font-weight:bold;padding:12px 24px;border-radius:8px;border:none;cursor:pointer;font-size:14px;box-shadow:0 4px 12px rgba(37,99,235,0.3);">
      🖨️ Print / Save as PDF
    </button>
  </div>
</body>
</html>`);
    printWindow.document.close();

    await new Promise<void>((resolve) => {
      if (printWindow.document.readyState === "complete") {
        resolve();
      } else {
        printWindow.addEventListener("load", () => resolve(), { once: true });
      }
    });

    const root = printWindow.document.getElementById("print-root");
    if (!root) {
      printWindow.close();
      throw new Error("Print window render target not found.");
    }

    const AllInvoices = () => (
      <>
        {opts.orders.map((order) => (
          <div key={order.id} className="invoice-page">
            <OrderPrintView
              order={order}
              counterparty={opts.counterpartyMap[order.counterpartyId]}
              tenant={opts.tenant}
              type={type}
            />
          </div>
        ))}
      </>
    );

    const reactRoot = createRoot(root);
    reactRoot.render(
      <React.StrictMode>
        <AllInvoices />
      </React.StrictMode>,
    );

    await new Promise((r) => setTimeout(r, 1000));
    try { await printWindow.document.fonts.ready; } catch {}

    opts.onProgress?.(opts.orders.length, opts.orders.length);
    printWindow.focus();
    printWindow.print();
    return;
  }

  // ─── Web Individual: html2canvas per order → ZIP download ───
  const { jsPDF } = await import("jspdf");
  const html2canvas = (await import("html2canvas")).default;
  const { zipSync } = await import("fflate");
  const files: Record<string, Uint8Array> = {};

  for (let i = 0; i < opts.orders.length; i++) {
    if (opts.signal?.aborted) return;
    const order = opts.orders[i];
    const counterparty = opts.counterpartyMap[order.counterpartyId];

    const container = document.createElement("div");
    container.style.cssText = "position:fixed;left:-9999px;top:0;width:210mm;background:#fff;z-index:-1;";
    document.body.appendChild(container);

    const reactRoot = createRoot(container);
    try {
      await new Promise<void>((resolve) => {
        reactRoot.render(
          <React.StrictMode>
            <OrderPrintView
              order={order}
              counterparty={counterparty}
              tenant={opts.tenant}
              type={type}
            />
          </React.StrictMode>,
        );
        setTimeout(resolve, 1200);
      });

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          clonedDoc.documentElement.style.colorScheme = "light";
          // Remove oklch-using app styles from <head> only; preserve component's inline <style> (box-sizing etc.)
          clonedDoc.head.querySelectorAll("style, link:not([href*='fonts.googleapis.com'])").forEach((el) => el.remove());
          const el = clonedDoc.querySelector("[style*='-9999px']") as HTMLElement | null;
          if (el) { el.style.left = "0"; el.style.position = "static"; }
          // Remove minHeight so canvas only captures actual content (avoids extra blank page)
          clonedDoc.querySelectorAll(".pi-container").forEach((c: any) => { c.style.minHeight = "auto"; });
        },
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / pageW;
      const fullImgH = canvas.height / ratio;

      let yOffset = 0;
      let page = 0;
      while (yOffset < fullImgH) {
        if (page > 0) pdf.addPage();
        const sliceH = Math.min(pageH, fullImgH - yOffset);
        const slicePx = Math.round(sliceH * ratio);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = slicePx;
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.drawImage(canvas, 0, Math.round(yOffset * ratio), canvas.width, slicePx, 0, 0, canvas.width, slicePx);
        pdf.addImage(sliceCanvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageW, sliceH, undefined, "FAST");
        yOffset += sliceH;
        page++;
      }

      const pdfBytes = pdf.output("arraybuffer");
      files[`${opts.isPurchaseOrder ? "PO" : "INV"}_${order.id.slice(0, 8).toUpperCase()}.pdf`] = new Uint8Array(pdfBytes);
    } finally {
      reactRoot.unmount();
      if (container.parentNode) document.body.removeChild(container);
    }

    opts.onProgress?.(i + 1, opts.orders.length);
  }

  // Create ZIP and trigger browser download
  const zipBytes = zipSync(files);
  const zipBlob = new Blob([zipBytes], { type: "application/zip" });
  const zipFilename = `Bulk_${opts.isPurchaseOrder ? "PO" : "INV"}_${opts.orders.length}.zip`;
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
