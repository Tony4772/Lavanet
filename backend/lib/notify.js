/** Notificaciones de cobro — por ahora log + hook para email real. */
exports.sendBillingEmail = async (tenant, type, meta = {}) => {
  const email = tenant.billingEmail || tenant.contactEmail;
  const price = tenant.monthlyPrice;
  const lines = {
    upcoming: `Aviso: en ${meta.daysLeft} día(s) vence el periodo gratis (61 días). Próximo cobro S/ ${price}.`,
    grace: `Mora: ${meta.reason || "Pago pendiente"}. Gracia ${process.env.BILLING_GRACE_DAYS || 5} días.`,
    suspended: `Cuenta suspendida: ${meta.reason || "No se registró pago"}.`,
    paid: `Pago registrado S/ ${price}.`,
  };
  const msg = `[lavanet billing] ${tenant.name} <${email}> — ${lines[type] || type}`;
  console.log(msg);
  // TODO: Resend/SendGrid cuando SMTP esté configurado
  return { ok: true, logged: msg };
};
