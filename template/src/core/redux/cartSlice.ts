import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl?: string;
  price: number;
  originalPrice?: number;
  instructorName?: string;
  instructorId?: string;
  instructorAvatar?: string;
  rating?: number;
  ratingCount?: number;
  level?: string;
}

interface CartState {
  items: CartItem[];
}

const CART_KEY = 'academy_cart';

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

const initialState: CartState = {
  items: loadCart(),
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<CartItem>) {
      const exists = state.items.some((i) => i.id === action.payload.id);
      if (!exists) {
        state.items.push(action.payload);
        saveCart(state.items);
      }
    },
    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
      saveCart(state.items);
    },
    /** "Buy now": the checkout holds exactly this one course. */
    selectForCheckout(state, action: PayloadAction<CartItem>) {
      state.items = [action.payload];
      saveCart(state.items);
    },
    clearCart(state) {
      state.items = [];
      saveCart(state.items);
    },
  },
  extraReducers: (builder) => {
    // The cart is stored per device: empty it on logout so the next person
    // using this browser doesn't see (or pay for) the previous user's cart.
    builder.addMatcher(
      (action) => action.type === 'auth/logout/fulfilled' || action.type === 'auth/logout/rejected',
      (state) => {
        state.items = [];
        saveCart(state.items);
      },
    );
  },
});

export const { addToCart, removeFromCart, clearCart, selectForCheckout } = cartSlice.actions;

/** The checkout line for a course (SARALÖWE has no shopping cart: one course, straight to checkout). */
export const checkoutItemFor = (course: {
  id: string; slug: string; title: string; thumbnailUrl?: string; price?: number; originalPrice?: number;
  instructor?: { id?: string; fullName?: string; avatarUrl?: string }; ratingAverage?: number; ratingCount?: number; level?: string;
}): CartItem => ({
  id: course.id, slug: course.slug, title: course.title,
  thumbnailUrl: course.thumbnailUrl, price: course.price ?? 0, originalPrice: course.originalPrice,
  instructorName: course.instructor?.fullName, instructorId: course.instructor?.id, instructorAvatar: course.instructor?.avatarUrl,
  rating: course.ratingAverage, ratingCount: course.ratingCount, level: course.level,
});
export default cartSlice.reducer;
