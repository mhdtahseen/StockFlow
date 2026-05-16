import * as React from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import type { SaleOrder } from "@/features/billing/types";
import type { PurchaseOrder } from "@/features/purchasing/types";
import type { Customer } from "@/features/customers/types";
import type { TenantInfo } from "@/context/AuthContext";
import { PrintableInvoice } from "@/components/shared/PrintableInvoice";

/**
 * Opens a new browser window with the PrintableInvoice component rendered,
 * then triggers window.print() for a pixel-perfect PDF with selectable text.
 *
 * On native Capacitor platforms (where window.print() is unavailable),
 * falls back to the existing html2canvas + jsPDF approach.
 */
export async function printDocument(
  order: SaleOrder | PurchaseOrder,
  counterparty: Customer | undefined,
  tenant: TenantInfo | null,
  isPurchaseOrder: boolean,
): Promise<void> {
  // ─── Native: render PrintableInvoice → html2canvas → jsPDF → Share sheet ───
  if (Capacitor.isNativePlatform()) {
    const { jsPDF } = await import("jspdf");
    const html2canvas = (await import("html2canvas")).default;
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");

    const container = document.createElement("div");
    container.style.cssText = "position:fixed;left:-9999px;top:0;width:210mm;background:#fff;";
    document.body.appendChild(container);

    const reactRoot = createRoot(container);
    try {
      await new Promise<void>((resolve) => {
        reactRoot.render(
          <React.StrictMode>
            <PrintableInvoice
              order={order}
              counterparty={counterparty}
              tenant={tenant}
              type={isPurchaseOrder ? "PURCHASE" : "SALE"}
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
          // Remove oklch-using app styles; keep Google Fonts
          clonedDoc.querySelectorAll("style, link:not([href*='fonts.googleapis.com'])").forEach((el) => el.remove());
          const el = clonedDoc.querySelector("[style*='-9999px']") as HTMLElement | null;
          if (el) { el.style.left = "0"; el.style.position = "static"; }
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

      const docLabel = isPurchaseOrder ? "PO" : "Invoice";
      const filename = `${docLabel}_${order.id.slice(0, 8).toUpperCase()}.pdf`;
      const base64 = pdf.output("datauristring").split(",")[1];
      const result = await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache });
      await Share.share({ title: filename, url: result.uri, dialogTitle: `Share ${docLabel} PDF` });
    } finally {
      reactRoot.unmount();
      if (container.parentNode) document.body.removeChild(container);
    }
    return;
  }

  // ─── Web: Open print window ───
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    throw new Error("Could not open print window. Please allow popups for this site.");
  }

  // Sanitize tenant name for safe HTML insertion
  const safeTitle = (tenant?.name || "StockFlow").replace(/[<>"'&]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' }[c] || c)
  );
  const docType = isPurchaseOrder ? "Purchase Order" : "Invoice";

  // Write the base HTML document structure
  printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${docType} - ${safeTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    html, body { margin: 0; padding: 0; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
    @media print {
      body { background: none !important; padding: 0 !important; margin: 0 !important; }
      .no-print { display: none !important; }
      .pi-container { width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border: none !important; min-height: auto !important; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
      tr { page-break-inside: avoid; }
      @page { margin: 15mm; }
    }
  </style>
</head>
<body style="background:#f3f4f6;margin:0;padding:20px;">
  <div id="print-root"></div>
  <div class="no-print" style="position:fixed;bottom:20px;right:20px;z-index:9999;">
    <button onclick="window.print()" style="background:#2563eb;color:white;font-weight:bold;padding:12px 24px;border-radius:8px;border:none;cursor:pointer;font-size:14px;box-shadow:0 4px 12px rgba(37,99,235,0.3);">
      🖨️ Print / Save as PDF
    </button>
  </div>
</body>
</html>`);
  printWindow.document.close();

  // Wait for document to load (fonts, etc.)
  await new Promise<void>((resolve) => {
    const check = () => {
      if (printWindow.document.readyState === "complete") {
        resolve();
      } else {
        printWindow.addEventListener("load", () => resolve(), { once: true });
      }
    };
    check();
  });

  // Render the React component into the print window
  const root = printWindow.document.getElementById("print-root");
  if (!root) {
    printWindow.close();
    throw new Error("Print window render target not found.");
  }

  const reactRoot = createRoot(root);
  reactRoot.render(
    <React.StrictMode>
      <PrintableInvoice
        order={order}
        counterparty={counterparty}
        tenant={tenant}
        type={isPurchaseOrder ? "PURCHASE" : "SALE"}
      />
    </React.StrictMode>,
  );

  // Wait for fonts to load + React render to settle
  await new Promise((r) => setTimeout(r, 800));

  try {
    await printWindow.document.fonts.ready;
  } catch {
    // fonts.ready may not be available in all contexts
  }

  // Auto-trigger print dialog
  printWindow.focus();
  printWindow.print();
}
