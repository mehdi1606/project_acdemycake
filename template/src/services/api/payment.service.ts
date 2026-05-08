import api from './axios.config';
import {
  PaymentTransaction,
  InitiatePaymentResponse,
  PaginatedResponse,
} from './types';

class PaymentService {
  // Initiate course purchase payment
  async purchaseCourse(courseId: number): Promise<InitiatePaymentResponse> {
    const response = await api.post<InitiatePaymentResponse>(`/payments/course/${courseId}`);
    return response.data;
  }

  // Get payment history
  async getPaymentHistory(
    page = 0,
    size = 10
  ): Promise<PaginatedResponse<PaymentTransaction>> {
    const response = await api.get<PaginatedResponse<PaymentTransaction>>('/payments/history', {
      params: { page, size },
    });
    return response.data;
  }

  // Get transaction details
  async getTransactionDetails(transactionId: number): Promise<PaymentTransaction> {
    const response = await api.get<PaymentTransaction>(`/payments/transaction/${transactionId}`);
    return response.data;
  }

  // NOTE: The GET /callback endpoint has been removed from the backend.
  // Payment status updates are driven exclusively by the signed POST /webhook.
  // After a payment gateway redirect, fetch the latest transaction to check status:
  async getTransactionStatus(transactionId: string): Promise<PaymentTransaction> {
    const response = await api.get<PaymentTransaction>(`/payments/transaction/${transactionId}`);
    return response.data;
  }
}

export const paymentService = new PaymentService();
export default paymentService;
