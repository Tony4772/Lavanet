// Seed data for LAVANET demo
export const ORDER_STATUSES = [
  "Recibida",
  "Clasificación",
  "En lavado",
  "En secado",
  "Planchado",
  "Control de calidad",
  "Lista para entregar",
  "Entregada",
  "Cancelada",
];

export const STATUS_STYLE = {
  "Recibida": "bg-slate-100 text-slate-700 border-slate-200",
  "Clasificación": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "En lavado": "bg-blue-100 text-blue-700 border-blue-200",
  "En secado": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Planchado": "bg-orange-100 text-orange-800 border-orange-200",
  "Control de calidad": "bg-purple-100 text-purple-700 border-purple-200",
  "Lista para entregar": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Entregada": "bg-slate-800 text-white border-slate-900",
  "Cancelada": "bg-rose-100 text-rose-700 border-rose-200",
};

export const PAYMENT_METHODS = ["Efectivo", "Tarjeta", "Yape", "Plin", "Transferencia"];

export const SERVICE_CATEGORIES = [
  "Lavado", "Secado", "Planchado", "Lavado + secado", "Lavado en seco",
  "Edredones", "Alfombras", "Trajes", "Camisas", "Ropa delicada", "Servicio express",
];

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};
const daysAhead = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

export const DEFAULT_TENANT = "tenant-1";

const withTenant = (row, tenantId = DEFAULT_TENANT) => ({ ...row, tenantId });

export const SEED_USERS = [
  { id: "u1", name: "Carlos Mendoza", username: "admin", password: "admin123", email: "admin@lavanet.pe", role: "Administrador", active: true, lastAccess: daysAgo(0), tenantId: DEFAULT_TENANT },
  { id: "u2", name: "María Torres", username: "cajero", password: "cajero123", email: "maria@lavanet.pe", role: "Cajero", active: true, lastAccess: daysAgo(1), tenantId: DEFAULT_TENANT },
  { id: "u3", name: "Jorge Ramírez", username: "recepcion", password: "recepcion123", email: "jorge@lavanet.pe", role: "Recepción", active: true, lastAccess: daysAgo(2), tenantId: DEFAULT_TENANT },
  { id: "u4", name: "Lucía Vargas", username: "operador", password: "operador123", email: "lucia@lavanet.pe", role: "Operador", active: true, lastAccess: daysAgo(5), tenantId: DEFAULT_TENANT },
];

export const SEED_CUSTOMERS = [
  { id: "c1", name: "Ana Fernández", phone: "987654321", email: "ana.f@gmail.com", address: "Av. Arequipa 1234, Miraflores", createdAt: daysAgo(120), active: true },
  { id: "c2", name: "Pedro Sánchez", phone: "912345678", email: "pedro.s@hotmail.com", address: "Jr. Lima 456, San Isidro", createdAt: daysAgo(90), active: true },
  { id: "c3", name: "Rosa Quispe", phone: "998877665", email: "rosa.q@gmail.com", address: "Calle Los Olivos 789, Surco", createdAt: daysAgo(60), active: true },
  { id: "c4", name: "Luis Chávez", phone: "955443322", email: "luis.c@outlook.com", address: "Av. Javier Prado 2500, La Molina", createdAt: daysAgo(45), active: true },
  { id: "c5", name: "Elena Ruiz", phone: "944556677", email: "elena.r@gmail.com", address: "Av. Benavides 890, Miraflores", createdAt: daysAgo(30), active: true },
  { id: "c6", name: "Roberto Díaz", phone: "933221144", email: "roberto.d@gmail.com", address: "Calle Las Flores 12, San Borja", createdAt: daysAgo(20), active: true },
  { id: "c7", name: "Carmen López", phone: "922334455", email: "carmen.l@gmail.com", address: "Av. Salaverry 3200, Jesús María", createdAt: daysAgo(10), active: true },
  { id: "c8", name: "Diego Herrera", phone: "911223344", email: "diego.h@gmail.com", address: "Jr. Cusco 555, Cercado", createdAt: daysAgo(5), active: true },
];

