import { configureStore } from '@reduxjs/toolkit';
import themeSettingSlice from './themeSettingSlice';
import sidebarSlice from './sidebarSlice';
import authSlice from './authSlice';
import courseSlice from './courseSlice';
import studentSlice from './studentSlice';
import instructorSlice from './instructorSlice';
import adminSlice from './adminSlice';

const store = configureStore({
  reducer: {
    themeSetting: themeSettingSlice,
    sidebar: sidebarSlice,
    auth: authSlice,
    courses: courseSlice,
    student: studentSlice,
    instructor: instructorSlice,
    admin: adminSlice,
  },
});

// Type definitions for Redux
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
