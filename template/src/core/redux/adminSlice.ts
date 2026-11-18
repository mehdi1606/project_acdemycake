import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  AdminDashboard,
  AdminUser,
  Course,
  PaymentTransaction,
} from '../../services/api/types';
import adminService, { UserRoleFilter } from '../../services/api/admin.service';

interface AdminState {
  dashboard: AdminDashboard | null;
  users: AdminUser[];
  usersPagination: {
    totalPages: number;
    totalElements: number;
    currentPage: number;
  };
  courses: Course[];
  coursesPagination: {
    totalPages: number;
    totalElements: number;
    currentPage: number;
  };
  pendingCourses: Course[];
  pendingCoursesPagination: {
    totalPages: number;
    totalElements: number;
    currentPage: number;
  };
  transactions: PaymentTransaction[];
  transactionsPagination: {
    totalPages: number;
    totalElements: number;
    currentPage: number;
  };
  isLoading: boolean;
  isLoadingUsers: boolean;
  isLoadingCourses: boolean;
  isLoadingTransactions: boolean;
  error: string | null;
}

const initialState: AdminState = {
  dashboard: null,
  users: [],
  usersPagination: {
    totalPages: 0,
    totalElements: 0,
    currentPage: 0,
  },
  courses: [],
  coursesPagination: {
    totalPages: 0,
    totalElements: 0,
    currentPage: 0,
  },
  pendingCourses: [],
  pendingCoursesPagination: {
    totalPages: 0,
    totalElements: 0,
    currentPage: 0,
  },
  transactions: [],
  transactionsPagination: {
    totalPages: 0,
    totalElements: 0,
    currentPage: 0,
  },
  isLoading: false,
  isLoadingUsers: false,
  isLoadingCourses: false,
  isLoadingTransactions: false,
  error: null,
};

// Async thunks
export const fetchAdminDashboard = createAsyncThunk(
  'admin/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      return await adminService.getDashboard();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch dashboard');
    }
  }
);

export const fetchUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (
    {
      page = 0,
      size = 20,
      search,
      role,
    }: { page?: number; size?: number; search?: string; role?: UserRoleFilter },
    { rejectWithValue }
  ) => {
    try {
      return await adminService.getUsers(page, size, search, role);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const banUser = createAsyncThunk(
  'admin/banUser',
  async ({ userId, reason }: { userId: string; reason?: string }, { rejectWithValue }) => {
    try {
      await adminService.banUser(userId, reason);
      return { userId, reason };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to ban user');
    }
  }
);

export const unbanUser = createAsyncThunk(
  'admin/unbanUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      await adminService.unbanUser(userId);
      return userId;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to unban user');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      await adminService.deleteUser(userId);
      return userId;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to delete user');
    }
  }
);

export const fetchCourses = createAsyncThunk(
  'admin/fetchCourses',
  async (
    { page = 0, size = 20, status }: { page?: number; size?: number; status?: string },
    { rejectWithValue }
  ) => {
    try {
      return await adminService.getCourses(page, size, status || undefined);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch courses');
    }
  }
);

export const fetchPendingCourses = createAsyncThunk(
  'admin/fetchPendingCourses',
  async ({ page = 0, size = 20 }: { page?: number; size?: number }, { rejectWithValue }) => {
    try {
      return await adminService.getPendingCourses(page, size);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch pending courses');
    }
  }
);

export const approveCourse = createAsyncThunk(
  'admin/approveCourse',
  async (courseId: string, { rejectWithValue }) => {
    try {
      await adminService.approveCourse(courseId);
      return courseId;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to approve course');
    }
  }
);

// Reject a pending course: it goes back to DRAFT (never deleted). The reason is sent to the backend.
export const rejectCourse = createAsyncThunk(
  'admin/rejectCourse',
  async ({ courseId, reason }: { courseId: string; reason: string }, { rejectWithValue }) => {
    try {
      await adminService.rejectCourse(courseId, reason);
      return courseId;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to reject course');
    }
  }
);

