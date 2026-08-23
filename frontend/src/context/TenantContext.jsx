import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "lavanet_tenant_v1";

const TenantContext = createContext(null);

export const TenantProvider = ({ children }) => {
  const [tenantId, setTenantId] = useState(() => {
    // Intentar obtener del localStorage o de la URL
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;

    // Intentar detectar de la URL (/tenant-id/...)
    const pathMatch = window.location.pathname.match(/^\/([^/]+)/);
    if (pathMatch && pathMatch[1] !== "login") {
      const detected = pathMatch[1];
      localStorage.setItem(STORAGE_KEY, detected);
      return detected;
    }

    // Default tenant para desarrollo
    const defaultTenant = "tenant-1";
    localStorage.setItem(STORAGE_KEY, defaultTenant);
    return defaultTenant;
  });

  // Efecto para sincronizar con URL cuando cambia el tenant
  useEffect(() => {
    // Actualizar URL sin recargar (solo si no es login)
    if (!window.location.pathname.startsWith("/login")) {
      const tenantPath = `/${tenantId}`;
      if (window.location.pathname !== tenantPath) {
        const newUrl = window.location.pathname.replace(/^\//, "") === ""
          ? tenantPath
          : `/${tenantId}` + window.location.pathname;
        window.history.pushState({ tenantId }, "", newUrl);
      }
    }
  }, [tenantId]);

  const setTenant = useCallback((id) => {
    localStorage.setItem(STORAGE_KEY, id);
    setTenantId(id);
  }, []);

  const getTenantData = useCallback((data) => {
    // Filtrar todos los datos por tenant_id si existe
    if (!tenantId) return data;
    
    const filtered = { ...data };
    
    // Filtrar users - solo activados y del tenant
    if (filtered.users) {
      filtered.users = filtered.users.filter(u => u.active && u.tenantId === tenantId);
    }
    
    // Filtrar customers
    if (filtered.customers) {
      filtered.customers = filtered.customers.filter(c => c.tenantId === tenantId);
    }
    
    // Filtrar orders
    if (filtered.orders) {
      filtered.orders = filtered.orders.filter(o => o.tenantId === tenantId);
    }
    
    // Filtrar services (compartidos entre tenants o también filtrar)
    if (filtered.services) {
      filtered.services = filtered.services.filter(s => s.active);
    }
    
    // Filtrar products
    if (filtered.products) {
      filtered.products = filtered.products.filter(p => p.active);
    }
    
    // Filtrar config
    if (filtered.config) {
      filtered.config = { ...filtered.config };
      // Mantener config global pero tenant-specific si es necesario
    }
    
    // Filtrar notifications
    if (filtered.notifications) {
      filtered.notifications = filtered.notifications.filter(n => n.tenantId === tenantId || !n.tenantId);
    }
    
    // Filtrar cash
    if (filtered.cash) {
      // Cash es shared, no filtrar
    }
    
    // Filtrar coupons
    if (filtered.coupons) {
      filtered.coupons = filtered.coupons.filter(c => c.tenantId === tenantId || !c.tenantId);
    }
    
    return filtered;
  }, [tenantId]);

  const value = {
    tenantId, setTenant, getTenantData,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export const useTenant = () => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used inside TenantProvider");
  return ctx;
};

export default TenantContext;