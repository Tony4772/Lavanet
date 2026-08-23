import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { useApp, fmtMoney } from "../context/AppContext";
import { SERVICE_CATEGORIES } from "../lib/seed";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

export default function Servicios() {
  const { data, updateCollection } = useApp();
  const currency = data.config.business.currencySymbol;
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);

  const filtered = data.services.filter(s => q === "" || s.name.toLowerCase().includes(q.toLowerCase()) || s.category.toLowerCase().includes(q.toLowerCase()));

  const save = () => {
    if (!editing.name.trim() || !editing.category) { toast.error("Nombre y categoría son requeridos"); return; }
    if (editing.id) {
      updateCollection("services", prev => prev.map(s => s.id === editing.id ? editing : s));
      toast.success("Servicio actualizado");
    } else {
      updateCollection("services", prev => [{ ...editing, id: `s${Date.now()}`, active: true }, ...prev]);
      toast.success("Servicio creado");
    }
    setEditing(null);
  };
  const remove = (id) => {
    if (!window.confirm("¿Eliminar este servicio?")) return;
    updateCollection("services", prev => prev.filter(s => s.id !== id));
    toast.success("Servicio eliminado");
  };
  const toggleActive = (id) => updateCollection("services", prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));

  return (
    <div data-testid="servicios-page" className="space-y-6 animate-fadeInUp">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight">Servicios</h1>
          <p className="text-slate-500 mt-1">{filtered.length} servicios en el catálogo</p>
        </div>
        <Button data-testid="servicio-new" onClick={() => setEditing({ name: "", category: "Lavado", description: "", price: 0, unit: "kg", eta: "24h", active: true })} className="bg-brand hover:bg-brand-dark gap-2 h-10">
          <Plus className="w-4 h-4" /> Nuevo servicio
        </Button>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><Input placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-10 max-w-md" /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(s => (
          <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-brand-soft text-brand flex items-center justify-center text-xs font-bold">{s.category.slice(0, 2).toUpperCase()}</div>
              <Switch data-testid={`servicio-toggle-${s.id}`} checked={s.active} onCheckedChange={() => toggleActive(s.id)} />
            </div>
            <div className="mt-3">
              <div className="text-sm font-semibold text-slate-900">{s.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.category} · {s.eta}</div>
              <div className="text-xs text-slate-500 mt-2 line-clamp-2 min-h-[32px]">{s.description || "Sin descripción"}</div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <div className="font-heading font-bold text-lg text-slate-900">{fmtMoney(s.price, currency)}<span className="text-xs text-slate-500 font-normal">/{s.unit}</span></div>
              <div className="flex gap-1">
                <button data-testid={`servicio-edit-${s.id}`} onClick={() => setEditing(s)} className="p-1.5 rounded hover:bg-slate-100 text-slate-600"><Edit2 className="w-4 h-4" /></button>
                <button data-testid={`servicio-delete-${s.id}`} onClick={() => remove(s.id)} className="p-1.5 rounded hover:bg-slate-100 text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing?.id ? "Editar servicio" : "Nuevo servicio"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Nombre *</Label><Input data-testid="edit-servicio-name" value={editing.name} onChange={(e) => setEditing(v => ({ ...v, name: e.target.value }))} /></div>
              <div><Label>Categoría</Label>
                <Select value={editing.category} onValueChange={(v) => setEditing(x => ({ ...x, category: v }))}>
                  <SelectTrigger data-testid="edit-servicio-category"><SelectValue /></SelectTrigger>
                  <SelectContent>{SERVICE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Descripción</Label><Input value={editing.description} onChange={(e) => setEditing(v => ({ ...v, description: e.target.value }))} /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Precio</Label><Input data-testid="edit-servicio-price" type="number" step="0.5" value={editing.price} onChange={(e) => setEditing(v => ({ ...v, price: Number(e.target.value) }))} /></div>
                <div><Label>Unidad</Label><Input value={editing.unit} onChange={(e) => setEditing(v => ({ ...v, unit: e.target.value }))} /></div>
                <div><Label>Tiempo</Label><Input value={editing.eta} onChange={(e) => setEditing(v => ({ ...v, eta: e.target.value }))} /></div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button><Button data-testid="edit-servicio-save" onClick={save} className="bg-brand hover:bg-brand-dark">Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
