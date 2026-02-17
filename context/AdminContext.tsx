"use client";

import React, { createContext, useContext, useLayoutEffect, useState } from "react";
import { ADMIN_USUARIO, ADMIN_CLAVE } from "@/lib/mockData";

const ADMIN_STORAGE = "pelis-series-admin-auth";

interface AdminState {
  isAdmin: boolean;
  isLoading: boolean;
}

interface AdminContextType extends AdminState {
  login: (usuario: string, clave: string) => boolean;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useLayoutEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(ADMIN_STORAGE) : null;
    setIsAdmin(stored === "1");
    setIsLoading(false);
  }, []);

  const login = (usuario: string, clave: string): boolean => {
    if (usuario === ADMIN_USUARIO && clave === ADMIN_CLAVE) {
      if (typeof window !== "undefined") {
        localStorage.setItem(ADMIN_STORAGE, "1");
      }
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ADMIN_STORAGE);
    }
    setIsAdmin(false);
  };

  return (
    <AdminContext.Provider
      value={{ isAdmin, isLoading, login, logout }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (ctx === undefined) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return ctx;
}
