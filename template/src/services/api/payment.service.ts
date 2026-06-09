import api from './axios.config';
import {
  PaymentTransaction,
  InitiatePaymentResponse,
  PaginatedResponse,
} from './types';

// ── CMI Chaabi response type ──────────────────────────────────────────────────
export interface CmiInitiateResponse {
  transactionId: string;          // our internal DB UUID → store in sessionStorage
  gatewayUrl: string;             // CMI gateway URL to POST to
  formParams: Record<string, string>; // all CMI params including pre-computed HASH
}

// ── Public transaction status poll (no JWT) ──────────────────────────────────
export interface TransactionStatusInfo {
  status: string;          // PENDING | COMPLETED | FAILED | CANCELLED | NOT_FOUND
  transactionType: string; // SUBSCRIPTION | COURSE_PURCHASE
  errorMessage: string;
  orderId: string;         // CMI order reference, e.g. "SUB-YEA-XXXXXXXX"
  amount: string;          // decimal string, e.g. "299.00"
  currency: string;        // e.g. "MAD"
}

class PaymentService {
  // ── Legacy (PayZone) ────────────────────────────────────────────────────────

  async purchaseCourse(courseId: number): Promise<InitiatePaymentResponse> {
    const response = await api.post<InitiatePaymentResponse>(`/payments/course/${courseId}`);
    return response.data;
  }

  async getPaymentHistory(
    page = 0,
    size = 10
  ): Promise<PaginatedResponse<PaymentTransaction>> {
    const response = await api.get<PaginatedResponse<PaymentTransaction>>('/payments/history', {
      params: { page, size },
    });
    return response.data;
  }

  async getTransactionDetails(transactionId: string): Promise<PaymentTransaction> {
    const response = await api.get<PaymentTransaction>(`/payments/transaction/${transactionId}`);
    return response.data;
  }

  /**
   * Public status poll — no JWT required.
   * Returns { status, transactionType, errorMessage, orderId, amount, currency }.
   * Used by the payment callback page so polling keeps working even if the
   * 15-minute access token expired while the user was on the CMI page.
   */
  async getTransactionStatus(transactionId: string): Promise<TransactionStatusInfo> {
    const response = await api.get<TransactionStatusInfo>(
      `/payments/cmi/status/${transactionId}`
    );
    return response.data;
  }

  // ── CMI Chaabi Payment ──────────────────────────────────────────────────────

  /**
   * Initiate a CMI subscription payment.
   * Returns form params that the frontend must auto-submit to the CMI gateway.
   */
  async initiateCmiSubscription(
    planId: string,
    couponCode?: string
  ): Promise<CmiInitiateResponse> {
    const params: Record<string, string> = { planId };
    if (couponCode?.trim()) params.couponCode = couponCode.trim();

    const response = await api.post<CmiInitiateResponse>(
      '/payments/cmi/initiate/subscription',
      null,
      { params }
    );
    return response.data;
  }

  /**
   * Initiate a CMI course purchase.
   * Returns form params that the frontend must auto-submit to the CMI gateway.
   */
  async initiateCmiCourse(courseId: string): Promise<CmiInitiateResponse> {
    const response = await api.post<CmiInitiateResponse>(
      `/payments/cmi/initiate/course/${courseId}`
    );
    return response.data;
  }

  /**
   * Auto-submits a hidden HTML form to the CMI payment gateway.
   * The browser navigates away to CMI's hosted payment page.
   *
   * @param gatewayUrl  The CMI gateway URL (from CmiInitiateResponse)
   * @param formParams  All CMI params including HASH (from CmiInitiateResponse)
   */
  submitCmiForm(gatewayUrl: string, formParams: Record<string, string>): void {
    // Remove any existing CMI form to prevent duplicates
    const existing = document.getElementById('__cmi_pay_form__');
    if (existing) existing.remove();

    const form = document.createElement('form');
    form.id     = '__cmi_pay_form__';
    form.method = 'POST';
    form.action = gatewayUrl;
    form.style.display = 'none';

    for (const [name, value] of Object.entries(formParams)) {
      const input = document.createElement('input');
      input.type  = 'hidden';
      input.name  = name;
      input.value = value;
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
  }
}

export const paymentService = new PaymentService();
export default paymentService;
