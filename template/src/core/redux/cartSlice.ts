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
    clearCart(state) {
      state.items = [];
      saveCart(state.items);
    },
  },
});

export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
