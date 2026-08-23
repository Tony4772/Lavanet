import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { User, Lock, ArrowRight, Play, MessageCircle } from "lucide-react";
import { useApp } from "../context/AppContext";
import { api, hasApiBackend } from "../lib/api";
import BrandLogo from "../components/BrandLogo";
import SiteFooter from "../components/SiteFooter";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";

const WHATSAPP = "51906591037";
const WHATSAPP_MSG = encodeURIComponent("Hola, quiero contratar lavanet para mi lavandería.");

export default function Login() {
  const { login, applySession } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(username, password);
      if (res.ok) {
        toast.success(res.subscriptionBlocked ? "Regulariza tu suscripción para continuar" : "Bienvenido/a de vuelta");
        if (res.superadmin) navigate("/superadmin");
        else if (res.subscriptionBlocked) navigate("/configuracion?tab=subscription");
        else navigate("/");
      } else {
        toast.error(res.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const enterDemo = async () => {
    if (!hasApiBackend()) {
      toast.error("Demo disponible solo con API en producción");
      return;
    }
    setLoading(true);
    try {
      const { data: res } = await api.post("/api/auth/demo");
      applySession(res);
      toast.success("Modo demo — datos de ejemplo");
      navigate("/");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Demo no disponible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-svh lg:overflow-hidden bg-slate-50 flex flex-col">
      <div className="flex-1 min-h-0 grid lg:grid-cols-2">
      <div className="hidden lg:flex relative bg-black items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-brand-dark/40" />
        <div className="relative z-10 px-12 max-w-lg text-center">
          <BrandLogo size="heroWide" className="mb-8 mx-auto" />
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
          <div className="lg:hidden mb-8 flex justify-center">
            <BrandLogo size="heroWideMobile" />
          </div>

          <h2 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight">
            Iniciar sesión
          </h2>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">
            ¿Quieres contratar lavanet?{" "}
            <a
              href={`https://wa.me/${WHATSAPP}?text=${WHATSAPP_MSG}`}
              target="_blank"
              rel="noreferrer"
              className="text-brand font-semibold hover:underline inline-flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp 906 591 037
            </a>
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

          <div className="mt-6 space-y-3">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={enterDemo}
              className="w-full h-11 gap-2 border-brand text-brand hover:bg-brand-soft"
            >
              <Play className="w-4 h-4" /> Probar demo
            </Button>
            <p className="text-[11px] text-center text-slate-400">
              Cuenta demo compartida con datos de ejemplo. Para tu negocio, contrata por WhatsApp.
            </p>
          </div>
        </div>
      </div>
      </div>

      <SiteFooter />
    </div>
  );
}
