import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useRoutes } from "react-router-dom";
import { Toaster } from "sonner";
import { AppProvider, useApp } from "./context/AppContext";
import { AppProvider as TenantAppProvider, useTenant } from "./context/TenantContext";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
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

const LoginPage = () => {
  const { login } = useApp();
  const { tenantId, setTenant } = useTenant();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const result = login(username, password);
    if (result.ok) {
      setTenant("tenant-1"); // After real auth, this would come from auth service
      return null;
    }
    setError(result.error);
  };

  if (tenantId) return <Navigate to="/" replace />;

  return (
    <div data-testid="login-page" className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div data-testid="login-box" className="bg-white rounded-xl p-8 shadow-lg max-w-md w-full">
        <h2 data-testid="login-title" className="text-2xl font-heading font-bold text-slate-900 text-center mb-6">INICIAR SESIÓN</h2>
        {error && <p data-testid="login-error" className="text-red-600 text-sm text-center mb-4">ERROR: {error}</p>}
        <div className="space-y-4">
          <div>
            <label data-testid="login-username-label" className="block text-sm font-medium text-slate-600 mb-2">Usuario</label>
            <input 
              data-testid="login-username" 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="w-full border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-blue-500"
            />
          </div>
          <div>
            <label data-testid="login-password-label" className="block text-sm font-medium text-slate-600 mb-2">Contraseña</label>
            <input 
              data-testid="login-password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex justify-center mt-6">
          <button 
            data-testid="login-btn" 
            onClick={handleLogin} 
            className="bg-blue-600 text-white px-6 py-2 rounded text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Entrar
          </button>
        </div>
        <div className="text-center mt-6 text-sm text-slate-500">
          <p>Sistema multitenant LAVANET</p>
        </div>
      </div>
    </div>
  );
};

const Protected = ({ children }) => {
  const { currentUser } = useApp();
  if (!currentUser) return <LoginPage />;

  return <TenantAppProvider>{children}</TenantAppProvider>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Protected><AppLayout /></Protected>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/ordenes" element={<Ordenes />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/servicios" element={<Servicios />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/entregas" element={<Entregas />} />
        <Route path="/turno" element={<ModoTurno />} />
        <Route path="/caja" element={<Caja />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/configuracion" element={<Configuracion />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="bottom-right" richColors closeButton toastOptions={{ className: "!z-[100]" }} className="!z-[100]" />
      </BrowserRouter>
    </AppProvider>
  );
}