export const SEED_SERVICES = [
  { id: "s1", name: "Lavado por kilo", category: "Lavado", description: "Lavado general por kilogramo", price: 8.5, unit: "kg", eta: "24h", active: true },
  { id: "s2", name: "Secado por kilo", category: "Secado", description: "Secado en máquina industrial", price: 5.0, unit: "kg", eta: "12h", active: true },
  { id: "s3", name: "Lavado + Secado", category: "Lavado + secado", description: "Lavado y secado combinado", price: 12.0, unit: "kg", eta: "24h", active: true },
  { id: "s4", name: "Planchado camisa", category: "Planchado", description: "Planchado profesional de camisa", price: 4.0, unit: "und", eta: "12h", active: true },
  { id: "s5", name: "Planchado pantalón", category: "Planchado", description: "Planchado de pantalón", price: 5.0, unit: "und", eta: "12h", active: true },
  { id: "s6", name: "Lavado en seco terno", category: "Lavado en seco", description: "Lavado en seco para trajes", price: 45.0, unit: "und", eta: "48h", active: true },
  { id: "s7", name: "Edredón 2 plazas", category: "Edredones", description: "Lavado de edredón matrimonial", price: 35.0, unit: "und", eta: "48h", active: true },
  { id: "s8", name: "Edredón 1 plaza", category: "Edredones", description: "Lavado de edredón individual", price: 25.0, unit: "und", eta: "48h", active: true },
  { id: "s9", name: "Alfombra pequeña", category: "Alfombras", description: "Hasta 2m²", price: 30.0, unit: "und", eta: "72h", active: true },
  { id: "s10", name: "Alfombra grande", category: "Alfombras", description: "Más de 2m²", price: 60.0, unit: "und", eta: "72h", active: true },
  { id: "s11", name: "Traje completo", category: "Trajes", description: "Saco + pantalón + camisa", price: 55.0, unit: "und", eta: "48h", active: true },
  { id: "s12", name: "Camisa ejecutiva", category: "Camisas", description: "Lavado y planchado premium", price: 6.5, unit: "und", eta: "24h", active: true },
  { id: "s13", name: "Ropa delicada", category: "Ropa delicada", description: "Prendas de seda, lana, encaje", price: 18.0, unit: "kg", eta: "48h", active: true },
  { id: "s14", name: "Servicio express 3h", category: "Servicio express", description: "Lavado urgente en 3 horas", price: 22.0, unit: "kg", eta: "3h", active: true },
];

export const SEED_PRODUCTS = [
  { id: "p1", name: "Detergente líquido 5L", sku: "DET-001", category: "Detergentes", price: 45.0, stock: 24, minStock: 10, active: true },
  { id: "p2", name: "Suavizante 3L", sku: "SUA-001", category: "Suavizantes", price: 28.0, stock: 8, minStock: 10, active: true },
  { id: "p3", name: "Bolsa transparente x100", sku: "BOL-001", category: "Empaques", price: 15.0, stock: 45, minStock: 20, active: true },
  { id: "p4", name: "Perchas plástico x50", sku: "PER-001", category: "Accesorios", price: 22.0, stock: 30, minStock: 15, active: true },
  { id: "p5", name: "Quitamanchas premium", sku: "QUI-001", category: "Especiales", price: 32.0, stock: 6, minStock: 8, active: true },
  { id: "p6", name: "Blanqueador oxígeno", sku: "BLA-001", category: "Especiales", price: 18.0, stock: 12, minStock: 10, active: true },
  { id: "p7", name: "Bolsa térmica grande", sku: "BOL-002", category: "Empaques", price: 3.5, stock: 200, minStock: 50, active: true },
];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

