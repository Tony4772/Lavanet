import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Plus, RefreshCw, LogOut, Wallet, Building2 } from "lucide-react";
import { api } from "../lib/api";
import { useCulqiPublicKey, useCulqiToken } from "../lib/culqi";
import { useApp } from "../context/AppContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import BrandLogo from "../components/BrandLogo";

const fmt = (cents) => `S/ ${((cents || 0) / 100).toFixed(2)}`;

const STATUS_LABEL = {
  trial: "Prueba (61 días)",
  active: "Activo",
  grace: "Gracia",
  suspended: "Suspendido",
};

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { logout } = useApp();
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    adminName: "",
    adminUsername: "",
    adminEmail: "",
    adminPassword: "",
    monthlyPrice: "",
    contactPhone: "",
    contactEmail: "",
    billingEmail: "",
    contractNotes: "",
    cardNumber: "",
    cvv: "",
    expMonth: "",
    expYear: "",
    sunatEnabled: false,
    sunatRuc: "",
    sunatSolUser: "",
    sunatSolPass: "",
  });

  const publicKey = useCulqiPublicKey();
  const { createToken, loading: culqiLoading } = useCulqiToken(publicKey);

  const chartData = useMemo(() => {
    if (!stats?.monthlyRevenue) return [];
    return Object.entries(stats.monthlyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, cents]) => ({ month, total: cents / 100 }));
  }, [stats]);

  const load = async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([
        api.get("/api/superadmin/stats"),
        api.get("/api/superadmin/tenants"),
      ]);
      setStats(s.data?.data);
      setTenants(t.data?.data?.tenants || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error cargando panel");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submitTenant = async (e) => {
    e.preventDefault();
    try {
      let culqiToken;
      if (form.cardNumber.trim()) {
        culqiToken = await createToken({
          cardNumber: form.cardNumber,
          cvv: form.cvv,
          expirationMonth: form.expMonth,
          expirationYear: form.expYear,
          email: form.billingEmail || form.adminEmail,
        });
      }

      const payload = {
        name: form.name,
        adminName: form.adminName,
        adminUsername: form.adminUsername,
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
        monthlyPrice: Number(form.monthlyPrice),
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail,
        billingEmail: form.billingEmail || form.adminEmail,
        contractNotes: form.contractNotes,
        culqiToken,
        sunat: form.sunatEnabled
          ? {
              enabled: true,
              ruc: form.sunatRuc,
              solUser: form.sunatSolUser,
              solPass: form.sunatSolPass,
              businessName: form.name,
            }
          : { enabled: false },
      };

      const { data } = await api.post("/api/superadmin/tenants", payload);
      if (data.warning) toast.warning(data.warning);
      else toast.success("Lavandería creada");
      setShowForm(false);
      setForm({
        name: "",
        adminName: "",
        adminUsername: "",
        adminEmail: "",
        adminPassword: "",
        monthlyPrice: "",
        contactPhone: "",
        contactEmail: "",
        billingEmail: "",
        contractNotes: "",
        cardNumber: "",
        cvv: "",
        expMonth: "",
        expYear: "",
        sunatEnabled: false,
        sunatRuc: "",
        sunatSolUser: "",
        sunatSolPass: "",
      });
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Error al crear");
    }
  };

  const markPaid = async (id) => {
    try {
      await api.post(`/api/superadmin/tenants/${id}/mark-paid`, { notes: "Pago manual" });
      toast.success("Pago registrado (+30 días)");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error");
    }
  };

  const runBilling = async () => {
    try {
      const { data } = await api.post("/api/superadmin/billing/run");
      toast.success(`Cobros: ${data.data.charged}, gracia: ${data.data.grace}`);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b bg-white dark:bg-slate-900 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <BrandLogo framed imgClassName="h-10" />
          <div>
            <div className="font-heading font-bold text-lg">Panel dueño — lavanet</div>
            <div className="text-xs text-slate-500">Suscripciones y clientes</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={() => { logout(); navigate("/login"); }}>
            <LogOut className="w-4 h-4 mr-1" /> Salir
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border rounded-xl p-5">
            <div className="text-xs uppercase text-slate-500 font-semibold">Clientes</div>
            <div className="text-3xl font-heading font-extrabold mt-1">{stats?.tenantsTotal ?? "—"}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border rounded-xl p-5">
            <div className="text-xs uppercase text-slate-500 font-semibold">MRR</div>
            <div className="text-3xl font-heading font-extrabold text-brand mt-1">
              {stats ? fmt(stats.mrrCents) : "—"}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border rounded-xl p-5">
            <div className="text-xs uppercase text-slate-500 font-semibold">Este mes</div>
            <div className="text-3xl font-heading font-extrabold text-emerald-600 mt-1">
              {stats ? fmt(stats.revenueMonthCents) : "—"}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border rounded-xl p-5">
            <div className="text-xs uppercase text-slate-500 font-semibold">En gracia</div>
            <div className="text-3xl font-heading font-extrabold text-amber-600 mt-1">
              {stats?.byStatus?.grace ?? 0}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border rounded-xl p-6">
          <h3 className="font-heading font-bold mb-4">Ingresos últimos meses</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={11} tickFormatter={(v) => `S/${v}`} />
              <Tooltip formatter={(v) => [`S/ ${Number(v).toFixed(2)}`, "Ingresos"]} />
              <Bar dataKey="total" fill="#7B1FA2" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button className="gap-2" onClick={() => setShowForm((s) => !s)}>
            <Plus className="w-4 h-4" /> Nueva lavandería
          </Button>
          <Button variant="outline" onClick={runBilling}>
            <Wallet className="w-4 h-4 mr-1" /> Ejecutar cobros
          </Button>
        </div>

        {showForm && (
          <form
            onSubmit={submitTenant}
            className="bg-white dark:bg-slate-900 border rounded-xl p-6 grid md:grid-cols-2 gap-4"
          >
            <div className="md:col-span-2 font-heading font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand" /> Alta de cliente
            </div>
            <div>
              <Label>Nombre lavandería *</Label>
              <Input className="mt-1" value={form.name} onChange={set("name")} required />
            </div>
            <div>
              <Label>Precio mensual (PEN) *</Label>
              <Input
                type="number"
                min="1"
                step="0.01"
                className="mt-1"
                value={form.monthlyPrice}
                onChange={set("monthlyPrice")}
                required
              />
            </div>
            <div>
              <Label>Admin nombre *</Label>
              <Input className="mt-1" value={form.adminName} onChange={set("adminName")} required />
            </div>
            <div>
              <Label>Admin usuario *</Label>
              <Input className="mt-1" value={form.adminUsername} onChange={set("adminUsername")} required />
            </div>
            <div>
              <Label>Admin email</Label>
              <Input type="email" className="mt-1" value={form.adminEmail} onChange={set("adminEmail")} />
            </div>
            <div>
              <Label>Admin contraseña *</Label>
              <Input
                type="password"
                className="mt-1"
                value={form.adminPassword}
                onChange={set("adminPassword")}
                minLength={8}
                required
              />
            </div>
            <div>
              <Label>WhatsApp cliente</Label>
              <Input className="mt-1" value={form.contactPhone} onChange={set("contactPhone")} />
            </div>
            <div>
              <Label>Email cobro</Label>
              <Input className="mt-1" value={form.billingEmail} onChange={set("billingEmail")} />
            </div>
            <div className="md:col-span-2">
              <Label>Notas contrato</Label>
              <Input className="mt-1" value={form.contractNotes} onChange={set("contractNotes")} />
            </div>

            <div className="md:col-span-2 border-t pt-4">
              <div className="text-sm font-semibold mb-2">Tarjeta Culqi (opcional — cobro automático día 61+)</div>
              <div className="grid md:grid-cols-4 gap-3">
                <Input placeholder="Número tarjeta" value={form.cardNumber} onChange={set("cardNumber")} />
                <Input placeholder="CVV" value={form.cvv} onChange={set("cvv")} />
                <Input placeholder="MM" value={form.expMonth} onChange={set("expMonth")} />
                <Input placeholder="AAAA" value={form.expYear} onChange={set("expYear")} />
              </div>
            </div>

            <div className="md:col-span-2 border-t pt-4">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={form.sunatEnabled}
                  onChange={(e) => setForm((f) => ({ ...f, sunatEnabled: e.target.checked }))}
                />
                Facturación SUNAT (opcional)
              </label>
              {form.sunatEnabled && (
                <div className="grid md:grid-cols-3 gap-3 mt-3">
                  <Input placeholder="RUC" value={form.sunatRuc} onChange={set("sunatRuc")} />
                  <Input placeholder="Usuario SOL secundario" value={form.sunatSolUser} onChange={set("sunatSolUser")} />
                  <Input
                    type="password"
                    placeholder="Clave SOL"
                    value={form.sunatSolPass}
                    onChange={set("sunatSolPass")}
                  />
                </div>
              )}
            </div>

            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" disabled={culqiLoading}>
                {culqiLoading ? "Tokenizando..." : "Crear cliente"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        <div className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Negocio</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">1er cobro</th>
                <th className="px-4 py-3">Tarjeta</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t._id} className="border-t">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3">S/ {Number(t.monthlyPrice).toFixed(2)}</td>
                  <td className="px-4 py-3">{STATUS_LABEL[t.billingStatus] || t.billingStatus}</td>
                  <td className="px-4 py-3 text-xs">
                    {t.firstChargeAt ? new Date(t.firstChargeAt).toLocaleDateString("es-PE") : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {t.culqiCardLast4 ? `•••• ${t.culqiCardLast4}` : "Sin tarjeta"}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => markPaid(t._id)}>
                      Marcar pagado
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-500">
          Periodo gratis: 61 días desde el alta. Primer cobro al día 61, luego cada 30 días. Gracia: 5 días.
          Demo: usuario <code>demo</code> (contraseña en servidor).
        </p>
      </main>
    </div>
  );
}
