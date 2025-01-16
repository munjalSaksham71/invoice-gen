import { InvoiceFormData, Company, InvoiceItem } from '@/types/invoice';
import jsPDF from 'jspdf';
import "jspdf/dist/polyfills.es.js";
import { get } from 'lodash-es';

export const generateInvoicePdf = (
  invoice: InvoiceFormData,
  seller: Company,
  products: Array<InvoiceItem & { name: string }>
) => {
  const doc = new jsPDF();
  
  // Helper function to safely get nested values
  const getValue = (obj: any, path: string): string => {
    const value = get(obj, path);
    if (value === null || value === undefined || value === '') {
      return '--';
    }
    return String(value);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0'); 
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Helper function for currency formatting
  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '--';
    }
    return `INR ${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };
  

  // Helper function to calculate amount
  const calculateAmount = (price?: number, quantity?: number): number | null => {
    if (price === undefined || quantity === undefined || 
        price === null || quantity === null || 
        isNaN(price) || isNaN(quantity)) {
      return null;
    }
    return price * quantity;
  };

  // Add company logo (placeholder rectangle for now)
  doc.setDrawColor(40, 116, 166);
  doc.setFillColor(40, 116, 166);
  doc.rect(20, 20, 40, 20, 'F');

  // Title
  doc.setFontSize(28);
  doc.setTextColor(40, 116, 166);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 140, 30, { align: 'right' });

  // Invoice Details Box
  doc.setDrawColor(230, 230, 230);
  doc.setFillColor(249, 249, 249);
  doc.rect(120, 40, 70, 35, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text('INVOICE NUMBER', 125, 48);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(getValue(invoice, 'invoice_number'), 125, 54);
  
  doc.setTextColor(128, 128, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('DATE ISSUED', 125, 62);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDate(getValue(invoice, 'issue_date')), 125, 68);

  // Seller and Buyer Details
  doc.setFontSize(11);
  doc.setTextColor(128, 128, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('FROM', 20, 60);
  doc.text('BILL TO', 20, 100);

  // Seller Details
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(getValue(seller, 'name'), 20, 68);
  doc.setFont('helvetica', 'normal');
  doc.text(getValue(seller, 'address'), 20, 74);
  doc.text(getValue(seller, 'email'), 20, 80);
  doc.text(getValue(seller, 'phone'), 20, 86);

  // Buyer Details
  doc.setFont('helvetica', 'bold');
  doc.text(getValue(invoice, 'buyer.name'), 20, 108);
  doc.setFont('helvetica', 'normal');
  doc.text(getValue(invoice, 'buyer.address'), 20, 114);
  doc.text(getValue(invoice, 'buyer.email'), 20, 120);
  doc.text(getValue(invoice, 'buyer.phone'), 20, 126);
  const tableTop = 145;
  // Products Label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Products', 20, tableTop - 5);

  // Products Table Header

  doc.setFillColor(249, 249, 249);
  doc.rect(20, tableTop, 170, 8, 'F');
  
  // Draw line above table
  doc.setDrawColor(230, 230, 230);
  doc.line(20, tableTop, 190, tableTop);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ITEM', 25, tableTop + 6);
  doc.text('QTY', 95, tableTop + 6);
  doc.text('RATE', 120, tableTop + 6);
  doc.text('AMOUNT', 160, tableTop + 6);

  // Products Table Content
  doc.setFont('helvetica', 'normal');
  let tableY = tableTop + 15;
  
  (products || []).forEach((item, index) => {
    const y = tableY + (index * 12);
    doc.text(getValue(item, 'name'), 25, y);
    doc.text(getValue(item, 'quantity'), 95, y);
    doc.text(formatCurrency(item.unit_price), 120, y, {charSpace: 0});
    doc.text(formatCurrency(calculateAmount(item.unit_price, item.quantity)), 160, y, {charSpace: 0});
  });

  // Calculate Totals
  const subtotal = (products || []).reduce((sum, item) => {
    const amount = calculateAmount(item.unit_price, item.quantity);
    return sum + (amount || 0);
  }, 0);

  const discount = invoice.discount_percentage ? 
    (subtotal * (invoice.discount_percentage || 0)) / 100 : null;
  const tax = invoice.tax_percentage ? 
    (subtotal * (invoice.tax_percentage || 0)) / 100 : null;
  const shipping = invoice.shipping_charges || null;

  // Calculate grand total only with available values
  let grandTotal = subtotal;
  if (discount) grandTotal -= discount;
  if (tax) grandTotal += tax;
  if (shipping) grandTotal += shipping;

  // Totals Section
  const totalsStartY = tableY + (products?.length || 0) * 12 + 10;
  
  // Add line above totals
  doc.setDrawColor(230, 230, 230);
  doc.line(120, totalsStartY, 190, totalsStartY);

  // Totals content
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', 120, totalsStartY + 10);
  doc.text(formatCurrency(subtotal), 160, totalsStartY + 10);

  if (invoice.discount_percentage) {
    doc.text(`Discount (${getValue(invoice, 'discount_percentage')}%):`, 120, totalsStartY + 18);
    doc.text(formatCurrency(discount), 160, totalsStartY + 18);
  }

  if (invoice.tax_percentage) {
    doc.text(`Tax (${getValue(invoice, 'tax_percentage')}%):`, 120, totalsStartY + 26);
    doc.text(formatCurrency(tax), 160, totalsStartY + 26);
  }

  if (shipping !== null) {
    doc.text('Shipping:', 120, totalsStartY + 34);
    doc.text(formatCurrency(shipping), 160, totalsStartY + 34);
  }

  // Grand Total
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', 120, totalsStartY + 46);
  doc.text(formatCurrency(grandTotal), 160, totalsStartY + 46);

  // Notes Section
  if (invoice.notes) {
    const notesY = totalsStartY + 66;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Notes:', 20, notesY);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(getValue(invoice, 'notes'), 170);
    doc.text(splitNotes, 20, notesY + 8);
  }

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for your business!', 105, 280, { align: 'center' });

  // Save the PDF
  doc.save(`invoice_${getValue(invoice, 'invoice_number')}.pdf`);
};