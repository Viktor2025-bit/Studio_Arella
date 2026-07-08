import { create } from 'zustand';

export interface CartItem {
  id: string;
  creative: any;
  date: Date;
  startMin: number;
  loops: number;
  durationSec: number;
  priceInfo: any;
}

interface CartState {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  addMultipleToCart: (items: CartItem[]) => void;
  removeFromCart: (id: string) => void;
  updateCartItem: (id: string, updates: Partial<CartItem>) => void;
  setCart: (cart: CartItem[]) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],
  addToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
  addMultipleToCart: (items) => set((state) => ({ cart: [...state.cart, ...items] })),
  removeFromCart: (id) => set((state) => ({ cart: state.cart.filter((c) => c.id !== id) })),
  updateCartItem: (id, updates) => set((state) => ({
    cart: state.cart.map((c) => c.id === id ? { ...c, ...updates } : c)
  })),
  setCart: (cart) => set({ cart }),
  clearCart: () => set({ cart: [] }),
  getCartTotal: () => {
    return get().cart.reduce((total, item) => total + (item.priceInfo?.cost || 0), 0);
  }
}));
