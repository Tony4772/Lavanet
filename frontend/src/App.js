import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { useApp, canAccess } from "./context/AppContext";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import SuperAdmin from "./pages/SuperAdmin";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Ordenes from "./pages/Ordenes";
import Clientes from "./pages/Clientes";
import Servicios from "./pages/Servicios";
import Productos from "./pages/Productos";
import Inventario from "./pages/Inventario";
import Entregas from "./pages/Entregas";
import Caja from "./pages/Caja";
import Reportes from "./pages/Reportes";
import Usuarios from "./pages/Usuarios";
import Configuracion from "./pages/Configuracion";
import ModoTurno from "./pages/ModoTurno";
import Terminos from "./pages/legal/Terminos";
import PoliticaPrivacidad from "./pages/legal/PoliticaPrivacidad";
import CookieConsent from "./components/CookieConsent";

const RequireAuth = () => {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Outlet />;
};

const RequireSuperadmin = () => {
  const { currentUser } = useApp();
  if (currentUser?.rawRole !== "superadmin" && currentUser?.role !== "Superadmin") {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

const RequireActiveSubscription = () => {
  const { currentUser } = useApp();
  const location = useLocation();
  if (
    currentUser?.subscriptionBlocked &&
    !location.pathname.startsWith("/configuracion")
  ) {
    return <Navigate to="/configuracion?tab=subscription" replace />;
  }
  return <Outlet />;
};

const RequireRole = ({ path }) => {
  const { currentUser } = useApp();
  if (!canAccess(currentUser?.role, path)) return <Navigate to="/" replace />;
  return <Outlet />;
};

const HomeRedirect = () => {
  const { currentUser } = useApp();
  if (currentUser?.rawRole === "superadmin" || currentUser?.role === "Superadmin") {
    return <Navigate to="/superadmin" replace />;
  }
  return <Navigate to="/" replace />;
};

function AppRoutes() {
  const { currentUser } = useApp();
  return (
    <Routes>
      <Route
        path="/login"
        element={currentUser ? <HomeRedirect /> : <Login />}
      />
      <Route path="/terminos" element={<Terminos />} />
      <Route path="/privacidad" element={<PoliticaPrivacidad />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route element={<RequireAuth />}>
        <Route element={<RequireSuperadmin />}>
          <Route path="/superadmin" element={<SuperAdmin />} />
        </Route>
        <Route element={<AppLayout />}>
          <Route element={<RequireActiveSubscription />}>
          <Route element={<RequireRole path="/" />}>
            <Route path="/" element={<Dashboard />} />
          </Route>
          <Route element={<RequireRole path="/pos" />}>
            <Route path="/pos" element={<POS />} />
          </Route>
          <Route element={<RequireRole path="/ordenes" />}>
            <Route path="/ordenes" element={<Ordenes />} />
          </Route>
          <Route element={<RequireRole path="/clientes" />}>
            <Route path="/clientes" element={<Clientes />} />
          </Route>
          <Route element={<RequireRole path="/servicios" />}>
            <Route path="/servicios" element={<Servicios />} />
          </Route>
          <Route element={<RequireRole path="/productos" />}>
            <Route path="/productos" element={<Productos />} />
          </Route>
          <Route element={<RequireRole path="/inventario" />}>
            <Route path="/inventario" element={<Inventario />} />
          </Route>
          <Route element={<RequireRole path="/entregas" />}>
            <Route path="/entregas" element={<Entregas />} />
          </Route>
          <Route element={<RequireRole path="/turno" />}>
            <Route path="/turno" element={<ModoTurno />} />
          </Route>
          <Route element={<RequireRole path="/caja" />}>
            <Route path="/caja" element={<Caja />} />
          </Route>
          <Route element={<RequireRole path="/reportes" />}>
            <Route path="/reportes" element={<Reportes />} />
          </Route>
          <Route element={<RequireRole path="/usuarios" />}>
            <Route path="/usuarios" element={<Usuarios />} />
          </Route>
          <Route element={<RequireRole path="/configuracion" />}>
            <Route path="/configuracion" element={<Configuracion />} />
          </Route>
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <CookieConsent />
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{ className: "!z-[100]" }}
        className="!z-[100]"
      />
    </BrowserRouter>
  );
}
