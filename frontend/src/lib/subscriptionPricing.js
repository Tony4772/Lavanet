/** Precio de suscripción con IGV incluido (Perú). */
export const SUBSCRIPTION_IGV_NOTE = "IGV incluido";
export const IGV_RATE = 0.18;

/** Comisión Culqi estimada (tarjeta). Ajustable con REACT_APP_CULQI_FEE_PERCENT=3.99 */
export const CULQI_FEE_RATE =
  Number(process.env.REACT_APP_CULQI_FEE_PERCENT || 3.99) / 100;

const fmtPen = (amount) => `S/ ${Number(amount || 0).toFixed(2)}`;

export function fmtSubscriptionPrice(amount) {
  return `${fmtPen(amount)} (${SUBSCRIPTION_IGV_NOTE})`;
}

/** Desglose mensual desde el precio cobrado al cliente (IGV incluido). */
export function breakdownSubscriptionPrice(grossPen) {
  const gross = Math.max(0, Number(grossPen) || 0);
  if (gross <= 0) {
    return { gross: 0, igv: 0, culqi: 0, ownerNet: 0 };
  }
  const igv = gross - gross / (1 + IGV_RATE);
  const culqi = gross * CULQI_FEE_RATE;
  const ownerNet = gross - igv - culqi;
  return { gross, igv, culqi, ownerNet };
}

export function fmtBreakdownLine(key, amount) {
  return `${key}: ${fmtPen(amount)}`;
}
