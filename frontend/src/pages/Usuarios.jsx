import React, { useState } from "react";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, ShieldCheck } from "lucide-react";
import { useApp, fmtDate } from "../context/AppContext";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

const ROLES = ["Administrador", "Cajero", "Recepción", "Operador"];

export default function Usuarios() {
  const { data, updateCollection, currentUser } = useApp();
  const [editing, setEditing] = useState(null);

  const save = () => {
    if (!editing.name.trim() || !editing.username.trim()) { toast.error("Nombre y usuario son requeridos"); return; }
    if (editing.id) {
      updateCollection("users", prev => prev.map(u => u.id === editing.id ? editing : u));
      toast.success("Usuario actualizado");
    } else {
      if (!editing.password || editing.password.length < 4) { toast.error("Contraseña debe tener al menos 4 caracteres"); return; }
      updateCollection("users", prev => [{ ...editing, id: `u${Date.now()}`, active: true, lastAccess: null }, ...prev]);
      toast.success("Usuario creado");
    }
    setEditing(null);
  };
  const remove = (id) => {
    if (id === currentUser.id) { toast.error("No puedes eliminarte a ti mismo"); return; }
    if (!window.confirm("¿Eliminar este usuario?")) return;
    updateCollection("users", prev => prev.filter(u => u.id !== id));
    toast.success("Usuario eliminado");
  };
  const toggleActive = (id) => updateCollection("users", prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));

  const roleStyle = {
    "Administrador": "bg-blue-100 text-blue-700 border-blue-200",
    "Cajero": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "Recepción": "bg-violet-100 text-violet-700 border-violet-200",
    "Operador": "bg-amber-100 text-amber-800 border-amber-200",
  };

  return (
    <div data-testid="usuarios-page" className="space-y-6 animate-fadeInUp">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight">Usuarios</h1><p className="text-slate-500 mt-1">{data.users.length} usuarios en el sistema</p></div>
        <Button data-testid="usuario-new" onClick={() => setEditing({ name: "", username: "", password: "", email: "", role: "Cajero", active: true })} className="bg-blue-600 hover:bg-blue-700 gap-2 h-10"><Plus className="w-4 h-4" /> Nuevo usuario</Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="text-xs uppercase tracking-wider text-slate-500 bg-slate-50/50">
              <th className="text-left px-6 py-3 font-semibold">Nombre</th><th className="text-left px-6 py-3 font-semibold">Usuario</th>
              <th className="text-left px-6 py-3 font-semibold">Rol</th><th className="text-left px-6 py-3 font-semibold">Estado</th>
              <th className="text-left px-6 py-3 font-semibold">Último acceso</th><th className="text-right px-6 py-3 font-semibold">Acciones</th>
            </tr></thead>
            <tbody>
              {data.users.map(u => (
                <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-xs font-bold">{u.name.split(" ").map(s => s[0]).slice(0, 2).join("")}</div>
                      <div><div className="text-sm font-semibold">{u.name}</div><div className="text-xs text-slate-500">{u.email}</div></div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-sm font-mono text-slate-700">{u.username}</td>
                  <td className="px-6 py-3.5"><span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${roleStyle[u.role]}`}><ShieldCheck className="w-3 h-3" />{u.role}</span></td>
                  <td className="px-6 py-3.5"><Switch data-testid={`usuario-toggle-${u.id}`} checked={u.active} onCheckedChange={() => toggleActive(u.id)} /></td>
                  <td className="px-6 py-3.5 text-sm text-slate-600">{u.lastAccess ? fmtDate(u.lastAccess, true) : "-"}</td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="inline-flex gap-1">
                      <button data-testid={`usuario-edit-${u.id}`} onClick={() => setEditing(u)} className="p-1.5 rounded hover:bg-slate-100 text-slate-600"><Edit2 className="w-4 h-4" /></button>
                      <button data-testid={`usuario-delete-${u.id}`} onClick={() => remove(u.id)} className="p-1.5 rounded hover:bg-slate-100 text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing?.id ? "Editar" : "Nuevo"} usuario</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Nombre *</Label><Input data-testid="edit-usuario-name" value={editing.name} onChange={(e) => setEditing(v => ({ ...v, name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Usuario *</Label><Input data-testid="edit-usuario-username" value={editing.username} onChange={(e) => setEditing(v => ({ ...v, username: e.target.value }))} /></div>
                <div><Label>{editing.id ? "Nueva contraseña" : "Contraseña *"}</Label><Input data-testid="edit-usuario-password" type="text" value={editing.password || ""} onChange={(e) => setEditing(v => ({ ...v, password: e.target.value }))} placeholder={editing.id ? "Dejar vacío para no cambiar" : ""} /></div>
              </div>
              <div><Label>Email</Label><Input value={editing.email || ""} onChange={(e) => setEditing(v => ({ ...v, email: e.target.value }))} /></div>
              <div><Label>Rol</Label>
                <Select value={editing.role} onValueChange={(v) => setEditing(x => ({ ...x, role: v }))}>
                  <SelectTrigger data-testid="edit-usuario-role"><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button><Button data-testid="edit-usuario-save" onClick={save} className="bg-blue-600 hover:bg-blue-700">Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
