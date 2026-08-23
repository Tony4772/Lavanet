import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useApp } from "./context/AppContext";
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

const Protected = ({ children }) => {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
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
    <BrowserRouter>
      <AppRoutes />
      <Toaster position="bottom-right" richColors closeButton toastOptions={{ className: "!z-[100]" }} className="!z-[100]" />
    </BrowserRouter>
  );
}
