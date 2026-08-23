const express = require("express");
const router = express.Router();
const Tenant = require("../models/Tenant");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");

// @route   GET /api/auth/tenant
// @desc    Obtener tenant actual del usuario
// @access  Private
router.get("/tenant", protect, async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ owner: req.user.id });
    if (!tenant) {
      return res.status(404).json({ message: "Tenant no encontrado" });
    }
    res.json(tenant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/auth/register-tenant
// @desc    Registrar nuevo tenant
// @access  Private/Admin
router.post("/register-tenant", protect, authorize("admin"), async (req, res) => {
  try {
    const { name, plan, settings } = req.body;
    const tenant = new Tenant({
      name,
      plan,
      settings,
      owner: req.user.id,
    });
    await tenant.save();
    res.status(201).json(tenant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;