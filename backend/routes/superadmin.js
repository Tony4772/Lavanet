const express = require("express");
const router = express.Router();
const Tenant = require("../models/Tenant");
const User = require("../models/User");
const Payment = require("../models/Payment");
const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Service = require("../models/Service");
const Product = require("../models/Product");
const Cash = require("../models/Cash");
const Coupon = require("../models/Coupon");
const Invoice = require("../models/Invoice");
const culqi = require("../lib/culqi");
const billing = require("../lib/billing");
const sunat = require("../lib/sunat");
const { tenantToCompany } = require("../lib/sunat/buildPayload");
const { protect, superadminOnly } = require("../middleware/auth");

const applySunatConfig = (sunatCfg, body, fallbackName) => {
  if (!body || body.enabled === false) {
    sunatCfg.enabled = false;
    return sunatCfg;
  }
  sunatCfg.enabled = true;
  if (body.ruc !== undefined) sunatCfg.ruc = String(body.ruc).replace(/\D/g, "");
  if (body.businessName !== undefined) sunatCfg.businessName = body.businessName || fallbackName;
  if (body.address !== undefined) sunatCfg.address = body.address;
  if (body.ubigeo !== undefined) sunatCfg.ubigeo = body.ubigeo;
  if (body.solUser !== undefined) sunatCfg.solUser = body.solUser;
  if (body.solPass) sunatCfg.solPass = body.solPass;
  if (body.certificatePassword !== undefined) sunatCfg.certificatePassword = body.certificatePassword;
  if (body.certificateP12) sunatCfg.certificateP12 = body.certificateP12;
  if (body.environment) sunatCfg.environment = body.environment === "produccion" ? "produccion" : "beta";
  if (body.seriesInvoice) sunatCfg.seriesInvoice = String(body.seriesInvoice).toUpperCase();
  if (body.seriesBoleta) sunatCfg.seriesBoleta = String(body.seriesBoleta).toUpperCase();
  return sunatCfg;
};

const sunatSummary = (tenant) => {
  const s = tenant.sunat || {};
  return {
    enabled: !!s.enabled,
    ruc: s.ruc || "",
    environment: s.environment || "beta",
    hasCertificate: !!s.certificateP12,
    hasSol: !!(s.solUser && s.solPass),
    seriesInvoice: s.seriesInvoice || "F001",
    seriesBoleta: s.seriesBoleta || "B001",
  };
};

router.use(protect, superadminOnly);

