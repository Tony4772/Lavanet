export const UI_ROLES = ["Administrador", "Cajero", "Recepción", "Operador"];

const TO_API = {
  Administrador: "admin",
  Cajero: "cajero",
  Recepción: "recepcion",
  Operador: "operador",
};

const FROM_API = {
  superadmin: "Superadmin",
  admin: "Administrador",
  cajero: "Cajero",
  recepcion: "Recepción",
  operador: "Operador",
};

export const roleToApi = (uiRole) => TO_API[uiRole] || "operador";

export const roleFromApi = (apiRole) => FROM_API[apiRole] || apiRole;

export const mapUserFromApi = (u) => ({
  id: u._id || u.id,
  name: u.name,
  username: u.username,
  email: u.email,
  role: roleFromApi(u.role),
  rawRole: u.role,
  active: u.isActive !== false,
  lastAccess: u.lastLogin || null,
  tenantId: u.tenant ? String(u.tenant) : null,
});
