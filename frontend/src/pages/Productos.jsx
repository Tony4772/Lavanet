import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Search, AlertTriangle } from "lucide-react";
import { useApp, fmtMoney } from "../context/AppContext";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";

export default function Productos() {
  const { data, updateCollection } = useApp();
  const currency = data.config.business.currencySymbol;
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const filtered = data.products.filter(p => q === "" || p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()));

  const save = () => {
    if (!editing.name.trim() || !editing.sku.trim()) { toast.error("Nombre y SKU son requeridos"); return; }
    if (editing.id) { updateCollection("products", prev => prev.map(p => p.id === editing.id ? editing : p)); toast.success("Producto actualizado"); }
    else { updateCollection("products", prev => [{ ...editing, id: `p${Date.now()}`, active: true }, ...prev]); toast.success("Producto creado"); }
    setEditing(null);
  };
  const remove = (id) => { if (!window.confirm("¿Eliminar?")) return; updateCollection("products", prev => prev.filter(p => p.id !== id)); toast.success("Producto eliminado"); };

  return (
    <div data-testid="productos-page" className="space-y-6 animate-fadeInUp">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight">Productos</h1><p className="text-slate-500 mt-1">{filtered.length} productos</p></div>
        <Button data-testid="producto-new" onClick={() => setEditing({ name: "", sku: "", category: "Detergentes", price: 0, stock: 0, minStock: 5 })} className="bg-brand hover:bg-brand-dark gap-2 h-10"><Plus className="w-4 h-4" /> Nuevo producto</Button>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4"><div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><Input placeholder="Buscar por nombre o SKU..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-10 max-w-md" /></div></div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="text-xs uppercase tracking-wider text-slate-500 bg-slate-50/50">
              <th className="text-left px-6 py-3 font-semibold">Producto</th><th className="text-left px-6 py-3 font-semibold">SKU</th>
              <th className="text-left px-6 py-3 font-semibold">Categoría</th><th className="text-right px-6 py-3 font-semibold">Precio</th>
              <th className="text-right px-6 py-3 font-semibold">Stock</th><th className="text-left px-6 py-3 font-semibold">Estado</th>
              <th className="text-right px-6 py-3 font-semibold">Acciones</th>
            </tr></thead>
            <tbody>
              {filtered.map(p => {
                const low = p.stock <= p.minStock;
                return (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-6 py-3.5 text-sm font-medium text-slate-900">{p.name}</td>
                    <td className="px-6 py-3.5 text-sm font-mono text-slate-600">{p.sku}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-600">{p.category}</td>
                    <td className="px-6 py-3.5 text-right text-sm font-semibold">{fmtMoney(p.price, currency)}</td>
                    <td className="px-6 py-3.5 text-right text-sm">
                      <span className={`font-semibold ${low ? "text-rose-600" : "text-slate-900"}`}>{p.stock}</span>
                      <span className="text-xs text-slate-400"> / min {p.minStock}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      {low ? <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-0.5 text-xs font-semibold"><AlertTriangle className="w-3 h-3" /> Stock bajo</span>
                          : <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold">Disponible</span>}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="inline-flex gap-1">
                        <button data-testid={`producto-edit-${p.id}`} onClick={() => setEditing(p)} className="p-1.5 rounded hover:bg-slate-100 text-slate-600"><Edit2 className="w-4 h-4" /></button>
                        <button data-testid={`producto-delete-${p.id}`} onClick={() => remove(p.id)} className="p-1.5 rounded hover:bg-slate-100 text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing?.id ? "Editar" : "Nuevo"} producto</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Nombre *</Label><Input data-testid="edit-producto-name" value={editing.name} onChange={(e) => setEditing(v => ({ ...v, name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>SKU</Label><Input value={editing.sku} onChange={(e) => setEditing(v => ({ ...v, sku: e.target.value }))} /></div>
                <div><Label>Categoría</Label><Input value={editing.category} onChange={(e) => setEditing(v => ({ ...v, category: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Precio</Label><Input type="number" step="0.5" value={editing.price} onChange={(e) => setEditing(v => ({ ...v, price: Number(e.target.value) }))} /></div>
                <div><Label>Stock</Label><Input type="number" value={editing.stock} onChange={(e) => setEditing(v => ({ ...v, stock: Number(e.target.value) }))} /></div>
                <div><Label>Mín</Label><Input type="number" value={editing.minStock} onChange={(e) => setEditing(v => ({ ...v, minStock: Number(e.target.value) }))} /></div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button><Button data-testid="edit-producto-save" onClick={save} className="bg-brand hover:bg-brand-dark">Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
