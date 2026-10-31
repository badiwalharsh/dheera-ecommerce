"use client";

import { useState, useEffect } from "react";
import { ClientCartItem } from "@/types/ecommerce";

/**
 * Architectural Cart Hook Stub for Phase 1
 */
export function useCart() {
  const [items, setItems] = useState<ClientCartItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("dheera_cart");
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // LocalStorage unavailable
    }
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return {
    items,
    totalItems,
    subtotal,
  };
}
