const { loadP12 } = require('./cert');
const { buildXml, documentFileName } = require('./ubl');
const { signXml } = require('./sign');
const { sendBill } = require('./soap');
const { buildCpePdf } = require('./pdf');

function isConfigured(company) {
  return !!(
    company
    && String(company.sol_user || '').trim()
    && String(company.sol_pass || '').trim()
    && String(company.certificado_p12 || '').trim()
  );
}

function requireCompany(company) {
  if (!isConfigured(company)) {
    throw new Error('Configura certificado .p12, contrasena del cert y usuario/clave SOL en la empresa');
  }
  if (!company.ruc || String(company.ruc).replace(/\D/g, '').length !== 11) {
    throw new Error('La empresa necesita un RUC de 11 digitos');
  }
}

async function emitDocument(company, payload) {
  requireCompany(company);
  const { pemKey, certBase64 } = loadP12(company.certificado_p12, company.cert_password || '');
  const xmlUnsigned = buildXml(payload);
  const { xml, digestValue } = signXml(xmlUnsigned, pemKey, certBase64);
  const fileBase = documentFileName(payload);
  const env = company.sunat_env === 'produccion' ? 'produccion' : 'beta';

  if (process.env.SUNAT_DRY_RUN === '1') {
    return {
      ok: true,
      dryRun: true,
      xml,
      digestValue,
      fileBase,
      cdr: { cdrCode: '0', cdrDescription: 'DRY_RUN (no enviado a SUNAT)' },
      code: '0',
    };
  }

  const result = await sendBill({
    env,
    ruc: company.ruc,
    solUser: company.sol_user,
    solPass: company.sol_pass,
    fileBase,
    xml,
  });

  return {
    ok: true,
    xml,
    digestValue,
    fileBase,
    endpoint: result.endpoint,
    cdr: {
      cdrCode: result.cdr.code,
      cdrDescription: result.cdr.description,
      xml: result.cdr.xml,
    },
    code: result.cdr.code,
    cdrStatus: result.cdr.description,
  };
}

async function sendInvoice(company, payload) {
  return emitDocument(company, payload);
}

async function sendNote(company, payload) {
  return emitDocument(company, payload);
}

async function getInvoicePdf(company, payload, sunatResult) {
  return buildCpePdf({
    payload,
    cdrDescription: sunatResult && (sunatResult.cdr?.cdrDescription || sunatResult.cdrStatus),
    digestValue: sunatResult && sunatResult.digestValue,
  });
}

async function getNotePdf(company, payload, sunatResult) {
  return getInvoicePdf(company, payload, sunatResult);
}

async function getInvoiceStatus() {
  throw new Error('Consulta de estado CDR aun no implementada en el motor directo. Revisa el CDR guardado al emitir.');
}

async function testConnection(company) {
  requireCompany(company);
  const { cert } = loadP12(company.certificado_p12, company.cert_password || '');
  const notAfter = cert.validity && cert.validity.notAfter;
  const expired = notAfter && notAfter.getTime() < Date.now();
  return {
    ok: !expired,
    subject: cert.subject && cert.subject.getField('CN') ? cert.subject.getField('CN').value : '',
    notAfter: notAfter ? notAfter.toISOString() : null,
    env: company.sunat_env === 'produccion' ? 'produccion' : 'beta',
    expired: !!expired,
    message: expired
      ? 'El certificado esta vencido. Carga uno vigente.'
      : 'Certificado y credenciales SOL cargados. Listo para emitir (ambiente ' + (company.sunat_env === 'produccion' ? 'produccion' : 'beta') + ').',
  };
}

module.exports = {
  isConfigured,
  sendInvoice,
  sendNote,
  getInvoicePdf,
  getNotePdf,
  getInvoiceStatus,
  testConnection,
  emitDocument,
};
