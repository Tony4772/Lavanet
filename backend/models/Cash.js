const mongoose = require("mongoose");

const CashSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    isOpen: { type: Boolean, default: false },
    openedAt: Date,
    openingBalance: { type: Number, default: 0 },
    closedAt: Date,
    closingBalance: { type: Number, default: 0 },
    movements: [
      {
        type: { type: String, enum: ["ingreso", "gasto"], required: true },
        amount: { type: Number, required: true },
        note: { type: String, default: "" },
        method: { type: String, default: "Efectivo" },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

CashSchema.index({ tenant: 1 }, { unique: true });

module.exports = mongoose.model("Cash", CashSchema);
