import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Enrollment, PaymentTransaction, PaginatedResponse } from '../../services/api/types';
import courseService from '../../services/api/course.service';
import paymentService from '../../services/api/payment.service';

interface StudentDashboardStats {
  enrolledCourses: number;
  activeCourses: number;
  completedCourses: number;
}

interface StudentState {
  enrollments: Enrollment[];
  recentEnrollments: Enrollment[];
  transactions: PaymentTransaction[];
  stats: StudentDashboardStats;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: StudentState = {
  enrollments: [],
  recentEnrollments: [],
  transactions: [],
  stats: {
    enrolledCourses: 0,
    activeCourses: 0,
    completedCourses: 0,
  },
  totalPages: 0,
  currentPage: 0,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchMyEnrollments = createAsyncThunk(
  'student/fetchMyEnrollments',
  async ({ page = 0, size = 10 }: { page?: number; size?: number }, { rejectWithValue }) => {
    try {
      const response = await courseService.getMyEnrolledCourses(page, size);
      return response;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || 'Failed to fetch enrollments'
      );
    }
  }
);

export const fetchRecentEnrollments = createAsyncThunk(
  'student/fetchRecentEnrollments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await courseService.getMyEnrolledCourses(0, 3);
      return response.content;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || 'Failed to fetch recent enrollments'
      );
    }
  }
);

export const fetchPaymentHistory = createAsyncThunk(
  'student/fetchPaymentHistory',
  async ({ page = 0, size = 5 }: { page?: number; size?: number }, { rejectWithValue }) => {
    try {
      const response = await paymentService.getPaymentHistory(page, size);
      return response;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || 'Failed to fetch payment history'
      );
    }
  }
);

export const fetchStudentStats = createAsyncThunk(
  'student/fetchStudentStats',
  async (_, { rejectWithValue }) => {
    try {
      // Get all enrollments to calculate stats
      const response = await courseService.getMyEnrolledCourses(0, 1000);
      const enrollments = response.content;

      const stats: StudentDashboardStats = {
        enrolledCourses: enrollments.length,
        activeCourses: enrollments.filter((e) => e.progressPercentage > 0 && !e.isCompleted).length,
        completedCourses: enrollments.filter((e) => e.isCompleted).length,
      };

      return stats;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || 'Failed to fetch student stats'
      );
    }
  }
);

const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch enrollments
    builder
      .addCase(fetchMyEnrollments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyEnrollments.fulfilled, (state, action: PayloadAction<PaginatedResponse<Enrollment>>) => {
        state.isLoading = false;
        state.enrollments = action.payload.content;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.number;
      })
      .addCase(fetchMyEnrollments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch recent enrollments
    builder
      .addCase(fetchRecentEnrollments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchRecentEnrollments.fulfilled, (state, action: PayloadAction<Enrollment[]>) => {
        state.isLoading = false;
        state.recentEnrollments = action.payload;
      })
      .addCase(fetchRecentEnrollments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch payment history
    builder
      .addCase(fetchPaymentHistory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPaymentHistory.fulfilled, (state, action: PayloadAction<PaginatedResponse<PaymentTransaction>>) => {
        state.isLoading = false;
        state.transactions = action.payload.content;
      })
      .addCase(fetchPaymentHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch student stats
    builder
      .addCase(fetchStudentStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchStudentStats.fulfilled, (state, action: PayloadAction<StudentDashboardStats>) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchStudentStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = studentSlice.actions;
export default studentSlice.reducer;
