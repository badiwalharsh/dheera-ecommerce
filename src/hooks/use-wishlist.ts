"use client";

import { useState } from "react";

/**
 * Architectural Wishlist Hook Stub for Phase 1
 */
export function useWishlist() {
  const [wishlistIds] = useState<string[]>([]);

  return {
    wishlistIds,
    count: wishlistIds.length,
    isInWishlist: (id: string) => wishlistIds.includes(id),
  };
}

