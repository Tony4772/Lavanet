const Tenant = require("../models/Tenant");
const Payment = require("../models/Payment");
const culqi = require("./culqi");
const { sendBillingEmail } = require("./notify");

const TRIAL_DAYS = Number(process.env.BILLING_TRIAL_DAYS || 30);
const GRACE_DAYS = Number(process.env.BILLING_GRACE_DAYS || 5);
const CYCLE_DAYS = Number(process.env.BILLING_CYCLE_DAYS || 30);

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Días calendario desde `from` hasta `to` (sin horas). */
const calendarDaysUntil = (from, to) =>
  Math.round((startOfDay(to) - startOfDay(from)) / (1000 * 60 * 60 * 24));

exports.TRIAL_DAYS = TRIAL_DAYS;
exports.GRACE_DAYS = GRACE_DAYS;
exports.CYCLE_DAYS = CYCLE_DAYS;

/** 30 días gratis contando el alta; el cobro es al inicio del día siguiente (día 31). */
exports.computeFirstChargeAt = (startedAt) => addDays(startOfDay(startedAt), TRIAL_DAYS);

const isFirstChargeDue = (tenant, now = new Date()) =>
  !!(
    tenant.firstChargeAt &&
    startOfDay(now) >= startOfDay(tenant.firstChargeAt) &&
    !tenant.lastPaidAt
  );

exports.syncTenantSchedule = (tenant) => {
  if (tenant.isDemo || tenant.slug === "demo") {
    tenant.billingStatus = "demo";
    return tenant;
  }
  if (!tenant.startedAt) tenant.startedAt = tenant.createdAt || new Date();
  const expectedFirstCharge = exports.computeFirstChargeAt(tenant.startedAt);
  if (!tenant.firstChargeAt) {
    tenant.firstChargeAt = expectedFirstCharge;
  } else if (tenant.billingStatus === "trial" && !tenant.lastPaidAt) {
    tenant.firstChargeAt = expectedFirstCharge;
  }
  return tenant;
};

exports.getBillingSnapshot = (tenant) => {
  const now = new Date();
  const t = exports.syncTenantSchedule(tenant);
  const daysUntilNext = t.nextChargeAt
    ? Math.ceil((t.nextChargeAt - now) / (1000 * 60 * 60 * 24))
    : null;
  return {
    status: t.billingStatus,
    monthlyPrice: t.monthlyPrice,
    currency: t.currency || "PEN",
    startedAt: t.startedAt,
    firstChargeAt: t.firstChargeAt,
    nextChargeAt: t.nextChargeAt,
    graceUntil: t.graceUntil,
    lastPaidAt: t.lastPaidAt,
    daysUntilFirstCharge: t.firstChargeAt
      ? calendarDaysUntil(now, t.firstChargeAt)
      : null,
    daysUntilNextCharge: daysUntilNext,
    hasCard: !!t.culqiCardId,
    cardLast4: t.culqiCardLast4 || null,
    cardBrand: t.culqiCardBrand || null,
    isBlocked: t.billingStatus === "suspended",
    trialDays: TRIAL_DAYS,
  };
};

exports.registerCulqiCard = async (tenant, culqiToken) => {
  if (!culqiToken) throw new Error("Token de tarjeta requerido");

  let customerId = tenant.culqiCustomerId;
  if (!customerId) {
    const owner = tenant.owner;
    const name = owner?.name || tenant.name;
    const customer = await culqi.createCustomer({
      email: tenant.billingEmail,
      first_name: name.split(" ")[0],
      last_name: name.split(" ").slice(1).join(" ") || "Cliente",
      phone_number: tenant.contactPhone?.replace(/\D/g, "").slice(-9) || undefined,
    });
    customerId = customer.id;
    tenant.culqiCustomerId = customerId;
  }

  const card = await culqi.createCard({ customer_id: customerId, token_id: culqiToken });
  tenant.culqiCardId = card.id;
  tenant.culqiCardLast4 = card.last_four;
  tenant.culqiCardBrand = card.iin?.brand || card.source?.brand;
  await tenant.save();

  return {
    last4: tenant.culqiCardLast4,
    brand: tenant.culqiCardBrand,
  };
};

exports.isPaymentDue = (tenant) => {
  const now = new Date();
  exports.syncTenantSchedule(tenant);
  const dueFirst = isFirstChargeDue(tenant, now);
  const dueRecurring = tenant.nextChargeAt && now >= tenant.nextChargeAt && tenant.lastPaidAt;
  const inGrace = tenant.billingStatus === "grace";
  const suspended = tenant.billingStatus === "suspended";
  return dueFirst || dueRecurring || inGrace || suspended;
};

exports.payNowWithCard = async (tenant) => {
  if (!tenant.culqiCardId) throw new Error("Registra una tarjeta antes de pagar");
  if (!exports.isPaymentDue(tenant)) {
    throw new Error("Tu próximo cobro aún no vence. El cargo se hará automáticamente en la fecha indicada.");
  }
  return exports.attemptCulqiCharge(tenant);
};

