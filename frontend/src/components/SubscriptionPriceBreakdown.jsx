import React from "react";
import { breakdownSubscriptionPrice, CULQI_FEE_RATE } from "../lib/subscriptionPricing";

const fmt = (n) => `S/ ${Number(n || 0).toFixed(2)}`;

/** Desglose: tu ganancia, Culqi e IGV SUNAT por precio mensual. */
export default function SubscriptionPriceBreakdown({ amount, className = "", compact = false }) {
  const b = breakdownSubscriptionPrice(amount);
  if (!b.gross || b.gross <= 0) return null;

  const culqiPct = (CULQI_FEE_RATE * 100).toFixed(2).replace(/\.?0+$/, "");

  if (compact) {
    return (
      <div className={`text-[10px] leading-snug text-slate-500 ${className}`}>
        <span className="text-emerald-700 font-medium">Tú {fmt(b.ownerNet)}</span>
        {" · "}
        Culqi ~{fmt(b.culqi)}
        {" · "}
        IGV {fmt(b.igv)}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 text-[11px] text-slate-600 space-y-1 ${className}`}>
      <div className="font-semibold text-slate-700">Desglose del precio mensual</div>
      <div className="flex justify-between gap-2">
        <span>Tu ganancia (neto)</span>
        <span className="font-semibold text-emerald-700">{fmt(b.ownerNet)}</span>
      </div>
      <div className="flex justify-between gap-2">
        <span>Culqi (~{culqiPct}% estimado)</span>
        <span>{fmt(b.culqi)}</span>
      </div>
      <div className="flex justify-between gap-2">
        <span>IGV SUNAT (18%)</span>
        <span>{fmt(b.igv)}</span>
      </div>
    </div>
  );
}
