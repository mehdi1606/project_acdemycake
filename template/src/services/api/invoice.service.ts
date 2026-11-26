import api from './axios.config';
import { PaginatedResponse } from './types';

/** An invoice issued for a successful payment (values frozen at issue time). */
export interface Invoice {
  id: string;
  invoiceNumber: string;   // e.g. "SL-2026-000001"
  paymentId?: string | null;
  manualBookingId?: string | null;
  userId?: string | null;
  buyerName?: string;
  buyerEmail?: string;
  itemDescription: string;
  paymentType: string;
  currency: string;
  amountHt: number;
  vatRate: number;
  vatAmount: number;
  amountTtc: number;
  issuedAt: string;
}

/** "attachment; filename="SL-2026-000001.pdf"" → "SL-2026-000001.pdf" */
const filenameFrom = (disposition: unknown, fallback: string): string => {
  if (typeof disposition !== 'string') return fallback;
  const star = /filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i.exec(disposition);
  if (star) {
    try { return decodeURIComponent(star[1].trim().replace(/^"|"$/g, '')); } catch { /* use plain name */ }
  }
  const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(disposition);
  return plain ? plain[1].trim() : fallback;
};

const saveBlob = (blob: Blob, fileName: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

class InvoiceService {
  /** The signed-in user's invoices, newest first. */
  async getMyInvoices(page = 0, size = 20): Promise<PaginatedResponse<Invoice>> {
    const response = await api.get<PaginatedResponse<Invoice>>('/invoices', { params: { page, size } });
    return response.data;
  }

  /**
   * Downloads the invoice PDF of a payment and saves it under its invoice number.
   * Buyers may only download their own; `admin` uses the admin endpoint (any payment).
   */
  async downloadForPayment(paymentId: string, admin = false): Promise<void> {
    const path = admin ? `/admin/invoices/payment/${paymentId}/pdf` : `/invoices/payment/${paymentId}/pdf`;
    await this.download(path, paymentId);
  }

  /** Downloads an invoice by its id (buyer, admin, or the instructor of the course bought). */
  async downloadInvoice(invoiceId: string): Promise<void> {
    await this.download(`/invoices/${invoiceId}/pdf`, invoiceId);
  }

  /** Downloads the invoice of a masterclass booking paid outside the platform (added by hand). */
  async downloadForManualBooking(bookingId: string): Promise<void> {
    await this.download(`/invoices/manual-booking/${bookingId}/pdf`, bookingId);
  }

  private async download(path: string, id: string): Promise<void> {
    const response = await api.get(path, { responseType: 'blob' });
    const name = filenameFrom(response.headers?.['content-disposition'], `invoice-${id.substring(0, 8)}.pdf`);
    saveBlob(response.data as Blob, name);
  }
}

export const invoiceService = new InvoiceService();
export default invoiceService;
