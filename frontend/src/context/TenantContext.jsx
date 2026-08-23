import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "lavanet_tenant_v1";
const TenantContext = createContext(null);

export const TenantProvider = ({ children }) => {
  const [tenantId, setTenantId] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "tenant-1";
    } catch {
      return "tenant-1";
    }
  });

  const setTenant = useCallback((id) => {
    const next = id || "tenant-1";
    localStorage.setItem(STORAGE_KEY, next);
    setTenantId(next);
  }, []);

  const value = { tenantId, setTenant };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export const useTenant = () => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used inside TenantProvider");
  return ctx;
};

export default TenantContext;
