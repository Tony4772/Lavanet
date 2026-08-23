const mongoose = require("mongoose");

const SunatSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    ruc: String,
    businessName: String,
    address: String,
    ubigeo: String,
    solUser: String,
    solPass: { type: String, select: false },
    certificatePassword: { type: String, select: false },
    /** Certificado .p12 en base64 (no path en disco) */
    certificateP12: { type: String, select: false },
    certificatePath: String,
    environment: { type: String, enum: ["beta", "produccion"], default: "beta" },
    seriesInvoice: { type: String, default: "F001" },
    seriesBoleta: { type: String, default: "B001" },
    nextInvoice: { type: Number, default: 1 },
    nextBoleta: { type: Number, default: 1 },
  },
  { _id: false }
);

const TenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nombre del tenant es requerido"],
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    isDemo: { type: Boolean, default: false },
    plan: {
      type: String,
      enum: ["custom"],
      default: "custom",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    billingStatus: {
      type: String,
      enum: ["demo", "trial", "active", "grace", "suspended"],
      default: "trial",
    },
    monthlyPrice: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "PEN" },
    startedAt: { type: Date, default: Date.now },
    firstChargeAt: Date,
    nextChargeAt: Date,
    graceUntil: Date,
    lastPaidAt: Date,
    lastBillingNotice: String,
    contactEmail: String,
    billingEmail: String,
    contactPhone: String,
    contractNotes: String,
    culqiCustomerId: String,
    culqiCardId: String,
    culqiCardLast4: String,
    culqiCardBrand: String,
    lastCulqiChargeId: String,
    demoLastResetAt: Date,
    sunat: { type: SunatSchema, default: () => ({}) },
    settings: {
      currency: { type: String, default: "PEN" },
      timezone: { type: String, default: "America/Lima" },
      theme: { type: String, enum: ["light", "dark"], default: "light" },
      features: { type: Map, of: Boolean, default: {} },
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

TenantSchema.index({ name: 1 });

TenantSchema.pre("validate", function normalizeLegacyFields() {
  if (!this.plan || this.plan === "free") this.plan = "custom";
});

module.exports = mongoose.model("Tenant", TenantSchema);
