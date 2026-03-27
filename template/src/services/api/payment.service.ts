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

  // Handle payment callback (when returning from payment gateway)
  async handlePaymentCallback(
    transactionId: string,
    status: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.get<{ success: boolean; message: string }>('/payments/callback', {
      params: { transactionId, status },
    });
    return response.data;
  }
}

export const paymentService = new PaymentService();
export default paymentService;
