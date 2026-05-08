import api from './axios.config';
import {
  SubscriptionPlan,
  Subscription,
  InitiatePaymentResponse,
  PaginatedResponse,
  PaymentTransaction,
} from './types';

interface SubscriptionHistoryItem {
  id: string;
  planType: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  amount: number;
  currency: string;
}

class SubscriptionService {
  // Get available subscription plans
  async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await api.get<SubscriptionPlan[]>('/subscriptions/plans');
    return response.data;
  }

  // Initiate subscription payment
  async subscribe(planId: string, couponCode?: string): Promise<InitiatePaymentResponse> {
    const response = await api.post<InitiatePaymentResponse>('/subscriptions/subscribe', {
      planId,
      ...(couponCode ? { couponCode } : {}),
    });
    return response.data;
  }

  // Validate a coupon code for the Annual plan
  async validateCoupon(code: string): Promise<{
    valid: boolean;
    code?: string;
    discountPercent?: number;
    originalPrice?: number;
    discountAmount?: number;
    finalPrice?: number;
    message?: string;
  }> {
    const response = await api.get('/coupons/validate', { params: { code } });
    return response.data;
  }

  // Get current subscription status
  async getMySubscription(): Promise<Subscription | null> {
    try {
      const response = await api.get<Subscription>('/subscriptions/my-subscription');
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(): Promise<void> {
    await api.post('/subscriptions/cancel');
  }

  // Reactivate cancelled subscription
  async reactivateSubscription(): Promise<Subscription> {
    const response = await api.post<Subscription>('/subscriptions/reactivate');
    return response.data;
  }

  // Get subscription history
  async getSubscriptionHistory(
    page = 0,
    size = 10
  ): Promise<PaginatedResponse<SubscriptionHistoryItem>> {
    const response = await api.get<PaginatedResponse<SubscriptionHistoryItem>>('/subscriptions/history', {
      params: { page, size },
    });
    return response.data;
  }

  // Check if user has active subscription
  async hasActiveSubscription(): Promise<boolean> {
    const subscription = await this.getMySubscription();
    return subscription?.status === 'ACTIVE';
  }

  // Purchase individual course — backend expects courseId as a path variable
  async purchaseCourse(courseId: string): Promise<InitiatePaymentResponse> {
    const response = await api.post<InitiatePaymentResponse>(`/payments/course/${courseId}`);
    return response.data;
  }

  // Get payment history
  async getPaymentHistory(page = 0, size = 10): Promise<PaginatedResponse<PaymentTransaction>> {
    const response = await api.get<PaginatedResponse<PaymentTransaction>>('/payments/history', {
      params: { page, size },
    });
    return response.data;
  }

  // Verify payment callback
  async verifyPayment(transactionId: string, status: string): Promise<boolean> {
    const response = await api.post<{ success: boolean }>('/payments/verify', {
      transactionId,
      status,
    });
    return response.data.success;
  }

  // Check if user has access to a specific course
  async hasAccessToCourse(courseId: number): Promise<{ hasAccess: boolean; reason: string }> {
    try {
      const response = await api.get<{ hasAccess: boolean; reason: string }>(`/courses/${courseId}/access`);
      return response.data;
    } catch {
      return { hasAccess: false, reason: 'Unable to verify access' };
    }
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
