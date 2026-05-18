import * as React from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import type { SaleOrder } from "@/features/billing/types";
import type { PurchaseOrder } from "@/features/purchasing/types";
import type { Customer } from "@/features/customers/types";
import type { TenantInfo } from "@/context/AuthContext";
import { PrintableInvoice } from "@/components/shared/PrintableInvoice";

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderInvoiceOffscreen(
  order: SaleOrder | PurchaseOrder,
  counterparty: Customer | undefined,
  tenant: TenantInfo | null,
  isPurchaseOrder: boolean,
): { container: HTMLDivElement; root: ReturnType<typeof createRoot> } {
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;left:-9999px;top:0;width:210mm;background:#fff;";
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <PrintableInvoice
        order={order}
        counterparty={counterparty}
        tenant={tenant}
        type={isPurchaseOrder ? "PURCHASE" : "SALE"}
      />
    </React.StrictMode>,
  );
  return { container, root };
}

async function orderToCanvas(container: HTMLDivElement) {
  const html2canvas = (await import("html2canvas")).default;
  return html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    onclone: (clonedDoc) => {
      clonedDoc.documentElement.style.colorScheme = "light";
      clonedDoc
        .querySelectorAll(
          "style, link:not([href*='fonts.googleapis.com'])",
        )
        .forEach((el) => el.remove());
      const el = clonedDoc.querySelector(
        "[style*='-9999px']",
      ) as HTMLElement | null;
      if (el) {
        el.style.left = "0";
        el.style.position = "static";
      }
    },
  });
}

function addCanvasToPdf(
  pdf: InstanceType<Awaited<typeof import("jspdf")>["jsPDF"]>,
  canvas: HTMLCanvasElement,
  addPage: boolean,
) {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW;
  const ratio = canvas.width / imgW;
  const fullImgH = canvas.height / ratio;

  let yOffset = 0;
  let pageCount = 0;
  while (yOffset < fullImgH) {
    if (addPage || pageCount > 0) pdf.addPage();
    const sliceH = Math.min(pageH, fullImgH - yOffset);
    const slicePx = Math.round(sliceH * ratio);
    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = slicePx;
    const ctx = sliceCanvas.getContext("2d")!;
    ctx.drawImage(
      canvas,
      0,
      Math.round(yOffset * ratio),
      canvas.width,
      slicePx,
      0,
      0,
      canvas.width,
      slicePx,
    );
    pdf.addImage(
      sliceCanvas.toDataURL("image/jpeg", 0.92),
      "JPEG",
      0,
      0,
      imgW,
      sliceH,
      undefined,
      "FAST",
    );
    yOffset += sliceH;
    pageCount++;
  }
}

// ── Native share helper ───────────────────────────────────────────────────────

async function shareFile(base64: string, filename: string, title: string) {
  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  const { Share } = await import("@capacitor/share");
  const result = await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Cache,
  });
  await Share.share({ title, url: result.uri, dialogTitle: `Share ${title}` });
}

// ── Web blob download helper ──────────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ── Combined PDF (all orders in one file) ────────────────────────────────────

async function generateCombined(opts: BulkInvoiceOptions) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF("p", "mm", "a4");
  const docLabel = opts.isPurchaseOrder ? "PO" : "INV";

  for (let i = 0; i < opts.orders.length; i++) {
    if (opts.signal?.aborted) return;

    const order = opts.orders[i];
    const counterparty = opts.counterpartyMap[order.counterpartyId];
    const { container, root } = renderInvoiceOffscreen(
      order,
      counterparty,
      opts.tenant,
      opts.isPurchaseOrder,
    );

    try {
      await new Promise<void>((r) => setTimeout(r, 1200));
      const canvas = await orderToCanvas(container);
      addCanvasToPdf(pdf, canvas, i > 0);
    } finally {
      root.unmount();
      if (container.parentNode) document.body.removeChild(container);
    }

    opts.onProgress?.(i + 1, opts.orders.length);
  }

  const filename = `Bulk_${docLabel}_${opts.orders.length}_orders.pdf`;
  if (Capacitor.isNativePlatform()) {
    const base64 = pdf.output("datauristring").split(",")[1];
    await shareFile(base64, filename, `Bulk ${docLabel} PDF`);
  } else {
    downloadBlob(new Blob([pdf.output("blob")], { type: "application/pdf" }), filename);
  }
}

// ── Individual PDFs zipped ────────────────────────────────────────────────────

async function generateIndividual(opts: BulkInvoiceOptions) {
  const { jsPDF } = await import("jspdf");
  const { zipSync, strToU8 } = await import("fflate");
  const docLabel = opts.isPurchaseOrder ? "PO" : "INV";

  const files: Record<string, Uint8Array> = {};

  for (let i = 0; i < opts.orders.length; i++) {
    if (opts.signal?.aborted) return;

    const order = opts.orders[i];
    const counterparty = opts.counterpartyMap[order.counterpartyId];
    const { container, root } = renderInvoiceOffscreen(
      order,
      counterparty,
      opts.tenant,
      opts.isPurchaseOrder,
    );

    try {
      await new Promise<void>((r) => setTimeout(r, 1200));
      const canvas = await orderToCanvas(container);
      const pdf = new jsPDF("p", "mm", "a4");
      addCanvasToPdf(pdf, canvas, false);
      const base64 = pdf.output("datauristring").split(",")[1];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
      files[`${docLabel}_${order.id.slice(0, 8).toUpperCase()}.pdf`] = bytes;
    } finally {
      root.unmount();
      if (container.parentNode) document.body.removeChild(container);
    }

    opts.onProgress?.(i + 1, opts.orders.length);
  }

  const zipBytes = zipSync(files);
  const zipBlob = new Blob([zipBytes], { type: "application/zip" });
  const zipFilename = `Bulk_${docLabel}_${opts.orders.length}_orders.zip`;

  if (Capacitor.isNativePlatform()) {
    // Convert to base64 for Capacitor Filesystem
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(zipBlob);
    });
    await shareFile(base64, zipFilename, `Bulk ${docLabel} ZIPs`);
  } else {
    downloadBlob(zipBlob, zipFilename);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function generateBulkInvoice(opts: BulkInvoiceOptions) {
  if (opts.orders.length === 0) return;
  if (opts.mode === "combined") {
    await generateCombined(opts);
  } else {
    await generateIndividual(opts);
  }
}
