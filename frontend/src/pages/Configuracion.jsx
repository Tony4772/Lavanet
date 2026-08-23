import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { Save, RefreshCw, Mail, Send, Clock } from "lucide-react";
import { useApp, fmtMoney, fmtDate } from "../context/AppContext";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { PAYMENT_METHODS, ORDER_STATUSES } from "../lib/seed";
import { STATUS_STYLE } from "../lib/seed";

export default function Configuracion() {
  const { data, setData, resetDemo } = useApp();
  const [cfg, setCfg] = useState(data.config);
  const [schedule, setSchedule] = useState(data.reportSchedule || { enabled: false, email: "", lastSentAt: null, hourOfDay: 22 });
  const currency = data.config.business.currencySymbol;

  const todayReport = useMemo(() => {
    const key = new Date().toDateString();
    const todaysOrders = data.orders.filter(o => new Date(o.createdAt).toDateString() === key);
    const revenue = todaysOrders.reduce((s, o) => s + o.total, 0);
    const byPay = {};
    todaysOrders.forEach(o => { byPay[o.paymentMethod] = (byPay[o.paymentMethod] || 0) + o.total; });
    const delivered = todaysOrders.filter(o => o.status === "Entregada").length;
    const pending = todaysOrders.filter(o => !["Entregada", "Cancelada"].includes(o.status)).length;
    return { count: todaysOrders.length, revenue, byPay, delivered, pending, orders: todaysOrders };
  }, [data.orders]);

  const save = () => {
    setData(prev => ({ ...prev, config: cfg, reportSchedule: schedule }));
    toast.success("Configuración guardada");
  };
  const reset = () => {
    if (!window.confirm("Esto restaurará todos los datos demo (clientes, órdenes, servicios, etc.). ¿Continuar?")) return;
    resetDemo();
    toast.success("Datos demo restaurados");
  };

  const buildReportBody = () => {
    const symbol = currency;
    const dateStr = new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
    const byPayLines = Object.entries(todayReport.byPay).map(([m, v]) => `  • ${m}: ${symbol} ${v.toFixed(2)}`).join("\n") || "  (sin ventas)";
    return `Reporte diario ${cfg.business.name}\nFecha: ${dateStr}\n\n== Resumen ==\nÓrdenes del día: ${todayReport.count}\nEntregadas: ${todayReport.delivered}\nPendientes: ${todayReport.pending}\nIngresos totales: ${symbol} ${todayReport.revenue.toFixed(2)}\n\n== Ingresos por método de pago ==\n${byPayLines}\n\n== Últimas órdenes ==\n${todayReport.orders.slice(0, 10).map(o => `  ${o.number}  ${o.customerName}  ${symbol} ${o.total.toFixed(2)}  [${o.status}]`).join("\n") || "  (sin órdenes)"}\n\nDescarga el PDF completo desde el módulo Reportes.\n\n— ${cfg.business.name} · ${cfg.business.email}`;
  };

  const sendReportNow = () => {
    if (!schedule.email) { toast.error("Configura primero el email del administrador"); return; }
    const subject = encodeURIComponent(`[${cfg.business.name}] Reporte diario · ${new Date().toLocaleDateString("es-PE")}`);
    const body = encodeURIComponent(buildReportBody());
    window.open(`mailto:${schedule.email}?subject=${subject}&body=${body}`, "_blank");
    const now = new Date().toISOString();
    setSchedule(s => ({ ...s, lastSentAt: now }));
    setData(prev => ({ ...prev, reportSchedule: { ...(prev.reportSchedule || {}), ...schedule, lastSentAt: now } }));
    toast.success("Abriendo tu cliente de correo con el reporte del día");
  };

  return (
    <div data-testid="configuracion-page" className="space-y-6 animate-fadeInUp">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight">Configuración</h1><p className="text-slate-500 mt-1">Ajustes generales del sistema</p></div>
        <div className="flex gap-2">
          <Button data-testid="config-reset" onClick={reset} variant="outline" className="h-10 gap-2"><RefreshCw className="w-4 h-4" /> Restaurar demo</Button>
          <Button data-testid="config-save" onClick={save} className="bg-blue-600 hover:bg-blue-700 h-10 gap-2"><Save className="w-4 h-4" /> Guardar</Button>
        </div>
      </div>

      <Tabs defaultValue="business" className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 h-auto flex-wrap justify-start">
          <TabsTrigger value="business" data-testid="tab-business">Negocio</TabsTrigger>
          <TabsTrigger value="payments" data-testid="tab-payments">Métodos de pago</TabsTrigger>
          <TabsTrigger value="tax" data-testid="tab-tax">Impuestos</TabsTrigger>
          <TabsTrigger value="statuses" data-testid="tab-statuses">Estados</TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="report" data-testid="tab-report">Reporte diario</TabsTrigger>
          <TabsTrigger value="appearance" data-testid="tab-appearance">Apariencia</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="mt-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Nombre del negocio</Label><Input data-testid="cfg-name" value={cfg.business.name} onChange={(e) => setCfg(v => ({ ...v, business: { ...v.business, name: e.target.value } }))} /></div>
              <div><Label>Slogan</Label><Input value={cfg.business.tagline} onChange={(e) => setCfg(v => ({ ...v, business: { ...v.business, tagline: e.target.value } }))} /></div>
            </div>
            <div><Label>Dirección</Label><Input value={cfg.business.address} onChange={(e) => setCfg(v => ({ ...v, business: { ...v.business, address: e.target.value } }))} /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Teléfono</Label><Input value={cfg.business.phone} onChange={(e) => setCfg(v => ({ ...v, business: { ...v.business, phone: e.target.value } }))} /></div>
              <div><Label>Email</Label><Input value={cfg.business.email} onChange={(e) => setCfg(v => ({ ...v, business: { ...v.business, email: e.target.value } }))} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label>RUC</Label><Input value={cfg.business.ruc} onChange={(e) => setCfg(v => ({ ...v, business: { ...v.business, ruc: e.target.value } }))} /></div>
              <div><Label>Moneda</Label><Input value={cfg.business.currency} onChange={(e) => setCfg(v => ({ ...v, business: { ...v.business, currency: e.target.value } }))} /></div>
              <div><Label>Símbolo</Label><Input value={cfg.business.currencySymbol} onChange={(e) => setCfg(v => ({ ...v, business: { ...v.business, currencySymbol: e.target.value } }))} /></div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-xl">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">Métodos de pago habilitados</div>
            <div className="space-y-2">
              {PAYMENT_METHODS.map(m => (
                <div key={m} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                  <span className="text-sm font-medium">{m}</span>
                  <Switch defaultChecked />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tax" className="mt-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <div><Label>Aplicar impuestos</Label><p className="text-xs text-slate-500 mt-1">Incluir IGV en las ventas</p></div>
              <Switch checked={cfg.tax.enabled} onCheckedChange={(v) => setCfg(x => ({ ...x, tax: { ...x.tax, enabled: v } }))} />
            </div>
            <div><Label>Nombre del impuesto</Label><Input value={cfg.tax.name} onChange={(e) => setCfg(v => ({ ...v, tax: { ...v.tax, name: e.target.value } }))} /></div>
            <div><Label>Tasa (%)</Label><Input data-testid="cfg-tax-rate" type="number" step="0.01" value={cfg.tax.rate * 100} onChange={(e) => setCfg(v => ({ ...v, tax: { ...v.tax, rate: (Number(e.target.value) || 0) / 100 } }))} /></div>
          </div>
        </TabsContent>

        <TabsContent value="statuses" className="mt-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">Estados del flujo de órdenes</div>
            <div className="flex flex-wrap gap-2">
              {ORDER_STATUSES.map(s => (
                <span key={s} className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLE[s]}`}>{s}</span>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-xl space-y-3">
            {[
              { k: "lowStock", label: "Alertas de stock bajo", hint: "Notificar cuando un producto esté por debajo del mínimo" },
              { k: "newSale", label: "Nueva venta", hint: "Notificar cuando se registra una nueva venta" },
              { k: "orderReady", label: "Orden lista", hint: "Notificar cuando una orden esté lista para entregar" },
              { k: "cashClose", label: "Cierre de caja", hint: "Notificar tras el cierre de caja" },
            ].map(opt => (
              <div key={opt.k} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                <div><Label>{opt.label}</Label><p className="text-xs text-slate-500 mt-1">{opt.hint}</p></div>
                <Switch checked={cfg.notifications[opt.k]} onCheckedChange={(v) => setCfg(x => ({ ...x, notifications: { ...x.notifications, [opt.k]: v } }))} />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="report" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Mail className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-heading font-bold text-slate-900">Envío automático diario</h3>
                  <p className="text-xs text-slate-500">Recibe el reporte del día por email cada noche</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                <div><Label>Habilitar envío diario</Label><p className="text-xs text-slate-500 mt-1">Se enviará automáticamente al terminar el día</p></div>
                <Switch data-testid="report-enabled" checked={schedule.enabled} onCheckedChange={(v) => setSchedule(s => ({ ...s, enabled: v }))} />
              </div>
              <div>
                <Label>Email del administrador</Label>
                <Input data-testid="report-email" type="email" value={schedule.email} onChange={(e) => setSchedule(s => ({ ...s, email: e.target.value }))} placeholder="admin@lavanet.pe" className="mt-1" />
              </div>
              <div>
                <Label>Hora de envío (24h)</Label>
                <Input data-testid="report-hour" type="number" min={0} max={23} value={schedule.hourOfDay} onChange={(e) => setSchedule(s => ({ ...s, hourOfDay: Math.max(0, Math.min(23, Number(e.target.value) || 22)) }))} className="mt-1 w-24" />
              </div>
              {schedule.lastSentAt && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                  <Clock className="w-3.5 h-3.5" /> Último envío: {fmtDate(schedule.lastSentAt, true)}
                </div>
              )}
              <Button data-testid="report-send-now" onClick={sendReportNow} className="w-full bg-blue-600 hover:bg-blue-700 gap-2 h-11">
                <Send className="w-4 h-4" /> Enviar reporte de hoy ahora
              </Button>
              <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                💡 Al presionar &quot;Enviar&quot;, se abrirá tu cliente de correo con el asunto y cuerpo listos. El envío automático nocturno requiere mantener la aplicación abierta durante la hora configurada.
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">Vista previa del reporte de hoy</div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-slate-50 rounded-lg p-3"><div className="text-[10px] uppercase text-slate-500 font-semibold">Órdenes</div><div className="mt-1 font-heading font-extrabold text-xl">{todayReport.count}</div></div>
                <div className="bg-slate-50 rounded-lg p-3"><div className="text-[10px] uppercase text-slate-500 font-semibold">Ingresos</div><div className="mt-1 font-heading font-extrabold text-xl text-emerald-600">{fmtMoney(todayReport.revenue, currency)}</div></div>
                <div className="bg-slate-50 rounded-lg p-3"><div className="text-[10px] uppercase text-slate-500 font-semibold">Entregadas</div><div className="mt-1 font-heading font-extrabold text-xl">{todayReport.delivered}</div></div>
                <div className="bg-slate-50 rounded-lg p-3"><div className="text-[10px] uppercase text-slate-500 font-semibold">Pendientes</div><div className="mt-1 font-heading font-extrabold text-xl text-amber-600">{todayReport.pending}</div></div>
              </div>
              <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Por método de pago</div>
              <div className="space-y-1 text-sm">
                {Object.entries(todayReport.byPay).length === 0 && <div className="text-xs text-slate-400">Sin ventas del día</div>}
                {Object.entries(todayReport.byPay).map(([m, v]) => (
                  <div key={m} className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-600">{m}</span>
                    <span className="font-semibold">{fmtMoney(v, currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-xl">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">Tema visual</div>
            <div className="flex flex-wrap gap-3">
              <div className="border-2 border-blue-600 rounded-lg p-4 cursor-pointer">
                <div className="w-32 h-16 rounded bg-gradient-to-br from-blue-600 to-blue-800"></div>
                <div className="text-xs font-semibold text-slate-800 mt-2">Azul (por defecto)</div>
              </div>
              <div className="border border-slate-200 rounded-lg p-4 cursor-pointer opacity-40">
                <div className="w-32 h-16 rounded bg-gradient-to-br from-slate-700 to-slate-900"></div>
                <div className="text-xs font-semibold text-slate-800 mt-2">Oscuro (próximo)</div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
