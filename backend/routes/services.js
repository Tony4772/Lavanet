const express = require("express");
const router = express.Router();
const Tenant = require("../models/Tenant");
const Service = require("../models/Service");
const { protect, authorize, verifyTenant } = require("../middleware/auth");

// @route   GET /api/services
// @desc    Obtener todos los servicios de un tenant
// @access  Private
router.get("/", protect, verifyTenant, async (req, res) => {
  try {
    const services = await Service.find({ tenant: req.tenantId });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/services/:id
// @desc    Obtener un servicio específico
// @access  Private
router.get("/:id", protect, verifyTenant, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/services
// @desc    Crear un nuevo servicio
// @access  Private
router.post("/", protect, verifyTenant, async (req, res) => {
  try {
    const service = new Service({
      ...req.body,
      tenant: req.tenantId,
    });
    await service.save();
    res.status(201).json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/services/:id
// @desc    Actualizar un servicio
// @access  Private
router.put("/:id", protect, verifyTenant, async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { ...req.body, tenant: req.tenantId },
      { new: true, runValidators: true }
    );
    if (!service) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/services/:id
// @desc    Eliminar un servicio
// @access  Private/Admin
router.delete("/:id", protect, authorize("admin"), verifyTenant, async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }
    res.json({ message: "Servicio eliminado" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;