import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Course, CourseCategory, PaginatedResponse, CourseQueryParams } from '../../services/api/types';
import courseService from '../../services/api/course.service';

interface CourseState {
  courses: Course[];
  popularCourses: Course[];
  latestCourses: Course[];
  categories: CourseCategory[];
  currentCourse: Course | null;
  wishlist: Course[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: CourseState = {
  courses: [],
  popularCourses: [],
  latestCourses: [],
  categories: [],
  currentCourse: null,
  wishlist: [],
  totalPages: 0,
  totalElements: 0,
  currentPage: 0,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchCourses = createAsyncThunk(
  'courses/fetchCourses',
  async (params: CourseQueryParams = {}, { rejectWithValue }) => {
    try {
      const response = await courseService.getCourses(params);
      return response;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || 'Failed to fetch courses'
      );
    }
  }
);

export const fetchPopularCourses = createAsyncThunk(
  'courses/fetchPopularCourses',
  async (limit: number = 8, { rejectWithValue }) => {
    try {
      const courses = await courseService.getPopularCourses(limit);
      return courses;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || 'Failed to fetch popular courses'
      );
    }
  }
);

export const fetchLatestCourses = createAsyncThunk(
  'courses/fetchLatestCourses',
  async (limit: number = 8, { rejectWithValue }) => {
    try {
      const courses = await courseService.getLatestCourses(limit);
      return courses;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || 'Failed to fetch latest courses'
      );
    }
  }
);

export const fetchCourseById = createAsyncThunk(
  'courses/fetchCourseById',
  async (id: string, { rejectWithValue }) => {
    try {
      const course = await courseService.getCourseById(id);
      return course;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || 'Failed to fetch course'
      );
    }
  }
);

export const fetchCourseBySlug = createAsyncThunk(
  'courses/fetchCourseBySlug',
  async (slug: string, { rejectWithValue }) => {
    try {
      const course = await courseService.getCourseBySlug(slug);
      return course;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || 'Failed to fetch course'
      );
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'courses/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const categories = await courseService.getCategories();
      return categories;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || 'Failed to fetch categories'
      );
    }
  }
);

export const fetchWishlist = createAsyncThunk(
  'courses/fetchWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await courseService.getWishlist();
      return response.content;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || 'Failed to fetch wishlist'
      );
    }
  }
);

export const addToWishlist = createAsyncThunk(
  'courses/addToWishlist',
  async (courseId: string, { rejectWithValue }) => {
    try {
      await courseService.addToWishlist(courseId);
      return courseId;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || 'Failed to add to wishlist'
      );
    }
  }
);

export const removeFromWishlist = createAsyncThunk(
  'courses/removeFromWishlist',
  async (courseId: string, { rejectWithValue }) => {
    try {
      await courseService.removeFromWishlist(courseId);
      return courseId;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || 'Failed to remove from wishlist'
      );
    }
  }
);

export const enrollInCourse = createAsyncThunk(
  'courses/enrollInCourse',
  async (courseId: string, { rejectWithValue }) => {
    try {
      const enrollment = await courseService.enrollInCourse(courseId);
      return enrollment;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.message || 'Failed to enroll in course'
      );
    }
  }
);

const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentCourse: (state, action: PayloadAction<Course | null>) => {
      state.currentCourse = action.payload;
    },
    updateCourseInList: (state, action: PayloadAction<Course>) => {
      const index = state.courses.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.courses[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch courses
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action: PayloadAction<PaginatedResponse<Course>>) => {
        state.isLoading = false;
        state.courses = action.payload.content;
        state.totalPages = action.payload.totalPages;
        state.totalElements = action.payload.totalElements;
        state.currentPage = action.payload.number;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch popular courses
    builder
      .addCase(fetchPopularCourses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPopularCourses.fulfilled, (state, action: PayloadAction<Course[]>) => {
        state.isLoading = false;
        state.popularCourses = action.payload;
      })
      .addCase(fetchPopularCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch latest courses
    builder
      .addCase(fetchLatestCourses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchLatestCourses.fulfilled, (state, action: PayloadAction<Course[]>) => {
        state.isLoading = false;
        state.latestCourses = action.payload;
      })
      .addCase(fetchLatestCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch course by ID
    builder
      .addCase(fetchCourseById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourseById.fulfilled, (state, action: PayloadAction<Course>) => {
        state.isLoading = false;
        state.currentCourse = action.payload;
      })
      .addCase(fetchCourseById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch course by slug
    builder
      .addCase(fetchCourseBySlug.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourseBySlug.fulfilled, (state, action: PayloadAction<Course>) => {
        state.isLoading = false;
        state.currentCourse = action.payload;
      })
      .addCase(fetchCourseBySlug.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch categories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action: PayloadAction<CourseCategory[]>) => {
        state.isLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch wishlist
    builder
      .addCase(fetchWishlist.fulfilled, (state, action: PayloadAction<Course[]>) => {
        state.wishlist = action.payload;
      });

    // Add to wishlist
    builder
      .addCase(addToWishlist.fulfilled, (state, action: PayloadAction<string>) => {
        // Update course in list
        const courseIndex = state.courses.findIndex((c) => c.id === action.payload);
        if (courseIndex !== -1) {
          state.courses[courseIndex].isWishlisted = true;
        }
        if (state.currentCourse?.id === action.payload) {
          state.currentCourse.isWishlisted = true;
        }
      });

    // Remove from wishlist
    builder
      .addCase(removeFromWishlist.fulfilled, (state, action: PayloadAction<string>) => {
        state.wishlist = state.wishlist.filter((c) => c.id !== action.payload);
        const courseIndex = state.courses.findIndex((c) => c.id === action.payload);
        if (courseIndex !== -1) {
          state.courses[courseIndex].isWishlisted = false;
        }
        if (state.currentCourse?.id === action.payload) {
          state.currentCourse.isWishlisted = false;
        }
      });

    // Enroll in course
    builder
      .addCase(enrollInCourse.fulfilled, (state, action) => {
        const courseId = action.payload.courseId;
        const courseIndex = state.courses.findIndex((c) => c.id === courseId);
        if (courseIndex !== -1) {
          state.courses[courseIndex].isEnrolled = true;
        }
        if (state.currentCourse !== null && state.currentCourse.id === courseId) {
          state.currentCourse.isEnrolled = true;
        }
      });
  },
});

export const { clearError, setCurrentCourse, updateCourseInList } = courseSlice.actions;
export default courseSlice.reducer;
