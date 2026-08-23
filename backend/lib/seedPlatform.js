const Tenant = require("../models/Tenant");
const User = require("../models/User");
const { computeFirstChargeAt } = require("./billing");

const DEMO_SLUG = "demo";

exports.ensurePlatformSeed = async () => {
  let systemTenant = await Tenant.findOne({ slug: "__system__" });
  if (!systemTenant) {
    systemTenant = await Tenant.create({
      name: "Lavanet System",
      slug: "__system__",
      isDemo: false,
      billingStatus: "demo",
      status: "active",
    });
  }

  const superUser = process.env.SUPERADMIN_USERNAME || "superadmin";
  const superPass = process.env.SUPERADMIN_PASSWORD || "ChangeMeSuper2026!";
  const superEmail = process.env.SUPERADMIN_EMAIL || "superadmin@lavanet.local";

  let superadmin = await User.findOne({ username: superUser, role: "superadmin" });
  if (!superadmin) {
    superadmin = await User.create({
      name: "Dueño Lavanet",
      username: superUser,
      email: superEmail,
      password: superPass,
      role: "superadmin",
      tenant: systemTenant._id,
      isActive: true,
    });
    console.log(`✓ Superadmin creado: ${superUser} (cambia la contraseña en producción)`);
  }

  let demoTenant = await Tenant.findOne({ slug: DEMO_SLUG });
  if (!demoTenant) {
    demoTenant = await Tenant.create({
      name: "Lavanet Demo",
      slug: DEMO_SLUG,
      isDemo: true,
      billingStatus: "demo",
      status: "active",
      monthlyPrice: 0,
    });
  }

  const demoUser = process.env.DEMO_USERNAME || "demo";
  const demoPass = process.env.DEMO_PASSWORD || "demo2026";
  let demo = await User.findOne({ username: demoUser, tenant: demoTenant._id });
  if (!demo) {
    demo = await User.create({
      name: "Usuario Demo",
      username: demoUser,
      email: "demo@lavanet.local",
      password: demoPass,
      role: "admin",
      tenant: demoTenant._id,
      isActive: true,
    });
    demoTenant.owner = demo._id;
    await demoTenant.save();
    console.log(`✓ Demo creado: ${demoUser} / ${demoPass}`);
  }

  return { superadmin, demoTenant, demo };
};

exports.resetDemoTenant = async () => {
  const demoTenant = await Tenant.findOne({ slug: DEMO_SLUG, isDemo: true });
  if (!demoTenant) return;
  demoTenant.demoLastResetAt = new Date();
  await demoTenant.save();
  console.log(`↻ Demo marcado reset ${demoTenant.demoLastResetAt.toISOString()}`);
};
