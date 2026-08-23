const express = require("express");
const router = express.Router();
const Tenant = require("../models/Tenant");
const config = require("../config/config");

// @route   GET /api/config
// @desc    Obtener configuración del tenant
// @access  Private
router.get("/", protect, verifyTenant, (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant no encontrado" });
    }
    res.json({
      currency: tenant.settings?.currency || "PEN",
      timezone: tenant.settings?.timezone || "America/Lima",
      theme: tenant.settings?.theme || "light",
      features: tenant.settings?.features || {},
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/config
// @desc    Actualizar configuración del tenant
// @access  Private/Admin
router.put("/", protect, authorize("admin"), verifyTenant, async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(
      req.tenantId,
      { $set: { settings: req.body } },
      { new: true, runValidators: true }
    );
    res.json(tenant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;