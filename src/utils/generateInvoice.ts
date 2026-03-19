import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SaleOrder } from '@/features/billing/types';
import { Customer } from '@/features/customers/types';
import { TenantInfo } from '@/context/AuthContext';
import { format, parseISO } from 'date-fns';

export function generateInvoicePDF(order: SaleOrder, customer: Customer | undefined, tenant: TenantInfo | null) {
  const doc = new jsPDF();
  const filename = `Invoice_${order.id.slice(0, 8)}.pdf`;
  
  // Settings
  const primaryColor = [6, 74, 152]; // StockFlow Brand Blue #064a98
  const amberColor = [186, 117, 23]; // #BA7517 for outstanding
  const greyColor = [107, 114, 128]; // text-gray-500
  const darkGrey = [31, 41, 55]; // text-gray-900

  // 1. Header Section
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('TAX INVOICE', 14, 20);

  // Seller Info (Left)
  doc.setFontSize(14);
  doc.setTextColor(darkGrey[0], darkGrey[1], darkGrey[2]);
  doc.text(tenant?.name || 'StockFlow Store', 14, 32);
  
  doc.setFontSize(9);
  doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
  const address = tenant?.address || '123 Tech Plaza, Silicon Valley Road,\nElectronic City, Bengaluru - 560100';
  doc.text(address, 14, 38);
  
  doc.setTextColor(darkGrey[0], darkGrey[1], darkGrey[2]);
  doc.text(`GSTIN: ${tenant?.gstin || '29AAAA0000Z1Z5'}`, 14, 52);
  doc.text(`Contact: ${tenant?.phone || '+91 9876543210'}`, 14, 56);

  // 2. Invoice Meta (Right) - Blue box logic from Stitch
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(140, 15, 56, 25, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text('INVOICE NUMBER', 145, 22);
  doc.setFontSize(10);
  doc.text(`INV-${order.id.slice(0,8).toUpperCase()}`, 145, 27);
  
  doc.setFontSize(7);
  doc.text('DATE OF ISSUE', 145, 33);
  doc.setFontSize(10);
  doc.text(format(parseISO(order.createdAt), 'MMMM d, yyyy'), 145, 38);

  // 3. Bill To & Status
  doc.setFontSize(8);
  doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
  doc.text('BILL TO:', 14, 75);
  
  doc.setFontSize(11);
  doc.setTextColor(darkGrey[0], darkGrey[1], darkGrey[2]);
  doc.text(customer?.name || 'Walk-in Customer', 14, 82);
  
  doc.setFontSize(9);
  doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
  doc.text(customer?.phone ? `Phone: ${customer.phone}` : 'Phone: N/A', 14, 88);
  doc.text(`GSTIN: Consumer`, 14, 93);

  // Status (Right aligned)
  doc.setFontSize(8);
  doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
  doc.text('PAYMENT STATUS:', 196, 75, { align: 'right' });
  
  const statusColor = order.status === 'SETTLED' ? [16, 185, 129] : [245, 158, 11];
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(160, 78, 36, 6, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(order.status, 178, 82.5, { align: 'center' });

  // 4. Items Table
  autoTable(doc, {
    startY: 105,
    head: [['No.', 'Description', 'Unit Price', 'GST %', 'Amount']],
    body: order.items.map((item, index) => {
      const discountLine = item.discountAmount > 0 ? `\n— ₹${item.discountAmount.toLocaleString()} discount` : '';
      return [
        (index + 1).toString().padStart(2, '0'),
        { content: `${item.brandSnapshot} ${item.modelSnapshot}\n${item.storageSnapshot} | ${item.colorSnapshot}\nIMEI: ${item.imeiSnapshot[0] || 'N/A'}`, styles: { cellPadding: 2 } },
        { content: `₹${item.salePrice.toLocaleString()}${discountLine}`, styles: { halign: 'right' } },
        '18%',
        { content: `₹${item.effectivePrice.toLocaleString()}`, styles: { halign: 'right' } }
      ];
    }),
    theme: 'plain',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [31, 41, 55],
      fontStyle: 'bold',
      fontSize: 9,
      lineWidth: { bottom: 0.5 },
      lineColor: primaryColor as any
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [75, 85, 99],
    },
    columnStyles: {
      0: { halign: 'center', textColor: [156, 163, 175] },
      4: { fontStyle: 'bold', textColor: [31, 41, 55] }
    },
    margin: { top: 105 }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 150;

  // 5. Financials Summary Footer
  const footerX = 130;
  doc.setFontSize(9);
  doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
  
  let currentY = finalY + 15;
  doc.text('Invoiced', footerX, currentY);
  doc.text(`₹${order.totalAmount.toLocaleString()}`, 196, currentY, { align: 'right' });
  
  currentY += 6;
  doc.text('Paid', footerX, currentY);
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(`₹${order.amountPaid.toLocaleString()}`, 196, currentY, { align: 'right' });
  
  const outstanding = order.totalAmount - order.amountPaid;
  currentY += 6;
  doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
  doc.text('Outstanding', footerX, currentY);
  if (outstanding > 0) {
    doc.setTextColor(amberColor[0], amberColor[1], amberColor[2]); // #BA7517 Amber
  }
  doc.text(`₹${outstanding.toLocaleString()}`, 196, currentY, { align: 'right' });

  // Grand Total Box
  currentY += 8;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(footerX, currentY, 66, 12, 1, 1, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('GRAND TOTAL', footerX + 4, currentY + 7.5);
  doc.setFontSize(13);
  doc.text(`₹${order.totalAmount.toLocaleString()}`, 194, currentY + 8, { align: 'right' });

  // 6. Signature & Share Logic
  doc.setDrawColor(229, 231, 235);
  doc.line(14, 250, 196, 250);
  
  doc.setFontSize(8);
  doc.setTextColor(darkGrey[0], darkGrey[1], darkGrey[2]);
  doc.text('TERMS & CONDITIONS', 14, 258);
  
  doc.setFontSize(7);
  doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
  const terms = [
    '1. Goods once sold will be as per standard terms.',
    '2. Standard warranty applies as per Manufacturer.',
    '3. Computer generated invoice - No signature required.'
  ];
  doc.text(terms, 14, 264);

  doc.setTextColor(darkGrey[0], darkGrey[1], darkGrey[2]);
  doc.setFontSize(8);
  doc.text('Authorized Signatory', 196, 275, { align: 'right' });
  doc.setFontSize(7);
  doc.setTextColor(greyColor[0], greyColor[1], greyColor[2]);
  doc.text(tenant?.name || 'StockFlow', 196, 280, { align: 'right' });

  // Native Share Sheet Implementation
  if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    try {
      const blob = doc.output('blob');
      const file = new File([blob], filename, { type: 'application/pdf' });
      navigator.share({
        files: [file],
        title: `Inv ${order.id.slice(0,8)}`,
        text: `StockFlow Invoice for ${customer?.name || 'Customer'}`
      });
    } catch (e: any) {
      console.warn('Share failed, falling back to download', e);
      doc.save(filename);
    }
  } else {
    doc.save(filename);
  }
}
