import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { User, Lock, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import BrandLogo from "../components/BrandLogo";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";

const DEMO_USERS = [
  { role: "Administrador", user: "admin", pass: "admin123" },
  { role: "Cajero", user: "cajero", pass: "cajero123" },
  { role: "Recepción", user: "recepcion", pass: "recepcion123" },
  { role: "Operador", user: "operador", pass: "operador123" },
];

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const showDemos = process.env.REACT_APP_SHOW_DEMOS === "true";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(username, password);
      if (res.ok) {
        toast.success("Bienvenido/a de vuelta");
        navigate("/");
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (u, p) => {
    setUsername(u);
    setPassword(p);
    setLoading(true);
    try {
      const res = await login(u, p);
      if (res.ok) {
        toast.success("Sesión iniciada");
        navigate("/");
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      <div className="hidden lg:flex relative bg-black items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-brand-dark/40" />
        <div className="relative z-10 px-12 max-w-lg text-center">
          <BrandLogo imgClassName="h-28 mx-auto" className="mb-10" />
          <h1 className="text-white font-heading text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight">
            La gestión de tu lavandería,
            <br />
            <span className="text-brand-light">simple y poderosa.</span>
          </h1>
          <p className="text-brand-muted mt-6 text-lg leading-relaxed">
            Órdenes, POS, caja, inventario y reportes para lavanderías modernas.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <BrandLogo framed imgClassName="h-14" />
          </div>

          <h2 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight">
            Iniciar sesión
          </h2>
          <p className="text-slate-500 mt-2">
            ¿Nuevo en lavanet?{" "}
            <Link to="/register" className="text-brand font-semibold hover:underline">
              Crear cuenta
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <Label className="text-slate-700 text-sm">Usuario</Label>
              <div className="relative mt-1.5">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  data-testid="login-username"
                  className="pl-9 h-11"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <Label className="text-slate-700 text-sm">Contraseña</Label>
              <div className="relative mt-1.5">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  data-testid="login-password"
                  type="password"
                  className="pl-9 h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button
              data-testid="login-submit"
              type="submit"
              disabled={loading}
              className="w-full h-11 gap-2 font-semibold"
            >
              {loading ? "Ingresando..." : (
                <>
                  Entrar <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {showDemos && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">
                Acceso rápido demo
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_USERS.map((u) => (
                  <button
                    key={u.user}
                    type="button"
                    data-testid={`quick-login-${u.user}`}
                    onClick={() => quickLogin(u.user, u.pass)}
                    className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-brand hover:bg-brand-soft transition-colors group"
                  >
                    <div className="text-xs font-semibold text-slate-700 group-hover:text-brand-dark">
                      {u.role}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{u.user}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
