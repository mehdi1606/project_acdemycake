import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Course, InstructorDashboard, InstructorEarning, Payout, PaginatedResponse } from '../../services/api/types';
import instructorService from '../../services/api/instructor.service';

interface InstructorState {
  dashboard: InstructorDashboard | null;
  courses: Course[];
  earnings: InstructorEarning[];
  payouts: Payout[];
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: InstructorState = {
  dashboard: null,
  courses: [],
  earnings: [],
  payouts: [],
  totalPages: 0,
  currentPage: 0,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchInstructorDashboard = createAsyncThunk(
  'instructor/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await instructorService.getDashboard();
      return response;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || 'Failed to fetch dashboard'
      );
    }
  }
);

export const fetchInstructorCourses = createAsyncThunk(
  'instructor/fetchCourses',
  async ({ page = 0, size = 10 }: { page?: number; size?: number }, { rejectWithValue }) => {
    try {
      const response = await instructorService.getMyCourses(page, size);
      return response;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || 'Failed to fetch courses'
      );
    }
  }
);

export const fetchInstructorEarnings = createAsyncThunk(
  'instructor/fetchEarnings',
  async ({ page = 0, size = 20 }: { page?: number; size?: number }, { rejectWithValue }) => {
    try {
      const response = await instructorService.getEarnings(page, size);
      return response;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || 'Failed to fetch earnings'
      );
    }
  }
);

export const fetchInstructorPayouts = createAsyncThunk(
  'instructor/fetchPayouts',
  async ({ page = 0, size = 10 }: { page?: number; size?: number }, { rejectWithValue }) => {
    try {
      const response = await instructorService.getPayouts(page, size);
      return response;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || 'Failed to fetch payouts'
      );
    }
  }
);

const instructorSlice = createSlice({
  name: 'instructor',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch dashboard
    builder
      .addCase(fetchInstructorDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInstructorDashboard.fulfilled, (state, action: PayloadAction<InstructorDashboard>) => {
        state.isLoading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchInstructorDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch courses
    builder
      .addCase(fetchInstructorCourses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInstructorCourses.fulfilled, (state, action: PayloadAction<PaginatedResponse<Course>>) => {
        state.isLoading = false;
        state.courses = action.payload.content;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.number;
      })
      .addCase(fetchInstructorCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch earnings
    builder
      .addCase(fetchInstructorEarnings.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchInstructorEarnings.fulfilled, (state, action: PayloadAction<PaginatedResponse<InstructorEarning>>) => {
        state.isLoading = false;
        state.earnings = action.payload.content;
      })
      .addCase(fetchInstructorEarnings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch payouts
    builder
      .addCase(fetchInstructorPayouts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchInstructorPayouts.fulfilled, (state, action: PayloadAction<PaginatedResponse<Payout>>) => {
        state.isLoading = false;
        state.payouts = action.payload.content;
      })
      .addCase(fetchInstructorPayouts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = instructorSlice.actions;
export default instructorSlice.reducer;
