const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const Service = require("../models/Service");
const Order = require("../models/Order");
const { protect, verifyTenant } = require("../middleware/auth");

const scoped = (req) => ({ _id: req.params.id, tenant: req.tenantId });

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

router.get("/:id", protect, verifyTenant, async (req, res) => {
  try {
    const order = await Order.findOne(scoped(req)).populate("customer", "name phone");
    if (!order) return res.status(404).json({ message: "Orden no encontrada" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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
      promisedAt,
    } = req.body;

    if (!customerId || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: "customerId e items son requeridos" });
    }

    const customer = await Customer.findOne({ _id: customerId, tenant: req.tenantId });
    if (!customer) {
      return res.status(404).json({ message: "Cliente no encontrado en este tenant" });
    }

    const serviceIds = items.map((i) => i.service).filter(Boolean);
    const services = await Service.find({
      _id: { $in: serviceIds },
      tenant: req.tenantId,
    });
    if (services.length !== serviceIds.length) {
      return res.status(400).json({
        message: "Uno o más servicios no pertenecen a este tenant",
      });
    }

    const order = await Order.create({
      orderNumber: `ORD-${Date.now()}`,
      customer: customerId,
      tenant: req.tenantId,
      items,
      subtotal: subtotal || 0,
      discount: discount || 0,
      tax: tax || 0,
      total: total || 0,
      paymentMethod: paymentMethod || "Efectivo",
      notes: notes || "",
      promisedAt,
    });

    await order.populate("customer", "name phone");
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id/status", protect, verifyTenant, async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      scoped(req),
      { status: req.body.status, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ message: "Orden no encontrada" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id/paid", protect, verifyTenant, async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      scoped(req),
      { paid: !!req.body.paid, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ message: "Orden no encontrada" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
