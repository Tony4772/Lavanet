import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Waves, User, Lock, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";
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
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const res = login(username, password);
      setLoading(false);
      if (res.ok) {
        toast.success(`Bienvenido/a de vuelta`);
        navigate("/");
      } else {
        toast.error(res.error);
      }
    }, 400);
  };

  const quickLogin = (u, p) => {
    setUsername(u); setPassword(p);
    setTimeout(() => {
      const res = login(u, p);
      if (res.ok) { toast.success("Sesión iniciada"); navigate("/"); }
    }, 100);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      {/* Left visual side */}
      <div className="hidden lg:flex relative bg-slate-900 items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1547104442-044448b73426?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1Mjh8MHwxfHNlYXJjaHwxfHxjbGVhbiUyMGZvbGRlZCUyMHdoaXRlJTIwbGluZW4lMjBtaW5pbWFsfGVufDB8fHx8MTc4NjM0NzUzNXww&ixlib=rb-4.1.0&q=85)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-900/70 to-blue-950/95" />
        <div className="relative z-10 px-12 max-w-lg">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
              <Waves className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-white font-heading font-extrabold text-2xl leading-none tracking-tight">LAVANET</div>
              <div className="text-blue-300 text-xs uppercase tracking-[0.2em] mt-1">POS · ERP</div>
            </div>
          </div>
          <h1 className="text-white font-heading text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight">
            La gestión de tu lavandería,<br/><span className="text-blue-400">simple y poderosa.</span>
          </h1>
          <p className="text-slate-300 mt-6 text-lg leading-relaxed">
            Órdenes, POS, caja, inventario y reportes en una sola plataforma diseñada para lavanderías modernas del Perú.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { n: "12+", l: "Módulos" },
              { n: "S/", l: "Soles PEN" },
              { n: "24/7", l: "Disponible" },
            ].map((s, i) => (
              <div key={i} className="border border-white/10 rounded-lg p-3 bg-white/5 backdrop-blur-sm">
                <div className="text-white font-heading font-bold text-2xl">{s.n}</div>
                <div className="text-slate-400 text-xs uppercase tracking-wider mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form side */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Waves className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="text-slate-900 font-heading font-extrabold text-xl">LAVANET</div>
          </div>

          <h2 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight">Iniciar sesión</h2>
          <p className="text-slate-500 mt-2">Ingresa a tu panel de gestión</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <Label className="text-slate-700 text-sm">Usuario</Label>
              <div className="relative mt-1.5">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input data-testid="login-username" className="pl-9 h-11" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
            </div>
            <div>
              <Label className="text-slate-700 text-sm">Contraseña</Label>
              <div className="relative mt-1.5">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input data-testid="login-password" type="password" className="pl-9 h-11" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>
            <Button data-testid="login-submit" type="submit" disabled={loading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 gap-2 font-semibold">
              {loading ? "Ingresando..." : (<>Entrar <ArrowRight className="w-4 h-4" /></>)}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">Acceso rápido demo</div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_USERS.map(u => (
                <button
                  key={u.user}
                  data-testid={`quick-login-${u.user}`}
                  onClick={() => quickLogin(u.user, u.pass)}
                  className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                >
                  <div className="text-xs font-semibold text-slate-700 group-hover:text-blue-700">{u.role}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{u.user} / {u.pass}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
