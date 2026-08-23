import React, { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  Search, Plus, Minus, X, ShoppingCart, User, UserPlus, Trash2,
  Percent, Printer, CheckCircle2, Ticket as TicketIcon,
} from "lucide-react";
import { useApp, fmtMoney, fmtDate } from "../context/AppContext";
import { useTenant } from "../context/TenantContext";
import { SERVICE_CATEGORIES, PAYMENT_METHODS } from "../lib/seed";
import { api, hasApiBackend } from "../lib/api";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import Ticket from "../components/Ticket";
import { Switch } from "../components/ui/switch";

export default function POS() {
  const { data, updateCollection, createOrder, addCashMovement, findCoupon, redeemCoupon } = useApp();
  const { tenantId } = useTenant();
  const currency = data.config.business.currencySymbol;
  const taxRate = data.config.tax.enabled ? data.config.tax.rate : 0;

  const [searchService, setSearchService] = useState("");
  const [category, setCategory] = useState("Todas");
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [discountPct, setDiscountPct] = useState(0);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [amountPaid, setAmountPaid] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [emitSunat, setEmitSunat] = useState(false);
  const [sunatEnabled, setSunatEnabled] = useState(false);
  const [cpeType, setCpeType] = useState("03");
  const [clientDoc, setClientDoc] = useState("");
  const [invoiceLabel, setInvoiceLabel] = useState("");

  useEffect(() => {
    if (!hasApiBackend()) return;
    api
      .get("/api/sunat/status")
      .then(({ data: res }) => setSunatEnabled(!!res?.data?.enabled))
      .catch(() => setSunatEnabled(false));
  }, []);

  const filteredServices = useMemo(() => {
    const tenantFilter = tenantId ? s => s.tenantId === tenantId : s => true;
    return data.services.filter(s => s.active
      && (category === "Todas" || s.category === category)
      && (searchService === "" || s.name.toLowerCase().includes(searchService.toLowerCase()))
    ).filter(tenantFilter);
  }, [data.services, searchService, category, tenantId]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return [];
    return data.customers.filter(c =>
      (c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)) &&
      c.tenantId === tenantId
    ).slice(0, 5);
  }, [customerSearch, data.customers, tenantId]);

  const addToCart = (s) => {
    setCart(prev => {
      const found = prev.find(it => it.serviceId === s.id);
      if (found) return prev.map(it => it.serviceId === s.id ? { ...it, qty: it.qty + 1 } : it);
      return [...prev, { serviceId: s.id, name: s.name, category: s.category, price: s.price, unit: s.unit, qty: 1 }];
    });
  };
  const updateQty = (id, delta) => setCart(prev => prev.map(it => it.serviceId === id ? { ...it, qty: Math.max(1, it.qty + delta) } : it));
  const setQty = (id, qty) => setCart(prev => prev.map(it => it.serviceId === id ? { ...it, qty: Math.max(1, Number(qty) || 1) } : it));
  const removeItem = (id) => setCart(prev => prev.filter(it => it.serviceId !== id));

  const subtotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
  const discount = subtotal * (Number(discountPct) || 0) / 100;
  const loyalty = data.config.loyalty || { pointsToSol: 20, enabled: true };
  const availablePoints = customer?.pointsBalance || 0;
  const validPoints = Math.max(0, Math.min(availablePoints, Number(pointsToRedeem) || 0));
  const pointsDiscount = loyalty.enabled ? (validPoints / (loyalty.pointsToSol || 20)) : 0;
  const couponDiscount = appliedCoupon ? Number(appliedCoupon.valuePEN || 0) : 0;
  const taxable = Math.max(0, subtotal - discount - pointsDiscount - couponDiscount);
  const tax = taxable * taxRate;
  const total = taxable + tax;
  const change = Math.max(0, (Number(amountPaid) || 0) - total);

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const cp = findCoupon(code);
    if (!cp) { toast.error("Cupón inválido, ya usado o expirado"); return; }
    if (customer && cp.customerId !== customer.id) {
      toast.error("Este cupón pertenece a otro cliente");
      return;
    }
    if (!customer) {
      const owner = data.customers.find(c => c.id === cp.customerId);
      if (owner) setCustomer(owner);
    }
    setAppliedCoupon(cp);
    setCouponInput("");
    toast.success(`Cupón aplicado: -${fmtMoney(cp.valuePEN, currency)}`);
  };

  const handleCreateCustomer = () => {
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) { toast.error("Nombre y teléfono son requeridos"); return; }
    const c = {
      id: `c${Date.now()}`,
      ...newCustomer,
      address: "",
      createdAt: new Date().toISOString(),
      active: true,
      tenantId,
    };
    updateCollection("customers", (prev) => [c, ...prev]);
    setCustomer(c);
    setShowNewCustomer(false);
    setNewCustomer({ name: "", phone: "", email: "" });
    toast.success(`Cliente ${c.name} creado`);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error("El carrito está vacío"); return; }
    if (!customer) { toast.error("Selecciona o crea un cliente"); return; }
    if (paymentMethod === "Efectivo" && (Number(amountPaid) || 0) < total) { toast.error("Monto insuficiente"); return; }
    if (emitSunat && cpeType === "01" && String(clientDoc).replace(/\D/g, "").length !== 11) {
      toast.error("Factura requiere RUC del cliente (11 dígitos)");
      return;
    }

    const promised = new Date();
    promised.setDate(promised.getDate() + 2);
    const order = createOrder({
      customerId: customer.id,
      customerName: customer.name,
      items: cart,
      subtotal, discount, tax, total,
      pointsRedeemed: validPoints,
      pointsDiscount,
      couponCode: appliedCoupon?.code || null,
      couponDiscount,
      status: "Recibida",
      paymentMethod,
      paid: true,
      notes,
      promisedAt: promised.toISOString(),
      tenantId,
    });
    if (appliedCoupon) redeemCoupon(appliedCoupon.code, order.number);
    if (data.cash.isOpen) {
      addCashMovement({ type: "ingreso", amount: total, note: `Venta ${order.number}`, method: paymentMethod });
    }

    let cpe = "";
    if (emitSunat && hasApiBackend()) {
      try {
        const { data: res } = await api.post("/api/sunat/emit", {
          orderId: order.id || order.number,
          orderNumber: order.number,
          tipoDoc: cpeType,
          clientDocType: cpeType === "01" ? "6" : "1",
          clientDocNumber: clientDoc || (cpeType === "01" ? "" : "00000000"),
          clientName: customer.name,
          discount,
          items: cart,
        });
        cpe = res?.data?.invoice?.label || "";
        if (res.status === "success") toast.success(`CPE ${cpe} emitido`);
        else toast.error(res.message || "SUNAT rechazó el comprobante");
      } catch (err) {
        toast.error(err?.response?.data?.message || "Error emitiendo CPE (venta ya registrada)");
      }
    }

    setInvoiceLabel(cpe);
    setCreatedOrder(order);
    setConfirmOpen(true);
    setCart([]); setCustomer(null); setCustomerSearch(""); setDiscountPct(0); setNotes(""); setAmountPaid(""); setPointsToRedeem(0); setAppliedCoupon(null); setCouponInput(""); setClientDoc("");
  };

  return (
    <div data-testid="pos-page" className="grid grid-cols-1 xl:grid-cols-12 gap-4 animate-fadeInUp">
      {/* LEFT: Catálogo */}
      <div className="xl:col-span-8 space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input data-testid="pos-search-service" placeholder="Buscar servicio..." value={searchService} onChange={(e) => setSearchService(e.target.value)} className="pl-9 h-11 text-base" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {["Todas", ...SERVICE_CATEGORIES].map(c => (
                <button key={c} data-testid={`pos-cat-${c}`} onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                    category === c ? "bg-brand text-white border-brand" : "bg-white text-slate-600 border-slate-200 hover:border-brand-light"
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredServices.map(s => (
            <button
              key={s.id}
              data-testid={`pos-service-${s.id}`}
              onClick={() => addToCart(s)}
              className="text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-brand hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-brand-soft text-brand flex items-center justify-center text-xs font-bold">
                  {s.category.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{s.eta}</span>
              </div>
              <div className="mt-3">
                <div className="text-sm font-semibold text-slate-900 leading-tight">{s.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.category}</div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <div className="font-heading font-bold text-lg text-slate-900">{fmtMoney(s.price, currency)}</div>
                <div className="text-xs text-slate-500">/ {s.unit}</div>
              </div>
            </button>
          ))}
          {filteredServices.length === 0 && (
            <div className="col-span-full text-center py-10 text-slate-500 text-sm">No hay servicios que coincidan</div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart */}
      <div className="xl:col-span-4">
        <div className="xl:sticky xl:top-20 bg-white border border-slate-200 rounded-xl overflow-hidden">
          {/* Customer */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <Label className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Cliente</Label>
            {customer ? (
              <div className="mt-2 bg-white border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-brand-soft text-brand-dark flex items-center justify-center text-xs font-bold">
                      {customer.name.split(" ").map(s => s[0]).slice(0,2).join("")}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{customer.name}</div>
                      <div className="text-xs text-slate-500">{customer.phone}</div>
                    </div>
                  </div>
                  <button data-testid="pos-clear-customer" onClick={() => { setCustomer(null); setPointsToRedeem(0); }} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4"/></button>
                </div>
                {loyalty.enabled && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-slate-500">Puntos disponibles</span>
                    </div>
                    <span data-testid="pos-customer-points" className="text-sm font-heading font-bold text-amber-600">{availablePoints} pts</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input data-testid="pos-search-customer" placeholder="Buscar cliente..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="pl-9 h-9" />
                </div>
                {filteredCustomers.length > 0 && (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    {filteredCustomers.map(c => (
                      <button key={c.id} data-testid={`pos-pick-customer-${c.id}`} onClick={() => { setCustomer(c); setCustomerSearch(""); }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b border-slate-100 last:border-0">
                        <div className="font-medium text-slate-800">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.phone}</div>
                      </button>
                    ))}
                  </div>
                )}
                <button data-testid="pos-new-customer" onClick={() => setShowNewCustomer(true)} className="w-full flex items-center justify-center gap-2 text-xs text-brand hover:text-brand-dark font-semibold border border-dashed border-brand-light rounded-lg py-2">
                  <UserPlus className="w-3.5 h-3.5" /> Crear cliente rápido
                </button>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="max-h-72 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <div className="text-sm">Carrito vacío</div>
                <div className="text-xs mt-1">Selecciona servicios del catálogo</div>
              </div>
            ) : cart.map(it => (
              <div key={it.serviceId} className="p-3 border-b border-slate-100 last:border-0 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{it.name}</div>
                  <div className="text-xs text-slate-500">{fmtMoney(it.price, currency)} / {it.unit}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button data-testid={`pos-qty-minus-${it.serviceId}`} onClick={() => updateQty(it.serviceId, -1)} className="w-6 h-6 rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                  <input data-testid={`pos-qty-input-${it.serviceId}`} value={it.qty} onChange={(e) => setQty(it.serviceId, e.target.value)} className="w-10 text-center text-sm border border-slate-200 rounded h-6" />
                  <button data-testid={`pos-qty-plus-${it.serviceId}`} onClick={() => updateQty(it.serviceId, 1)} className="w-6 h-6 rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                </div>
                <button data-testid={`pos-remove-${it.serviceId}`} onClick={() => removeItem(it.serviceId)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/40 space-y-2">
            <div className="flex items-center gap-2">
              <Percent className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-600 flex-1">Descuento</span>
              <input data-testid="pos-discount" type="number" value={discountPct} min={0} max={50} onChange={(e) => setDiscountPct(e.target.value)} className="w-16 text-right text-sm border border-slate-200 rounded h-7 px-2" />
              <span className="text-xs text-slate-500">%</span>
            </div>
            {loyalty.enabled && customer && availablePoints > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center text-white text-[9px] font-bold">P</span>
                <span className="text-xs text-slate-600 flex-1">Canjear puntos <span className="text-slate-400">({loyalty.pointsToSol} pts = S/1)</span></span>
                <input data-testid="pos-points-redeem" type="number" value={pointsToRedeem} min={0} max={availablePoints} onChange={(e) => setPointsToRedeem(Math.max(0, Math.min(availablePoints, Number(e.target.value) || 0)))} className="w-16 text-right text-sm border border-slate-200 rounded h-7 px-2" />
                <button data-testid="pos-points-max" onClick={() => setPointsToRedeem(availablePoints)} className="text-[10px] font-semibold text-amber-600 hover:text-amber-700">MAX</button>
              </div>
            )}
            {/* Coupon */}
            <div className="flex items-center gap-2">
              <TicketIcon className="w-3.5 h-3.5 text-amber-500" />
              {appliedCoupon ? (
                <>
                  <span className="text-xs text-slate-600 flex-1">Cupón <span className="font-mono font-bold text-amber-700">{appliedCoupon.code}</span></span>
                  <button data-testid="pos-coupon-remove" onClick={() => setAppliedCoupon(null)} className="text-[10px] font-semibold text-rose-600 hover:text-rose-700">Quitar</button>
                </>
              ) : (
                <>
                  <input data-testid="pos-coupon-input" placeholder="Código cupón" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} className="flex-1 text-sm border border-slate-200 rounded h-7 px-2 font-mono uppercase" />
                  <button data-testid="pos-coupon-apply" onClick={applyCoupon} className="text-[10px] font-semibold text-brand hover:text-brand-dark">APLICAR</button>
                </>
              )}
            </div>
            <Textarea data-testid="pos-notes" placeholder="Observaciones (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="text-sm min-h-[60px]" />

            <div className="space-y-1 pt-2 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{fmtMoney(subtotal, currency)}</span></div>
              {discount > 0 && <div className="flex justify-between text-emerald-600"><span>Descuento</span><span>-{fmtMoney(discount, currency)}</span></div>}
              {pointsDiscount > 0 && <div className="flex justify-between text-amber-600"><span>Puntos ({validPoints} pts)</span><span>-{fmtMoney(pointsDiscount, currency)}</span></div>}
              {couponDiscount > 0 && <div className="flex justify-between text-amber-700"><span>Cupón {appliedCoupon?.code}</span><span>-{fmtMoney(couponDiscount, currency)}</span></div>}
              <div className="flex justify-between text-slate-600"><span>IGV ({(taxRate * 100).toFixed(0)}%)</span><span>{fmtMoney(tax, currency)}</span></div>
              <div className="flex justify-between font-heading font-extrabold text-slate-900 text-lg pt-1 border-t border-slate-200 mt-1">
                <span>Total</span><span data-testid="pos-total">{fmtMoney(total, currency)}</span>
              </div>
            </div>

            <div className="pt-2">
              <Label className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Método de pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger data-testid="pos-payment-method" className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === "Efectivo" && (
              <div>
                <Label className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Recibido</Label>
                <Input data-testid="pos-amount-paid" type="number" placeholder="0.00" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className="h-11 mt-1 text-base" inputMode="decimal" />
                {amountPaid && <div className="text-xs text-emerald-600 mt-1 font-semibold">Vuelto: {fmtMoney(change, currency)}</div>}
              </div>
            )}

            {sunatEnabled && (
              <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Emitir boleta/factura SUNAT</Label>
                    <p className="text-[10px] text-slate-500">Servicio contratado con Lavanet</p>
                  </div>
                  <Switch checked={emitSunat} onCheckedChange={setEmitSunat} />
                </div>
                {emitSunat && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Select value={cpeType} onValueChange={setCpeType}>
                      <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="03">Boleta</SelectItem>
                        <SelectItem value="01">Factura</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      className="h-11"
                      placeholder={cpeType === "01" ? "RUC cliente" : "DNI (opcional)"}
                      value={clientDoc}
                      onChange={(e) => setClientDoc(e.target.value)}
                      inputMode="numeric"
                    />
                  </div>
                )}
              </div>
            )}

            <Button data-testid="pos-checkout" onClick={handleCheckout} className="w-full h-12 bg-brand hover:bg-brand-dark font-semibold mt-2 text-base">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Cobrar y generar orden
            </Button>
          </div>
        </div>
      </div>

      {/* New customer modal */}
      <Dialog open={showNewCustomer} onOpenChange={setShowNewCustomer}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nuevo cliente rápido</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre completo *</Label><Input data-testid="new-customer-name" value={newCustomer.name} onChange={(e) => setNewCustomer(v => ({ ...v, name: e.target.value }))} /></div>
            <div><Label>Teléfono *</Label><Input data-testid="new-customer-phone" value={newCustomer.phone} onChange={(e) => setNewCustomer(v => ({ ...v, phone: e.target.value }))} /></div>
            <div><Label>Email</Label><Input data-testid="new-customer-email" value={newCustomer.email} onChange={(e) => setNewCustomer(v => ({ ...v, email: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCustomer(false)}>Cancelar</Button>
            <Button data-testid="new-customer-save" onClick={handleCreateCustomer} className="bg-brand hover:bg-brand-dark">Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation modal */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <DialogTitle className="text-center text-2xl font-heading">Orden creada correctamente</DialogTitle>
          </DialogHeader>
          {createdOrder && (
            <div className="pt-2 divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              <div className="flex justify-between items-center text-sm px-4 py-3 bg-slate-50/40"><span className="text-slate-500">Número</span><span className="font-mono font-semibold text-brand">{createdOrder.number}</span></div>
              <div className="flex justify-between items-center text-sm px-4 py-3"><span className="text-slate-500">Cliente</span><span className="font-semibold text-right">{createdOrder.customerName}</span></div>
              <div className="flex justify-between items-center text-sm px-4 py-3"><span className="text-slate-500">Total</span><span className="font-heading font-extrabold text-lg">{fmtMoney(createdOrder.total, currency)}</span></div>
              <div className="flex justify-between items-center text-sm px-4 py-3"><span className="text-slate-500">Método</span><span className="font-semibold">{createdOrder.paymentMethod}</span></div>
              {invoiceLabel && <div className="flex justify-between items-center text-sm px-4 py-3"><span className="text-slate-500">CPE</span><span className="font-mono font-semibold text-brand">{invoiceLabel}</span></div>}
              <div className="flex justify-between items-center text-sm px-4 py-3"><span className="text-slate-500">Entrega</span><span className="font-semibold">{fmtDate(createdOrder.promisedAt, true)}</span></div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cerrar</Button>
            <Button data-testid="print-ticket-btn" onClick={() => { setConfirmOpen(false); setTicketOpen(true); }} className="bg-brand hover:bg-brand-dark">
              <Printer className="w-4 h-4 mr-2" /> Ver / imprimir ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket dialog */}
      <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Comprobante 80mm</DialogTitle></DialogHeader>
          {createdOrder && <Ticket order={createdOrder} config={data.config} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
