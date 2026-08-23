const express = require("express");
const router = express.Router();
const Service = require("../models/Service");
const { protect, authorize, verifyTenant } = require("../middleware/auth");

const scoped = (req) => ({ _id: req.params.id, tenant: req.tenantId });

router.get("/", protect, verifyTenant, async (req, res) => {
  try {
    const services = await Service.find({ tenant: req.tenantId });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", protect, verifyTenant, async (req, res) => {
  try {
    const service = await Service.findOne(scoped(req));
    if (!service) return res.status(404).json({ message: "Servicio no encontrado" });
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", protect, verifyTenant, authorize("admin", "cajero", "recepcion"), async (req, res) => {
  try {
    const service = await Service.create({ ...req.body, tenant: req.tenantId });
    res.status(201).json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", protect, verifyTenant, authorize("admin", "cajero"), async (req, res) => {
  try {
    const { name, category, description, price, unit, eta, active } = req.body;
    const service = await Service.findOneAndUpdate(
      scoped(req),
      { name, category, description, price, unit, eta, active, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!service) return res.status(404).json({ message: "Servicio no encontrado" });
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", protect, authorize("admin"), verifyTenant, async (req, res) => {
  try {
    const service = await Service.findOneAndDelete(scoped(req));
    if (!service) return res.status(404).json({ message: "Servicio no encontrado" });
    res.json({ message: "Servicio eliminado" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
