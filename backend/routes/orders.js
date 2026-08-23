const express = require("express");
const router = express.Router();
const Tenant = require("../models/Tenant");
const Customer = require("../models/Customer");
const Service = require("../models/Service");
const Order = require("../models/Order");
const { protect, authorize, verifyTenant } = require("../middleware/auth");

// @route   GET /api/orders
// @desc    Obtener todas las órdenes de un tenant
// @access  Private
router.get("/", protect, verifyTenant, async (req, res) => {
  try {
    const orders = await Order.find({ tenant: req.tenantId })
      .populate("customer", "name phone")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/orders/:id
// @desc    Obtener una orden específica
// @access  Private
router.get("/:id", protect, verifyTenant, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "customer",
      "name phone"
    );
    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/orders
// @desc    Crear una nueva orden
// @access  Private
router.post("/", protect, verifyTenant, async (req, res) => {
  try {
    const {
      customerId,
      items,
      subtotal,
      discount,
      tax,
      total,
      paymentMethod,
      notes,
    } = req.body;

    // Validar cliente
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    // Validar que todos los servicios pertenencen al mismo tenant
    const services = await Service.find({
      _id: { $in: items.map((i) => i.service) },
      tenant: req.tenantId,
    });

    if (services.length !== items.length) {
      return res.status(400).json({
        message: "Uno o más servicios no pertenecen a este tenant",
      });
    }

    const order = new Order({
      orderNumber: `ORD-${Date.now()}`,
      customer: customerId,
      tenant: req.tenantId,
      items,
      subtotal,
      discount,
      tax,
      total,
      paymentMethod,
      notes,
    });

    const savedOrder = await order.save();

    // Populate customer info
    await savedOrder.populate("customer", "name phone");

    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Actualizar estado de orden
// @access  Private
router.put("/:id/status", protect, verifyTenant, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/orders/:id/paid
// @desc    Marcar orden como pagada
// @access  Private
router.put("/:id/paid", protect, verifyTenant, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paid: req.body.paid },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;