const genOrders = () => {
  const orders = [];
  const statuses = ORDER_STATUSES.filter(s => s !== "Cancelada");
  let n = 1001;
  for (let i = 0; i < 26; i++) {
    const customer = rand(SEED_CUSTOMERS);
    const created = new Date();
    created.setDate(created.getDate() - randInt(0, 20));
    created.setHours(randInt(8, 20), randInt(0, 59));
    const items = [];
    const nItems = randInt(1, 3);
    for (let j = 0; j < nItems; j++) {
      const s = rand(SEED_SERVICES);
      const qty = randInt(1, 5);
      items.push({ serviceId: s.id, name: s.name, category: s.category, price: s.price, qty, unit: s.unit });
    }
    const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
    const discount = Math.random() > 0.7 ? Math.round(subtotal * 0.05 * 100) / 100 : 0;
    const taxable = subtotal - discount;
    const tax = Math.round(taxable * 0.18 * 100) / 100;
    const total = Math.round((taxable + tax) * 100) / 100;
    const status = i < 5 ? "Entregada" : rand(statuses);
    const paid = status === "Entregada" || Math.random() > 0.3;
    const promised = new Date(created);
    promised.setDate(promised.getDate() + randInt(1, 3));
    orders.push({
      id: `o${i + 1}`,
      number: `ORD-${n++}`,
      customerId: customer.id,
      customerName: customer.name,
      tenantId: DEFAULT_TENANT,
      items,
      subtotal, discount, tax, total,
      status,
      paymentMethod: rand(PAYMENT_METHODS),
      paid,
      notes: "",
      createdAt: created.toISOString(),
      promisedAt: promised.toISOString(),
      timeline: [
        { status: "Recibida", at: created.toISOString(), by: "Sistema" },
      ],
    });
  }
  return orders;
};

export const SEED_ORDERS = genOrders();

export const SEED_CASH = {
  isOpen: false,
  openedAt: null,
  openingBalance: 0,
  closedAt: null,
  closingBalance: 0,
  movements: [], // {id, type: 'ingreso'|'gasto', amount, note, at, method}
};

export const SEED_CONFIG = {
  business: {
    name: "LAVANET",
    tagline: "Lavandería Premium",
    address: "Av. Arequipa 1234, Miraflores, Lima",
    phone: "+51 987 654 321",
    email: "hola@lavanet.pe",
    ruc: "20512345678",
    currency: "PEN",
    currencySymbol: "S/",
    logo: "",
  },
  tax: { name: "IGV", rate: 0.18, enabled: true },
  loyalty: { pointsPerSol: 1, pointsToSol: 20, enabled: true },
  notifications: { lowStock: true, newSale: true, orderReady: true, cashClose: true },
  appearance: { primary: "azul", density: "cómoda" },
};

export const initialData = () => ({
  users: SEED_USERS.map((u) => withTenant(u)),
  customers: SEED_CUSTOMERS.map((c) => withTenant(c)),
  services: SEED_SERVICES.map((s) => withTenant(s)),
  products: SEED_PRODUCTS.map((p) => withTenant(p)),
  orders: SEED_ORDERS.map((o) => withTenant(o)),
  cash: withTenant({ ...SEED_CASH }),
  config: {
    ...SEED_CONFIG,
    business: { ...SEED_CONFIG.business, tenantId: DEFAULT_TENANT },
  },
  notifications: [
    { id: "n1", title: "Orden ORD-1004 lista para entregar", type: "info", at: daysAgo(0), read: false, tenantId: DEFAULT_TENANT },
    { id: "n2", title: "Stock bajo: Suavizante 3L", type: "warning", at: daysAgo(0), read: false, tenantId: DEFAULT_TENANT },
    { id: "n3", title: "Nueva venta registrada ORD-1012", type: "success", at: daysAgo(1), read: true, tenantId: DEFAULT_TENANT },
  ],
  inventoryLog: [],
  coupons: [],
  reportSchedule: { enabled: false, email: "", lastSentAt: null, hourOfDay: 22 },
});
