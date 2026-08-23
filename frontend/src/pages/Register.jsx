import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Waves, Building2, User, Lock, Mail, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";

export default function Register() {
  const { registerAccount } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    businessName: "",
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await registerAccount(form);
      if (res.ok) {
        toast.success("Cuenta creada. ¡Bienvenido a LAVANET!");
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
      <div className="hidden lg:flex relative bg-slate-900 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950" />
        <div className="relative z-10 px-12 max-w-lg">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
              <Waves className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div className="text-white font-heading font-extrabold text-2xl">LAVANET</div>
          </div>
          <h1 className="text-white font-heading text-4xl font-extrabold leading-tight tracking-tight">
            Registra tu lavandería y empieza hoy.
          </h1>
          <p className="text-slate-300 mt-6 text-lg leading-relaxed">
            Crea tu negocio, invita a tu equipo y gestiona órdenes, caja e inventario en un solo lugar.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <h2 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight">
            Crear cuenta
          </h2>
          <p className="text-slate-500 mt-2">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
              Iniciar sesión
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <Label>Nombre de la lavandería *</Label>
              <div className="relative mt-1.5">
                <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-9 h-11"
                  value={form.businessName}
                  onChange={set("businessName")}
                  placeholder="Ej. Lavandería San Martín"
                  required
                />
              </div>
            </div>
            <div>
              <Label>Tu nombre *</Label>
              <div className="relative mt-1.5">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-9 h-11"
                  value={form.name}
                  onChange={set("name")}
                  required
                />
              </div>
            </div>
            <div>
              <Label>Usuario admin *</Label>
              <div className="relative mt-1.5">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-9 h-11"
                  value={form.username}
                  onChange={set("username")}
                  autoComplete="username"
                  required
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <div className="relative mt-1.5">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="email"
                  className="pl-9 h-11"
                  value={form.email}
                  onChange={set("email")}
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <Label>Contraseña * (mín. 8)</Label>
              <div className="relative mt-1.5">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="password"
                  className="pl-9 h-11"
                  value={form.password}
                  onChange={set("password")}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 gap-2 font-semibold"
            >
              {loading ? "Creando..." : (
                <>
                  Crear mi lavandería <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
