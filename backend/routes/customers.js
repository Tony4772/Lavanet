const express = require("express");
const router = express.Router();
const Tenant = require("../models/Tenant");
const Customer = require("../models/Customer");
const { protect, authorize, verifyTenant } = require("../middleware/auth");

// @route   GET /api/customers
// @desc    Obtener todos los clientes de un tenant
// @access  Private
router.get("/", protect, verifyTenant, async (req, res) => {
  try {
    const customers = await Customer.find({ tenant: req.tenantId });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/customers/:id
// @desc    Obtener un cliente específico
// @access  Private
router.get("/:id", protect, verifyTenant, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/customers
// @desc    Crear un nuevo cliente
// @access  Private
router.post("/", protect, verifyTenant, async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    const customer = new Customer({
      name,
      phone,
      email,
      address,
      tenant: req.tenantId,
    });
    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/customers/:id
// @desc    Actualizar un cliente
// @access  Private
router.put("/:id", protect, verifyTenant, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { ...req.body, tenant: req.tenantId },
      { new: true, runValidators: true }
    );
    if (!customer) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/customers/:id
// @desc    Eliminar un cliente
// @access  Private/Admin
router.delete("/:id", protect, authorize("admin"), verifyTenant, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    res.json({ message: "Cliente eliminado" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;