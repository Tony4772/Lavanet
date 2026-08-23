import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { Wallet, Lock, Unlock, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useApp, fmtMoney, fmtDate } from "../context/AppContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { PAYMENT_METHODS } from "../lib/seed";

export default function Caja() {
  const { data, openCash, closeCash, addCashMovement } = useApp();
  const currency = data.config.business.currencySymbol;
  const { cash } = data;
  const [openOpen, setOpenOpen] = useState(false);
  const [openMov, setOpenMov] = useState(false);
  const [balance, setBalance] = useState(100);
  const [mov, setMov] = useState({ type: "ingreso", amount: 0, note: "", method: "Efectivo" });

  const stats = useMemo(() => {
    if (!cash.isOpen && cash.movements.length === 0) return { cash: 0, card: 0, digital: 0, other: 0, expenses: 0, expected: 0 };
    const cashSales = cash.movements.filter(m => m.type === "ingreso" && m.method === "Efectivo").reduce((s, m) => s + m.amount, 0);
    const cardSales = cash.movements.filter(m => m.type === "ingreso" && m.method === "Tarjeta").reduce((s, m) => s + m.amount, 0);
    const digitalSales = cash.movements.filter(m => m.type === "ingreso" && ["Yape", "Plin", "Transferencia"].includes(m.method)).reduce((s, m) => s + m.amount, 0);
    const other = cash.movements.filter(m => m.type === "ingreso" && !PAYMENT_METHODS.includes(m.method)).reduce((s, m) => s + m.amount, 0);
    const expenses = cash.movements.filter(m => m.type === "gasto").reduce((s, m) => s + m.amount, 0);
    const expected = cash.openingBalance + cashSales - expenses;
    return { cash: cashSales, card: cardSales, digital: digitalSales, other, expenses, expected };
  }, [cash]);

  const doOpen = () => {
    if (Number(balance) < 0) { toast.error("Saldo inválido"); return; }
    openCash(Number(balance));
    setOpenOpen(false);
    toast.success("Caja abierta");
  };
  const doClose = () => {
    if (!window.confirm("¿Cerrar la caja del turno?")) return;
    closeCash();
    toast.success("Caja cerrada correctamente");
  };
  const addMov = () => {
    if (!mov.amount || Number(mov.amount) <= 0) { toast.error("Monto inválido"); return; }
    addCashMovement({ ...mov, amount: Number(mov.amount) });
    setOpenMov(false);
    setMov({ type: "ingreso", amount: 0, note: "", method: "Efectivo" });
    toast.success("Movimiento registrado");
  };

  return (
    <div data-testid="caja-page" className="space-y-6 animate-fadeInUp">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight">Caja</h1>
          <p className="text-slate-500 mt-1">Estado: {cash.isOpen ? <span className="text-emerald-600 font-semibold">Abierta desde {fmtDate(cash.openedAt, true)}</span> : <span className="text-slate-500">Cerrada</span>}</p>
        </div>
        {cash.isOpen ? (
          <div className="flex gap-2">
            <Button data-testid="caja-add-mov" onClick={() => setOpenMov(true)} variant="outline" className="h-10">Nuevo movimiento</Button>
            <Button data-testid="caja-close" onClick={doClose} className="bg-rose-600 hover:bg-rose-700 gap-2 h-10"><Lock className="w-4 h-4" /> Cerrar caja</Button>
          </div>
        ) : (
          <Button data-testid="caja-open" onClick={() => setOpenOpen(true)} className="bg-brand hover:bg-brand-dark gap-2 h-10"><Unlock className="w-4 h-4" /> Abrir caja</Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5"><div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Saldo inicial</div><div className="mt-2 font-heading font-extrabold text-2xl">{fmtMoney(cash.openingBalance, currency)}</div></div>
        <div className="bg-white border border-slate-200 rounded-xl p-5"><div className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1"><DollarSign className="w-3 h-3" /> Efectivo</div><div className="mt-2 font-heading font-extrabold text-2xl text-emerald-600">{fmtMoney(stats.cash, currency)}</div></div>
        <div className="bg-white border border-slate-200 rounded-xl p-5"><div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Tarjeta</div><div className="mt-2 font-heading font-extrabold text-2xl text-brand">{fmtMoney(stats.card, currency)}</div></div>
        <div className="bg-white border border-slate-200 rounded-xl p-5"><div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Yape/Plin/Transf.</div><div className="mt-2 font-heading font-extrabold text-2xl text-violet-600">{fmtMoney(stats.digital, currency)}</div></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5"><div className="flex items-center gap-2 text-emerald-700 text-xs uppercase font-semibold"><TrendingUp className="w-4 h-4" /> Total ingresos</div><div className="mt-2 font-heading font-extrabold text-2xl text-emerald-900">{fmtMoney(stats.cash + stats.card + stats.digital + stats.other, currency)}</div></div>
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-5"><div className="flex items-center gap-2 text-rose-700 text-xs uppercase font-semibold"><TrendingDown className="w-4 h-4" /> Gastos</div><div className="mt-2 font-heading font-extrabold text-2xl text-rose-900">{fmtMoney(stats.expenses, currency)}</div></div>
        <div className="bg-brand-soft border border-brand-light rounded-xl p-5"><div className="flex items-center gap-2 text-brand-dark text-xs uppercase font-semibold"><Wallet className="w-4 h-4" /> Saldo esperado</div><div className="mt-2 font-heading font-extrabold text-2xl text-brand-dark">{fmtMoney(stats.expected, currency)}</div></div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100"><h3 className="font-heading font-bold">Movimientos del turno</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="text-xs uppercase tracking-wider text-slate-500 bg-slate-50/50">
              <th className="text-left px-6 py-3 font-semibold">Fecha</th><th className="text-left px-6 py-3 font-semibold">Tipo</th>
              <th className="text-left px-6 py-3 font-semibold">Método</th><th className="text-left px-6 py-3 font-semibold">Nota</th>
              <th className="text-right px-6 py-3 font-semibold">Monto</th>
            </tr></thead>
            <tbody>
              {cash.movements.map(m => (
                <tr key={m.id} className="border-t border-slate-100">
                  <td className="px-6 py-3 text-sm text-slate-600">{fmtDate(m.at, true)}</td>
                  <td className="px-6 py-3 text-sm">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${m.type === "ingreso" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-rose-100 text-rose-700 border-rose-200"}`}>{m.type}</span>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-600">{m.method || "-"}</td>
                  <td className="px-6 py-3 text-sm text-slate-700">{m.note}</td>
                  <td className={`px-6 py-3 text-sm text-right font-bold ${m.type === "ingreso" ? "text-emerald-600" : "text-rose-600"}`}>{m.type === "ingreso" ? "+" : "-"}{fmtMoney(m.amount, currency)}</td>
                </tr>
              ))}
              {cash.movements.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-slate-500 text-sm">Sin movimientos</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={openOpen} onOpenChange={setOpenOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Apertura de caja</DialogTitle></DialogHeader>
          <div className="space-y-3"><Label>Saldo inicial ({currency})</Label><Input data-testid="caja-opening-balance" type="number" value={balance} onChange={(e) => setBalance(e.target.value)} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setOpenOpen(false)}>Cancelar</Button><Button data-testid="caja-confirm-open" onClick={doOpen} className="bg-brand hover:bg-brand-dark">Abrir</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openMov} onOpenChange={setOpenMov}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nuevo movimiento de caja</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Tipo</Label>
              <Select value={mov.type} onValueChange={(v) => setMov(x => ({ ...x, type: v }))}>
                <SelectTrigger data-testid="mov-caja-type"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ingreso">Ingreso</SelectItem><SelectItem value="gasto">Gasto</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Método</Label>
              <Select value={mov.method} onValueChange={(v) => setMov(x => ({ ...x, method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}<SelectItem value="Otros">Otros</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Monto</Label><Input data-testid="mov-caja-amount" type="number" step="0.5" value={mov.amount} onChange={(e) => setMov(x => ({ ...x, amount: e.target.value }))} /></div>
            <div><Label>Nota</Label><Input data-testid="mov-caja-note" value={mov.note} onChange={(e) => setMov(x => ({ ...x, note: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpenMov(false)}>Cancelar</Button><Button data-testid="mov-caja-save" onClick={addMov} className="bg-brand hover:bg-brand-dark">Registrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
