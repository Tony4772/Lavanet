import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { api, hasApiBackend } from "../lib/api";
import { openCulqiCheckout } from "../lib/culqi";
import { useApp, fmtDate } from "../context/AppContext";
import { fmtSubscriptionPrice, SUBSCRIPTION_IGV_NOTE } from "../lib/subscriptionPricing";

const STATUS = {
  trial: { label: "Periodo de prueba", className: "bg-sky-100 text-sky-800 border-sky-200" },
  active: { label: "Activa", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  grace: { label: "Gracia — paga tu suscripción", className: "bg-amber-100 text-amber-900 border-amber-200" },
  suspended: { label: "Suspendida", className: "bg-red-100 text-red-800 border-red-200" },
  demo: { label: "Demo", className: "bg-slate-100 text-slate-700 border-slate-200" },
};

const fmtMoney = (amount) => `S/ ${Number(amount || 0).toFixed(2)}`;

const PAYMENT_STATUS = {
  paid: "Pagado",
  manual: "Pagado (manual)",
  failed: "Fallido",
  pending: "Pendiente",
};

/** ¿Toca pagar la suscripción ahora? */
function mustPayNow(billing) {
  if (!billing || billing.isBlocked) return true;
  if (billing.status === "grace" || billing.status === "suspended") return true;
  if (billing.daysUntilFirstCharge != null && billing.daysUntilFirstCharge <= 0 && !billing.lastPaidAt) {
    return true;
  }
  if (billing.daysUntilNextCharge != null && billing.daysUntilNextCharge <= 0 && billing.lastPaidAt) {
    return true;
  }
  return false;
}

export default function SubscriptionPanel() {
  const { currentUser, updateSubscriptionState } = useApp();
  const [info, setInfo] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [culqiBusy, setCulqiBusy] = useState(false);

  const load = useCallback(async () => {
    if (!hasApiBackend()) return;
    setLoading(true);
    try {
      const [subRes, payRes] = await Promise.all([
        api.get("/api/billing"),
        api.get("/api/billing/payments"),
      ]);
      const data = subRes.data?.data;
      setInfo(data);
      setPayments(payRes.data?.data?.payments || []);
      if (data?.billing) {
        updateSubscriptionState?.({
          billing: data.billing,
          subscriptionBlocked: !!data.billing.isBlocked,
        });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error al cargar suscripción");
    } finally {
      setLoading(false);
    }
  }, [updateSubscriptionState]);

  useEffect(() => {
    load();
  }, [load]);

  const paySubscription = async () => {
    setCulqiBusy(true);
    try {
      const { data: res } = await api.post("/api/billing/culqi-session", {
        email: info?.billingEmail || currentUser?.email,
      });
      const { tokenId, email } = await openCulqiCheckout(res.data);
      const { data: done } = await api.post("/api/billing/culqi-complete", { tokenId, email });

      toast.success(
        done.data?.method === "yape"
          ? "Suscripción pagada con Yape"
          : "Suscripción pagada con tarjeta"
      );

      if (done.data?.billing) {
        updateSubscriptionState?.({
          billing: done.data.billing,
          subscriptionBlocked: !done.data.billing.isBlocked,
        });
      }
      load();
    } catch (err) {
      if (err?.message !== "Pago cancelado") {
        toast.error(err?.response?.data?.message || err.message || "No se completó el pago");
      }
    } finally {
      setCulqiBusy(false);
    }
  };

  if (!hasApiBackend()) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-2xl text-sm text-slate-600">
        La suscripción a lavanet se gestiona cuando la aplicación está conectada al servidor en producción.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        Cargando suscripción...
      </div>
    );
  }

  const billing = info?.billing || {};
  const statusKey = info?.isDemo ? "demo" : billing.status || "trial";
  const status = STATUS[statusKey] || STATUS.trial;
  const payNow = mustPayNow(billing);
  const inFreeTrial =
    billing.status === "trial" &&
    !billing.isBlocked &&
    billing.daysUntilFirstCharge != null &&
    billing.daysUntilFirstCharge > 0;

  return (
    <div className="space-y-4 max-w-3xl">
      {(billing.isBlocked || billing.status === "grace") && !info?.isDemo && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-950">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            {billing.isBlocked ? (
              <>
                <p className="font-semibold">Tu suscripción está suspendida.</p>
                <p className="mt-1">Pulsa <strong>Pagar suscripción</strong> y elige tarjeta o Yape en Culqi.</p>
              </>
            ) : (
              <>
                <p className="font-semibold">Debes pagar tu suscripción.</p>
                <p className="mt-1">
                  Tienes hasta el {billing.graceUntil ? fmtDate(billing.graceUntil, true) : "fin del plazo"}.
                  Elige tarjeta o Yape en Culqi.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading font-bold text-slate-900">Mi suscripción</h3>
            <p className="text-xs text-slate-500 mt-1">
              {fmtSubscriptionPrice(billing.monthlyPrice)}/mes · {billing.trialDays || 30} días de prueba gratis · el cobro inicia al día{" "}
              {(billing.trialDays || 30) + 1}
            </p>
          </div>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}>
            {status.label}
          </span>
        </div>

        {info?.isDemo ? (
          <p className="text-sm text-slate-600">
            Cuenta demo — no requiere pago. Para contratar: WhatsApp{" "}
            <a href="https://wa.me/51906591037" className="text-brand font-semibold">
              906 591 037
            </a>
            .
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Precio mensual ({SUBSCRIPTION_IGV_NOTE})</div>
                <div className="mt-1 font-heading text-2xl font-extrabold text-slate-900">
                  {fmtSubscriptionPrice(billing.monthlyPrice)}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {inFreeTrial ? "Primer pago" : "Próximo pago"}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {!billing.lastPaidAt && billing.firstChargeAt
                    ? fmtDate(billing.firstChargeAt, true)
                    : billing.nextChargeAt
                      ? fmtDate(billing.nextChargeAt, true)
                      : "—"}
                </div>
                {inFreeTrial && (
                  <div className="text-xs text-slate-500 mt-1">
                    {billing.daysUntilFirstCharge} días de prueba restantes
                  </div>
                )}
              </div>
            </div>

            {billing.status === "active" && !payNow && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-2 text-sm text-emerald-800">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                Suscripción al día. Próximo pago:{" "}
                {billing.nextChargeAt ? fmtDate(billing.nextChargeAt, true) : "—"}
              </div>
            )}

            {inFreeTrial && (
              <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
                Estás en <strong>periodo de prueba gratis</strong>. Cuando termine, aquí aparecerá el botón{" "}
                <strong>Pagar suscripción</strong> para que pagues con tarjeta o Yape en Culqi.
              </p>
            )}

            {payNow && (
              <div className="rounded-xl border-2 border-brand/40 bg-brand-soft/20 p-5 text-center space-y-3">
                <p className="text-sm text-slate-800">
                  Paga <strong>{fmtSubscriptionPrice(billing.monthlyPrice)}</strong> de tu suscripción mensual.
                  <br />
                  En Culqi eliges <strong>tarjeta</strong> o <strong>Yape</strong>.
                </p>
                <Button
                  onClick={paySubscription}
                  disabled={culqiBusy}
                  className="bg-brand hover:bg-brand-dark gap-2 h-12 px-10 text-base font-bold"
                >
                  {culqiBusy ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Abriendo Culqi...
                    </>
                  ) : (
                    "Pagar suscripción"
                  )}
                </Button>
                <p className="text-[11px] text-slate-500">El cobro lo procesa Culqi. lavanet no guarda datos de pago.</p>
              </div>
            )}

            <Button type="button" variant="outline" onClick={load} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Actualizar
            </Button>
          </>
        )}
      </div>

      {!info?.isDemo && payments.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
            Historial de pagos
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500 bg-slate-50/80">
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Monto</th>
                  <th className="px-4 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id} className="border-t border-slate-100">
                    <td className="px-4 py-2.5">{fmtDate(p.createdAt, true)}</td>
                    <td className="px-4 py-2.5 font-semibold">{fmtMoney((p.amountCents || 0) / 100)}</td>
                    <td className="px-4 py-2.5">{PAYMENT_STATUS[p.status] || p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