export const deleteCourse = createAsyncThunk(
  'admin/deleteCourse',
  async (courseId: string, { rejectWithValue }) => {
    try {
      await adminService.deleteCourse(courseId);
      return courseId;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to delete course');
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  'admin/fetchTransactions',
  async (
    {
      page = 0,
      size = 20,
      status,
      type,
    }: { page?: number; size?: number; status?: string; type?: string },
    { rejectWithValue }
  ) => {
    try {
      return await adminService.getTransactions(page, size, status, type);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to fetch transactions');
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAdminState: () => initialState,
  },
  extraReducers: (builder) => {
    // Dashboard
    builder
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Users
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.isLoadingUsers = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoadingUsers = false;
        state.users = action.payload.content as AdminUser[];
        state.usersPagination = {
          totalPages: action.payload.totalPages,
          totalElements: action.payload.totalElements,
          currentPage: action.payload.page,
        };
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoadingUsers = false;
        state.error = action.payload as string;
      });

    // Ban user
    builder
      .addCase(banUser.fulfilled, (state, action) => {
        const user = state.users.find((u) => u.id === String(action.payload.userId));
        if (user) {
          user.isBanned = true;
          user.bannedAt = new Date().toISOString();
          user.banReason = action.payload.reason;
        }
      });

    // Unban user
    builder
      .addCase(unbanUser.fulfilled, (state, action) => {
        const user = state.users.find((u) => u.id === String(action.payload));
        if (user) {
          user.isBanned = false;
          user.bannedAt = undefined;
          user.banReason = undefined;
        }
      });

    // Delete user
    builder
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.id !== String(action.payload));
        state.usersPagination.totalElements -= 1;
      });

    // Courses
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.isLoadingCourses = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.isLoadingCourses = false;
        state.courses = action.payload.content;
        state.coursesPagination = {
          totalPages: action.payload.totalPages,
          totalElements: action.payload.totalElements,
          currentPage: action.payload.page,
        };
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.isLoadingCourses = false;
        state.error = action.payload as string;
      });

    // Pending Courses
    builder
      .addCase(fetchPendingCourses.pending, (state) => {
        state.isLoadingCourses = true;
        state.error = null;
      })
      .addCase(fetchPendingCourses.fulfilled, (state, action) => {
        state.isLoadingCourses = false;
        state.pendingCourses = action.payload.content;
        state.pendingCoursesPagination = {
          totalPages: action.payload.totalPages,
          totalElements: action.payload.totalElements,
          currentPage: action.payload.page,
        };
      })
      .addCase(fetchPendingCourses.rejected, (state, action) => {
        state.isLoadingCourses = false;
        state.error = action.payload as string;
      });

    // Approve course
    builder
      .addCase(approveCourse.fulfilled, (state, action) => {
        state.pendingCourses = state.pendingCourses.filter((c) => c.id !== action.payload);
        state.pendingCoursesPagination.totalElements = Math.max(0, state.pendingCoursesPagination.totalElements - 1);
      });

    // Reject course (back to DRAFT): drop it from the pending queue only
    builder
      .addCase(rejectCourse.fulfilled, (state, action) => {
        state.pendingCourses = state.pendingCourses.filter((c) => c.id !== action.payload);
        state.pendingCoursesPagination.totalElements = Math.max(0, state.pendingCoursesPagination.totalElements - 1);
        const course = state.courses.find((c) => c.id === action.payload);
        if (course) course.status = 'DRAFT';
      });

    // Delete course
    builder
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.courses = state.courses.filter((c) => c.id !== action.payload);
        state.coursesPagination.totalElements -= 1;
        const wasPending = state.pendingCourses.some((c) => c.id === action.payload);
        state.pendingCourses = state.pendingCourses.filter((c) => c.id !== action.payload);
        if (wasPending) {
          state.pendingCoursesPagination.totalElements = Math.max(0, state.pendingCoursesPagination.totalElements - 1);
        }
      });

    // Transactions
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.isLoadingTransactions = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.isLoadingTransactions = false;
        state.transactions = action.payload.content;
        state.transactionsPagination = {
          totalPages: action.payload.totalPages,
          totalElements: action.payload.totalElements,
          currentPage: action.payload.page,
        };
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.isLoadingTransactions = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearAdminState } = adminSlice.actions;
export default adminSlice.reducer;
