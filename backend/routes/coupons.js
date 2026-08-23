const express = require("express");
const router = express.Router();
const Coupon = require("../models/Coupon");
const Customer = require("../models/Customer");
const { protect, verifyTenant } = require("../middleware/auth");

router.get("/", protect, verifyTenant, async (req, res) => {
  try {
    const coupons = await Coupon.find({ tenant: req.tenantId }).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", protect, verifyTenant, async (req, res) => {
  try {
    const { customerId, valuePEN, pointsCost, expiresAt } = req.body;
    const customer = await Customer.findOne({ _id: customerId, tenant: req.tenantId });
    if (!customer) return res.status(404).json({ message: "Cliente no encontrado" });

    const code = `LVN-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const coupon = await Coupon.create({
      code,
      customer: customerId,
      customerName: customer.name,
      valuePEN: Number(valuePEN || 0),
      pointsCost: Number(pointsCost || 0),
      expiresAt: expiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      tenant: req.tenantId,
    });
    res.status(201).json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/redeem", protect, verifyTenant, async (req, res) => {
  try {
    const { code, orderNumber } = req.body;
    const coupon = await Coupon.findOne({
      tenant: req.tenantId,
      code: String(code || "").trim().toUpperCase(),
      used: false,
    });
    if (!coupon) return res.status(404).json({ message: "Cupón no válido" });
    if (new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ message: "Cupón expirado" });
    }
    coupon.used = true;
    coupon.usedAt = new Date();
    coupon.usedOrder = orderNumber;
    await coupon.save();
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
