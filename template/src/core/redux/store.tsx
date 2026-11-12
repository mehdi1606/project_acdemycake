import { AnyAction, combineReducers, configureStore } from '@reduxjs/toolkit';
import themeSettingSlice from './themeSettingSlice';
import sidebarSlice from './sidebarSlice';
import authSlice from './authSlice';
import courseSlice from './courseSlice';
import studentSlice from './studentSlice';
import instructorSlice from './instructorSlice';
import adminSlice from './adminSlice';
import cartSlice from './cartSlice';

const appReducer = combineReducers({
  themeSetting: themeSettingSlice,
  sidebar: sidebarSlice,
  auth: authSlice,
  courses: courseSlice,
  student: studentSlice,
  instructor: instructorSlice,
  admin: adminSlice,
  cart: cartSlice,
});

type AppState = ReturnType<typeof appReducer>;

// On logout, drop every piece of user-scoped data so the next user on this
// browser never sees the previous user's dashboard/courses/admin data.
// - auth and cart handle logout themselves (auth's initialState is read from
//   storage at module load, so it must not be reset to that snapshot).
// - themeSetting/sidebar are UI preferences, not user data.
const rootReducer = (state: AppState | undefined, action: AnyAction): AppState => {
  if (state && (action.type === 'auth/logout/fulfilled' || action.type === 'auth/logout/rejected')) {
    return appReducer(
      {
        themeSetting: state.themeSetting,
        sidebar: state.sidebar,
        auth: state.auth,
        cart: state.cart,
      } as AppState,
      action,
    );
  }
  return appReducer(state, action);
};

const store = configureStore({
  reducer: rootReducer,
});

// Type definitions for Redux
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
