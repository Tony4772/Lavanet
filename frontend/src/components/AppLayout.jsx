import React, { useState, useMemo } from "react";
import { NavLink, useNavigate, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart, ClipboardList, Users, Sparkles, Package,
  Warehouse, Truck, Wallet, BarChart3, UserCog, Settings, Bell, Search,
  LogOut, Menu, X, ChevronDown, Workflow, MoreHorizontal,
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
import BrandLogo from "./BrandLogo";

const NAV = [
  { to: "/", label: "Inicio", icon: LayoutDashboard, testId: "nav-dashboard" },
  { to: "/pos", label: "POS", icon: ShoppingCart, testId: "nav-pos" },
  { to: "/ordenes", label: "Órdenes", icon: ClipboardList, testId: "nav-ordenes" },
  { to: "/clientes", label: "Clientes", icon: Users, testId: "nav-clientes" },
  { to: "/servicios", label: "Servicios", icon: Sparkles, testId: "nav-servicios" },
  { to: "/productos", label: "Productos", icon: Package, testId: "nav-productos" },
  { to: "/inventario", label: "Inventario", icon: Warehouse, testId: "nav-inventario" },
  { to: "/entregas", label: "Entregas", icon: Truck, testId: "nav-entregas" },
  { to: "/turno", label: "Turno", icon: Workflow, testId: "nav-turno" },
  { to: "/caja", label: "Caja", icon: Wallet, testId: "nav-caja" },
  { to: "/reportes", label: "Reportes", icon: BarChart3, testId: "nav-reportes" },
  { to: "/usuarios", label: "Usuarios", icon: UserCog, testId: "nav-usuarios" },
  { to: "/configuracion", label: "Ajustes", icon: Settings, testId: "nav-configuracion" },
];

const MOBILE_PRIMARY = ["/", "/pos", "/ordenes", "/clientes"];

export default function AppLayout() {
  const { currentUser, logout, data, markNotificationsRead } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState("");

  const unread = data.notifications.filter((n) => !n.read).length;
  const businessName = data.business?.name || data.config?.business?.name || "LAVANET";

  const visibleNav = useMemo(
    () => NAV.filter((item) => canAccess(currentUser?.role, item.to)),
    [currentUser?.role]
  );

  const mobileTabs = useMemo(() => {
    const primary = visibleNav.filter((n) => MOBILE_PRIMARY.includes(n.to));
    return primary.slice(0, 4);
  }, [visibleNav]);

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

  const SidebarContent = ({ dense = false }) => (
    <>
      <div className={`px-5 ${dense ? "pt-14 pb-4" : "pt-5 pb-6"}`}>
        <BrandLogo imgClassName="h-12 w-full max-w-[180px]" />
        <div className="text-brand-muted text-[10px] uppercase tracking-widest mt-2 truncate px-1">
          {businessName}
        </div>
      </div>
      <nav className="px-3 flex-1 overflow-y-auto pb-4 overscroll-contain">
        {visibleNav.map(({ to, label, icon: Icon, testId }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            data-testid={testId}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3.5 sm:py-2.5 rounded-xl mb-0.5 text-base sm:text-sm font-medium transition-colors min-h-[48px] ${
                isActive
                  ? "bg-brand text-white shadow-sm shadow-brand/30"
                  : "text-slate-400 active:bg-white/10 hover:text-white hover:bg-white/5"
              }`
            }
          >
            <Icon className="w-5 h-5 sm:w-4 sm:h-4 shrink-0" strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-white/10 safe-area-pb">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-semibold text-sm">
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

  const isTabActive = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-black flex-col z-40">
        <SidebarContent />
      </aside>

      {/* Drawer móvil */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-opacity ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
        <aside
          className={`absolute inset-y-0 left-0 w-[min(100%,20rem)] bg-black flex flex-col shadow-2xl transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            data-testid="sidebar-close"
            aria-label="Cerrar menú"
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/10 text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
          <SidebarContent dense />
        </aside>
      </div>

      <div className="lg:ml-64 pb-20 lg:pb-0">
        {currentUser?.username === "demo" && (
          <div className="bg-amber-500 text-amber-950 text-center text-xs sm:text-sm py-2 px-4 font-medium">
            Modo demo — datos de ejemplo. Contrata por WhatsApp{" "}
            <a
              href="https://wa.me/51906591037"
              target="_blank"
              rel="noreferrer"
              className="underline font-bold"
            >
              906 591 037
            </a>
          </div>
        )}
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 h-14 sm:h-16 flex items-center px-3 sm:px-4 lg:px-8 gap-2 sm:gap-4">
          <button
            className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
            data-testid="sidebar-open"
            aria-label="Abrir menú"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-6 h-6 text-slate-700 dark:text-slate-200" />
          </button>

          <Popover open={q.trim().length > 0} onOpenChange={(o) => !o && setQ("")}>
            <PopoverTrigger asChild>
              <div className="relative flex-1 max-w-md min-w-0">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  data-testid="global-search"
                  placeholder="Buscar..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-9 h-11 sm:h-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-brand text-base sm:text-sm"
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-[min(100vw-2rem,24rem)] p-0" align="start">
              {searchResults.length === 0 ? (
                <div className="p-4 text-sm text-slate-500">Sin resultados</div>
              ) : (
                <div className="py-2">
                  {searchResults.map((r, i) => (
                    <button
                      key={`${r.type}-${r.label}-${i}`}
                      data-testid={`search-result-${i}`}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-sm min-h-[48px]"
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

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {canAccess(currentUser?.role, "/pos") && (
              <Button
                data-testid="topbar-new-order"
                onClick={() => navigate("/pos")}
                className="hidden md:inline-flex bg-brand hover:bg-brand-dark gap-2 h-10"
              >
                <ShoppingCart className="w-4 h-4" /> Nueva Venta
              </Button>
            )}

            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            <Popover onOpenChange={(o) => o && markNotificationsRead()}>
              <PopoverTrigger asChild>
                <button
                  data-testid="notifications-btn"
                  className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Bell className="w-5 h-5" />
                  {unread > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[min(100vw-2rem,20rem)] p-0">
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  data-testid="profile-menu"
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px]"
                >
                  <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white text-xs font-semibold">
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

        <main className="p-3 sm:p-4 lg:p-8 max-w-[100vw] overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav móvil */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]"
        data-testid="mobile-bottom-nav"
      >
        <div className="grid grid-cols-5 h-16">
          {mobileTabs.map(({ to, label, icon: Icon, testId }) => (
            <button
              key={to}
              type="button"
              data-testid={`mobile-${testId}`}
              onClick={() => navigate(to)}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
                isTabActive(to) ? "text-brand" : "text-slate-400"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isTabActive(to) ? 2.5 : 2} />
              {label}
            </button>
          ))}
          <button
            type="button"
            data-testid="mobile-menu-more"
            onClick={() => setMobileOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
              mobileOpen || !MOBILE_PRIMARY.some((p) => isTabActive(p))
                ? "text-brand"
                : "text-slate-400"
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            Más
          </button>
        </div>
      </nav>
    </div>
  );
}
