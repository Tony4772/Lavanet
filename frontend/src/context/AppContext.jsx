import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { initialData, emptyBusinessBundle } from "../lib/seed";
import { useTenant } from "./TenantContext";
import { api, hasApiBackend, setAuthToken } from "../lib/api";
import { roleFromApi } from "../lib/userRoles";

const STORAGE_KEY = "lavanet_data_v1";
const AUTH_KEY = "lavanet_auth_v1";
const DATA_VERSION_KEY = "lavanet_data_version";
const DATA_VERSION = "3";

const AppContext = createContext(null);

const stripPassword = (user) => {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
};

const sameTenant = (row, tenantId) => {
  if (!tenantId) return false;
  return row?.tenantId === tenantId;
};

const filterStore = (store, tenantId) => {
  const config =
    (store.tenantConfigs && store.tenantConfigs[tenantId]) ||
    (store.config?.business?.tenantId === tenantId ? store.config : null) ||
    store.config;

  const cash =
    (store.cashByTenant && store.cashByTenant[tenantId]) ||
    (store.cash && sameTenant(store.cash, tenantId) ? store.cash : null) || {
      isOpen: false,
      openedAt: null,
      openingBalance: 0,
      closedAt: null,
      closingBalance: 0,
      movements: [],
      tenantId,
    };

  const business = (store.businesses || []).find((b) => b.id === tenantId) || null;

  return {
    ...store,
    business,
    config,
    cash,
    users: (store.users || []).filter((u) => sameTenant(u, tenantId)),
    customers: (store.customers || []).filter((c) => sameTenant(c, tenantId)),
    orders: (store.orders || []).filter((o) => sameTenant(o, tenantId)),
    services: (store.services || []).filter((s) => sameTenant(s, tenantId)),
    products: (store.products || []).filter((p) => sameTenant(p, tenantId)),
    notifications: (store.notifications || []).filter((n) => sameTenant(n, tenantId)),
    coupons: (store.coupons || []).filter((c) => sameTenant(c, tenantId)),
  };
};

const loadInitialStore = () => {
  try {
    const version = localStorage.getItem(DATA_VERSION_KEY);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && version === DATA_VERSION) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  const seed = initialData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  localStorage.setItem(DATA_VERSION_KEY, DATA_VERSION);
  return seed;
};

