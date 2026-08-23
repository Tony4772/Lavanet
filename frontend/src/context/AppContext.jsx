import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { initialData } from "../lib/seed";
import { useTenant } from "./TenantContext";

const STORAGE_KEY = "lavanet_data_v1";
const AUTH_KEY = "lavanet_auth_v1";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { tenantId } = useTenant();

  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    const seed = initialData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (currentUser) localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser));
    else localStorage.removeItem(AUTH_KEY);
  }, [currentUser]);

  const assignTenantToSeed = useCallback((seedData, id) => {
    const result = { ...seedData };
    if (result.users) result.users = result.users.map((u) => ({ ...u, tenantId: id }));
    if (result.customers) result.customers = result.customers.map((c) => ({ ...c, tenantId: id }));
    if (result.orders) result.orders = result.orders.map((o) => ({ ...o, tenantId: id }));
    if (result.services) result.services = result.services.map((s) => ({ ...s, tenantId: id }));
    if (result.products) result.products = result.products.map((p) => ({ ...p, tenantId: id }));
    if (result.config?.business) {
      result.config = {
        ...result.config,
        business: { ...result.config.business, tenantId: id },
      };
    }
    if (result.notifications) {
      result.notifications = result.notifications.map((n) => ({ ...n, tenantId: id }));
    }
    if (result.cash) result.cash = { ...result.cash, tenantId: id };
    if (result.coupons) result.coupons = result.coupons.map((c) => ({ ...c, tenantId: id }));
    return result;
  }, []);

  const login = useCallback((username, password) => {
    const attemptsKey = "lavanet_login_attempts";
    let attempts = parseInt(localStorage.getItem(attemptsKey) || "0", 10);

    if (attempts >= 5) {
      const firstFail = localStorage.getItem("lavanet_first_fail_time");
      if (firstFail) {
        const firstFailDate = new Date(firstFail);
        const now = new Date();
        if (now.getTime() - firstFailDate.getTime() < 60000) {
          return { ok: false, error: "Demasiados intentos fallidos. Inténtalo de nuevo en 1 minuto" };
        }
      }
      attempts = 0;
    }

    const user = data.users.find(
      (u) =>
        u.username === username &&
        u.password === password &&
        u.active &&
        (!tenantId || !u.tenantId || u.tenantId === tenantId)
    );

    if (user) {
      localStorage.removeItem(attemptsKey);
      localStorage.removeItem("lavanet_first_fail_time");
      const updated = { ...user, lastAccess: new Date().toISOString() };
      setData((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === user.id ? updated : u)),
      }));
      setCurrentUser(updated);
      return { ok: true };
    }

    attempts += 1;
    localStorage.setItem(attemptsKey, attempts.toString());
    if (attempts === 1) {
      localStorage.setItem("lavanet_first_fail_time", new Date().toISOString());
    }
    return { ok: false, error: "Usuario o contraseña inválidos" };
  }, [data.users, tenantId]);

  const logout = useCallback(() => setCurrentUser(null), []);

  const resetDemo = useCallback(() => {
    const seed = initialData();
    const seededData = assignTenantToSeed(seed, tenantId || "tenant-1");
    setData(seededData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seededData));
  }, [tenantId, assignTenantToSeed]);

  const updateCollection = useCallback((key, updater) => {
    setData((prev) => ({
      ...prev,
      [key]: typeof updater === "function" ? updater(prev[key]) : updater,
    }));
  }, []);

  const addNotification = useCallback((notif) => {
    setData((prev) => ({
      ...prev,
      notifications: [
        { id: `n${Date.now()}`, at: new Date().toISOString(), read: false, tenantId, ...notif },
        ...prev.notifications,
      ].slice(0, 30),
    }));
  }, [tenantId]);

  const markNotificationsRead = useCallback(() => {
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  }, []);

  useEffect(() => {
    setData((prev) => {
      const needs = prev.customers.some((c) => c.pointsBalance === undefined);
      if (!needs) return prev;
      const cfgRate = prev.config?.loyalty?.pointsPerSol ?? 1;
      return {
        ...prev,
        customers: prev.customers.map((c) => {
          if (c.pointsBalance !== undefined) return c;
          const earned = prev.orders
            .filter((o) => o.customerId === c.id && (!tenantId || o.tenantId === tenantId || !o.tenantId))
            .reduce((s, o) => s + Math.floor(o.total * cfgRate), 0);
          return { ...c, pointsBalance: earned };
        }),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.orders, data.customers, data.config, tenantId]);

  const createOrder = useCallback((order) => {
    const num = `ORD-${1000 + data.orders.length + 1}`;
    const newOrder = {
      id: `o${Date.now()}`,
      number: num,
      ...order,
      createdAt: new Date().toISOString(),
      tenantId,
      timeline: [{ status: "Recibida", at: new Date().toISOString(), by: currentUser?.name || "Sistema" }],
    };
    const pointsRedeemed = Number(order.pointsRedeemed || 0);
    const pointsEarned = Math.floor((order.total || 0) * (data.config?.loyalty?.pointsPerSol ?? 1));
    setData((prev) => ({
      ...prev,
      orders: [newOrder, ...prev.orders],
      customers: prev.customers.map((c) =>
        c.id === order.customerId
          ? { ...c, pointsBalance: Math.max(0, (c.pointsBalance || 0) - pointsRedeemed + pointsEarned) }
          : c
      ),
    }));
    addNotification({ title: `Nueva venta registrada ${num}`, type: "success" });
    return newOrder;
  }, [data.orders.length, data.config, currentUser, addNotification, tenantId]);

  const updateOrderStatus = useCallback((orderId, newStatus) => {
    setData((prev) => ({
      ...prev,
      orders: prev.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: newStatus,
              tenantId,
              timeline: [...o.timeline, { status: newStatus, at: new Date().toISOString(), by: currentUser?.name || "Sistema" }],
            }
          : o
      ),
    }));
    if (newStatus === "Lista para entregar") {
      addNotification({ title: "Orden lista para entregar — Notifica al cliente por WhatsApp", type: "info" });
    }
  }, [currentUser, addNotification, tenantId]);

  const updateOrder = useCallback((orderId, updates) => {
    setData((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.id === orderId ? { ...o, ...updates, tenantId } : o)),
    }));
  }, [tenantId]);

  const createCoupon = useCallback((customerId, pointsCost, valuePEN) => {
    const customer = data.customers.find((c) => c.id === customerId);
    if (!customer) return null;
    if ((customer.pointsBalance || 0) < pointsCost) return null;
    const code = `LVN-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const expires = new Date();
    expires.setDate(expires.getDate() + 90);
    const coupon = {
      id: `cp${Date.now()}`,
      code,
      customerId,
      customerName: customer.name,
      valuePEN,
      pointsCost,
      createdAt: new Date().toISOString(),
      expiresAt: expires.toISOString(),
      used: false,
      tenantId,
    };
    setData((prev) => ({
      ...prev,
      coupons: [coupon, ...(prev.coupons || [])],
      customers: prev.customers.map((c) =>
        c.id === customerId ? { ...c, pointsBalance: (c.pointsBalance || 0) - pointsCost } : c
      ),
    }));
    return coupon;
  }, [data.customers, tenantId]);

  const redeemCoupon = useCallback((code, orderNumber) => {
    setData((prev) => ({
      ...prev,
      coupons: (prev.coupons || []).map((c) =>
        c.code === code
          ? { ...c, used: true, usedAt: new Date().toISOString(), usedOrder: orderNumber, tenantId }
          : c
      ),
    }));
  }, [tenantId]);

  const findCoupon = useCallback(
    (code) =>
      (data.coupons || []).find(
        (c) => c.code === (code || "").trim().toUpperCase() && !c.used && new Date(c.expiresAt) > new Date()
      ),
    [data.coupons]
  );

  const openCash = useCallback((openingBalance) => {
    setData((prev) => ({
      ...prev,
      cash: {
        ...prev.cash,
        isOpen: true,
        openedAt: new Date().toISOString(),
        openingBalance,
        movements: [],
        closedAt: null,
        closingBalance: 0,
        tenantId,
      },
    }));
  }, [tenantId]);

  const addCashMovement = useCallback((mov) => {
    setData((prev) => ({
      ...prev,
      cash: {
        ...prev.cash,
        movements: [{ id: `m${Date.now()}`, at: new Date().toISOString(), ...mov }, ...prev.cash.movements],
      },
    }));
  }, []);

  const closeCash = useCallback(() => {
    setData((prev) => {
      const closing =
        prev.cash.openingBalance +
        prev.cash.movements.filter((m) => m.type === "ingreso").reduce((s, m) => s + m.amount, 0) -
        prev.cash.movements.filter((m) => m.type === "gasto").reduce((s, m) => s + m.amount, 0);
      return {
        ...prev,
        cash: { ...prev.cash, isOpen: false, closedAt: new Date().toISOString(), closingBalance: closing },
      };
    });
    addNotification({ title: "Se realizó el cierre de caja", type: "success" });
  }, [addNotification]);

  const value = {
    data,
    setData,
    updateCollection,
    currentUser,
    login,
    logout,
    resetDemo,
    createOrder,
    updateOrderStatus,
    updateOrder,
    createCoupon,
    redeemCoupon,
    findCoupon,
    openCash,
    addCashMovement,
    closeCash,
    addNotification,
    markNotificationsRead,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
};

export const fmtMoney = (n, symbol = "S/") => `${symbol} ${Number(n || 0).toFixed(2)}`;

export const fmtDate = (iso, withTime = false) => {
  if (!iso) return "-";
  const d = new Date(iso);
  const date = d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
  if (!withTime) return date;
  const time = d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  return `${date} ${time}`;
};

export const buildWhatsAppLink = (customer, order, config) => {
  if (!customer?.phone) return null;
  const digits = String(customer.phone).replace(/\D/g, "");
  const intl = digits.startsWith("51") ? digits : `51${digits}`;
  const symbol = config?.business?.currencySymbol || "S/";
  const biz = config?.business?.name || "LAVANET";
  const eta = order.promisedAt
    ? new Date(order.promisedAt).toLocaleString("es-PE", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const total = `${symbol} ${Number(order.total || 0).toFixed(2)}`;
  const msg = `Hola ${customer.name.split(" ")[0]}, tu orden *${order.number}* de ${biz} está *lista para entregar* 🎉\n\nTotal: ${total}\nRetiro sugerido: ${eta}\n¡Te esperamos!`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(msg)}`;
};

export const buildRescheduleLink = (customer, order, config) => {
  if (!customer?.phone) return null;
  const digits = String(customer.phone).replace(/\D/g, "");
  const intl = digits.startsWith("51") ? digits : `51${digits}`;
  const biz = config?.business?.name || "LAVANET";
  const eta = order.promisedAt
    ? new Date(order.promisedAt).toLocaleString("es-PE", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const msg = `Hola ${customer.name.split(" ")[0]}, actualizamos la fecha de entrega de tu orden *${order.number}* en ${biz}.\n\n📅 Nueva fecha: *${eta}*\nDisculpa las molestias y gracias por tu comprensión.`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(msg)}`;
};

export const buildCouponLink = (customer, coupon, config) => {
  if (!customer?.phone) return null;
  const digits = String(customer.phone).replace(/\D/g, "");
  const intl = digits.startsWith("51") ? digits : `51${digits}`;
  const symbol = config?.business?.currencySymbol || "S/";
  const biz = config?.business?.name || "LAVANET";
  const expires = new Date(coupon.expiresAt).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const msg = `Hola ${customer.name.split(" ")[0]}, en ${biz} canjeaste ${coupon.pointsCost} puntos por un cupón de descuento 🎁\n\n🎫 Código: *${coupon.code}*\n💰 Valor: *${symbol} ${Number(coupon.valuePEN).toFixed(2)}*\n📆 Válido hasta: ${expires}\nMuéstralo en tu próxima visita.`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(msg)}`;
};
