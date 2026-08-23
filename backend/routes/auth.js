const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const Tenant = require("../models/Tenant");
const User = require("../models/User");
const { protect, createSendToken } = require("../middleware/auth");
const billing = require("../lib/billing");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "fail", message: "Demasiados intentos de login" },
});

const publicRegisterEnabled = () => process.env.ALLOW_PUBLIC_REGISTER === "true";

router.post("/register", async (req, res) => {
  if (!publicRegisterEnabled()) {
    return res.status(403).json({
      status: "fail",
      message: "Registro público desactivado. Contrata por WhatsApp 906 591 037",
    });
  }
  try {
    const { tenantName, name, username, email, password } = req.body;
    if (!tenantName || !name || !username || !email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "tenantName, name, username, email y password son requeridos",
      });
    }
    if (String(password).length < 8) {
      return res.status(400).json({
        status: "fail",
        message: "Password debe tener mínimo 8 caracteres",
      });
    }

    const existingTenant = await Tenant.findOne({ name: tenantName.trim() });
    if (existingTenant) {
      return res.status(409).json({ status: "fail", message: "Tenant ya existe" });
    }

    const startedAt = new Date();
    const tenant = await Tenant.create({
      name: tenantName.trim(),
      slug: `biz-${Date.now().toString(36)}`,
      startedAt,
      firstChargeAt: billing.computeFirstChargeAt(startedAt),
      billingStatus: "trial",
      monthlyPrice: 0,
    });
    const user = await User.create({
      name,
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password,
      role: "admin",
      tenant: tenant._id,
    });

    tenant.owner = user._id;
    await tenant.save();

    createSendToken(user, 201, res);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ status: "fail", message: "Usuario o email ya registrado" });
    }
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const login = (username || email || "").trim().toLowerCase();
    if (!login || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Usuario/email y password son requeridos",
      });
    }

    const user = await User.findOne({
      $or: [{ username: login }, { email: login }],
    }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        status: "fail",
        message: "Credenciales inválidas",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        status: "fail",
        message: "Usuario inactivo",
      });
    }

    let tenantInfo = null;
    if (user.role !== "superadmin" && user.tenant) {
      const tenant = await Tenant.findById(user.tenant);
      if (tenant) {
        if (!tenant.isDemo && tenant.billingStatus === "suspended") {
          return res.status(402).json({
            status: "fail",
            code: "SUBSCRIPTION_SUSPENDED",
            message: "Suscripción suspendida. WhatsApp 906 591 037",
          });
        }
        tenantInfo = {
          id: tenant._id,
          name: tenant.name,
          isDemo: tenant.isDemo,
          billing: billing.getBillingSnapshot(tenant),
        };
      }
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = require("../middleware/auth").signToken(user);
    const days = Number(process.env.JWT_COOKIE_EXPIRES_IN || 1);
    res.cookie("jwt", token, {
      expires: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    const safeUser = user.toObject();
    delete safeUser.password;

    res.status(200).json({
      status: "success",
      token,
      data: { user: safeUser, tenant: tenantInfo },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.post("/demo", loginLimiter, async (req, res) => {
  try {
    const demoUser = process.env.DEMO_USERNAME || "demo";
    const demoPass = process.env.DEMO_PASSWORD || "demo2026";
    const tenant = await Tenant.findOne({ slug: "demo", isDemo: true });
    const user = await User.findOne({ username: demoUser, tenant: tenant?._id }).select("+password");
    if (!user || !(await user.comparePassword(demoPass))) {
      return res.status(503).json({ status: "fail", message: "Demo no disponible" });
    }
    createSendToken(user, 200, res);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  let tenant = null;
  if (user.tenant && user.role !== "superadmin") {
    const t = await Tenant.findById(user.tenant);
    if (t) {
      tenant = {
        ...t.toObject(),
        billing: billing.getBillingSnapshot(t),
      };
    }
  }
  res.json({ status: "success", data: { user, tenant } });
});

router.get("/tenant", protect, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenant);
    if (!tenant) {
      return res.status(404).json({ status: "fail", message: "Tenant no encontrado" });
    }
    res.json({
      status: "success",
      data: { tenant, billing: billing.getBillingSnapshot(tenant) },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

router.post("/register-tenant", protect, async (req, res) => {
  return res.status(400).json({
    status: "fail",
    message: "Contacta WhatsApp 906 591 037 para contratar lavanet",
  });
});

module.exports = router;
