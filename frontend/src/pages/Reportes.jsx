import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileDown, Printer } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { useApp, fmtMoney, fmtDate } from "../context/AppContext";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

const COLORS = ["#1A56DB", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#EF4444", "#84CC16"];

export default function Reportes() {
  const { data } = useApp();
  const currency = data.config.business.currencySymbol;
  const today = new Date();
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); });
  const [to, setTo] = useState(today.toISOString().slice(0, 10));

  const range = useMemo(() => {
    const start = new Date(from); start.setHours(0,0,0,0);
    const end = new Date(to); end.setHours(23,59,59,999);
    const orders = data.orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= start && d <= end;
    });

    // daily
    const days = {};
    orders.forEach(o => {
      const k = new Date(o.createdAt).toISOString().slice(0, 10);
      days[k] = (days[k] || 0) + o.total;
    });
    const daily = Object.entries(days).sort((a, b) => a[0].localeCompare(b[0])).map(([d, v]) => ({ date: d.slice(5), total: Math.round(v) }));

    // monthly
    const months = {};
    orders.forEach(o => {
      const d = new Date(o.createdAt);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[k] = (months[k] || 0) + o.total;
    });
    const monthly = Object.entries(months).sort().map(([m, v]) => ({ month: m, total: Math.round(v) }));

    // services
    const svc = {};
    orders.forEach(o => o.items.forEach(it => { svc[it.name] = (svc[it.name] || 0) + it.qty; }));
    const topSvc = Object.entries(svc).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, qty]) => ({ name: name.length > 22 ? name.slice(0, 22) + "…" : name, qty }));

    // customers
    const cust = {};
    orders.forEach(o => { cust[o.customerName] = (cust[o.customerName] || 0) + o.total; });
    const topCust = Object.entries(cust).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, total]) => ({ name, total: Math.round(total) }));

    // payments
    const pay = {};
    orders.forEach(o => { pay[o.paymentMethod] = (pay[o.paymentMethod] || 0) + o.total; });
    const byPay = Object.entries(pay).map(([name, value]) => ({ name, value: Math.round(value) }));

    // status
    const st = {};
    orders.forEach(o => { st[o.status] = (st[o.status] || 0) + 1; });
    const byStatus = Object.entries(st).map(([name, value]) => ({ name, value }));

    const revenue = orders.reduce((s, o) => s + o.total, 0);
    const estCost = revenue * 0.55;
    const estProfit = revenue - estCost;

    return { orders, daily, monthly, topSvc, topCust, byPay, byStatus, revenue, estCost, estProfit };
  }, [data.orders, from, to]);

  const resetRange = () => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    setFrom(d.toISOString().slice(0, 10));
    setTo(new Date().toISOString().slice(0, 10));
  };

  const downloadCSV = () => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["Numero", "Cliente", "Fecha", "Metodo pago", "Estado", "Subtotal", "Descuento", "IGV", "Total"].map(esc).join(",");
    const rows = range.orders.map(o => [
      o.number, o.customerName, new Date(o.createdAt).toLocaleString("es-PE"),
      o.paymentMethod, o.status, o.subtotal.toFixed(2), (o.discount || 0).toFixed(2), o.tax.toFixed(2), o.total.toFixed(2),
    ].map(esc).join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LAVANET_reporte_${from}_a_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV descargado");
  };

  const printPDF = () => {
    document.body.classList.add("print-mode-report");
    setTimeout(() => {
      window.print();
      document.body.classList.remove("print-mode-report");
    }, 100);
  };

  return (
    <div data-testid="reportes-page" className="space-y-6 animate-fadeInUp">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight">Reportes</h1>
          <p className="text-slate-500 mt-1">{range.orders.length} órdenes en el período seleccionado</p>
        </div>
        <div className="flex gap-2">
          <Button data-testid="reportes-export-csv" onClick={downloadCSV} variant="outline" className="h-10 gap-2"><FileDown className="w-4 h-4" /> Exportar CSV</Button>
          <Button data-testid="reportes-print-pdf" onClick={printPDF} className="bg-blue-600 hover:bg-blue-700 h-10 gap-2"><Printer className="w-4 h-4" /> Imprimir / PDF</Button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-3 md:items-end">
        <div><Label className="text-xs">Desde</Label><Input data-testid="reportes-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10 mt-1" /></div>
        <div><Label className="text-xs">Hasta</Label><Input data-testid="reportes-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10 mt-1" /></div>
        <Button variant="outline" onClick={resetRange} className="h-10">Últimos 30 días</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5"><div className="text-xs uppercase text-slate-500 font-semibold">Ingresos</div><div className="mt-2 font-heading font-extrabold text-2xl text-blue-600">{fmtMoney(range.revenue, currency)}</div></div>
        <div className="bg-white border border-slate-200 rounded-xl p-5"><div className="text-xs uppercase text-slate-500 font-semibold">Costo estimado (55%)</div><div className="mt-2 font-heading font-extrabold text-2xl text-slate-700">{fmtMoney(range.estCost, currency)}</div></div>
        <div className="bg-white border border-slate-200 rounded-xl p-5"><div className="text-xs uppercase text-slate-500 font-semibold">Rentabilidad</div><div className="mt-2 font-heading font-extrabold text-2xl text-emerald-600">{fmtMoney(range.estProfit, currency)}</div></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-heading font-bold text-slate-900 mb-4">Ventas diarias</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={range.daily}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="date" stroke="#94a3b8" fontSize={11} /><YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `S/${v}`} /><Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v) => [`${currency} ${v}`, "Ventas"]} /><Line type="monotone" dataKey="total" stroke="#1A56DB" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} /></LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-heading font-bold text-slate-900 mb-4">Ventas mensuales</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={range.monthly}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} /><XAxis dataKey="month" stroke="#94a3b8" fontSize={11} /><YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `S/${v}`} /><Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v) => [`${currency} ${v}`, "Ventas"]} /><Bar dataKey="total" fill="#10B981" radius={[6, 6, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-heading font-bold text-slate-900 mb-4">Servicios más vendidos</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={range.topSvc} layout="vertical" margin={{ left: 10 }}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} /><XAxis type="number" stroke="#94a3b8" fontSize={11} /><YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={140} /><Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} /><Bar dataKey="qty" fill="#8B5CF6" radius={[0, 6, 6, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-heading font-bold text-slate-900 mb-4">Clientes frecuentes</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={range.topCust} layout="vertical" margin={{ left: 10 }}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} /><XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `S/${v}`} /><YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={140} /><Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v) => [`${currency} ${v}`, "Total"]} /><Bar dataKey="total" fill="#F59E0B" radius={[0, 6, 6, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-heading font-bold text-slate-900 mb-4">Ingresos por método de pago</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart><Pie data={range.byPay} dataKey="value" nameKey="name" outerRadius={90} label>{range.byPay.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v) => `${currency} ${v}`} /><Legend /></PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-heading font-bold text-slate-900 mb-4">Órdenes por estado</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart><Pie data={range.byStatus} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50} paddingAngle={2}>{range.byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Print-only container */}
      <div id="print-report" className="hidden">
        <div style={{ fontFamily: "IBM Plex Sans, sans-serif", color: "#000" }}>
          <div style={{ borderBottom: "2px solid #000", paddingBottom: 12, marginBottom: 20 }}>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1 }}>{data.config.business.name}</div>
            <div style={{ fontSize: 12, color: "#444" }}>{data.config.business.tagline} · {data.config.business.address}</div>
            <div style={{ fontSize: 12, color: "#444" }}>RUC: {data.config.business.ruc} · {data.config.business.phone}</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Reporte de Ventas</div>
          <div style={{ fontSize: 12, color: "#444", marginBottom: 20 }}>Período: {from} — {to}  ·  Generado: {new Date().toLocaleString("es-PE")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
            <div style={{ border: "1px solid #ddd", borderRadius: 6, padding: 12 }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", color: "#666", fontWeight: 700 }}>Ingresos</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{fmtMoney(range.revenue, currency)}</div>
            </div>
            <div style={{ border: "1px solid #ddd", borderRadius: 6, padding: 12 }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", color: "#666", fontWeight: 700 }}>Costo estimado</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{fmtMoney(range.estCost, currency)}</div>
            </div>
            <div style={{ border: "1px solid #ddd", borderRadius: 6, padding: 12 }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", color: "#666", fontWeight: 700 }}>Rentabilidad</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{fmtMoney(range.estProfit, currency)}</div>
            </div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Detalle de órdenes ({range.orders.length})</div>
          <table style={{ width: "100%", fontSize: 10, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #000", textAlign: "left" }}>
                <th style={{ padding: 6 }}>N°</th><th style={{ padding: 6 }}>Cliente</th><th style={{ padding: 6 }}>Fecha</th>
                <th style={{ padding: 6 }}>Pago</th><th style={{ padding: 6 }}>Estado</th><th style={{ padding: 6, textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {range.orders.map(o => (
                <tr key={o.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 6, fontFamily: "monospace" }}>{o.number}</td>
                  <td style={{ padding: 6 }}>{o.customerName}</td>
                  <td style={{ padding: 6 }}>{fmtDate(o.createdAt)}</td>
                  <td style={{ padding: 6 }}>{o.paymentMethod}</td>
                  <td style={{ padding: 6 }}>{o.status}</td>
                  <td style={{ padding: 6, textAlign: "right", fontWeight: 700 }}>{fmtMoney(o.total, currency)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid #000" }}>
                <td colSpan={5} style={{ padding: 8, fontWeight: 700, textAlign: "right" }}>TOTAL</td>
                <td style={{ padding: 8, textAlign: "right", fontWeight: 800 }}>{fmtMoney(range.revenue, currency)}</td>
              </tr>
            </tfoot>
          </table>
          <div style={{ marginTop: 30, fontSize: 10, color: "#666", textAlign: "center" }}>Documento generado por {data.config.business.name} · {data.config.business.email}</div>
        </div>
      </div>
      <style>{`@media print { #print-report { display: block !important; } }`}</style>
    </div>
  );
}
