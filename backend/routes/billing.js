const express = require("express");
const router = express.Router();
const Tenant = require("../models/Tenant");
const Payment = require("../models/Payment");
const culqi = require("../lib/culqi");
const billing = require("../lib/billing");
const { protect, authorize, verifyTenant } = require("../middleware/auth");

router.use(protect, verifyTenant, authorize("admin"));

router.get("/culqi-public-key", (req, res) => {
  res.json({ status: "success", data: { publicKey: culqi.getPublicKey() } });
});

router.get("/", async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant) {
      return res.status(404).json({ status: "fail", message: "Negocio no encontrado" });
    }

    res.json({
      status: "success",
      data: {
        tenantName: tenant.name,
        billingEmail: tenant.billingEmail || req.user.email || "",
        isDemo: tenant.isDemo || tenant.slug === "demo",
        billing: billing.getBillingSnapshot(tenant),
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.get("/payments", async (req, res) => {
  try {
    const payments = await Payment.find({ tenant: req.tenantId })
      .sort({ createdAt: -1 })
      .limit(24)
      .select("-culqiResponse");

    res.json({ status: "success", data: { payments } });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.post("/culqi-session", async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant) {
      return res.status(404).json({ status: "fail", message: "Negocio no encontrado" });
    }
    if (tenant.isDemo || tenant.slug === "demo") {
      return res.status(400).json({ status: "fail", message: "La cuenta demo no requiere suscripción" });
    }
    if (!culqi.getPublicKey()) {
      return res.status(503).json({ status: "fail", message: "Culqi no configurado en el servidor" });
    }

    const session = await billing.createCheckoutSession(tenant, req.user, req.body?.email);
    res.json({ status: "success", data: session });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message, culqi: err.culqi });
  }
});

router.post("/culqi-complete", async (req, res) => {
  try {
    const { tokenId, email } = req.body;
    if (!tokenId) {
      return res.status(400).json({ status: "fail", message: "tokenId requerido" });
    }

    const tenant = await Tenant.findById(req.tenantId).populate("owner", "name email");
    if (!tenant) {
      return res.status(404).json({ status: "fail", message: "Negocio no encontrado" });
    }
    if (tenant.isDemo || tenant.slug === "demo") {
      return res.status(400).json({ status: "fail", message: "La cuenta demo no requiere suscripción" });
    }

    const result = await billing.processCulqiToken(tenant, {
      tokenId,
      email,
      user: req.user,
    });

    res.json({ status: "success", data: result });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message, culqi: err.culqi });
  }
});

module.exports = router;
