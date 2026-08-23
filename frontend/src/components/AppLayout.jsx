import React, { useState, useMemo } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart, ClipboardList, Users, Sparkles, Package,
  Warehouse, Truck, Wallet, BarChart3, UserCog, Settings, Bell, Search,
  LogOut, Menu, X, ChevronDown, Waves, Workflow,
} from "lucide-react";
import { useApp, fmtDate, canAccess } from "../context/AppContext";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, testId: "nav-dashboard" },
  { to: "/pos", label: "Punto de Venta", icon: ShoppingCart, testId: "nav-pos" },
  { to: "/ordenes", label: "Órdenes", icon: ClipboardList, testId: "nav-ordenes" },
  { to: "/clientes", label: "Clientes", icon: Users, testId: "nav-clientes" },
  { to: "/servicios", label: "Servicios", icon: Sparkles, testId: "nav-servicios" },
  { to: "/productos", label: "Productos", icon: Package, testId: "nav-productos" },
  { to: "/inventario", label: "Inventario", icon: Warehouse, testId: "nav-inventario" },
  { to: "/entregas", label: "Entregas", icon: Truck, testId: "nav-entregas" },
  { to: "/turno", label: "Modo Turno", icon: Workflow, testId: "nav-turno" },
  { to: "/caja", label: "Caja", icon: Wallet, testId: "nav-caja" },
  { to: "/reportes", label: "Reportes", icon: BarChart3, testId: "nav-reportes" },
  { to: "/usuarios", label: "Usuarios", icon: UserCog, testId: "nav-usuarios" },
  { to: "/configuracion", label: "Configuración", icon: Settings, testId: "nav-configuracion" },
];

export default function AppLayout() {
  const { currentUser, logout, data, markNotificationsRead } = useApp();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState("");

  const unread = data.notifications.filter((n) => !n.read).length;
  const businessName = data.business?.name || data.config?.business?.name || "LAVANET";

  const visibleNav = useMemo(
    () => NAV.filter((item) => canAccess(currentUser?.role, item.to)),
    [currentUser?.role]
  );

  const searchResults = useMemo(() => {
    if (!q.trim()) return [];
    const term = q.toLowerCase();
    const results = [];
    data.orders
      .filter(
        (o) =>
          o.number?.toLowerCase().includes(term) ||
          o.customerName?.toLowerCase().includes(term)
      )
      .slice(0, 5)
      .forEach((o) =>
        results.push({
          type: "Orden",
          label: `${o.number} — ${o.customerName}`,
          to: "/ordenes",
        })
      );
    data.customers
      .filter(
        (c) =>
          c.name?.toLowerCase().includes(term) ||
          String(c.phone || "").includes(term)
      )
      .slice(0, 5)
      .forEach((c) => results.push({ type: "Cliente", label: c.name, to: "/clientes" }));
    data.services
      .filter((s) => s.name?.toLowerCase().includes(term))
      .slice(0, 5)
      .forEach((s) => results.push({ type: "Servicio", label: s.name, to: "/servicios" }));
    return results;
  }, [q, data]);

  const SidebarContent = () => (
    <>
      <div className="px-6 pt-6 pb-8">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Waves className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-white font-heading font-extrabold text-lg leading-none tracking-tight">
              LAVANET
            </div>
            <div className="text-slate-400 text-[10px] uppercase tracking-widest mt-1 truncate max-w-[160px]">
              {businessName}
            </div>
          </div>
        </div>
      </div>
      <nav className="px-3 flex-1 overflow-y-auto pb-4">
        {visibleNav.map(({ to, label, icon: Icon, testId }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            data-testid={testId}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`
            }
          >
            <Icon className="w-4 h-4" strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
            {(currentUser?.name || "U")
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">
              {currentUser?.name || "Usuario"}
            </div>
            <div className="text-slate-400 text-xs truncate">{currentUser?.role}</div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-slate-900 flex-col z-40">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 w-64 bg-slate-900 flex flex-col z-50">
            <button
              data-testid="sidebar-close"
              className="absolute top-4 right-4 text-slate-400"
              onClick={() => setMobileOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </>
      )}

      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 flex items-center px-4 lg:px-8 gap-4">
          <button
            className="lg:hidden"
            data-testid="sidebar-open"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>

          <Popover open={q.trim().length > 0} onOpenChange={(o) => !o && setQ("")}>
            <PopoverTrigger asChild>
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  data-testid="global-search"
                  placeholder="Buscar órdenes, clientes, servicios..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-9 h-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500"
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="start">
              {searchResults.length === 0 ? (
                <div className="p-4 text-sm text-slate-500">Sin resultados</div>
              ) : (
                <div className="py-2">
                  {searchResults.map((r, i) => (
                    <button
                      key={`${r.type}-${r.label}-${i}`}
                      data-testid={`search-result-${i}`}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-sm"
                      onClick={() => {
                        navigate(r.to);
                        setQ("");
                      }}
                    >
                      <span className="text-slate-700 dark:text-slate-200">{r.label}</span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400">
                        {r.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>

          <div className="ml-auto flex items-center gap-2">
            {canAccess(currentUser?.role, "/pos") && (
              <Button
                data-testid="topbar-new-order"
                onClick={() => navigate("/pos")}
                className="hidden md:inline-flex bg-blue-600 hover:bg-blue-700 gap-2 h-10"
              >
                <ShoppingCart className="w-4 h-4" /> Nueva Venta
              </Button>
            )}

            <ThemeToggle />

            <Popover onOpenChange={(o) => o && markNotificationsRead()}>
              <PopoverTrigger asChild>
                <button
                  data-testid="notifications-btn"
                  className="relative p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  <Bell className="w-5 h-5" />
                  {unread > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="text-sm font-semibold">Notificaciones</div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {data.notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className="px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <div className="text-sm text-slate-700">{n.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {fmtDate(n.at, true)}
                      </div>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <div className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 max-w-[140px] truncate" title={businessName}>
              {businessName}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  data-testid="profile-menu"
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                    {(currentUser?.name || "U")
                      .split(" ")
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-500 hidden md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-sm font-medium">{currentUser?.name}</div>
                  <div className="text-xs text-slate-500 font-normal">
                    {currentUser?.email}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {canAccess(currentUser?.role, "/configuracion") && (
                  <DropdownMenuItem onClick={() => navigate("/configuracion")}>
                    <Settings className="w-4 h-4 mr-2" /> Configuración
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  data-testid="logout-btn"
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