export const AppProvider = ({ children }) => {
  const { tenantId, setTenant } = useTenant();
  const [store, setStore] = useState(loadInitialStore);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      return raw ? stripPassword(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    localStorage.setItem(DATA_VERSION_KEY, DATA_VERSION);
  }, [store]);

  useEffect(() => {
    if (currentUser) localStorage.setItem(AUTH_KEY, JSON.stringify(stripPassword(currentUser)));
    else {
      localStorage.removeItem(AUTH_KEY);
      setAuthToken(null);
    }
  }, [currentUser]);

  const data = useMemo(() => filterStore(store, tenantId), [store, tenantId]);

  const assignTenantToSeed = useCallback((seedData, id) => {
    const tag = (rows) => (rows || []).map((r) => ({ ...r, tenantId: id }));
    return {
      ...seedData,
      users: tag(seedData.users),
      customers: tag(seedData.customers),
      orders: tag(seedData.orders),
      services: tag(seedData.services),
      products: tag(seedData.products),
      notifications: tag(seedData.notifications),
      coupons: tag(seedData.coupons),
      cash: { ...seedData.cash, tenantId: id },
      config: {
        ...seedData.config,
        business: { ...seedData.config?.business, tenantId: id },
      },
    };
  }, []);

  const mapApiUser = (user) =>
    stripPassword({
      id: user._id || user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: roleFromApi(user.role),
      rawRole: user.role,
      tenantId: user.tenant ? String(user.tenant) : null,
      active: user.isActive !== false,
      lastAccess: user.lastLogin || null,
      isJWT: true,
      isDemo: Boolean(user.isDemo),
    });

  const applySession = useCallback(
    (res) => {
      const user = res?.data?.user;
      const tenant = res?.data?.tenant;
      if (res?.token) setAuthToken(res.token);
      if (user?.tenant) setTenant(String(user.tenant));
      const mapped = mapApiUser(user);
      if (tenant) {
        mapped.billing = tenant.billing;
        mapped.subscriptionBlocked = !!tenant.subscriptionBlocked;
        mapped.isDemoTenant = !!tenant.isDemo;
        mapped.tenantName = tenant.name;
      }
      setCurrentUser(mapped);
      return mapped;
    },
    [setTenant]
  );

  const updateSubscriptionState = useCallback(({ billing, subscriptionBlocked }) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        billing: billing ?? prev.billing,
        subscriptionBlocked:
          subscriptionBlocked !== undefined ? subscriptionBlocked : prev.subscriptionBlocked,
      };
    });
  }, []);

  const login = useCallback(
    async (username, password) => {
      if (hasApiBackend()) {
        try {
          const { data: res } = await api.post("/api/auth/login", { username, password });
          const mapped = applySession(res);
          return {
            ok: true,
            superadmin: mapped.rawRole === "superadmin",
            subscriptionBlocked: !!mapped.subscriptionBlocked,
          };
        } catch (err) {
          if (err?.response) {
            return { ok: false, error: err.response.data?.message || "Credenciales inválidas" };
          }
        }
      }

      const attemptsKey = "lavanet_login_attempts";
      let attempts = parseInt(localStorage.getItem(attemptsKey) || "0", 10);
      if (attempts >= 5) {
        const firstFail = localStorage.getItem("lavanet_first_fail_time");
        if (firstFail && Date.now() - new Date(firstFail).getTime() < 60000) {
          return { ok: false, error: "Demasiados intentos fallidos. Inténtalo de nuevo en 1 minuto" };
        }
        attempts = 0;
      }

      const user = store.users.find(
        (u) => u.username === username && u.password === password && u.active
      );

      if (user) {
        localStorage.removeItem(attemptsKey);
        localStorage.removeItem("lavanet_first_fail_time");
        if (user.tenantId) setTenant(user.tenantId);
        const updated = { ...user, lastAccess: new Date().toISOString() };
        setStore((prev) => ({
          ...prev,
          users: prev.users.map((u) => (u.id === user.id ? updated : u)),
        }));
        setCurrentUser(stripPassword(updated));
        return { ok: true };
      }

      attempts += 1;
      localStorage.setItem(attemptsKey, String(attempts));
      if (attempts === 1) localStorage.setItem("lavanet_first_fail_time", new Date().toISOString());
      return { ok: false, error: "Usuario o contraseña inválidos" };
    },
    [store.users, setTenant, applySession]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    setAuthToken(null);
  }, []);

  const registerAccount = useCallback(
    async ({ businessName, name, username, email, password }) => {
      const biz = String(businessName || "").trim();
      const uname = String(username || "").trim().toLowerCase();
      if (!biz || !name?.trim() || !uname || !password) {
        return { ok: false, error: "Completa todos los campos obligatorios" };
      }
      if (password.length < 8) {
        return { ok: false, error: "La contraseña debe tener al menos 8 caracteres" };
      }
      if (store.users.some((u) => u.username === uname)) {
        return { ok: false, error: "Ese nombre de usuario ya está en uso" };
      }
      if (email && store.users.some((u) => u.email === email.trim().toLowerCase())) {
        return { ok: false, error: "Ese email ya está registrado" };
      }

      if (hasApiBackend()) {
        try {
          const { data: res } = await api.post("/api/auth/register", {
            tenantName: biz,
            name: name.trim(),
            username: uname,
            email: (email || `${uname}@lavanet.local`).trim().toLowerCase(),
            password,
          });
          const user = res?.data?.user;
          if (res?.token) setAuthToken(res.token);
          if (user?.tenant) setTenant(String(user.tenant));
          setCurrentUser(
            stripPassword({
              id: user._id || user.id,
              name: user.name,
              username: user.username,
              email: user.email,
              role: "Administrador",
              tenantId: String(user.tenant),
              active: true,
              isJWT: true,
            })
          );
          return { ok: true };
        } catch (err) {
          if (err?.response) {
            return { ok: false, error: err.response.data?.message || "No se pudo registrar" };
          }
        }
      }

      const tenantIdNew = `biz_${Date.now()}`;
      const bundle = emptyBusinessBundle(tenantIdNew, biz);
      const admin = {
        id: `u_${Date.now()}`,
        name: name.trim(),
        username: uname,
        password,
        email: (email || `${uname}@lavanet.local`).trim().toLowerCase(),
        role: "Administrador",
        active: true,
        lastAccess: new Date().toISOString(),
        tenantId: tenantIdNew,
      };

      setStore((prev) => ({
        ...prev,
        businesses: [...(prev.businesses || []), bundle.business],
        tenantConfigs: {
          ...(prev.tenantConfigs || {}),
          [tenantIdNew]: bundle.config,
        },
        cashByTenant: {
          ...(prev.cashByTenant || {}),
          [tenantIdNew]: bundle.cash,
        },
        users: [...(prev.users || []), admin],
        services: [...(prev.services || []), ...bundle.services],
        products: [...(prev.products || []), ...bundle.products],
        notifications: [...bundle.notifications, ...(prev.notifications || [])],
      }));
      setTenant(tenantIdNew);
      setCurrentUser(stripPassword(admin));
      return { ok: true };
    },
    [store.users, setTenant]
  );

  const resetDemo = useCallback(() => {
    const seeded = assignTenantToSeed(initialData(), tenantId || "tenant-1");
    setStore(seeded);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  }, [tenantId, assignTenantToSeed]);

  const updateCollection = useCallback((key, updater) => {
    setStore((prev) => ({
      ...prev,
      [key]: typeof updater === "function" ? updater(prev[key]) : updater,
    }));
  }, []);

  const addNotification = useCallback(
    (notif) => {
      setStore((prev) => ({
        ...prev,
        notifications: [
          { id: `n${Date.now()}`, at: new Date().toISOString(), read: false, tenantId, ...notif },
          ...prev.notifications,
        ].slice(0, 30),
      }));
    },
    [tenantId]
  );

  const markNotificationsRead = useCallback(() => {
    setStore((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        sameTenant(n, tenantId) ? { ...n, read: true } : n
      ),
    }));
  }, [tenantId]);

  const createOrder = useCallback(
    (order) => {
      const num = `ORD-${1000 + store.orders.length + 1}`;
      const newOrder = {
        id: `o${Date.now()}`,
        number: num,
        ...order,
        createdAt: new Date().toISOString(),
        tenantId,
        timeline: [
          { status: "Recibida", at: new Date().toISOString(), by: currentUser?.name || "Sistema" },
        ],
      };
      const pointsRedeemed = Number(order.pointsRedeemed || 0);
      const pointsEarned = Math.floor(
        (order.total || 0) * (store.config?.loyalty?.pointsPerSol ?? 1)
      );
      setStore((prev) => ({
        ...prev,
        orders: [newOrder, ...prev.orders],
        customers: prev.customers.map((c) =>
          c.id === order.customerId
            ? {
                ...c,
                pointsBalance: Math.max(
                  0,
                  (c.pointsBalance || 0) - pointsRedeemed + pointsEarned
                ),
              }
            : c
        ),
      }));
      addNotification({ title: `Nueva venta registrada ${num}`, type: "success" });
      return newOrder;
    },
    [store.orders.length, store.config, currentUser, addNotification, tenantId]
  );

  const updateOrderStatus = useCallback(
    (orderId, newStatus) => {
      setStore((prev) => ({
        ...prev,
        orders: prev.orders.map((o) =>
          o.id === orderId && sameTenant(o, tenantId)
            ? {
                ...o,
                status: newStatus,
                timeline: [
                  ...o.timeline,
                  {
                    status: newStatus,
                    at: new Date().toISOString(),
                    by: currentUser?.name || "Sistema",
                  },
                ],
              }
            : o
        ),
      }));
      if (newStatus === "Lista para entregar") {
        addNotification({
          title: "Orden lista para entregar — Notifica al cliente por WhatsApp",
          type: "info",
        });
      }
    },
    [currentUser, addNotification, tenantId]
  );

  const updateOrder = useCallback(
    (orderId, updates) => {
      setStore((prev) => ({
        ...prev,
        orders: prev.orders.map((o) =>
          o.id === orderId && sameTenant(o, tenantId) ? { ...o, ...updates } : o
        ),
      }));
    },
    [tenantId]
  );

  const createCoupon = useCallback(
    (customerId, pointsCost, valuePEN) => {
      const customer = store.customers.find(
        (c) => c.id === customerId && sameTenant(c, tenantId)
      );
      if (!customer || (customer.pointsBalance || 0) < pointsCost) return null;
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
      setStore((prev) => ({
        ...prev,
        coupons: [coupon, ...(prev.coupons || [])],
        customers: prev.customers.map((c) =>
          c.id === customerId
            ? { ...c, pointsBalance: (c.pointsBalance || 0) - pointsCost }
            : c
        ),
      }));
      return coupon;
    },
    [store.customers, tenantId]
  );

  const redeemCoupon = useCallback(
    (code, orderNumber) => {
      setStore((prev) => ({
        ...prev,
        coupons: (prev.coupons || []).map((c) =>
          c.code === code && sameTenant(c, tenantId)
            ? {
                ...c,
                used: true,
                usedAt: new Date().toISOString(),
                usedOrder: orderNumber,
              }
            : c
        ),
      }));
    },
    [tenantId]
  );

  const findCoupon = useCallback(
    (code) =>
      (store.coupons || []).find(
        (c) =>
          sameTenant(c, tenantId) &&
          c.code === (code || "").trim().toUpperCase() &&
          !c.used &&
          new Date(c.expiresAt) > new Date()
      ),
    [store.coupons, tenantId]
  );

  const openCash = useCallback(
    (openingBalance) => {
      setStore((prev) => {
        const nextCash = {
          isOpen: true,
          openedAt: new Date().toISOString(),
          openingBalance,
          movements: [],
          closedAt: null,
          closingBalance: 0,
          tenantId,
        };
        return {
          ...prev,
          cash: nextCash,
          cashByTenant: { ...(prev.cashByTenant || {}), [tenantId]: nextCash },
        };
      });
    },
    [tenantId]
  );

  const addCashMovement = useCallback(
    (mov) => {
      setStore((prev) => {
        const current =
          (prev.cashByTenant && prev.cashByTenant[tenantId]) || prev.cash || {
            movements: [],
            tenantId,
          };
        const nextCash = {
          ...current,
          tenantId,
          movements: [
            { id: `m${Date.now()}`, at: new Date().toISOString(), ...mov },
            ...(current.movements || []),
          ],
        };
        return {
          ...prev,
          cash: nextCash,
          cashByTenant: { ...(prev.cashByTenant || {}), [tenantId]: nextCash },
        };
      });
    },
    [tenantId]
  );

  const closeCash = useCallback(() => {
    setStore((prev) => {
      const current =
        (prev.cashByTenant && prev.cashByTenant[tenantId]) || prev.cash || {
          openingBalance: 0,
          movements: [],
        };
      const closing =
        (current.openingBalance || 0) +
        (current.movements || [])
          .filter((m) => m.type === "ingreso")
          .reduce((s, m) => s + m.amount, 0) -
        (current.movements || [])
          .filter((m) => m.type === "gasto")
          .reduce((s, m) => s + m.amount, 0);
      const nextCash = {
        ...current,
        tenantId,
        isOpen: false,
        closedAt: new Date().toISOString(),
        closingBalance: closing,
      };
      return {
        ...prev,
        cash: nextCash,
        cashByTenant: { ...(prev.cashByTenant || {}), [tenantId]: nextCash },
      };
    });
    addNotification({ title: "Se realizó el cierre de caja", type: "success" });
  }, [addNotification, tenantId]);

  const value = {
    data,
    setData: setStore,
    updateCollection,
    currentUser,
    login,
    logout,
    applySession,
    updateSubscriptionState,
    registerAccount,
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
  const date = d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
  const msg = `Hola ${customer.name.split(" ")[0]}, tu orden *${order.number}* de ${biz} está *lista para entregar*\n\nTotal: ${total}\nRetiro sugerido: ${eta}\n¡Te esperamos!`;
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
  const msg = `Hola ${customer.name.split(" ")[0]}, actualizamos la fecha de entrega de tu orden *${order.number}* en ${biz}.\n\nNueva fecha: *${eta}*`;
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
  const msg = `Hola ${customer.name.split(" ")[0]}, en ${biz} canjeaste ${coupon.pointsCost} puntos.\n\nCódigo: *${coupon.code}*\nValor: *${symbol} ${Number(coupon.valuePEN).toFixed(2)}*\nVálido hasta: ${expires}`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(msg)}`;
};

export const ROUTE_ROLES = {
  "/": ["Administrador", "Cajero", "Recepción", "Operador", "admin", "cajero", "recepcion", "operador"],
  "/pos": ["Administrador", "Cajero", "Recepción", "admin", "cajero", "recepcion"],
  "/ordenes": ["Administrador", "Cajero", "Recepción", "Operador", "admin", "cajero", "recepcion", "operador"],
  "/clientes": ["Administrador", "Cajero", "Recepción", "admin", "cajero", "recepcion"],
  "/servicios": ["Administrador", "Cajero", "admin", "cajero"],
  "/productos": ["Administrador", "Cajero", "admin", "cajero"],
  "/inventario": ["Administrador", "Cajero", "Operador", "admin", "cajero", "operador"],
  "/entregas": ["Administrador", "Cajero", "Recepción", "Operador", "admin", "cajero", "recepcion", "operador"],
  "/turno": ["Administrador", "Cajero", "Recepción", "Operador", "admin", "cajero", "recepcion", "operador"],
  "/caja": ["Administrador", "Cajero", "admin", "cajero"],
  "/reportes": ["Administrador", "admin"],
  "/usuarios": ["Administrador", "admin"],
  "/configuracion": ["Administrador", "admin"],
};

export const canAccess = (role, path) => {
  if (role === "Superadmin" || role === "superadmin") {
    return path === "/superadmin" || path.startsWith("/superadmin");
  }
  if (path.startsWith("/superadmin")) return false;
  const allowed = ROUTE_ROLES[path];
  if (!allowed) return true;
  return allowed.includes(role);
};
