import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign, ShoppingBag, Clock, PackageCheck, Users, TrendingUp,
  Calendar, ArrowUpRight, ArrowDownRight, Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";
import { useApp, fmtMoney, fmtDate } from "../context/AppContext";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "../components/ui/button";

const KpiCard = ({ label, value, hint, delta, icon: Icon, tone = "blue", testId }) => {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
  };
  const positive = delta && delta >= 0;
  return (
    <div data-testid={testId} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tones[tone]}`}>
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
        {delta !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${positive ? "text-emerald-600" : "text-rose-600"}`}>
            {positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(delta)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
        <div className="text-2xl font-heading font-extrabold text-slate-900 mt-1 tracking-tight">{value}</div>
        {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
      </div>
    </div>
  );
};

const CHART_COLORS = ["#1A56DB", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#EF4444"];

export default function Dashboard() {
  const { data, currentUser } = useApp();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const thisMonth = new Date().getMonth();

    const salesToday = data.orders.filter(o => new Date(o.createdAt).toDateString() === today).reduce((s, o) => s + o.total, 0);
    const salesMonth = data.orders.filter(o => new Date(o.createdAt).getMonth() === thisMonth).reduce((s, o) => s + o.total, 0);
    const pending = data.orders.filter(o => !["Entregada", "Cancelada"].includes(o.status)).length;
    const ready = data.orders.filter(o => o.status === "Lista para entregar").length;
    const avgTicket = data.orders.length ? data.orders.reduce((s, o) => s + o.total, 0) / data.orders.length : 0;

    const salesByDay = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toDateString();
      const total = data.orders.filter(o => new Date(o.createdAt).toDateString() === key).reduce((s, o) => s + o.total, 0);
      return { day: d.toLocaleDateString("es-PE", { weekday: "short" }), total: Math.round(total) };
    });
    const weekIncome = salesByDay.reduce((s, x) => s + x.total, 0);

    const statusCount = {};
    data.orders.forEach(o => { statusCount[o.status] = (statusCount[o.status] || 0) + 1; });
    const ordersByStatus = Object.entries(statusCount).map(([status, count]) => ({ status, count }));

    const svcTally = {};
    data.orders.forEach(o => o.items.forEach(it => {
      svcTally[it.name] = (svcTally[it.name] || 0) + it.qty;
    }));
    const topServices = Object.entries(svcTally).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([name, qty]) => ({ name: name.length > 20 ? name.slice(0, 20) + "…" : name, qty }));

    const catTally = {};
    data.orders.forEach(o => o.items.forEach(it => {
      catTally[it.category] = (catTally[it.category] || 0) + (it.price * it.qty);
    }));
    const revByCat = Object.entries(catTally).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value).slice(0, 6);

    return { salesToday, salesMonth, pending, ready, avgTicket, salesByDay, weekIncome, ordersByStatus, topServices, revByCat };
  }, [data.orders]);

  const recentOrders = [...data.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
  const currency = data.config.business.currencySymbol;

  return (
    <div data-testid="dashboard-page" className="space-y-6 animate-fadeInUp">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-blue-600 font-semibold">Panel ejecutivo</div>
          <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-slate-900 mt-1 tracking-tight">
            Hola, {currentUser?.name?.split(" ")[0] || "Usuario"} 👋
          </h1>
          <p className="text-slate-500 mt-1">Aquí está el resumen del negocio en tiempo real.</p>
        </div>
        <Button data-testid="dashboard-new-sale" onClick={() => navigate("/pos")} className="bg-blue-600 hover:bg-blue-700 gap-2 h-11">
          <Sparkles className="w-4 h-4" /> Nueva venta
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard testId="kpi-sales-today" label="Ventas de hoy" value={fmtMoney(stats.salesToday, currency)} delta={12} icon={DollarSign} tone="blue" />
        <KpiCard testId="kpi-sales-month" label="Ventas del mes" value={fmtMoney(stats.salesMonth, currency)} delta={8} icon={TrendingUp} tone="emerald" />
        <KpiCard testId="kpi-pending" label="Órdenes pendientes" value={stats.pending} hint="En proceso" icon={Clock} tone="amber" />
        <KpiCard testId="kpi-ready" label="Listas para entregar" value={stats.ready} hint="Requieren entrega" icon={PackageCheck} tone="violet" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard testId="kpi-customers" label="Clientes registrados" value={data.customers.length} icon={Users} tone="blue" />
        <KpiCard testId="kpi-avg-ticket" label="Ticket promedio" value={fmtMoney(stats.avgTicket, currency)} icon={ShoppingBag} tone="emerald" />
        <KpiCard testId="kpi-week-income" label="Ingresos semana" value={fmtMoney(stats.weekIncome, currency)} delta={-3} icon={Calendar} tone="amber" />
        <KpiCard testId="kpi-orders-total" label="Total órdenes" value={data.orders.length} icon={ShoppingBag} tone="violet" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-bold text-slate-900">Ventas por día</h3>
              <p className="text-xs text-slate-500 mt-0.5">Últimos 7 días</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.salesByDay}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1A56DB" stopOpacity={0.35}/>
                  <stop offset="100%" stopColor="#1A56DB" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `S/${v}`} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v) => [`S/ ${v}`, "Ventas"]} />
              <Area type="monotone" dataKey="total" stroke="#1A56DB" strokeWidth={2.5} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-heading font-bold text-slate-900">Órdenes por estado</h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">Distribución actual</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={stats.ordersByStatus} dataKey="count" nameKey="status" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {stats.ordersByStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto">
            {stats.ordersByStatus.map((s, i) => (
              <div key={s.status} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} /><span className="text-slate-600">{s.status}</span></div>
                <span className="font-semibold text-slate-900">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-heading font-bold text-slate-900">Servicios más vendidos</h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">Top 5 servicios</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.topServices} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={120} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Bar dataKey="qty" fill="#1A56DB" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-heading font-bold text-slate-900">Ingresos por categoría</h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">En soles (PEN)</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.revByCat}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} angle={-15} textAnchor="end" height={60} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `S/${v}`} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v) => [`S/ ${v}`, "Ingresos"]} />
              <Bar dataKey="value" fill="#10B981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="font-heading font-bold text-slate-900">Órdenes recientes</h3>
            <p className="text-xs text-slate-500 mt-0.5">Últimas 6 órdenes registradas</p>
          </div>
          <button data-testid="view-all-orders" onClick={() => navigate("/ordenes")} className="text-sm font-semibold text-blue-600 hover:text-blue-700">Ver todas →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-slate-500 bg-slate-50/50">
                <th className="text-left px-6 py-3 font-semibold">Número</th>
                <th className="text-left px-6 py-3 font-semibold">Cliente</th>
                <th className="text-left px-6 py-3 font-semibold">Fecha</th>
                <th className="text-left px-6 py-3 font-semibold">Servicios</th>
                <th className="text-right px-6 py-3 font-semibold">Total</th>
                <th className="text-left px-6 py-3 font-semibold">Estado</th>
                <th className="text-left px-6 py-3 font-semibold">Entrega</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(o => (
                <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50/60 cursor-pointer" onClick={() => navigate("/ordenes")}>
                  <td className="px-6 py-3.5"><span className="font-mono text-sm font-semibold text-blue-600">{o.number}</span></td>
                  <td className="px-6 py-3.5 text-sm text-slate-700">{o.customerName}</td>
                  <td className="px-6 py-3.5 text-sm text-slate-600">{fmtDate(o.createdAt)}</td>
                  <td className="px-6 py-3.5 text-sm text-slate-600">{o.items.length} servicios</td>
                  <td className="px-6 py-3.5 text-sm text-right font-semibold text-slate-900">{fmtMoney(o.total, currency)}</td>
                  <td className="px-6 py-3.5"><StatusBadge status={o.status} /></td>
                  <td className="px-6 py-3.5 text-sm text-slate-600">{fmtDate(o.promisedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
