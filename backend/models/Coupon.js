const mongoose = require("mongoose");

const CouponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    customerName: String,
    valuePEN: { type: Number, required: true, min: 0 },
    pointsCost: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    usedAt: Date,
    usedOrder: String,
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
  },
  { timestamps: true }
);

CouponSchema.index({ tenant: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("Coupon", CouponSchema);
