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
import {
  Plus,
  RefreshCw,
  LogOut,
  Wallet,
  Building2,
  FileText,
  Upload,
  Pencil,
  KeyRound,
  Search,
  MoreHorizontal,
  Users,
  LayoutDashboard,
  Loader2,
  Info,
  Pause,
  Ban,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { api } from "../lib/api";
import { useApp } from "../context/AppContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import BrandLogo from "../components/BrandLogo";
import SiteFooter from "../components/SiteFooter";
import { fmtSubscriptionPrice, SUBSCRIPTION_IGV_NOTE } from "../lib/subscriptionPricing";
import SubscriptionPriceBreakdown from "../components/SubscriptionPriceBreakdown";

const EMPTY_SUNAT = {
  enabled: false,
  ruc: "",
  businessName: "",
  address: "",
  ubigeo: "150101",
  solUser: "",
  solPass: "",
  certificatePassword: "",
  certificateP12: "",
  environment: "beta",
  seriesInvoice: "F001",
  seriesBoleta: "B001",
};

const STATUS_LABEL = {
  trial: "Prueba",
  active: "Activo",
  grace: "Gracia",
  suspended: "Suspendido",
};

const STATUS_STYLES = {
  trial: "bg-sky-100 text-sky-800 border-sky-200",
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  grace: "bg-amber-100 text-amber-900 border-amber-200",
  suspended: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_FILTERS = [
  { id: "all", label: "Todos" },
  { id: "trial", label: "Prueba" },
  { id: "active", label: "Activos" },
  { id: "grace", label: "Gracia" },
  { id: "suspended", label: "Suspendidos" },
];

const fmt = (cents) => `S/ ${((cents || 0) / 100).toFixed(2)}`;
const fmtDate = (value) => (value ? new Date(value).toLocaleDateString("es-PE") : "—");

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        STATUS_STYLES[status] || "bg-slate-100 text-slate-700 border-slate-200"
      }`}
    >
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function StatCard({ label, value, hint, accent, onClick, active, extra }) {
  const clickable = typeof onClick === "function";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`text-left rounded-xl border p-5 transition-all ${
        clickable ? "hover:border-brand/40 hover:shadow-sm cursor-pointer" : ""
      } ${active ? "border-brand ring-2 ring-brand/20 bg-brand-soft/10" : "bg-white dark:bg-slate-900"}`}
    >
      <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{label}</div>
      <div className={`text-3xl font-heading font-extrabold mt-1 ${accent || ""}`}>{value}</div>
      {hint && <div className="text-[11px] text-slate-500 mt-1">{hint}</div>}
      {extra}
    </button>
  );
}

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { logout } = useApp();
  const [pageTab, setPageTab] = useState("clients");
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
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
    sunatEnabled: false,
    ...EMPTY_SUNAT,
  });
  const [createBusy, setCreateBusy] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [clientEditTab, setClientEditTab] = useState("general");
  const [clientForm, setClientForm] = useState({
    name: "",
    monthlyPrice: "",
    contactPhone: "",
    contactEmail: "",
    billingEmail: "",
    contractNotes: "",
    billingStatus: "trial",
  });
  const [editSunat, setEditSunat] = useState({ ...EMPTY_SUNAT });
  const [clientBusy, setClientBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [sunatBusy, setSunatBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordBusy, setPasswordBusy] = useState(false);

  const chartData = useMemo(() => {
    if (!stats?.monthlyRevenue) return [];
    return Object.entries(stats.monthlyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, cents]) => ({ month, total: cents / 100 }));
  }, [stats]);

  const filteredTenants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tenants.filter((t) => {
      if (statusFilter !== "all" && t.billingStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        t.name?.toLowerCase().includes(q) ||
        t.owner?.username?.toLowerCase().includes(q) ||
        t.owner?.email?.toLowerCase().includes(q) ||
        t.contactEmail?.toLowerCase().includes(q)
      );
    });
  }, [tenants, searchQuery, statusFilter]);

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

  const readCertFile = (file, setter) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = String(reader.result || "").split(",").pop() || "";
      setter((s) => ({ ...s, certificateP12: b64 }));
      toast.success("Certificado .p12 cargado");
    };
    reader.readAsDataURL(file);
  };

  const validateSunat = (src, hasExistingCert = false) => {
    if (!src.enabled) return null;
    if (!String(src.ruc || "").replace(/\D/g, "").match(/^\d{11}$/)) {
      return "RUC emisor: 11 dígitos";
    }
    if (!src.solUser?.trim() || !src.solPass?.trim()) {
      return "Usuario y clave SOL secundario son obligatorios";
    }
    if (!src.certificatePassword?.trim()) {
      return "Contraseña del certificado .p12 es obligatoria";
    }
    if (!src.certificateP12 && !hasExistingCert) {
      return "Debes subir el certificado digital .p12";
    }
    return null;
  };

  const buildSunatPayload = (src, fallbackName) =>
    src.enabled
      ? {
          enabled: true,
          ruc: src.ruc,
          businessName: src.businessName || fallbackName,
          address: src.address,
          ubigeo: src.ubigeo,
          solUser: src.solUser,
          solPass: src.solPass || undefined,
          certificatePassword: src.certificatePassword,
          certificateP12: src.certificateP12 || undefined,
          environment: src.environment,
          seriesInvoice: src.seriesInvoice,
          seriesBoleta: src.seriesBoleta,
        }
      : { enabled: false };

  const openClientEdit = (tenant, tab = "general") => {
    const s = tenant.sunatSummary || {};
    setEditClient(tenant);
    setClientEditTab(tab);
    setClientForm({
      name: tenant.name || "",
      monthlyPrice: String(tenant.monthlyPrice ?? ""),
      contactPhone: tenant.contactPhone || "",
      contactEmail: tenant.contactEmail || "",
      billingEmail: tenant.billingEmail || "",
      contractNotes: tenant.contractNotes || "",
      billingStatus: tenant.billingStatus || "trial",
    });
    setEditSunat({
      ...EMPTY_SUNAT,
      enabled: !!s.enabled,
      ruc: s.ruc || "",
      environment: s.environment || "beta",
      seriesInvoice: s.seriesInvoice || "F001",
      seriesBoleta: s.seriesBoleta || "B001",
      businessName: tenant.name || "",
    });
  };

  const closeClientEdit = () => {
    setEditClient(null);
    setClientEditTab("general");
  };

  const goToClients = (filter = "all") => {
    setPageTab("clients");
    setStatusFilter(filter);
  };

  const saveClientEdit = async (e) => {
    e?.preventDefault?.();
    if (!editClient) return;
    const price = Number(clientForm.monthlyPrice);
    if (!clientForm.name.trim()) {
      toast.error("El nombre del negocio es obligatorio");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Precio mensual inválido");
      return;
    }
    setClientBusy(true);
    try {
      await api.patch(`/api/superadmin/tenants/${editClient._id}`, {
        name: clientForm.name.trim(),
        monthlyPrice: price,
        contactPhone: clientForm.contactPhone,
        contactEmail: clientForm.contactEmail,
        billingEmail: clientForm.billingEmail,
        contractNotes: clientForm.contractNotes,
        billingStatus: clientForm.billingStatus,
      });
      toast.success("Cliente actualizado");
      closeClientEdit();
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error al guardar");
    } finally {
      setClientBusy(false);
    }
  };

  const saveSunatEdit = async () => {
    if (!editClient) return;
    const errMsg = validateSunat(editSunat, !!editClient?.sunatSummary?.hasCertificate);
    if (errMsg) {
      toast.error(errMsg);
      return;
    }
    setSunatBusy(true);
    try {
      await api.patch(`/api/superadmin/tenants/${editClient._id}`, {
        sunat: buildSunatPayload(editSunat, editSunat.businessName || editClient.name),
      });
      toast.success(editSunat.enabled ? "Facturación SUNAT actualizada" : "SUNAT desactivado");
      closeClientEdit();
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error al guardar SUNAT");
    } finally {
      setSunatBusy(false);
    }
  };

  const testSunatEdit = async () => {
    if (!editClient) return;
    setSunatBusy(true);
    try {
      await api.patch(`/api/superadmin/tenants/${editClient._id}`, {
        sunat: buildSunatPayload(editSunat, editSunat.businessName || editClient.name),
      });
      const { data: res } = await api.post(`/api/superadmin/tenants/${editClient._id}/sunat/test`);
      if (res?.data?.ok) toast.success(res.data.message || "Certificado y SOL OK");
      else toast.error(res?.data?.message || "Revisa certificado/SOL");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error de prueba SUNAT");
    } finally {
      setSunatBusy(false);
    }
  };

  const resetCreateForm = () => {
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
      sunatEnabled: false,
      ...EMPTY_SUNAT,
    });
  };

  const submitTenant = async (e) => {
    e.preventDefault();
    const sunatErr = validateSunat({ ...form, enabled: form.sunatEnabled });
    if (sunatErr) {
      toast.error(sunatErr);
      return;
    }
    setCreateBusy(true);
    try {
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
        sunat: buildSunatPayload({
          ...form,
          enabled: form.sunatEnabled,
          businessName: form.businessName || form.name,
        }),
      };

      const { data } = await api.post("/api/superadmin/tenants", payload);
      if (data.warning) toast.warning(data.warning);
      else toast.success("Lavandería creada");
      setShowCreate(false);
      resetCreateForm();
      setPageTab("clients");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Error al crear");
    } finally {
      setCreateBusy(false);
    }
  };

  const markPaid = async (tenant) => {
    if (!window.confirm(`¿Registrar pago manual de ${fmtSubscriptionPrice(tenant.monthlyPrice)} para ${tenant.name}?`)) {
      return;
    }
    try {
      await api.post(`/api/superadmin/tenants/${tenant._id}/mark-paid`, { notes: "Pago manual (Yape/transferencia)" });
      toast.success("Pago registrado — suscripción activa +30 días");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "No se pudo registrar el pago");
    }
  };

  const runTenantAction = async (action, successMsg) => {
    if (!editClient) return;
    setActionBusy(true);
    try {
      await api.post(`/api/superadmin/tenants/${editClient._id}/${action}`);
      toast.success(successMsg);
      closeClientEdit();
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error en la acción");
    } finally {
      setActionBusy(false);
    }
  };

  const pauseClient = () => {
    if (!editClient) return;
    if (!window.confirm(`¿Pausar "${editClient.name}"? No podrá usar el sistema hasta reactivar.`)) return;
    runTenantAction("pause", "Cliente pausado");
  };

  const blockClient = () => {
    if (!editClient) return;
    if (!window.confirm(`¿Bloquear "${editClient.name}"? Quedará suspendido y deberá regularizar para volver.`)) return;
    runTenantAction("block", "Cliente bloqueado");
  };

  const reactivateClient = () => {
    if (!editClient) return;
    if (!window.confirm(`¿Reactivar "${editClient.name}"?`)) return;
    runTenantAction("reactivate", "Cliente reactivado");
  };

  const deleteClient = async () => {
    if (!editClient) return;
    if (!window.confirm(`¿Eliminar "${editClient.name}"? Se borrarán usuarios, órdenes y datos. No se puede deshacer.`)) return;
    setActionBusy(true);
    try {
      await api.delete(`/api/superadmin/tenants/${editClient._id}`);
      toast.success("Cliente eliminado");
      closeClientEdit();
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "No se pudo eliminar");
    } finally {
      setActionBusy(false);
    }
  };

  const clientAccessLabel = (tenant) => {
    if (!tenant) return "—";
    if (tenant.status === "inactive") return "Pausado";
    if (tenant.billingStatus === "suspended" || tenant.status === "suspended") return "Bloqueado";
    return "Operativo";
  };

  const runBilling = async () => {
    if (!window.confirm("¿Revisar ahora qué clientes deben cobrarse hoy?")) return;
    try {
      const { data } = await api.post("/api/superadmin/billing/run");
      const r = data.data || {};
      toast.success(`Listo: ${r.charged || 0} cobrados, ${r.grace || 0} en gracia, ${r.suspended || 0} suspendidos`);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error al revisar cobros");
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("La confirmación no coincide");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }
    setPasswordBusy(true);
    try {
      await api.post("/api/superadmin/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Contraseña actualizada");
      setShowPassword(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err?.response?.data?.message || "No se pudo cambiar la contraseña");
    } finally {
      setPasswordBusy(false);
    }
  };

  const renderSunatFields = (src, setSrc, hasExistingCert = false) => (
    <div className="grid sm:grid-cols-2 gap-3">
      <div>
        <Label>RUC emisor (11 dígitos) *</Label>
        <Input className="mt-1" value={src.ruc} onChange={(e) => setSrc((s) => ({ ...s, ruc: e.target.value }))} inputMode="numeric" />
      </div>
      <div>
        <Label>Razón social *</Label>
        <Input className="mt-1" value={src.businessName} onChange={(e) => setSrc((s) => ({ ...s, businessName: e.target.value }))} />
      </div>
      <div className="sm:col-span-2">
        <Label>Dirección fiscal *</Label>
        <Input className="mt-1" value={src.address} onChange={(e) => setSrc((s) => ({ ...s, address: e.target.value }))} />
      </div>
      <div>
        <Label>Ubigeo</Label>
        <Input className="mt-1" value={src.ubigeo} onChange={(e) => setSrc((s) => ({ ...s, ubigeo: e.target.value }))} />
      </div>
      <div>
        <Label>Ambiente SUNAT</Label>
        <Select value={src.environment} onValueChange={(v) => setSrc((s) => ({ ...s, environment: v }))}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="beta">Beta (pruebas)</SelectItem>
            <SelectItem value="produccion">Producción</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Usuario SOL *</Label>
        <Input className="mt-1" value={src.solUser} onChange={(e) => setSrc((s) => ({ ...s, solUser: e.target.value }))} />
      </div>
      <div>
        <Label>Clave SOL *</Label>
        <Input
          type="password"
          className="mt-1"
          value={src.solPass}
          onChange={(e) => setSrc((s) => ({ ...s, solPass: e.target.value }))}
          placeholder={hasExistingCert ? "Dejar vacío para no cambiar" : ""}
        />
      </div>
      <div>
        <Label>Serie factura</Label>
        <Input className="mt-1" value={src.seriesInvoice} onChange={(e) => setSrc((s) => ({ ...s, seriesInvoice: e.target.value.toUpperCase() }))} />
      </div>
      <div>
        <Label>Serie boleta</Label>
        <Input className="mt-1" value={src.seriesBoleta} onChange={(e) => setSrc((s) => ({ ...s, seriesBoleta: e.target.value.toUpperCase() }))} />
      </div>
      <div>
        <Label>Contraseña del certificado *</Label>
        <Input type="password" className="mt-1" value={src.certificatePassword} onChange={(e) => setSrc((s) => ({ ...s, certificatePassword: e.target.value }))} />
      </div>
      <div>
        <Label>Certificado digital (.p12) *</Label>
        <label className="mt-1 flex items-center justify-center gap-2 h-11 border border-dashed rounded-md cursor-pointer hover:bg-slate-50 text-sm text-slate-600">
          <Upload className="w-4 h-4" />
          {src.certificateP12 || hasExistingCert ? "Certificado listo — tocar para reemplazar" : "Subir archivo .p12"}
          <input type="file" accept=".p12,.pfx" className="hidden" onChange={(e) => readCertFile(e.target.files?.[0], setSrc)} />
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <header className="border-b bg-white dark:bg-slate-900 px-4 sm:px-6 py-2.5 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo size="header" imgClassName="max-h-9 w-auto" />
            <div className="min-w-0 border-l border-slate-200 dark:border-slate-700 pl-3">
              <div className="font-heading font-bold text-sm sm:text-base leading-tight truncate">Panel dueño</div>
              <div className="text-[11px] sm:text-xs text-slate-500 truncate hidden sm:block">
                Clientes y suscripciones
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setShowPassword(true)}>
              <KeyRound className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Mi contraseña</span>
            </Button>
            <Button variant="outline" size="icon" onClick={load} disabled={loading} title="Actualizar datos">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <LogOut className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto p-4 sm:p-6 w-full space-y-6">
        <Tabs value={pageTab} onValueChange={setPageTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
              <TabsTrigger value="clients" className="gap-2">
                <Users className="w-4 h-4" /> Clientes
              </TabsTrigger>
              <TabsTrigger value="overview" className="gap-2">
                <LayoutDashboard className="w-4 h-4" /> Resumen
              </TabsTrigger>
            </TabsList>
            {pageTab === "clients" && (
              <Button className="gap-2 bg-brand hover:bg-brand-dark" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" /> Nueva lavandería
              </Button>
            )}
          </div>

          <TabsContent value="overview" className="space-y-6 mt-0">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Clientes"
                value={stats?.tenantsTotal ?? "—"}
                onClick={() => goToClients("all")}
                active={pageTab === "clients" && statusFilter === "all"}
              />
              <StatCard
                label="MRR"
                value={stats ? fmt(stats.mrrCents) : "—"}
                accent="text-brand"
                hint="Ingreso recurrente mensual (IGV incl.)"
                extra={
                  stats ? (
                    <SubscriptionPriceBreakdown amount={stats.mrrCents / 100} compact className="mt-2" />
                  ) : null
                }
              />
              <StatCard
                label="Este mes"
                value={stats ? fmt(stats.revenueMonthCents) : "—"}
                accent="text-emerald-600"
                hint="Cobros registrados"
                extra={
                  stats ? (
                    <SubscriptionPriceBreakdown amount={stats.revenueMonthCents / 100} compact className="mt-2" />
                  ) : null
                }
              />
              <StatCard
                label="En gracia"
                value={stats?.byStatus?.grace ?? 0}
                accent="text-amber-600"
                hint="Clic para ver lista"
                onClick={() => goToClients("grace")}
                active={pageTab === "clients" && statusFilter === "grace"}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Ingresos últimos meses</CardTitle>
                <CardDescription>Cobros registrados por mes</CardDescription>
              </CardHeader>
              <CardContent>
                {loading && !stats ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin" /> Cargando estadísticas...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" fontSize={11} />
                      <YAxis fontSize={11} tickFormatter={(v) => `S/${v}`} />
                      <Tooltip formatter={(v) => [`S/ ${Number(v).toFixed(2)}`, "Ingresos"]} />
                      <Bar dataKey="total" fill="#7B1FA2" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-base flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-brand" /> Cobros automáticos
                </CardTitle>
                <CardDescription>
                  El sistema revisa cobros cada día. Usa este botón solo si necesitas forzar la revisión ahora.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Button variant="outline" onClick={runBilling} className="gap-2">
                  <Wallet className="w-4 h-4" /> Revisar cobros pendientes
                </Button>
                <p className="text-xs text-slate-500">
                  Cobra tarjetas registradas en Culqi o mueve a gracia/suspensión.{" "}
                  <strong>Registrar pago</strong> es solo para Yape/transferencia manual.
                </p>
              </CardContent>
            </Card>

            <div className="rounded-xl border bg-slate-50 dark:bg-slate-900/50 p-4 flex gap-3 text-sm text-slate-600">
              <Info className="w-5 h-5 shrink-0 text-brand mt-0.5" />
              <div className="space-y-1">
                <p><strong>30 días gratis</strong> desde el alta. Primer cobro al <strong>día 31</strong>, luego cada 30 días. Gracia: 5 días. Precios con <strong>IGV incluido</strong>. El desglose muestra tu neto, Culqi (~3,99% estimado) e IGV SUNAT (18%).</p>
                <p>El cliente paga en <strong>Configuración → Mi suscripción</strong> (Culqi: tarjeta o Yape). Demo: usuario <code className="text-xs bg-white px-1 rounded">demo</code>.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="clients" className="space-y-4 mt-0">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      className="pl-9"
                      placeholder="Buscar por nombre, admin o email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_FILTERS.map((f) => (
                      <Button
                        key={f.id}
                        type="button"
                        size="sm"
                        variant={statusFilter === f.id ? "default" : "outline"}
                        className={statusFilter === f.id ? "bg-brand hover:bg-brand-dark" : ""}
                        onClick={() => setStatusFilter(f.id)}
                      >
                        {f.label}
                        {f.id !== "all" && stats?.byStatus?.[f.id] != null ? ` (${stats.byStatus[f.id]})` : ""}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin" /> Cargando clientes...
                  </div>
                ) : filteredTenants.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                    <p className="font-medium text-slate-700">No hay clientes con estos filtros</p>
                    <p className="text-sm text-slate-500 mt-1">Prueba otra búsqueda o crea una lavandería nueva.</p>
                    <Button className="mt-4 gap-2 bg-brand hover:bg-brand-dark" onClick={() => setShowCreate(true)}>
                      <Plus className="w-4 h-4" /> Nueva lavandería
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Negocio</TableHead>
                            <TableHead>Precio ({SUBSCRIPTION_IGV_NOTE})</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>1er cobro</TableHead>
                            <TableHead>SUNAT</TableHead>
                            <TableHead className="text-right w-[70px]">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTenants.map((t) => (
                            <TableRow key={t._id} className="group">
                              <TableCell>
                                <div className="font-medium">{t.name}</div>
                                {t.owner?.username && (
                                  <div className="text-xs text-slate-500">@{t.owner.username}</div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{fmtSubscriptionPrice(t.monthlyPrice)}</div>
                                <SubscriptionPriceBreakdown amount={t.monthlyPrice} compact className="mt-1" />
                              </TableCell>
                              <TableCell><StatusBadge status={t.billingStatus} /></TableCell>
                              <TableCell className="text-slate-600">{fmtDate(t.firstChargeAt)}</TableCell>
                              <TableCell>
                                {t.sunatSummary?.enabled ? (
                                  <span className="text-emerald-700 text-xs font-medium">Activo</span>
                                ) : (
                                  <span className="text-slate-400 text-xs">Sin facturación</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-52">
                                    <DropdownMenuItem onClick={() => openClientEdit(t, "general")}>
                                      <Pencil className="w-4 h-4 mr-2" /> Editar datos
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openClientEdit(t, "sunat")}>
                                      <FileText className="w-4 h-4 mr-2" /> Facturación SUNAT
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => markPaid(t)}>
                                      <Wallet className="w-4 h-4 mr-2" /> Registrar pago manual
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="md:hidden divide-y">
                      {filteredTenants.map((t) => (
                        <div key={t._id} className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold">{t.name}</div>
                              <div className="text-sm font-medium">{fmtSubscriptionPrice(t.monthlyPrice)}/mes</div>
                              <SubscriptionPriceBreakdown amount={t.monthlyPrice} compact className="mt-1" />
                            </div>
                            <StatusBadge status={t.billingStatus} />
                          </div>
                          <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                            <span>1er cobro: {fmtDate(t.firstChargeAt)}</span>
                            <span>SUNAT: {t.sunatSummary?.enabled ? "Activo" : "No"}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => openClientEdit(t, "general")}>
                              Editar
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => markPaid(t)}>
                              Pago manual
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) resetCreateForm(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand" /> Nueva lavandería
            </DialogTitle>
            <DialogDescription>Crea el negocio y la cuenta admin del cliente.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitTenant} className="space-y-5">
            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-3">Negocio</h4>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Nombre lavandería *</Label>
                  <Input className="mt-1" value={form.name} onChange={set("name")} required />
                </div>
                <div>
                  <Label>Precio mensual (PEN, {SUBSCRIPTION_IGV_NOTE}) *</Label>
                  <Input type="number" min="1" step="0.01" className="mt-1" value={form.monthlyPrice} onChange={set("monthlyPrice")} required />
                  <SubscriptionPriceBreakdown amount={form.monthlyPrice} className="mt-2" />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-3">Cuenta administrador</h4>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Nombre *</Label><Input className="mt-1" value={form.adminName} onChange={set("adminName")} required /></div>
                <div><Label>Usuario *</Label><Input className="mt-1" value={form.adminUsername} onChange={set("adminUsername")} required /></div>
                <div><Label>Email</Label><Input type="email" className="mt-1" value={form.adminEmail} onChange={set("adminEmail")} /></div>
                <div><Label>Contraseña *</Label><Input type="password" className="mt-1" value={form.adminPassword} onChange={set("adminPassword")} minLength={8} required /></div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-3">Contacto (opcional)</h4>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>WhatsApp</Label><Input className="mt-1" value={form.contactPhone} onChange={set("contactPhone")} /></div>
                <div><Label>Email de cobro</Label><Input className="mt-1" value={form.billingEmail} onChange={set("billingEmail")} /></div>
                <div className="sm:col-span-2"><Label>Notas del contrato</Label><Input className="mt-1" value={form.contractNotes} onChange={set("contractNotes")} /></div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={form.sunatEnabled}
                  onChange={(e) => setForm((f) => ({ ...f, sunatEnabled: e.target.checked }))}
                />
                <FileText className="w-4 h-4 text-brand" />
                Configurar facturación SUNAT ahora
              </label>
              {form.sunatEnabled && renderSunatFields(form, setForm, false)}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button type="submit" disabled={createBusy} className="bg-brand hover:bg-brand-dark">
                {createBusy ? "Creando..." : "Crear cliente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editClient} onOpenChange={(open) => !open && closeClientEdit()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{editClient?.name}</DialogTitle>
            <DialogDescription>Gestiona datos del cliente, suscripción y SUNAT en un solo lugar.</DialogDescription>
          </DialogHeader>

          <Tabs value={clientEditTab} onValueChange={setClientEditTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">Datos y suscripción</TabsTrigger>
              <TabsTrigger value="sunat">Facturación SUNAT</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-4">
              <form onSubmit={saveClientEdit} className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <Label>Nombre del negocio *</Label>
                    <Input className="mt-1" value={clientForm.name} onChange={(e) => setClientForm((f) => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div>
                    <Label>Precio mensual (PEN, {SUBSCRIPTION_IGV_NOTE}) *</Label>
                    <Input type="number" min="1" step="0.01" className="mt-1" value={clientForm.monthlyPrice} onChange={(e) => setClientForm((f) => ({ ...f, monthlyPrice: e.target.value }))} required />
                    <SubscriptionPriceBreakdown amount={clientForm.monthlyPrice} className="mt-2" />
                  </div>
                  <div>
                    <Label>Estado de suscripción</Label>
                    <Select value={clientForm.billingStatus} onValueChange={(v) => setClientForm((f) => ({ ...f, billingStatus: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial">Prueba (30 días)</SelectItem>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="grace">Gracia</SelectItem>
                        <SelectItem value="suspended">Suspendido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Teléfono</Label><Input className="mt-1" value={clientForm.contactPhone} onChange={(e) => setClientForm((f) => ({ ...f, contactPhone: e.target.value }))} /></div>
                  <div><Label>Email contacto</Label><Input type="email" className="mt-1" value={clientForm.contactEmail} onChange={(e) => setClientForm((f) => ({ ...f, contactEmail: e.target.value }))} /></div>
                  <div className="sm:col-span-2"><Label>Email Culqi / facturación</Label><Input type="email" className="mt-1" value={clientForm.billingEmail} onChange={(e) => setClientForm((f) => ({ ...f, billingEmail: e.target.value }))} /></div>
                  <div className="sm:col-span-2"><Label>Notas</Label><Input className="mt-1" value={clientForm.contractNotes} onChange={(e) => setClientForm((f) => ({ ...f, contractNotes: e.target.value }))} /></div>
                </div>
                {editClient?.owner && (
                  <p className="text-xs text-slate-500 pt-1">
                    Admin: {editClient.owner.username || editClient.owner.name}
                    {editClient.owner.email ? ` · ${editClient.owner.email}` : ""}
                  </p>
                )}

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-700">Estado de acceso</div>
                    <div className="text-sm mt-1">{clientAccessLabel(editClient)}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editClient?.status !== "inactive" && (
                      <Button type="button" variant="outline" size="sm" disabled={actionBusy} onClick={pauseClient} className="gap-1.5">
                        <Pause className="w-3.5 h-3.5" /> Pausar
                      </Button>
                    )}
                    {editClient?.billingStatus !== "suspended" && editClient?.status !== "suspended" && (
                      <Button type="button" variant="outline" size="sm" disabled={actionBusy} onClick={blockClient} className="gap-1.5 text-amber-800 border-amber-200 hover:bg-amber-50">
                        <Ban className="w-3.5 h-3.5" /> Bloquear
                      </Button>
                    )}
                    {(editClient?.status === "inactive" || editClient?.billingStatus === "suspended" || editClient?.status === "suspended") && (
                      <Button type="button" variant="outline" size="sm" disabled={actionBusy} onClick={reactivateClient} className="gap-1.5 text-emerald-800 border-emerald-200 hover:bg-emerald-50">
                        <RotateCcw className="w-3.5 h-3.5" /> Reactivar
                      </Button>
                    )}
                    <Button type="button" variant="destructive" size="sm" disabled={actionBusy} onClick={deleteClient} className="gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </Button>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    <strong>Pausar:</strong> no puede entrar ni usar el POS. <strong>Bloquear:</strong> suspendido (como mora).
                    <strong> Eliminar:</strong> borra la lavandería, usuarios y datos.
                  </p>
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={closeClientEdit}>Cancelar</Button>
                  <Button type="submit" disabled={clientBusy} className="bg-brand hover:bg-brand-dark">
                    {clientBusy ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            <TabsContent value="sunat" className="mt-4 space-y-4">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={editSunat.enabled} onChange={(e) => setEditSunat((s) => ({ ...s, enabled: e.target.checked }))} />
                Activar facturación electrónica para este cliente
              </label>
              {editSunat.enabled && renderSunatFields(editSunat, setEditSunat, !!editClient?.sunatSummary?.hasCertificate)}
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={closeClientEdit}>Cancelar</Button>
                {editSunat.enabled && (
                  <Button type="button" variant="outline" onClick={testSunatEdit} disabled={sunatBusy}>Probar conexión</Button>
                )}
                <Button type="button" onClick={saveSunatEdit} disabled={sunatBusy} className="bg-brand hover:bg-brand-dark">
                  {sunatBusy ? "Guardando..." : "Guardar SUNAT"}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={showPassword} onOpenChange={setShowPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar contraseña de superadmin</DialogTitle>
          </DialogHeader>
          <form onSubmit={changePassword} className="space-y-3">
            <div><Label>Contraseña actual *</Label><Input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))} required /></div>
            <div><Label>Nueva contraseña *</Label><Input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))} minLength={8} required /></div>
            <div><Label>Confirmar *</Label><Input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))} minLength={8} required /></div>
            <p className="text-xs text-slate-500">Mínimo 8 caracteres.</p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPassword(false)}>Cancelar</Button>
              <Button type="submit" disabled={passwordBusy} className="bg-brand hover:bg-brand-dark">
                {passwordBusy ? "Guardando..." : "Actualizar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
}
