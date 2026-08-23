const JSZip = require('jszip');

const ENDPOINTS = {
  beta: 'https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService',
  produccion: 'https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService',
};

function escXml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function zipXml(fileBase, xml) {
  const zip = new JSZip();
  zip.file(`${fileBase}.xml`, xml);
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

function soapEnvelope({ username, password, fileName, contentBase64 }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.sunat.gob.pe" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
  <soapenv:Header>
    <wsse:Security>
      <wsse:UsernameToken>
        <wsse:Username>${escXml(username)}</wsse:Username>
        <wsse:Password>${escXml(password)}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    <ser:sendBill>
      <fileName>${escXml(fileName)}</fileName>
      <contentFile>${contentBase64}</contentFile>
    </ser:sendBill>
  </soapenv:Body>
</soapenv:Envelope>`;
}

function extractTag(xml, localName) {
  const re = new RegExp(`<(?:[\\w-]+:)?${localName}[^>]*>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${localName}>`, 'i');
  const m = String(xml || '').match(re);
  return m ? m[1].trim() : null;
}

async function unzipXmlFromBase64(b64) {
  const buf = Buffer.from(b64, 'base64');
  const zip = await JSZip.loadAsync(buf);
  const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
  let xmlName = names.find((n) => /\.xml$/i.test(n) && /^R-/i.test(n.split('/').pop() || ''));
  if (!xmlName) xmlName = names.find((n) => /\.xml$/i.test(n));
  if (!xmlName) {
    const nested = names.find((n) => /\.zip$/i.test(n));
    if (nested) {
      const inner = await zip.files[nested].async('nodebuffer');
      const zip2 = await JSZip.loadAsync(inner);
      const names2 = Object.keys(zip2.files).filter((n) => !zip2.files[n].dir && /\.xml$/i.test(n));
      xmlName = names2.find((n) => /^R-/i.test(n.split('/').pop() || '')) || names2[0];
      if (!xmlName) throw new Error('CDR ZIP sin XML');
      return zip2.files[xmlName].async('string');
    }
    throw new Error('Respuesta SUNAT sin CDR XML');
  }
  return zip.files[xmlName].async('string');
}

function parseCdrXml(cdrXml) {
  const code = extractTag(cdrXml, 'ResponseCode') || extractTag(cdrXml, 'responseCode') || '';
  const description = extractTag(cdrXml, 'Description') || extractTag(cdrXml, 'description') || '';
  return {
    code: String(code).trim(),
    description: String(description).replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
    xml: cdrXml,
  };
}

async function sendBill({ env, ruc, solUser, solPass, fileBase, xml }) {
  const endpoint = ENDPOINTS[env === 'produccion' ? 'produccion' : 'beta'];
  const zipBuf = await zipXml(fileBase, xml);
  const username = `${String(ruc).replace(/\D/g, '')}${String(solUser || '').trim()}`;
  const body = soapEnvelope({
    username,
    password: solPass,
    fileName: `${fileBase}.zip`,
    contentBase64: zipBuf.toString('base64'),
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  let res;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'urn:sendBill',
      },
      body,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  if (!res.ok) {
    const fault = extractTag(text, 'faultstring') || extractTag(text, 'message') || text.slice(0, 300);
    throw new Error(`SUNAT HTTP ${res.status}: ${fault}`);
  }

  const fault = extractTag(text, 'faultstring');
  if (fault) throw new Error(`SUNAT: ${fault}`);

  const appResponse = extractTag(text, 'applicationResponse') || extractTag(text, 'contentFile');
  if (!appResponse) {
    throw new Error('SUNAT no devolvio CDR (applicationResponse). Respuesta: ' + text.slice(0, 240));
  }

  const cdrXml = await unzipXmlFromBase64(appResponse);
  const cdr = parseCdrXml(cdrXml);
  if (cdr.code && cdr.code !== '0' && !/^0+$/.test(cdr.code)) {
    const err = new Error(`SUNAT rechazo: ${cdr.code} — ${cdr.description}`);
    err.cdr = cdr;
    throw err;
  }
  return { cdr, rawSoap: text, endpoint };
}

module.exports = { sendBill, ENDPOINTS, zipXml };
