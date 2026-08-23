import React, { useState } from "react";
import { toast } from "sonner";
import { Truck, CheckCircle2, Phone, MessageCircle } from "lucide-react";
import { useApp, fmtMoney, fmtDate, buildWhatsAppLink } from "../context/AppContext";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";

export default function Entregas() {
  const { data, updateOrderStatus } = useApp();
  const currency = data.config.business.currencySymbol;
  const [confirm, setConfirm] = useState(null);

  const ready = data.orders.filter(o => o.status === "Lista para entregar").sort((a, b) => new Date(a.promisedAt) - new Date(b.promisedAt));
  const delivered = data.orders.filter(o => o.status === "Entregada").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

  const confirmDelivery = () => {
    if (!confirm) return;
    updateOrderStatus(confirm.id, "Entregada");
    toast.success(`Orden ${confirm.number} entregada`);
    setConfirm(null);
  };

  return (
    <div data-testid="entregas-page" className="space-y-6 animate-fadeInUp">
      <div><h1 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight">Entregas</h1><p className="text-slate-500 mt-1">{ready.length} órdenes listas para entregar</p></div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-emerald-50/50 flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-600" />
          <h3 className="font-heading font-bold text-emerald-900">Listas para entregar</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="text-xs uppercase tracking-wider text-slate-500 bg-slate-50/50">
              <th className="text-left px-6 py-3 font-semibold">Nº</th><th className="text-left px-6 py-3 font-semibold">Cliente</th>
              <th className="text-left px-6 py-3 font-semibold">Teléfono</th><th className="text-left px-6 py-3 font-semibold">Fecha</th>
              <th className="text-right px-6 py-3 font-semibold">Total</th><th className="text-left px-6 py-3 font-semibold">Pago</th>
              <th className="text-right px-6 py-3 font-semibold">Acción</th>
            </tr></thead>
            <tbody>
              {ready.map(o => {
                const cust = data.customers.find(c => c.id === o.customerId);
                return (
                  <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-6 py-3.5"><span className="font-mono text-sm font-semibold text-brand">{o.number}</span></td>
                    <td className="px-6 py-3.5 text-sm">{o.customerName}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-600"><span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{cust?.phone || "-"}</span></td>
                    <td className="px-6 py-3.5 text-sm text-slate-600">{fmtDate(o.promisedAt)}</td>
                    <td className="px-6 py-3.5 text-sm text-right font-semibold">{fmtMoney(o.total, currency)}</td>
                    <td className="px-6 py-3.5">
                      {o.paid
                        ? <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold">Pagado</span>
                        : <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold">Pendiente</span>}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        {cust && (
                          <a
                            data-testid={`whatsapp-${o.number}`}
                            href={buildWhatsAppLink(cust, o, data.config)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-md h-8 px-2.5 text-xs font-semibold transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            WhatsApp
                          </a>
                        )}
                        <Button data-testid={`entregar-${o.number}`} size="sm" onClick={() => setConfirm(o)} className="bg-emerald-600 hover:bg-emerald-700 h-8"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Entregar</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {ready.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-slate-500 text-sm">No hay órdenes listas para entregar</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100"><h3 className="font-heading font-bold">Entregas recientes</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="text-xs uppercase tracking-wider text-slate-500 bg-slate-50/50">
              <th className="text-left px-6 py-3 font-semibold">Nº</th><th className="text-left px-6 py-3 font-semibold">Cliente</th>
              <th className="text-left px-6 py-3 font-semibold">Entregada</th><th className="text-right px-6 py-3 font-semibold">Total</th>
              <th className="text-left px-6 py-3 font-semibold">Estado</th>
            </tr></thead>
            <tbody>
              {delivered.map(o => (
                <tr key={o.id} className="border-t border-slate-100">
                  <td className="px-6 py-3.5"><span className="font-mono text-sm font-semibold text-brand">{o.number}</span></td>
                  <td className="px-6 py-3.5 text-sm">{o.customerName}</td>
                  <td className="px-6 py-3.5 text-sm text-slate-600">{fmtDate(o.timeline[o.timeline.length - 1]?.at, true)}</td>
                  <td className="px-6 py-3.5 text-sm text-right font-semibold">{fmtMoney(o.total, currency)}</td>
                  <td className="px-6 py-3.5"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>¿Confirmar entrega de esta orden?</DialogTitle></DialogHeader>
          {confirm && (
            <div className="space-y-2 py-2">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Orden</span><span className="font-mono font-semibold text-brand">{confirm.number}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Cliente</span><span className="font-semibold">{confirm.customerName}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Total</span><span className="font-semibold">{fmtMoney(confirm.total, currency)}</span></div>
              {!confirm.paid && <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 mt-2">⚠️ Esta orden aún no está marcada como pagada.</div>}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setConfirm(null)}>Cancelar</Button><Button data-testid="confirm-delivery" onClick={confirmDelivery} className="bg-emerald-600 hover:bg-emerald-700"><CheckCircle2 className="w-4 h-4 mr-2" /> Confirmar entrega</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
