import React from "react";
import { Printer } from "lucide-react";
import { fmtMoney, fmtDate } from "../context/AppContext";
import { Button } from "./ui/button";

export default function Ticket({ order, config }) {
  const currency = config.business.currencySymbol;
  const handlePrint = () => {
    document.body.classList.add("print-mode-ticket");
    setTimeout(() => {
      window.print();
      document.body.classList.remove("print-mode-ticket");
    }, 100);
  };
  return (
    <div>
      <div id="print-ticket" className="font-mono-ticket text-black bg-white mx-auto border border-slate-200 rounded-lg p-4 text-xs" style={{ maxWidth: 320 }}>
        <div className="text-center">
          <div className="font-bold text-base uppercase tracking-widest">{config.business.name}</div>
          <div className="text-[10px] mt-0.5">{config.business.tagline}</div>
          <div className="text-[10px] mt-1">{config.business.address}</div>
          <div className="text-[10px]">Tel: {config.business.phone}</div>
          <div className="text-[10px]">RUC: {config.business.ruc}</div>
        </div>
        <div className="border-t border-dashed border-black my-2" />
        <div className="text-[10px] space-y-0.5">
          <div className="flex justify-between"><span data-testid="ticket-order-number">ORDEN:</span><span className="font-bold">{order.number}</span></div>
          <div className="flex justify-between"><span data-testid="ticket-date">FECHA:</span><span>{fmtDate(order.createdAt, true)}</span></div>
          <div className="flex justify-between"><span data-testid="ticket-customer">CLIENTE:</span><span className="truncate ml-2">{order.customerName}</span></div>
          <div className="flex justify-between"><span data-testid="ticket-payment">PAGO:</span><span>{order.paymentMethod}</span></div>
        </div>
        <div className="border-t border-dashed border-black my-2" />
        <div className="text-[10px] font-bold uppercase flex justify-between">
          <span>Descripción</span><span>Total</span>
        </div>
        <div className="border-t border-dashed border-black my-1" />
        {order.items.map((it, i) => (
          <div key={i} className="text-[10px] mb-1">
            <div className="flex justify-between">
              <span className="truncate mr-1">{it.name}</span>
              <span className="font-bold whitespace-nowrap">{fmtMoney(it.price * it.qty, currency)}</span>
            </div>
            <div className="text-[9px] text-black/70">{it.qty} {it.unit} × {fmtMoney(it.price, currency)}</div>
          </div>
        ))}
        <div className="border-t border-dashed border-black my-2" />
        <div className="text-[10px] space-y-0.5">
          <div className="flex justify-between"><span data-testid="ticket-subtotal">Subtotal</span><span>{fmtMoney(order.subtotal, currency)}</span></div>
          {order.discount > 0 && <div className="flex justify-between"><span data-testid="ticket-discount">Descuento</span><span>-{fmtMoney(order.discount, currency)}</span></div>}
          <div className="flex justify-between"><span data-testid="ticket-tax">IGV</span><span>{fmtMoney(order.tax, currency)}</span></div>
          <div className="border-t border-dashed border-black my-1" />
          <div className="flex justify-between font-bold text-xs"><span data-testid="ticket-total">TOTAL</span><span>{fmtMoney(order.total, currency)}</span></div>
        </div>
        <div className="border-t border-dashed border-black my-2" />
        <div className="text-[10px] space-y-0.5">
          <div className="flex justify-between"><span data-testid="ticket-delivery">Entrega:</span><span>{fmtDate(order.promisedAt, true)}</span></div>
        </div>
        <div className="border-t border-dashed border-black my-2" />
        <div className="text-center text-[10px]">
          <div>¡Gracias por su preferencia!</div>
          <div className="mt-1">{config.business.email}</div>
        </div>
      </div>
      <div className="mt-4 flex justify-center no-print">
        <Button data-testid="ticket-print-btn" onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Printer className="w-4 h-4" /> Imprimir
        </Button>
      </div>
    </div>
  );
}
