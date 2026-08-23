import React, { useState } from "react";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, AlertTriangle, Package, TrendingUp, TrendingDown } from "lucide-react";
import { useApp, fmtDate } from "../context/AppContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

export default function Inventario() {
  const { data, updateCollection, setData } = useApp();
  const [openMov, setOpenMov] = useState(false);
  const [mov, setMov] = useState({ productId: "", type: "entrada", qty: 1, note: "" });

  const lowStock = data.products.filter(p => p.stock <= p.minStock);
  const totalStock = data.products.reduce((s, p) => s + p.stock, 0);
  const stockValue = data.products.reduce((s, p) => s + p.stock * p.price, 0);
  const currency = data.config.business.currencySymbol;

  const entries = (data.inventoryLog || []).filter(l => l.type === "entrada").length;
  const exits = (data.inventoryLog || []).filter(l => l.type === "salida").length;

  const registerMov = () => {
    if (!mov.productId) { toast.error("Selecciona un producto"); return; }
    const qty = Number(mov.qty) || 0;
    if (qty <= 0) { toast.error("Cantidad inválida"); return; }
    const prod = data.products.find(p => p.id === mov.productId);
    const delta = mov.type === "entrada" ? qty : mov.type === "salida" ? -qty : qty - prod.stock;
    setData(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === mov.productId ? { ...p, stock: Math.max(0, p.stock + delta) } : p),
      inventoryLog: [{ id: `l${Date.now()}`, at: new Date().toISOString(), productId: mov.productId, productName: prod.name, type: mov.type, qty, note: mov.note }, ...(prev.inventoryLog || [])],
    }));
    setOpenMov(false);
    setMov({ productId: "", type: "entrada", qty: 1, note: "" });
    toast.success("Movimiento registrado");
  };

  return (
    <div data-testid="inventario-page" className="space-y-6 animate-fadeInUp">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight">Inventario</h1><p className="text-slate-500 mt-1">Control de stock y movimientos</p></div>
        <Button data-testid="inventario-new-mov" onClick={() => setOpenMov(true)} className="bg-blue-600 hover:bg-blue-700 gap-2 h-10">Registrar movimiento</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5"><div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-semibold"><Package className="w-4 h-4" /> Stock total</div><div className="mt-2 font-heading font-extrabold text-2xl">{totalStock}</div></div>
        <div className="bg-white border border-slate-200 rounded-xl p-5"><div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-semibold">Valor stock</div><div className="mt-2 font-heading font-extrabold text-2xl">{currency} {stockValue.toFixed(0)}</div></div>
        <div className="bg-white border border-slate-200 rounded-xl p-5"><div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-semibold"><TrendingUp className="w-4 h-4 text-emerald-500" /> Entradas</div><div className="mt-2 font-heading font-extrabold text-2xl">{entries}</div></div>
        <div className="bg-white border border-slate-200 rounded-xl p-5"><div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-semibold"><TrendingDown className="w-4 h-4 text-rose-500" /> Salidas</div><div className="mt-2 font-heading font-extrabold text-2xl">{exits}</div></div>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center"><AlertTriangle className="w-5 h-5" /></div>
            <div>
              <div className="font-semibold text-amber-900">{lowStock.length} producto(s) con stock bajo</div>
              <div className="text-sm text-amber-800 mt-0.5">Reabastece pronto: {lowStock.map(p => p.name).join(", ")}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100"><h3 className="font-heading font-bold">Stock actual</h3></div>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead><tr className="text-xs uppercase tracking-wider text-slate-500 bg-slate-50/50 sticky top-0">
                <th className="text-left px-6 py-3 font-semibold">Producto</th><th className="text-right px-6 py-3 font-semibold">Stock</th><th className="text-right px-6 py-3 font-semibold">Mínimo</th><th className="text-left px-6 py-3 font-semibold">Estado</th>
              </tr></thead>
              <tbody>
                {data.products.map(p => {
                  const low = p.stock <= p.minStock;
                  return (
                    <tr key={p.id} className="border-t border-slate-100">
                      <td className="px-6 py-3 text-sm">{p.name}</td>
                      <td className={`px-6 py-3 text-sm text-right font-bold ${low ? "text-rose-600" : "text-slate-900"}`}>{p.stock}</td>
                      <td className="px-6 py-3 text-sm text-right text-slate-500">{p.minStock}</td>
                      <td className="px-6 py-3 text-sm">{low ? <span className="text-rose-600 text-xs font-semibold">BAJO</span> : <span className="text-emerald-600 text-xs font-semibold">OK</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100"><h3 className="font-heading font-bold">Movimientos recientes</h3></div>
          <div className="max-h-96 overflow-y-auto">
            {(data.inventoryLog || []).length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">Sin movimientos aún</div>
            ) : (data.inventoryLog || []).map(l => (
              <div key={l.id} className="p-3 border-b border-slate-100 last:border-0 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${l.type === "entrada" ? "bg-emerald-100 text-emerald-600" : l.type === "salida" ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"}`}>
                  {l.type === "entrada" ? <ArrowUp className="w-4 h-4" /> : l.type === "salida" ? <ArrowDown className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{l.productName}</div>
                  <div className="text-xs text-slate-500">{fmtDate(l.at, true)} · {l.note || "Sin nota"}</div>
                </div>
                <div className="text-sm font-bold">{l.type === "entrada" ? "+" : l.type === "salida" ? "-" : "="}{l.qty}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={openMov} onOpenChange={setOpenMov}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nuevo movimiento de inventario</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Producto *</Label>
              <Select value={mov.productId} onValueChange={(v) => setMov(x => ({ ...x, productId: v }))}>
                <SelectTrigger data-testid="mov-product"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>{data.products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Tipo</Label>
              <Select value={mov.type} onValueChange={(v) => setMov(x => ({ ...x, type: v }))}>
                <SelectTrigger data-testid="mov-type"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="entrada">Entrada</SelectItem><SelectItem value="salida">Salida</SelectItem><SelectItem value="ajuste">Ajuste</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Cantidad</Label><Input data-testid="mov-qty" type="number" value={mov.qty} onChange={(e) => setMov(x => ({ ...x, qty: e.target.value }))} /></div>
            <div><Label>Nota</Label><Input data-testid="mov-note" value={mov.note} onChange={(e) => setMov(x => ({ ...x, note: e.target.value }))} placeholder="Motivo del movimiento..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpenMov(false)}>Cancelar</Button><Button data-testid="mov-save" onClick={registerMov} className="bg-blue-600 hover:bg-blue-700">Registrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
