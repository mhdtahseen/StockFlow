import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import type { PurchaseOrder } from '@/features/purchasing/types';
import type { Customer as Supplier } from '@/features/customers/types';
import type { TenantInfo } from '@/context/AuthContext';
import { PurchaseOrderPrintable } from '@/components/shared/PurchaseOrderPrintable';

/**
 * PRODUCTION-GRADE PO-TO-PDF GENERATOR
 * Using React + Tailwind + html2canvas + jsPDF
 */
export async function generatePurchaseOrderPDF(order: PurchaseOrder, supplier: Supplier | undefined, tenant: TenantInfo | null) {
  const container = document.createElement('div');
  container.id = 'invoice-render-container';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '210mm';
  container.style.backgroundColor = '#ffffff';
  document.body.appendChild(container);

  try {
    const root = createRoot(container);
    await new Promise<void>((resolve) => {
      root.render(
        <React.StrictMode>
          <PurchaseOrderPrintable order={order} supplier={supplier} tenant={tenant} />
        </React.StrictMode>
      );
      setTimeout(resolve, 1500); // Wait for font loading and render
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const PAGE_MARGIN = 15;
    const contentWidth = pdfWidth - (PAGE_MARGIN * 2);
    let currentY = PAGE_MARGIN;

    const captureOptions = {
      scale: 3, // High quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc: Document) => {
        const styleTags = clonedDoc.querySelectorAll('style, link:not([href*="fonts.googleapis.com"])');
        styleTags.forEach(el => (el as HTMLElement).remove());
        clonedDoc.documentElement.style.colorScheme = 'light';
        const el = clonedDoc.getElementById('invoice-render-container');
        if (el) {
          el.style.left = '0';
          el.style.position = 'static';
        }
      }
    };

    const addToPdf = async (elementId: string, repeatHeader = false) => {
      const el = container.querySelector(elementId.startsWith('#') ? elementId : `#${elementId}`) as HTMLElement;
      if (!el) return 0;
      
      const canvas = await html2canvas(el, captureOptions);
      const imgHeight = (canvas.height * contentWidth) / canvas.width;
      
      if (currentY + imgHeight > pdfHeight - PAGE_MARGIN) {
        pdf.addPage();
        currentY = PAGE_MARGIN;
        
        if (repeatHeader) {
          await addToPdf('invoice-table-header');
        }
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', PAGE_MARGIN, currentY, contentWidth, imgHeight, undefined, 'FAST');
      currentY += imgHeight;
      return imgHeight;
    };

    // 1. Capture Header & Parties
    await addToPdf('invoice-header');
    currentY += 5;
    await addToPdf('invoice-parties');
    currentY += 8;

    // 2. Capture Main Table Row by Row (Accepted Items)
    await addToPdf('invoice-table-header');
    for (let i = 0; i < order.items.length; i++) {
        const row = container.querySelector(`#invoice-row-${i}`);
        if (row) {
            await addToPdf(`invoice-row-${i}`, true);
        }
    }

    // 3. Totals Section
    currentY += 8;
    await addToPdf('invoice-totals');

    // 4. Footer Section
    currentY += 10;
    await addToPdf('invoice-footer');

    // 5. Finalize
    const filename = `PurchaseOrder_${order.id.slice(0, 8)}.pdf`;
    pdf.save(filename);

    root.unmount();
    if (container.parentNode) {
      document.body.removeChild(container);
    }

  } catch (error) {
    console.error('PO PDF Generation Failed:', error);
    if (document.getElementById('invoice-render-container')) {
      document.body.removeChild(container);
    }
    throw error;
  }
}
