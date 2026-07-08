import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  creative: any;
  date: Date | string; // Handled as string post-hydration
  startMin: number;
  loops: number;
  durationSec: number;
  priceInfo: any;
}

interface CartState {
  cart: CartItem[];
  cartExpiresAt: number | null;
  addToCart: (item: CartItem) => void;
  addMultipleToCart: (items: CartItem[]) => void;
  removeFromCart: (id: string) => void;
  updateCartItem: (id: string, updates: Partial<CartItem>) => void;
  setCart: (cart: CartItem[]) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      cartExpiresAt: null,
      addToCart: (item) => set((state) => {
        const expiresAt = state.cart.length === 0 ? Date.now() + 5 * 60 * 1000 : state.cartExpiresAt;
        return { cart: [...state.cart, item], cartExpiresAt: expiresAt };
      }),
      addMultipleToCart: (items) => set((state) => {
        const expiresAt = state.cart.length === 0 ? Date.now() + 5 * 60 * 1000 : state.cartExpiresAt;
        return { cart: [...state.cart, ...items], cartExpiresAt: expiresAt };
      }),
      removeFromCart: (id) => set((state) => {
        const newCart = state.cart.filter((c) => c.id !== id);
        return { cart: newCart, cartExpiresAt: newCart.length === 0 ? null : state.cartExpiresAt };
      }),
      updateCartItem: (id, updates) => set((state) => ({
        cart: state.cart.map((c) => c.id === id ? { ...c, ...updates } : c)
      })),
      setCart: (cart) => set({ cart, cartExpiresAt: cart.length === 0 ? null : (get().cartExpiresAt || Date.now() + 5 * 60 * 1000) }),
      clearCart: () => set({ cart: [], cartExpiresAt: null }),
      getCartTotal: () => {
        return get().cart.reduce((total, item) => total + (item.priceInfo?.cost || 0), 0);
      }
    }),
    {
      name: 'rella-cart-storage',
    }
  )
);
