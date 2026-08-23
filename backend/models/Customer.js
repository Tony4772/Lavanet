const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CustomerSchema = new Schema({
  name: {
    type: String,
    required: [true, "Nombre es requerido"],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, "Teléfono es requerido"],
    trim: true,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  tenant: {
    type: Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
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

// Index for tenant lookup
CustomerSchema.index({ tenant: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model("Customer", CustomerSchema);