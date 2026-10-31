"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserProfile } from "@/types/account";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    fullName: string,
    email: string,
    password: string,
    phone?: string
  ) => Promise<{ success: boolean; error?: string; requiresEmailVerification?: boolean }>;
  logout: () => Promise<void>;
  updateProfile: (fullName: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (
    currentPassword?: string,
    newPassword?: string
  ) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "dheera_auth_patron";
const AUTH_COOKIE_NAME = "dheera_session_user";

// Helper to set session cookie for server route handlers
function setSessionCookie(user: UserProfile | null) {
  if (typeof document === "undefined") return;
  if (user) {
    const encoded = encodeURIComponent(JSON.stringify({ id: user.id, email: user.email, name: user.fullName }));
    document.cookie = `${AUTH_COOKIE_NAME}=${encoded}; path=/; max-age=604800; SameSite=Lax`;
  } else {
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync past guest orders and guest wishlist to the newly logged in patron
  const syncGuestData = useCallback(async (patron: UserProfile) => {
    try {
      // 1. Associate past guest orders matching patron email
      await fetch("/api/account/associate-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: patron.id, email: patron.email }),
      });

      // 2. Sync guest wishlist items from localStorage
      const guestWishlistStr = localStorage.getItem("dheera_wishlist");
      if (guestWishlistStr) {
        try {
          const guestWishlist = JSON.parse(guestWishlistStr);
          if (Array.isArray(guestWishlist) && guestWishlist.length > 0) {
            await fetch("/api/account/wishlist", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: patron.id, syncIds: guestWishlist }),
            });
          }
        } catch {
          // Safe ignore
        }
      }
    } catch {
      // Non-blocking sync error
    }
  }, []);

  // Initialize session
  useEffect(() => {
    async function initAuth() {
      setIsLoading(true);

      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            const res = await fetch(`/api/account/profile?userId=${session.user.id}`);
            if (res.ok) {
              const profile = await res.json();
              setUser(profile);
              setSessionCookie(profile);
            } else {
              const fallbackProfile: UserProfile = {
                id: session.user.id,
                email: session.user.email || "",
                fullName: session.user.user_metadata?.full_name || "Valued Patron",
                phone: session.user.user_metadata?.phone,
                role: "customer",
                createdAt: session.user.created_at,
              };
              setUser(fallbackProfile);
              setSessionCookie(fallbackProfile);
            }
          }
        } catch {
          // Fallback to local storage
        }
      } else {
        // Fallback local session for dev/preview
        try {
          const saved = localStorage.getItem(AUTH_STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            setUser(parsed);
            setSessionCookie(parsed);
          }
        } catch {
          // Safe ignore
        }
      }

      setIsLoading(false);
    }

    initAuth();
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail || !password) {
        setIsLoading(false);
        return { success: false, error: "Please provide both email and password." };
      }

      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

          if (error) {
            setIsLoading(false);
            return { success: false, error: error.message };
          }

          if (data.user) {
            const res = await fetch(`/api/account/profile?userId=${data.user.id}`);
            let profile: UserProfile;
            if (res.ok) {
              profile = await res.json();
            } else {
              profile = {
                id: data.user.id,
                email: cleanEmail,
                fullName: data.user.user_metadata?.full_name || "Valued Patron",
                phone: data.user.user_metadata?.phone,
                role: "customer",
                createdAt: data.user.created_at,
              };
            }

            setUser(profile);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
            setSessionCookie(profile);
            await syncGuestData(profile);
            setIsLoading(false);
            return { success: true };
          }
        } catch (err: any) {
          setIsLoading(false);
          return { success: false, error: err.message || "Failed to sign in." };
        }
      }

      // Offline / sandbox mode authentication
      // Password must be at least 6 characters
      if (password.length < 6) {
        setIsLoading(false);
        return { success: false, error: "Password must be at least 6 characters long." };
      }

      // Check demo or create patron session
      const patronId =
        cleanEmail === "patron@dheera.in"
          ? "00000000-0000-0000-0000-000000000001"
          : "patron_" + cleanEmail.replace(/[^a-z0-9]/g, "_");

      const patronName =
        cleanEmail === "patron@dheera.in"
          ? "Ananya Sharma"
          : cleanEmail.split("@")[0].charAt(0).toUpperCase() + cleanEmail.split("@")[0].slice(1);

      const patron: UserProfile = {
        id: patronId,
        email: cleanEmail,
        fullName: patronName,
        phone: cleanEmail === "patron@dheera.in" ? "9876543210" : undefined,
        role: "customer",
        createdAt: new Date().toISOString(),
      };

      setUser(patron);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(patron));
      setSessionCookie(patron);
      await syncGuestData(patron);

      setIsLoading(false);
      return { success: true };
    },
    [syncGuestData]
  );

  const register = useCallback(
    async (
      fullName: string,
      email: string,
      password: string,
      phone?: string
    ): Promise<{ success: boolean; error?: string; requiresEmailVerification?: boolean }> => {
      setIsLoading(true);
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = fullName.trim();

      if (!cleanName || !cleanEmail || !password) {
        setIsLoading(false);
        return { success: false, error: "Please fill in all mandatory fields." };
      }

      if (password.length < 6) {
        setIsLoading(false);
        return { success: false, error: "Password must be at least 6 characters long." };
      }

      if (phone && !/^[6-9]\d{9}$/.test(phone.trim())) {
        setIsLoading(false);
        return { success: false, error: "Please enter a valid 10-digit Indian mobile number." };
      }

      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                full_name: cleanName,
                phone: phone?.trim(),
              },
            },
          });

          if (error) {
            setIsLoading(false);
            return { success: false, error: error.message };
          }

          if (data.user) {
            const profile: UserProfile = {
              id: data.user.id,
              email: cleanEmail,
              fullName: cleanName,
              phone: phone?.trim(),
              role: "customer",
              createdAt: data.user.created_at,
            };

            setUser(profile);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
            setSessionCookie(profile);
            await syncGuestData(profile);
            setIsLoading(false);

            const requiresEmailVerification = !data.session;
            return { success: true, requiresEmailVerification };
          }
        } catch (err: any) {
          setIsLoading(false);
          return { success: false, error: err.message || "Registration failed." };
        }
      }

      // Offline / sandbox mode registration
      const newUserId = "patron_" + cleanEmail.replace(/[^a-z0-9]/g, "_");
      const profile: UserProfile = {
        id: newUserId,
        email: cleanEmail,
        fullName: cleanName,
        phone: phone?.trim(),
        role: "customer",
        createdAt: new Date().toISOString(),
      };

      setUser(profile);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
      setSessionCookie(profile);
      await syncGuestData(profile);

      setIsLoading(false);
      return { success: true, requiresEmailVerification: false };
    },
    [syncGuestData]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // Ignore
      }
    }
    setUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // Ignore
    }
    setSessionCookie(null);
    setIsLoading(false);
  }, []);

  const updateProfile = useCallback(
    async (fullName: string, phone?: string): Promise<{ success: boolean; error?: string }> => {
      if (!user) return { success: false, error: "Not authenticated" };

      try {
        const res = await fetch("/api/account/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, fullName, phone }),
        });

        if (!res.ok) {
          const data = await res.json();
          return { success: false, error: data.error || "Failed to update profile." };
        }

        const updated = await res.json();
        setUser(updated);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
        setSessionCookie(updated);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || "Network error occurred." };
      }
    },
    [user]
  );

  const changePassword = useCallback(
    async (currentPassword?: string, newPassword?: string): Promise<{ success: boolean; error?: string }> => {
      if (!newPassword || newPassword.length < 6) {
        return { success: false, error: "New password must be at least 6 characters long." };
      }

      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) {
            return { success: false, error: error.message };
          }
          return { success: true };
        } catch (err: any) {
          return { success: false, error: err.message || "Failed to update password." };
        }
      }

      // Offline mock confirmation
      return { success: true };
    },
    []
  );

  const requestPasswordReset = useCallback(
    async (email: string): Promise<{ success: boolean; error?: string }> => {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) {
        return { success: false, error: "Please enter your registered email address." };
      }

      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
            redirectTo: `${window.location.origin}/account/reset-password`,
          });
          if (error) {
            return { success: false, error: error.message };
          }
          return { success: true };
        } catch (err: any) {
          return { success: false, error: err.message || "Failed to send reset email." };
        }
      }

      // Offline mode simulation
      return { success: true };
    },
    []
  );

  const resetPassword = useCallback(
    async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
      if (!newPassword || newPassword.length < 6) {
        return { success: false, error: "Password must be at least 6 characters." };
      }

      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) {
            return { success: false, error: error.message };
          }
          return { success: true };
        } catch (err: any) {
          return { success: false, error: err.message || "Password reset failed." };
        }
      }

      return { success: true };
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        requestPasswordReset,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

