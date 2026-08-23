const Tenant = require("../models/Tenant");
const Payment = require("../models/Payment");
const culqi = require("./culqi");
const { sendBillingEmail } = require("./notify");

const TRIAL_DAYS = Number(process.env.BILLING_TRIAL_DAYS || 61);
const GRACE_DAYS = Number(process.env.BILLING_GRACE_DAYS || 5);
const CYCLE_DAYS = Number(process.env.BILLING_CYCLE_DAYS || 30);

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

exports.TRIAL_DAYS = TRIAL_DAYS;
exports.GRACE_DAYS = GRACE_DAYS;
exports.CYCLE_DAYS = CYCLE_DAYS;

exports.computeFirstChargeAt = (startedAt) => addDays(startedAt, TRIAL_DAYS);

exports.syncTenantSchedule = (tenant) => {
  if (tenant.isDemo || tenant.slug === "demo") {
    tenant.billingStatus = "demo";
    return tenant;
  }
  if (!tenant.startedAt) tenant.startedAt = tenant.createdAt || new Date();
  if (!tenant.firstChargeAt) {
    tenant.firstChargeAt = exports.computeFirstChargeAt(tenant.startedAt);
  }
  return tenant;
};

exports.getBillingSnapshot = (tenant) => {
  const now = new Date();
  const t = exports.syncTenantSchedule(tenant);
  return {
    status: t.billingStatus,
    monthlyPrice: t.monthlyPrice,
    currency: t.currency || "PEN",
    startedAt: t.startedAt,
    firstChargeAt: t.firstChargeAt,
    nextChargeAt: t.nextChargeAt,
    graceUntil: t.graceUntil,
    daysUntilFirstCharge: t.firstChargeAt
      ? Math.ceil((t.firstChargeAt - now) / (1000 * 60 * 60 * 24))
      : null,
    isBlocked: t.billingStatus === "suspended",
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
    description: `Suscripción lavanet — ${tenant.name}`,
  });

  const now = new Date();
  tenant.billingStatus = "active";
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
      const dueFirst = tenant.firstChargeAt && now >= tenant.firstChargeAt && !tenant.lastPaidAt;
      const dueRecurring = tenant.nextChargeAt && now >= tenant.nextChargeAt && tenant.lastPaidAt;

      if (tenant.billingStatus === "grace" && tenant.graceUntil && now > tenant.graceUntil) {
        await exports.suspendTenant(tenant, "Periodo de gracia vencido");
        results.suspended += 1;
        continue;
      }

      const notifyDays = [6, 3, 1, 0];
      if (tenant.firstChargeAt && !tenant.lastPaidAt) {
        const daysLeft = Math.ceil((tenant.firstChargeAt - now) / (1000 * 60 * 60 * 24));
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
