/** Construye payload UBL compatible con lib/sunat/ubl.js a partir de una orden Lavanet. */

function money(n) {
  return Math.round(Number(n || 0) * 100) / 100;
}

function amountInWords(amount) {
  // Leyenda simple; suficiente para CPE (SUNAT acepta texto libre en Note 1000)
  const n = money(amount).toFixed(2);
  return `SON: ${n} CON 00/100 SOLES`;
}

/**
 * @param {object} opts
 * @param {object} opts.company - { ruc, razonSocial, nombreComercial, address }
 * @param {object} opts.client - { tipoDoc, numDoc, rznSocial, address }
 * @param {Array} opts.items - [{ name, qty, unit, price }] precios con IGV incluido
 * @param {string} opts.tipoDoc - '01' factura | '03' boleta
 * @param {string} opts.serie
 * @param {string|number} opts.correlativo
 * @param {number} [opts.discount=0]
 */
function buildInvoicePayload(opts) {
  const {
    company,
    client,
    items,
    tipoDoc,
    serie,
    correlativo,
    discount = 0,
  } = opts;

  const IGV = 0.18;
  let mtoOperGravadas = 0;
  let mtoIGV = 0;
  const details = (items || []).map((it, i) => {
    const qty = Number(it.qty || it.cantidad || 1);
    const priceInc = Number(it.price || it.mtoPrecioUnitario || 0);
    const lineInc = money(priceInc * qty);
    const valorVenta = money(lineInc / (1 + IGV));
    const igv = money(lineInc - valorVenta);
    const valorUnit = money(priceInc / (1 + IGV));
    mtoOperGravadas += valorVenta;
    mtoIGV += igv;
    return {
      codProducto: it.codProducto || String(i + 1),
      unidad: it.unit === "kg" ? "KGM" : "NIU",
      descripcion: it.name || it.descripcion || "Servicio",
      cantidad: qty,
      mtoValorUnitario: valorUnit,
      mtoPrecioUnitario: priceInc,
      mtoValorVenta: valorVenta,
      igv,
    };
  });

  if (discount > 0 && mtoOperGravadas > 0) {
    const factor = Math.max(0, 1 - Number(discount) / (mtoOperGravadas + mtoIGV));
    mtoOperGravadas = money(mtoOperGravadas * factor);
    mtoIGV = money(mtoOperGravadas * IGV);
  }

  const mtoImpVenta = money(mtoOperGravadas + mtoIGV);

  return {
    tipoOperacion: "0101",
    tipoDoc: String(tipoDoc),
    serie: String(serie),
    correlativo: String(correlativo),
    fechaEmision: new Date().toISOString(),
    formaPago: { tipo: "Contado" },
    company: {
      ruc: String(company.ruc || "").replace(/\D/g, ""),
      razonSocial: company.razonSocial || company.businessName || company.name,
      nombreComercial: company.nombreComercial || company.razonSocial || company.name,
      address: company.address || {
        ubigeo: company.ubigeo || "150101",
        direccion: company.direccion || "-",
        distrito: company.distrito || "LIMA",
        provincia: company.provincia || "LIMA",
        departamento: company.departamento || "LIMA",
      },
    },
    client: {
      tipoDoc: client.tipoDoc || (String(tipoDoc) === "01" ? "6" : "1"),
      numDoc: String(client.numDoc || client.dni || client.ruc || "00000000").replace(/\D/g, ""),
      rznSocial: client.rznSocial || client.name || "CLIENTE VARIOS",
      address: client.address || {
        ubigeo: "150101",
        direccion: client.direccion || "-",
        distrito: "LIMA",
        provincia: "LIMA",
        departamento: "LIMA",
      },
    },
    mtoOperGravadas,
    mtoIGV,
    mtoImpVenta,
    details,
    legends: [{ code: "1000", value: amountInWords(mtoImpVenta) }],
  };
}

function tenantToCompany(tenant) {
  const s = tenant.sunat || {};
  return {
    ruc: s.ruc,
    razonSocial: s.businessName || tenant.name,
    nombreComercial: s.businessName || tenant.name,
    sol_user: s.solUser,
    sol_pass: s.solPass,
    certificado_p12: s.certificateP12,
    cert_password: s.certificatePassword || "",
    sunat_env: s.environment === "produccion" ? "produccion" : "beta",
    address: {
      ubigeo: s.ubigeo || "150101",
      direccion: s.address || "-",
      distrito: "LIMA",
      provincia: "LIMA",
      departamento: "LIMA",
    },
  };
}

module.exports = { buildInvoicePayload, tenantToCompany, money };
