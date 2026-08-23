import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { Search, Filter, Eye, CheckCircle2 } from "lucide-react";
import { useApp, fmtMoney, fmtDate, buildWhatsAppLink, buildRescheduleLink } from "../context/AppContext";
import { ORDER_STATUSES, PAYMENT_METHODS } from "../lib/seed";
import { StatusBadge } from "../components/StatusBadge";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { MessageCircle, Calendar, Save } from "lucide-react";

const TIMELINE = ["Recibida", "Clasificación", "En lavado", "En secado", "Planchado", "Control de calidad", "Lista para entregar", "Entregada"];

const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function Ordenes() {
  const { data, updateOrderStatus, updateOrder } = useApp();
  const currency = data.config.business.currencySymbol;
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [payFilter, setPayFilter] = useState("Todos");
  const [selected, setSelected] = useState(null);
  const [newPromised, setNewPromised] = useState("");
  const [rescheduleLink, setRescheduleLink] = useState(null);

  const rows = useMemo(() => {
    return data.orders.filter(o => {
      if (statusFilter !== "Todos" && o.status !== statusFilter) return false;
      if (payFilter !== "Todos" && o.paymentMethod !== payFilter) return false;
      if (q && !o.number.toLowerCase().includes(q.toLowerCase()) && !o.customerName.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [data.orders, q, statusFilter, payFilter]);

  const changeStatus = (id, newStatus) => {
    updateOrderStatus(id, newStatus);
    toast.success(`Estado actualizado a ${newStatus}`);
    if (selected && selected.id === id) {
      const updated = data.orders.find(o => o.id === id);
      if (updated) setSelected({ ...updated, status: newStatus });
    }
  };

  const openDetail = (o) => {
    setSelected(o);
    setNewPromised(toLocalInput(o.promisedAt));
    setRescheduleLink(null);
  };

  const savePromised = () => {
    if (!selected || !newPromised) return;
    const iso = new Date(newPromised).toISOString();
    updateOrder(selected.id, { promisedAt: iso });
    const updated = { ...selected, promisedAt: iso };
    setSelected(updated);
    const cust = data.customers.find(c => c.id === selected.customerId);
    const link = cust ? buildRescheduleLink(cust, updated, data.config) : null;
    setRescheduleLink(link);
    toast.success("Fecha de entrega actualizada", {
      action: link ? { label: "Avisar por WhatsApp", onClick: () => window.open(link, "_blank", "noopener,noreferrer") } : undefined,
      duration: 8000,
    });
  };

  return (
    <div data-testid="ordenes-page" className="space-y-6 animate-fadeInUp">
      <div>
        <h1 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight">Órdenes</h1>
        <p className="text-slate-500 mt-1">{rows.length} órdenes encontradas</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input data-testid="ordenes-search" placeholder="Buscar por número o cliente..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger data-testid="ordenes-status-filter" className="h-10 w-full md:w-52"><Filter className="w-3.5 h-3.5 mr-2 text-slate-400" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos los estados</SelectItem>
            {ORDER_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={payFilter} onValueChange={setPayFilter}>
          <SelectTrigger data-testid="ordenes-pay-filter" className="h-10 w-full md:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos los pagos</SelectItem>
            {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-slate-500 bg-slate-50/50">
                <th className="text-left px-6 py-3 font-semibold">Nº Orden</th>
                <th className="text-left px-6 py-3 font-semibold">Cliente</th>
                <th className="text-left px-6 py-3 font-semibold">Recepción</th>
                <th className="text-left px-6 py-3 font-semibold">Entrega</th>
                <th className="text-right px-6 py-3 font-semibold">Total</th>
                <th className="text-left px-6 py-3 font-semibold">Estado</th>
                <th className="text-left px-6 py-3 font-semibold">Pago</th>
                <th className="text-right px-6 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(o => (
                <tr key={o.id} data-testid={`orden-row-${o.number}`} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-6 py-3.5"><span className="font-mono text-sm font-semibold text-brand">{o.number}</span></td>
                  <td className="px-6 py-3.5 text-sm text-slate-700">{o.customerName}</td>
                  <td className="px-6 py-3.5 text-sm text-slate-600">{fmtDate(o.createdAt)}</td>
                  <td className="px-6 py-3.5 text-sm text-slate-600">{fmtDate(o.promisedAt)}</td>
                  <td className="px-6 py-3.5 text-sm text-right font-semibold text-slate-900">{fmtMoney(o.total, currency)}</td>
                  <td className="px-6 py-3.5"><StatusBadge status={o.status} /></td>
                  <td className="px-6 py-3.5 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${o.paid ? "bg-emerald-500" : "bg-amber-500"}`} />
                      {o.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button data-testid={`orden-view-${o.number}`} onClick={() => openDetail(o)} className="text-brand hover:text-brand-dark"><Eye className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-slate-500 text-sm">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div>
                    <DialogTitle className="font-mono text-brand text-xl">{selected.number}</DialogTitle>
                    <p className="text-sm text-slate-500 mt-1">{selected.customerName} · {fmtDate(selected.createdAt, true)}</p>
                  </div>
                </div>
              </DialogHeader>
              {/* Timeline */}
              <div className="mt-2">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">Progreso de la orden</div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {TIMELINE.map((step, i) => {
                    const currentIdx = TIMELINE.indexOf(selected.status);
                    const done = currentIdx >= 0 && i <= currentIdx;
                    const active = TIMELINE[currentIdx] === step;
                    return (
                      <React.Fragment key={step}>
                        <button
                          data-testid={`timeline-${step}`}
                          onClick={() => changeStatus(selected.id, step)}
                          className={`shrink-0 flex flex-col items-center gap-1 group`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                            active ? "bg-brand text-white border-brand ring-4 ring-brand-soft" :
                            done ? "bg-emerald-500 text-white border-emerald-500" :
                            "bg-white text-slate-400 border-slate-200 group-hover:border-brand-muted"
                          }`}>
                            {done && !active ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                          </div>
                          <div className={`text-[10px] font-medium whitespace-nowrap ${active ? "text-brand" : done ? "text-slate-700" : "text-slate-400"}`}>{step}</div>
                        </button>
                        {i < TIMELINE.length - 1 && <div className={`h-0.5 flex-1 min-w-[10px] ${done ? "bg-emerald-500" : "bg-slate-200"}`} />}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Método de pago</div>
                  <div className="mt-1 font-semibold">{selected.paymentMethod}</div>
                </div>
                <div className="bg-brand-soft border border-brand-soft rounded-lg p-3">
                  <div className="text-xs text-brand-dark uppercase tracking-wider font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Entrega prometida
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Input
                      data-testid="orden-promised-input"
                      type="datetime-local"
                      value={newPromised}
                      onChange={(e) => setNewPromised(e.target.value)}
                      className="h-8 text-sm bg-white"
                    />
                    <Button
                      data-testid="orden-promised-save"
                      onClick={savePromised}
                      disabled={!newPromised || toLocalInput(selected.promisedAt) === newPromised}
                      size="sm"
                      className="h-8 bg-brand hover:bg-brand-dark shrink-0 px-2"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="text-[10px] text-brand-dark mt-1.5">Al guardar se te ofrecerá avisar al cliente por WhatsApp</div>
                  {rescheduleLink && (
                    <a
                      data-testid="whatsapp-reschedule"
                      href={rescheduleLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md px-3 py-1.5 text-xs font-semibold w-full justify-center"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Avisar al cliente por WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {["Lista para entregar", "Entregada"].includes(selected.status) && (() => {
                const cust = data.customers.find(c => c.id === selected.customerId);
                const link = cust ? buildWhatsAppLink(cust, selected, data.config) : null;
                if (!link) return null;
                return (
                  <a
                    data-testid="whatsapp-notify"
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2.5 px-4 font-semibold text-sm transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Notificar al cliente por WhatsApp
                  </a>
                );
              })()}

              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Servicios</div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  {selected.items.map((it, i) => (
                    <div key={i} className="p-3 border-b border-slate-100 last:border-0 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{it.name}</div>
                        <div className="text-xs text-slate-500">{it.qty} {it.unit} × {fmtMoney(it.price, currency)}</div>
                      </div>
                      <div className="font-semibold">{fmtMoney(it.qty * it.price, currency)}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{fmtMoney(selected.subtotal, currency)}</span></div>
                  {selected.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Descuento</span><span>-{fmtMoney(selected.discount, currency)}</span></div>}
                  <div className="flex justify-between text-slate-600"><span>IGV</span><span>{fmtMoney(selected.tax, currency)}</span></div>
                  <div className="flex justify-between font-heading font-extrabold text-lg pt-2 border-t border-slate-200"><span>Total</span><span>{fmtMoney(selected.total, currency)}</span></div>
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Historial</div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selected.timeline.map((t, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-soft0 mt-2" />
                      <div>
                        <div className="font-medium">{t.status}</div>
                        <div className="text-xs text-slate-500">{fmtDate(t.at, true)} · {t.by}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