const slugify = (name) =>
  String(name || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || `tenant-${Date.now()}`;

router.get("/stats", async (req, res) => {
  try {
    const stats = await billing.getFinancialStats();
    res.json({ status: "success", data: stats });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.get("/culqi-public-key", (req, res) => {
  res.json({ status: "success", data: { publicKey: culqi.getPublicKey() } });
});

router.get("/tenants", async (req, res) => {
  try {
    const tenants = await Tenant.find({ slug: { $nin: ["demo", "__system__"] } })
      .sort({ createdAt: -1 })
      .populate("owner", "name username email")
      .select("+sunat.certificateP12 +sunat.solPass");
    const rows = tenants.map((t) => {
      const obj = t.toObject();
      if (obj.sunat) {
        delete obj.sunat.certificateP12;
        delete obj.sunat.solPass;
        delete obj.sunat.certificatePassword;
      }
      return {
        ...obj,
        billing: billing.getBillingSnapshot(t),
        sunatSummary: sunatSummary(t),
      };
    });
    res.json({ status: "success", data: { tenants: rows } });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.post("/tenants", async (req, res) => {
  try {
    const {
      name,
      adminName,
      adminUsername,
      adminEmail,
      adminPassword,
      monthlyPrice,
      contactPhone,
      contactEmail,
      billingEmail,
      contractNotes,
      culqiToken,
      sunat,
    } = req.body;

    if (!name?.trim() || !adminName?.trim() || !adminUsername?.trim() || !adminPassword) {
      return res.status(400).json({
        status: "fail",
        message: "name, adminName, adminUsername y adminPassword son requeridos",
      });
    }
    if (String(adminPassword).length < 8) {
      return res.status(400).json({ status: "fail", message: "Password admin mínimo 8 caracteres" });
    }
    const price = Number(monthlyPrice);
    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ status: "fail", message: "monthlyPrice inválido" });
    }

    if (sunat?.enabled) {
      const ruc = String(sunat.ruc || "").replace(/\D/g, "");
      if (ruc.length !== 11) {
        return res.status(400).json({ status: "fail", message: "SUNAT: RUC emisor debe tener 11 dígitos" });
      }
      if (!sunat.solUser?.trim() || !sunat.solPass?.trim()) {
        return res.status(400).json({ status: "fail", message: "SUNAT: usuario y clave SOL son obligatorios" });
      }
      if (!sunat.certificateP12?.trim()) {
        return res.status(400).json({ status: "fail", message: "SUNAT: certificado .p12 es obligatorio" });
      }
      if (!sunat.certificatePassword?.trim()) {
        return res.status(400).json({ status: "fail", message: "SUNAT: contraseña del certificado es obligatoria" });
      }
    }

    let slug = slugify(name);
    if (await Tenant.findOne({ slug })) slug = `${slug}-${Date.now().toString(36)}`;

    const startedAt = new Date();
    const tenant = await Tenant.create({
      name: name.trim(),
      slug,
      monthlyPrice: price,
      currency: "PEN",
      startedAt,
      firstChargeAt: billing.computeFirstChargeAt(startedAt),
      billingStatus: "trial",
      status: "active",
      contactPhone: contactPhone?.trim(),
      contactEmail: contactEmail?.trim(),
      billingEmail: (billingEmail || contactEmail || adminEmail)?.trim().toLowerCase(),
      contractNotes: contractNotes?.trim(),
      sunat: { enabled: false },
    });

    if (sunat?.enabled) {
      tenant.sunat = applySunatConfig(tenant.sunat || {}, sunat, name.trim());
      tenant.markModified("sunat");
      await tenant.save();
    }

    const admin = await User.create({
      name: adminName.trim(),
      username: adminUsername.trim().toLowerCase(),
      email: (adminEmail || `${adminUsername}@lavanet.local`).trim().toLowerCase(),
      password: adminPassword,
      role: "admin",
      tenant: tenant._id,
    });

    tenant.owner = admin._id;
    await tenant.save();

    if (culqiToken && tenant.billingEmail) {
      try {
        const customer = await culqi.createCustomer({
          email: tenant.billingEmail,
          first_name: adminName.trim().split(" ")[0],
          last_name: adminName.trim().split(" ").slice(1).join(" ") || "Cliente",
          phone_number: contactPhone?.replace(/\D/g, "").slice(-9) || undefined,
        });
        const card = await culqi.createCard({
          customer_id: customer.id,
          token_id: culqiToken,
        });
        tenant.culqiCustomerId = customer.id;
        tenant.culqiCardId = card.id;
        tenant.culqiCardLast4 = card.last_four;
        tenant.culqiCardBrand = card.iin?.brand || card.source?.brand;
        await tenant.save();
      } catch (culqiErr) {
        return res.status(201).json({
          status: "success",
          warning: `Tenant creado pero Culqi falló: ${culqiErr.message}`,
          data: { tenant, admin: { id: admin._id, username: admin.username } },
        });
      }
    }

    res.status(201).json({
      status: "success",
      data: {
        tenant,
        billing: billing.getBillingSnapshot(tenant),
        admin: { id: admin._id, username: admin.username, email: admin.email },
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ status: "fail", message: "Usuario o slug duplicado" });
    }
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.patch("/tenants/:id", async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant || tenant.isDemo) {
      return res.status(404).json({ status: "fail", message: "Tenant no encontrado" });
    }

    const {
      name,
      monthlyPrice,
      billingStatus,
      status,
      contractNotes,
      contactPhone,
      contactEmail,
      billingEmail,
      sunat: sunatBody,
    } = req.body;

    if (name !== undefined && String(name).trim()) tenant.name = String(name).trim();
    if (monthlyPrice !== undefined) {
      const price = Number(monthlyPrice);
      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({ status: "fail", message: "monthlyPrice inválido" });
      }
      tenant.monthlyPrice = price;
    }
    if (contractNotes !== undefined) tenant.contractNotes = contractNotes;
    if (contactPhone !== undefined) tenant.contactPhone = contactPhone;
    if (contactEmail !== undefined) tenant.contactEmail = contactEmail;
    if (billingEmail !== undefined) tenant.billingEmail = billingEmail;
    if (billingStatus && ["trial", "active", "grace", "suspended"].includes(billingStatus)) {
      tenant.billingStatus = billingStatus;
      if (billingStatus === "suspended") tenant.status = "suspended";
      if (billingStatus === "active" && tenant.status !== "inactive") tenant.status = "active";
    }
    if (status && ["active", "inactive", "suspended"].includes(status)) tenant.status = status;
    if (tenant.plan === "free" || !tenant.plan) tenant.plan = "custom";
    billing.syncTenantSchedule(tenant);

    if (sunatBody !== undefined) {
      tenant.sunat = applySunatConfig(tenant.sunat || {}, sunatBody, tenant.name);
      tenant.markModified("sunat");
    }

    await tenant.save();
    res.json({
      status: "success",
      data: { tenant, billing: billing.getBillingSnapshot(tenant), sunatSummary: sunatSummary(tenant) },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.post("/tenants/:id/pause", async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant || tenant.isDemo) {
      return res.status(404).json({ status: "fail", message: "Cliente no encontrado" });
    }
    tenant.status = "inactive";
    await tenant.save();
    res.json({
      status: "success",
      message: "Cliente pausado",
      data: { tenant, billing: billing.getBillingSnapshot(tenant) },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.post("/tenants/:id/block", async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant || tenant.isDemo) {
      return res.status(404).json({ status: "fail", message: "Cliente no encontrado" });
    }
    await billing.suspendTenant(tenant, req.body?.reason || "Bloqueado por superadmin");
    const fresh = await Tenant.findById(tenant._id);
    res.json({
      status: "success",
      message: "Cliente bloqueado",
      data: { tenant: fresh, billing: billing.getBillingSnapshot(fresh) },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.post("/tenants/:id/reactivate", async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant || tenant.isDemo) {
      return res.status(404).json({ status: "fail", message: "Cliente no encontrado" });
    }
    tenant.status = "active";
    if (tenant.billingStatus === "suspended") {
      tenant.billingStatus = tenant.lastPaidAt ? "active" : "trial";
      tenant.graceUntil = undefined;
    }
    await tenant.save();
    res.json({
      status: "success",
      message: "Cliente reactivado",
      data: { tenant, billing: billing.getBillingSnapshot(tenant) },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.delete("/tenants/:id", async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant || tenant.isDemo) {
      return res.status(404).json({ status: "fail", message: "Cliente no encontrado" });
    }
    const id = tenant._id;
    await Promise.all([
      User.deleteMany({ tenant: id }),
      Payment.deleteMany({ tenant: id }),
      Order.deleteMany({ tenant: id }),
      Customer.deleteMany({ tenant: id }),
      Service.deleteMany({ tenant: id }),
      Product.deleteMany({ tenant: id }),
      Cash.deleteMany({ tenant: id }),
      Coupon.deleteMany({ tenant: id }),
      Invoice.deleteMany({ tenant: id }),
    ]);
    await tenant.deleteOne();
    res.json({ status: "success", message: "Cliente eliminado" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.post("/tenants/:id/mark-paid", async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant || tenant.isDemo) {
      return res.status(404).json({ status: "fail", message: "Cliente no encontrado" });
    }
    if (!tenant.monthlyPrice || Number(tenant.monthlyPrice) <= 0) {
      return res.status(400).json({ status: "fail", message: "Precio mensual inválido para registrar pago" });
    }
    await billing.markPaidManual(tenant, req.user._id, req.body?.notes);
    const fresh = await Tenant.findById(tenant._id);
    res.json({ status: "success", data: { billing: billing.getBillingSnapshot(fresh) } });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message || "Error al registrar pago" });
  }
});

router.post("/tenants/:id/charge", async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant || tenant.isDemo) {
      return res.status(404).json({ status: "fail", message: "Tenant no encontrado" });
    }
    const charge = await billing.attemptCulqiCharge(tenant);
    res.json({ status: "success", data: { charge, billing: billing.getBillingSnapshot(tenant) } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message, culqi: err.culqi });
  }
});

router.post("/tenants/:id/card", async (req, res) => {
  try {
    const { culqiToken } = req.body;
    if (!culqiToken) return res.status(400).json({ status: "fail", message: "culqiToken requerido" });

    const tenant = await Tenant.findById(req.params.id).populate("owner", "name email");
    if (!tenant || tenant.isDemo) {
      return res.status(404).json({ status: "fail", message: "Tenant no encontrado" });
    }

    let customerId = tenant.culqiCustomerId;
    if (!customerId) {
      const owner = tenant.owner;
      const customer = await culqi.createCustomer({
        email: tenant.billingEmail || owner?.email,
        first_name: (owner?.name || tenant.name).split(" ")[0],
        last_name: (owner?.name || tenant.name).split(" ").slice(1).join(" ") || "Cliente",
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

    res.json({
      status: "success",
      data: { last4: tenant.culqiCardLast4, brand: tenant.culqiCardBrand },
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message, culqi: err.culqi });
  }
});

router.post("/tenants/:id/sunat/test", async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).select(
      "+sunat.solPass +sunat.certificatePassword +sunat.certificateP12"
    );
    if (!tenant || tenant.isDemo) {
      return res.status(404).json({ status: "fail", message: "Tenant no encontrado" });
    }
    if (!tenant.sunat?.enabled) {
      return res.status(400).json({ status: "fail", message: "SUNAT no activado para este cliente" });
    }
    const result = await sunat.testConnection(tenantToCompany(tenant));
    res.json({ status: "success", data: result });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
});

router.post("/billing/run", async (req, res) => {
  try {
    const result = await billing.processDueBilling();
    res.json({ status: "success", data: result });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.post("/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ status: "fail", message: "Contraseña actual y nueva son requeridas" });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ status: "fail", message: "La nueva contraseña debe tener al menos 8 caracteres" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user || user.role !== "superadmin") {
      return res.status(403).json({ status: "fail", message: "Solo superadmin" });
    }
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ status: "fail", message: "Contraseña actual incorrecta" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ status: "success", message: "Contraseña actualizada" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.get("/payments", async (req, res) => {
  try {
    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("tenant", "name slug");
    res.json({ status: "success", data: { payments } });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

module.exports = router;
