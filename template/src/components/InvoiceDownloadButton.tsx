import React, { useState } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import invoiceService from '../services/api/invoice.service';

interface InvoiceDownloadButtonProps {
  /** Id of the (successful) payment whose invoice is downloaded. */
  paymentId: string;
  /** Use the admin endpoint (any payment) instead of the buyer's own. */
  admin?: boolean;
}

/** Small icon button that downloads a payment's invoice PDF (SL-YYYY-NNNNNN.pdf). */
const InvoiceDownloadButton: React.FC<InvoiceDownloadButtonProps> = ({ paymentId, admin = false }) => {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const label = busy ? t('invoice.downloading', 'Preparing your invoice…') : t('invoice.download', 'Download invoice');

  const onClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      await invoiceService.downloadForPayment(paymentId, admin);
    } catch (err: any) {
      const status: number | undefined = err?.response?.status;
      // Server and network errors are already announced by the API client.
      if (status && status < 500) {
        message.error(status === 404
          ? t('invoice.notAvailable', 'The invoice for this payment is not available yet. Please try again in a few minutes.')
          : t('invoice.downloadError', "We couldn't download the invoice. Please try again."));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className="lx-btn lx-btn-outline lx-btn-sm"
      title={label}
      aria-label={label}
      aria-busy={busy}
      disabled={busy}
      onClick={onClick}
    >
      <i className="isax isax-document-download" />
    </button>
  );
};

export default InvoiceDownloadButton;
