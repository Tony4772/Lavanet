const express = require("express");
const router = express.Router();
const Tenant = require("../models/Tenant");
const { protect, authorize, verifyTenant } = require("../middleware/auth");

router.get("/", protect, verifyTenant, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant) return res.status(404).json({ message: "Tenant no encontrado" });
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

router.put("/", protect, authorize("admin"), verifyTenant, async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(
      req.tenantId,
      { $set: { settings: req.body } },
      { new: true, runValidators: true }
    );
    if (!tenant) return res.status(404).json({ message: "Tenant no encontrado" });
    res.json(tenant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
