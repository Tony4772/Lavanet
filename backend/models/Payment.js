const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    amountCents: { type: Number, required: true },
    currency: { type: String, default: "PEN" },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "manual"],
      default: "pending",
    },
    culqiChargeId: String,
    culqiResponse: mongoose.Schema.Types.Mixed,
    periodStart: Date,
    periodEnd: Date,
    notes: String,
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", PaymentSchema);
