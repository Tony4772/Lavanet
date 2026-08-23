const express = require("express");
const router = express.Router();
const Tenant = require("../models/Tenant");
const User = require("../models/User");
const Payment = require("../models/Payment");
const culqi = require("../lib/culqi");
const billing = require("../lib/billing");
const { protect, superadminOnly } = require("../middleware/auth");

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
      .populate("owner", "name username email");
    const rows = tenants.map((t) => ({
      ...t.toObject(),
      billing: billing.getBillingSnapshot(t),
    }));
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
      sunat: sunat?.enabled
        ? {
            enabled: true,
            ruc: sunat.ruc,
            businessName: sunat.businessName || name.trim(),
            address: sunat.address,
            ubigeo: sunat.ubigeo,
            solUser: sunat.solUser,
            solPass: sunat.solPass,
            certificatePassword: sunat.certificatePassword,
            environment: sunat.environment || "beta",
            seriesInvoice: sunat.seriesInvoice || "F001",
            seriesBoleta: sunat.seriesBoleta || "B001",
          }
        : { enabled: false },
    });

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

    const { monthlyPrice, billingStatus, status, contractNotes, contactPhone, contactEmail, billingEmail } =
      req.body;

    if (monthlyPrice !== undefined) tenant.monthlyPrice = Number(monthlyPrice);
    if (contractNotes !== undefined) tenant.contractNotes = contractNotes;
    if (contactPhone !== undefined) tenant.contactPhone = contactPhone;
    if (contactEmail !== undefined) tenant.contactEmail = contactEmail;
    if (billingEmail !== undefined) tenant.billingEmail = billingEmail;
    if (billingStatus && ["trial", "active", "grace", "suspended"].includes(billingStatus)) {
      tenant.billingStatus = billingStatus;
      if (billingStatus === "suspended") tenant.status = "suspended";
      if (billingStatus === "active") tenant.status = "active";
    }
    if (status && ["active", "inactive", "suspended"].includes(status)) tenant.status = status;

    await tenant.save();
    res.json({ status: "success", data: { tenant, billing: billing.getBillingSnapshot(tenant) } });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.post("/tenants/:id/mark-paid", async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant || tenant.isDemo) {
      return res.status(404).json({ status: "fail", message: "Tenant no encontrado" });
    }
    await billing.markPaidManual(tenant, req.user._id, req.body?.notes);
    res.json({ status: "success", data: { billing: billing.getBillingSnapshot(tenant) } });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
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

router.post("/billing/run", async (req, res) => {
  try {
    const result = await billing.processDueBilling();
    res.json({ status: "success", data: result });
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
