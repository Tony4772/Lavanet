const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
  orderNumber: {
    type: String,
    required: [true, "Número de orden es requerido"],
    unique: true,
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  tenant: {
    type: Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
  },
  items: [
    {
      service: {
        type: Schema.Types.ObjectId,
        ref: "Service",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      category: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      qty: {
        type: Number,
        default: 1,
        min: [1, "Cantidad mínima es 1"],
      },
      unit: {
        type: String,
        enum: ["kg", "und", "m", "hr"],
        default: "kg",
      },
    },
  ],
  subtotal: {
    type: Number,
    required: true,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
    default: 0,
  },
  paymentMethod: {
    type: String,
    enum: ["Efectivo", "Tarjeta", "Yape", "Plin", "Transferencia"],
    required: true,
  },
  paid: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: [
      "Recibida",
      "Clasificación",
      "En lavado",
      "En secado",
      "Planchado",
      "Control de calidad",
      "Lista para entregar",
      "Entregada",
      "Cancelada",
    ],
    default: "Recibida",
  },
  promisedAt: {
    type: Date,
  },
  notes: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for tenant and status lookup
OrderSchema.index({ tenant: 1, status: 1 });
OrderSchema.index({ tenant: 1, createdAt: -1 });

module.exports = mongoose.model("Order", OrderSchema);