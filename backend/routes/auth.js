const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const Tenant = require("../models/Tenant");
const User = require("../models/User");
const { protect, authorize, createSendToken } = require("../middleware/auth");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "fail", message: "Demasiados intentos de login" },
});

// POST /api/auth/register — creates tenant + admin user
router.post("/register", async (req, res) => {
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

    const tenant = await Tenant.create({ name: tenantName.trim() });
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

// POST /api/auth/login
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

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    createSendToken(user, 200, res);
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ status: "success", data: { user } });
});

// GET /api/auth/tenant
router.get("/tenant", protect, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenant);
    if (!tenant) {
      return res.status(404).json({ status: "fail", message: "Tenant no encontrado" });
    }
    res.json({ status: "success", data: { tenant } });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// POST /api/auth/register-tenant (admin only, additional tenants not supported in single-tenant-user model)
router.post("/register-tenant", protect, authorize("admin"), async (req, res) => {
  return res.status(400).json({
    status: "fail",
    message: "Usa POST /api/auth/register para crear un nuevo negocio",
  });
});

module.exports = router;
