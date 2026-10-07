"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  category: string;
  image: string;
  price: number | null;
  originalPrice: number | null;
  priceLabel: string | null;
  stockStatus: string | null;
  dimensions?: string | null;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  totalItems: number;
  subtotal: number;
  hasConsultationPricing: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_CART_KEY = "home_interior_guest_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart on initial mount
  useEffect(() => {
    try {
      const storageKey = user ? `home_interior_user_cart_${user.id}` : GUEST_CART_KEY;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      // Ignored
    } finally {
      setIsLoaded(true);
    }
  }, [user]);

  // When user logs in, merge guest cart into user cart
  useEffect(() => {
    if (!user || !isLoaded) return;
    try {
      const guestSaved = localStorage.getItem(GUEST_CART_KEY);
      if (guestSaved) {
        const guestItems: CartItem[] = JSON.parse(guestSaved);
        if (Array.isArray(guestItems) && guestItems.length > 0) {
          setItems((currentItems) => {
            const merged = [...currentItems];
            for (const gItem of guestItems) {
              const existingIndex = merged.findIndex((i) => i.productId === gItem.productId);
              if (existingIndex > -1) {
                merged[existingIndex].quantity += gItem.quantity;
              } else {
                merged.push(gItem);
              }
            }
            // Clear guest cart once merged
            localStorage.removeItem(GUEST_CART_KEY);
            return merged;
          });
        }
      }
    } catch {
      // Ignored
    }
  }, [user, isLoaded]);

  // Save cart changes to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const storageKey = user ? `home_interior_user_cart_${user.id}` : GUEST_CART_KEY;
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // Ignored
    }
  }, [items, user, isLoaded]);

  const addItem = (item: Omit<CartItem, "quantity">, quantity = 1) => {
    // If out of stock, do not add
    if (item.stockStatus === "out_of_stock") return;

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.productId === item.productId);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }
      return [...prev, { ...item, quantity: Math.max(1, quantity) }];
    });
    setIsOpen(true);
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen((prev) => !prev);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = items.reduce((sum, item) => {
    if (typeof item.price === "number" && item.price > 0) {
      return sum + item.price * item.quantity;
    }
    return sum;
  }, 0);

  const hasConsultationPricing = items.some(
    (item) => typeof item.price !== "number" || item.price <= 0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        totalItems,
        subtotal,
        hasConsultationPricing,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
