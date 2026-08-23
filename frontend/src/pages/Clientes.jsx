import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { Search, Plus, Edit2, Trash2, Eye, Phone, Mail, MapPin, Ticket, MessageCircle, Sparkles, PiggyBank, TrendingUp, Award, ScanLine } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useApp, fmtMoney, fmtDate, buildCouponLink } from "../context/AppContext";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";

const COUPON_PRESETS = [
  { pointsCost: 100, valuePEN: 5 },
  { pointsCost: 200, valuePEN: 10 },
  { pointsCost: 400, valuePEN: 20 },
  { pointsCost: 1000, valuePEN: 50 },
];

export default function Clientes() {
  const { data, updateCollection, createCoupon } = useApp();
  const currency = data.config.business.currencySymbol;
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [viewingId, setViewingId] = useState(null);

  const stats = useMemo(() => {
    const pointsPerSol = data.config.loyalty?.pointsPerSol || 1;
    return data.customers.map(c => {
      const ords = data.orders.filter(o => o.customerId === c.id);
      const total = ords.reduce((s, o) => s + o.total, 0);
      const last = ords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      const coupons = (data.coupons || []).filter(cp => cp.customerId === c.id);
      const usedCoupons = coupons.filter(cp => cp.used);
      const savingsManual = ords.reduce((s, o) => s + (o.discount || 0), 0);
      const savingsPoints = ords.reduce((s, o) => s + (o.pointsDiscount || 0), 0);
      const savingsCoupons = ords.reduce((s, o) => s + (o.couponDiscount || 0), 0);
      const totalSavings = savingsManual + savingsPoints + savingsCoupons;
      const pointsEarnedLifetime = ords.reduce((s, o) => s + Math.floor(o.total * pointsPerSol), 0);
      const pointsRedeemedLifetime = ords.reduce((s, o) => s + (o.pointsRedeemed || 0), 0);
      return {
        ...c,
        ordersCount: ords.length, totalSpent: total, lastVisit: last?.createdAt,
        avg: ords.length ? total / ords.length : 0, orders: ords, pointsBalance: c.pointsBalance || 0, coupons,
        savingsManual, savingsPoints, savingsCoupons, totalSavings,
        pointsEarnedLifetime, pointsRedeemedLifetime, couponsUsed: usedCoupons.length,
      };
    });
  }, [data.customers, data.orders, data.coupons, data.config]);

  const filtered = stats.filter(c => q === "" || c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q) || (c.email || "").toLowerCase().includes(q.toLowerCase()));

  const viewingLive = viewingId ? stats.find(c => c.id === viewingId) : null;

  const save = () => {
    if (!editing.name.trim() || !editing.phone.trim()) { toast.error("Nombre y teléfono son requeridos"); return; }
    if (editing.id) {
      updateCollection("customers", prev => prev.map(c => c.id === editing.id ? editing : c));
      toast.success("Cliente actualizado");
    } else {
      updateCollection("customers", prev => [{ ...editing, id: `c${Date.now()}`, createdAt: new Date().toISOString(), active: true }, ...prev]);
      toast.success("Cliente creado");
    }
    setEditing(null);
  };
  const remove = (id) => {
    if (!window.confirm("¿Eliminar este cliente?")) return;
    updateCollection("customers", prev => prev.filter(c => c.id !== id));
    toast.success("Cliente eliminado");
  };

  return (
    <div data-testid="clientes-page" className="space-y-6 animate-fadeInUp">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight">Clientes</h1>
          <p className="text-slate-500 mt-1">{filtered.length} clientes registrados</p>
        </div>
        <Button data-testid="cliente-new" onClick={() => setEditing({ name: "", phone: "", email: "", address: "" })} className="bg-brand hover:bg-brand-dark gap-2 h-10">
          <Plus className="w-4 h-4" /> Nuevo cliente
        </Button>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input data-testid="cliente-search" placeholder="Buscar por nombre, teléfono o email..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-10 max-w-md" />
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-slate-500 bg-slate-50/50">
                <th className="text-left px-6 py-3 font-semibold">Cliente</th>
                <th className="text-left px-6 py-3 font-semibold">Contacto</th>
                <th className="text-right px-6 py-3 font-semibold">Órdenes</th>
                <th className="text-right px-6 py-3 font-semibold">Total gastado</th>
                <th className="text-right px-6 py-3 font-semibold">Puntos</th>
                <th className="text-left px-6 py-3 font-semibold">Última visita</th>
                <th className="text-right px-6 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-brand-dark text-white flex items-center justify-center text-xs font-bold">
                        {c.name.split(" ").map(s => s[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{c.name}</div>
                        <div className="text-xs text-slate-500">Desde {fmtDate(c.createdAt)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="text-sm text-slate-700">{c.phone}</div>
                    <div className="text-xs text-slate-500">{c.email}</div>
                  </td>
                  <td className="px-6 py-3.5 text-right text-sm font-semibold">{c.ordersCount}</td>
                  <td className="px-6 py-3.5 text-right text-sm font-semibold text-emerald-600">{fmtMoney(c.totalSpent, currency)}</td>
                  <td className="px-6 py-3.5 text-right text-sm">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 text-xs font-semibold">
                      {c.pointsBalance} pts
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-slate-600">{c.lastVisit ? fmtDate(c.lastVisit) : "-"}</td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="inline-flex gap-1">
                      <button data-testid={`cliente-view-${c.id}`} onClick={() => setViewingId(c.id)} className="p-1.5 rounded hover:bg-slate-100 text-brand"><Eye className="w-4 h-4" /></button>
                      <button data-testid={`cliente-edit-${c.id}`} onClick={() => setEditing(c)} className="p-1.5 rounded hover:bg-slate-100 text-slate-600"><Edit2 className="w-4 h-4" /></button>
                      <button data-testid={`cliente-delete-${c.id}`} onClick={() => remove(c.id)} className="p-1.5 rounded hover:bg-slate-100 text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-slate-500 text-sm">Sin clientes</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing?.id ? "Editar cliente" : "Nuevo cliente"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Nombre *</Label><Input data-testid="edit-cliente-name" value={editing.name} onChange={(e) => setEditing(v => ({ ...v, name: e.target.value }))} /></div>
              <div><Label>Teléfono *</Label><Input data-testid="edit-cliente-phone" value={editing.phone} onChange={(e) => setEditing(v => ({ ...v, phone: e.target.value }))} /></div>
              <div><Label>Email</Label><Input data-testid="edit-cliente-email" value={editing.email || ""} onChange={(e) => setEditing(v => ({ ...v, email: e.target.value }))} /></div>
              <div><Label>Dirección</Label><Input data-testid="edit-cliente-address" value={editing.address || ""} onChange={(e) => setEditing(v => ({ ...v, address: e.target.value }))} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button data-testid="edit-cliente-save" onClick={save} className="bg-brand hover:bg-brand-dark">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingId} onOpenChange={(o) => !o && setViewingId(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {viewingLive && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand to-brand-dark text-white flex items-center justify-center font-bold">
                    {viewingLive.name.split(" ").map(s => s[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <DialogTitle>{viewingLive.name}</DialogTitle>
                    <p className="text-xs text-slate-500 mt-1">Cliente desde {fmtDate(viewingLive.createdAt)}</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-lg p-3"><div className="text-xs text-slate-500 uppercase font-semibold">Órdenes</div><div className="mt-1 font-heading font-bold text-xl">{viewingLive.ordersCount}</div></div>
                <div className="bg-slate-50 rounded-lg p-3"><div className="text-xs text-slate-500 uppercase font-semibold">Total gastado</div><div className="mt-1 font-heading font-bold text-xl text-emerald-600">{fmtMoney(viewingLive.totalSpent, currency)}</div></div>
                <div className="bg-slate-50 rounded-lg p-3"><div className="text-xs text-slate-500 uppercase font-semibold">Promedio</div><div className="mt-1 font-heading font-bold text-xl">{fmtMoney(viewingLive.avg, currency)}</div></div>
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-100"><div className="text-xs text-amber-700 uppercase font-semibold">Puntos de fidelidad</div><div className="mt-1 font-heading font-bold text-xl text-amber-600">{viewingLive.pointsBalance} pts</div><div className="text-[10px] text-amber-700 mt-0.5">≈ {fmtMoney(viewingLive.pointsBalance / (data.config.loyalty?.pointsToSol || 20), currency)} de descuento</div></div>
                <div className="bg-slate-50 rounded-lg p-3 col-span-2"><div className="text-xs text-slate-500 uppercase font-semibold">Última visita</div><div className="mt-1 font-semibold text-sm">{viewingLive.lastVisit ? fmtDate(viewingLive.lastVisit) : "-"}</div></div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600"><Phone className="w-4 h-4 text-slate-400" />{viewingLive.phone}</div>
                <div className="flex items-center gap-2 text-slate-600"><Mail className="w-4 h-4 text-slate-400" />{viewingLive.email || "-"}</div>
                <div className="flex items-center gap-2 text-slate-600"><MapPin className="w-4 h-4 text-slate-400" />{viewingLive.address || "-"}</div>
              </div>

              {/* Ahorros y beneficios */}
              <div className="bg-gradient-to-br from-emerald-50 to-brand-soft border border-emerald-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <PiggyBank className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-heading font-bold text-slate-900">Ahorros y beneficios</div>
                    <div className="text-[10px] text-slate-500">Cuánto ha ganado {viewingLive.name.split(" ")[0]} con nosotros</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div data-testid="metric-total-savings" className="bg-white/70 backdrop-blur-sm rounded-lg p-2.5 border border-white">
                    <div className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">Ahorro total</div>
                    <div className="mt-0.5 font-heading font-extrabold text-lg text-emerald-600">{fmtMoney(viewingLive.totalSavings, currency)}</div>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-2.5 border border-white">
                    <div className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Pts ganados</div>
                    <div className="mt-0.5 font-heading font-extrabold text-lg text-amber-600">{viewingLive.pointsEarnedLifetime}</div>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-2.5 border border-white">
                    <div className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">Pts canjeados</div>
                    <div className="mt-0.5 font-heading font-extrabold text-lg text-slate-700">{viewingLive.pointsRedeemedLifetime}</div>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-2.5 border border-white">
                    <div className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider flex items-center gap-1"><Award className="w-3 h-3" /> Cupones usados</div>
                    <div className="mt-0.5 font-heading font-extrabold text-lg text-violet-600">{viewingLive.couponsUsed}</div>
                  </div>
                </div>
                {viewingLive.totalSavings > 0 && (
                  <div className="text-[11px] text-emerald-800 mt-2 bg-emerald-100/60 rounded-md p-2">
                    🎉 Ya ahorraste el equivalente a <span className="font-bold">{Math.round((viewingLive.totalSavings / (viewingLive.totalSpent + viewingLive.totalSavings)) * 100)}%</span> de tus compras. ¡Sigue acumulando!
                  </div>
                )}
              </div>

              {/* Coupons */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5" /> Cupones de descuento
                  </div>
                  <span className="text-[10px] text-slate-400">{viewingLive.coupons.filter(c => !c.used && new Date(c.expiresAt) > new Date()).length} activo(s)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
                  {COUPON_PRESETS.map(preset => {
                    const enough = viewingLive.pointsBalance >= preset.pointsCost;
                    return (
                      <button
                        key={preset.pointsCost}
                        data-testid={`cliente-coupon-gen-${preset.pointsCost}`}
                        disabled={!enough}
                        onClick={() => {
                          const c = createCoupon(viewingLive.id, preset.pointsCost, preset.valuePEN);
                          if (c) toast.success(`Cupón ${c.code} generado`);
                          else toast.error("Puntos insuficientes");
                        }}
                        className={`text-left p-2 rounded-lg border transition-colors ${enough ? "border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900" : "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"}`}
                      >
                        <div className="text-[10px] font-semibold uppercase tracking-wider">{preset.pointsCost} pts</div>
                        <div className="font-heading font-extrabold text-sm">{fmtMoney(preset.valuePEN, currency)}</div>
                      </button>
                    );
                  })}
                </div>
                {viewingLive.coupons.length === 0 ? (
                  <div className="text-center py-3 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">Sin cupones generados</div>
                ) : (
                  <div className="space-y-2">
                    {viewingLive.coupons.map(cp => {
                      const active = !cp.used && new Date(cp.expiresAt) > new Date();
                      const link = active ? buildCouponLink(viewingLive, cp, data.config) : null;
                      const qrUrl = `${window.location.origin}/pos?coupon=${encodeURIComponent(cp.code)}`;
                      return (
                        <div key={cp.id} data-testid={`cliente-coupon-${cp.code}`} className={`border rounded-lg p-3 ${active ? "border-amber-300 bg-gradient-to-br from-amber-50 to-white" : "border-slate-200 bg-slate-50/50"}`}>
                          <div className="flex items-start gap-3">
                            {/* QR */}
                            {active && (
                              <div data-testid={`coupon-qr-${cp.code}`} className="bg-white p-1.5 rounded-md border border-amber-200 shrink-0">
                                <QRCodeSVG value={qrUrl} size={88} level="M" bgColor="#ffffff" fgColor="#0f172a" />
                                <div className="text-[8px] text-center text-slate-500 font-semibold uppercase tracking-wider mt-1 flex items-center justify-center gap-0.5">
                                  <ScanLine className="w-2.5 h-2.5" /> Escanear
                                </div>
                              </div>
                            )}
                            {!active && (
                              <div className="w-[100px] h-[100px] shrink-0 bg-slate-100 rounded-md flex items-center justify-center">
                                <Ticket className="w-8 h-8 text-slate-300" />
                              </div>
                            )}
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${active ? "bg-amber-500 text-white" : "bg-slate-300 text-white"}`}>
                                  <Ticket className="w-3.5 h-3.5" />
                                </div>
                                <span className="font-mono text-sm font-bold text-slate-900 tracking-wider">{cp.code}</span>
                              </div>
                              <div className={`mt-1.5 font-heading font-extrabold ${active ? "text-amber-600 text-xl" : "text-slate-500 text-lg"}`}>{fmtMoney(cp.valuePEN, currency)}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Costo: {cp.pointsCost} pts · Exp. {fmtDate(cp.expiresAt)}
                              </div>
                              {cp.used && <div className="text-[10px] text-rose-600 font-semibold mt-0.5">Usado {cp.usedOrder ? `en ${cp.usedOrder}` : ""}</div>}
                              {active && link && (
                                <a
                                  data-testid={`cliente-coupon-wa-${cp.code}`}
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md px-2 py-1 text-[10px] font-semibold"
                                >
                                  <MessageCircle className="w-3 h-3" /> Enviar por WhatsApp
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Historial de órdenes</div>
                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                  {viewingLive.orders.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500">Sin órdenes</div>
                  ) : viewingLive.orders.map(o => (
                    <div key={o.id} className="p-3 border-b border-slate-100 last:border-0 flex items-center justify-between text-sm">
                      <div><span className="font-mono text-brand font-semibold">{o.number}</span><span className="text-xs text-slate-500 ml-2">{fmtDate(o.createdAt)}</span></div>
                      <div className="font-semibold">{fmtMoney(o.total, currency)}</div>
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
