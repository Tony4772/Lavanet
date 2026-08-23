const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    orderNumber: String,
    tipoDoc: { type: String, enum: ["01", "03", "07", "08"], required: true },
    serie: { type: String, required: true },
    correlativo: { type: Number, required: true },
    label: String,
    clientName: String,
    clientDocType: String,
    clientDocNumber: String,
    mtoOperGravadas: Number,
    mtoIGV: Number,
    mtoImpVenta: Number,
    currency: { type: String, default: "PEN" },
    status: {
      type: String,
      enum: ["accepted", "rejected", "dry_run", "error"],
      default: "accepted",
    },
    cdrCode: String,
    cdrDescription: String,
    digestValue: String,
    xml: { type: String, select: false },
    cdrXml: { type: String, select: false },
    sunatEnv: String,
    errorMessage: String,
  },
  { timestamps: true }
);

InvoiceSchema.index({ tenant: 1, tipoDoc: 1, serie: 1, correlativo: 1 }, { unique: true });

module.exports = mongoose.model("Invoice", InvoiceSchema);