exports.createCheckoutSession = async (tenant, user, email) => {
  exports.syncTenantSchedule(tenant);
  const amountCents = Math.round(Number(tenant.monthlyPrice || 0) * 100);
  if (amountCents < 100) throw new Error("Precio mensual inválido");

  const billingEmail = (email || tenant.billingEmail || user?.email)?.trim().toLowerCase();
  if (!billingEmail) throw new Error("Email requerido para Culqi");

  const exp = Math.floor(Date.now() / 1000) + 24 * 3600;
  const nameParts = (user?.name || tenant.name || "Cliente").split(" ");
  const order = await culqi.createOrder({
    amount: amountCents,
    currency_code: tenant.currency || "PEN",
    description: `Suscripción lavanet — ${tenant.name} (IGV incl.)`,
    order_number: `lvn-${tenant._id.toString().slice(-8)}-${Date.now()}`,
    client_details: {
      email: billingEmail,
      first_name: nameParts[0],
      last_name: nameParts.slice(1).join(" ") || "Cliente",
    },
    expiration_date: exp,
  });

  return {
    publicKey: culqi.getPublicKey(),
    settings: {
      title: "Pagar suscripción lavanet",
      currency: "PEN",
      amount: amountCents,
      order: order.id,
    },
    client: { email: billingEmail },
    options: {
      lang: "es",
      installments: false,
      modal: true,
      paymentMethods: {
        tarjeta: true,
        yape: true,
        bancaMovil: false,
        agente: false,
        billetera: false,
        cuotealo: false,
      },
    },
  };
};

exports.processCulqiToken = async (tenant, { tokenId, email, user }) => {
  if (!tokenId) throw new Error("Token Culqi requerido");

  const billingEmail = (email || tenant.billingEmail || user?.email)?.trim().toLowerCase();
  if (!billingEmail) throw new Error("Email requerido");
  tenant.billingEmail = billingEmail;

  const amountCents = Math.round(Number(tenant.monthlyPrice || 0) * 100);

  if (tokenId.startsWith("ype_")) {
    const charge = await culqi.createCharge({
      amount: amountCents,
      currency_code: tenant.currency || "PEN",
      email: billingEmail,
      source_id: tokenId,
      description: `Suscripción lavanet — ${tenant.name} (IGV incl.)`,
    });
    const now = new Date();
    tenant.billingStatus = "active";
    tenant.status = "active";
    tenant.lastPaidAt = now;
    tenant.nextChargeAt = addDays(now, CYCLE_DAYS);
    tenant.graceUntil = null;
    tenant.lastCulqiChargeId = charge.id;
    await tenant.save();
    await recordPayment(tenant, {
      amountCents,
      status: "paid",
      culqiChargeId: charge.id,
      culqiResponse: charge,
      notes: "Pago Yape (Culqi)",
    });
    return { method: "yape", charge, billing: exports.getBillingSnapshot(tenant) };
  }

  await exports.registerCulqiCard(tenant, tokenId);
  const charge = await culqi.createCharge({
    amount: amountCents,
    currency_code: tenant.currency || "PEN",
    email: billingEmail,
    source_id: tenant.culqiCardId,
    description: `Suscripción lavanet — ${tenant.name} (IGV incl.)`,
  });
  const now = new Date();
  tenant.billingStatus = "active";
  tenant.status = "active";
  tenant.lastPaidAt = now;
  tenant.nextChargeAt = addDays(now, CYCLE_DAYS);
  tenant.graceUntil = null;
  tenant.lastCulqiChargeId = charge.id;
  await tenant.save();
  await recordPayment(tenant, {
    amountCents,
    status: "paid",
    culqiChargeId: charge.id,
    culqiResponse: charge,
    notes: "Pago tarjeta (Culqi)",
  });

  return {
    method: "card",
    charge,
    card: { last4: tenant.culqiCardLast4, brand: tenant.culqiCardBrand },
    billing: exports.getBillingSnapshot(tenant),
  };
};

async function recordPayment(tenant, { amountCents, status, culqiChargeId, culqiResponse, notes, userId, manual }) {
  const now = new Date();
  return Payment.create({
    tenant: tenant._id,
    amountCents,
    currency: tenant.currency || "PEN",
    status: manual ? "manual" : status,
    culqiChargeId,
    culqiResponse,
    periodStart: tenant.lastPaidAt || tenant.startedAt,
    periodEnd: addDays(now, CYCLE_DAYS),
    notes,
    recordedBy: userId || undefined,
  });
}

exports.markPaidManual = async (tenant, userId, notes) => {
  const amountCents = Math.round(Number(tenant.monthlyPrice || 0) * 100);
  const now = new Date();
  tenant.billingStatus = "active";
  tenant.status = "active";
  tenant.lastPaidAt = now;
  tenant.nextChargeAt = addDays(now, CYCLE_DAYS);
  tenant.graceUntil = null;
  tenant.lastBillingNotice = null;
  await tenant.save();
  await recordPayment(tenant, {
    amountCents,
    status: "paid",
    notes: notes || "Pago manual registrado",
    userId,
    manual: true,
  });
  return tenant;
};

