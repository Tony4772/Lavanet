import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Building2, User, Lock, Mail, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import BrandLogo from "../components/BrandLogo";
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
        toast.success("Cuenta creada. ¡Bienvenido a lavanet!");
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
          <h1 className="text-white font-heading text-4xl font-extrabold leading-tight tracking-tight">
            Registra tu lavandería y empieza hoy.
          </h1>
          <p className="text-brand-muted mt-6 text-lg leading-relaxed">
            Crea tu negocio, invita a tu equipo y gestiona órdenes, caja e inventario en un solo lugar.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <BrandLogo framed imgClassName="h-14" />
          </div>

          <h2 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight">
            Crear cuenta
          </h2>
          <p className="text-slate-500 mt-2">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-brand font-semibold hover:underline">
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
              className="w-full h-11 gap-2 font-semibold"
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