exports.attemptCulqiCharge = async (tenant) => {
  if (!tenant.culqiCardId) {
    throw new Error("Cliente sin tarjeta registrada en Culqi");
  }
  const amountCents = Math.round(Number(tenant.monthlyPrice || 0) * 100);
  if (amountCents < 100) throw new Error("Precio mensual inválido");

  const charge = await culqi.createCharge({
    amount: amountCents,
    currency_code: tenant.currency || "PEN",
    email: tenant.billingEmail || tenant.contactEmail,
    source_id: tenant.culqiCardId,
    description: `Suscripción lavanet — ${tenant.name} (IGV incl.)`,
  });

  const now = new Date();
  tenant.billingStatus = "active";
  tenant.status = "active";
  tenant.lastPaidAt = now;
  tenant.nextChargeAt = addDays(now, CYCLE_DAYS);
  tenant.graceUntil = null;
  tenant.lastCulqiChargeId = charge.id;
  await tenant.save();

  await recordPayment(tenant, {
    amountCents,
    status: "paid",
    culqiChargeId: charge.id,
    culqiResponse: charge,
  });

  return charge;
};

exports.enterGrace = async (tenant, reason) => {
  if (tenant.billingStatus === "suspended") return tenant;
  tenant.billingStatus = "grace";
  tenant.graceUntil = addDays(new Date(), GRACE_DAYS);
  await tenant.save();
  await sendBillingEmail(tenant, "grace", { reason });
  return tenant;
};

exports.suspendTenant = async (tenant, reason) => {
  tenant.billingStatus = "suspended";
  tenant.status = "suspended";
  await tenant.save();
  await sendBillingEmail(tenant, "suspended", { reason });
  return tenant;
};

exports.processDueBilling = async () => {
  const now = new Date();
  const tenants = await Tenant.find({
    isDemo: { $ne: true },
    slug: { $ne: "demo" },
    billingStatus: { $nin: ["demo", "suspended"] },
  });

  const results = { charged: 0, grace: 0, suspended: 0, notices: 0, errors: [] };

  for (const tenant of tenants) {
    try {
      exports.syncTenantSchedule(tenant);
      const dueFirst = isFirstChargeDue(tenant, now);
      const dueRecurring = tenant.nextChargeAt && now >= tenant.nextChargeAt && tenant.lastPaidAt;

      if (tenant.billingStatus === "grace" && tenant.graceUntil && now > tenant.graceUntil) {
        await exports.suspendTenant(tenant, "Periodo de gracia vencido");
        results.suspended += 1;
        continue;
      }

      const notifyDays = [6, 3, 1, 0];
      if (tenant.firstChargeAt && !tenant.lastPaidAt) {
        const daysLeft = calendarDaysUntil(now, tenant.firstChargeAt);
        if (notifyDays.includes(daysLeft) && tenant.lastBillingNotice !== String(daysLeft)) {
          await sendBillingEmail(tenant, "upcoming", { daysLeft });
          tenant.lastBillingNotice = String(daysLeft);
          await tenant.save();
          results.notices += 1;
        }
      }

      if (!dueFirst && !dueRecurring) continue;

      if (tenant.culqiCardId) {
        try {
          await exports.attemptCulqiCharge(tenant);
          results.charged += 1;
        } catch (err) {
          await recordPayment(tenant, {
            amountCents: Math.round(Number(tenant.monthlyPrice || 0) * 100),
            status: "failed",
            notes: err.message,
            culqiResponse: err.culqi,
          });
          if (tenant.billingStatus !== "grace") {
            await exports.enterGrace(tenant, err.message);
            results.grace += 1;
          }
        }
      } else if (tenant.billingStatus !== "grace") {
        await exports.enterGrace(tenant, "Sin tarjeta Culqi — registrar pago manual");
        results.grace += 1;
      }
    } catch (err) {
      results.errors.push({ tenant: tenant.name, error: err.message });
    }
  }

  return results;
};

exports.getFinancialStats = async () => {
  const tenants = await Tenant.find({ isDemo: { $ne: true }, slug: { $ne: "demo" } });
  const payments = await Payment.find({ status: { $in: ["paid", "manual"] } }).sort({ createdAt: -1 });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const paidThisMonth = payments
    .filter((p) => p.createdAt >= monthStart)
    .reduce((s, p) => s + p.amountCents, 0);

  const mrr = tenants
    .filter((t) => ["active", "trial", "grace"].includes(t.billingStatus))
    .reduce((s, t) => s + Math.round(Number(t.monthlyPrice || 0) * 100), 0);

  const byStatus = tenants.reduce((acc, t) => {
    acc[t.billingStatus] = (acc[t.billingStatus] || 0) + 1;
    return acc;
  }, {});

  const monthlyRevenue = {};
  payments.forEach((p) => {
    if (!["paid", "manual"].includes(p.status)) return;
    const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, "0")}`;
    monthlyRevenue[key] = (monthlyRevenue[key] || 0) + p.amountCents;
  });

  return {
    tenantsTotal: tenants.length,
    byStatus,
    mrrCents: mrr,
    revenueMonthCents: paidThisMonth,
    payments: payments.slice(0, 50),
    monthlyRevenue,
  };
};
