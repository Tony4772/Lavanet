const forge = require('node-forge');

function loadP12(p12Base64OrBuffer, password) {
  const buf = Buffer.isBuffer(p12Base64OrBuffer)
    ? p12Base64OrBuffer
    : Buffer.from(String(p12Base64OrBuffer || ''), 'base64');
  if (!buf.length) throw new Error('Certificado .p12 vacio');
  const asn1 = forge.asn1.fromDer(buf.toString('binary'));
  let p12;
  try {
    p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password || '');
  } catch (e) {
    throw new Error('No se pudo abrir el .p12 (contrasena incorrecta o archivo invalido)');
  }
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const keyBag = (keyBags[forge.pki.oids.pkcs8ShroudedKeyBag] || [])[0]
    || (p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag] || [])[0];
  const certBag = (certBags[forge.pki.oids.certBag] || [])[0];
  if (!keyBag || !keyBag.key) throw new Error('El .p12 no contiene clave privada');
  if (!certBag || !certBag.cert) throw new Error('El .p12 no contiene certificado');
  const privateKey = keyBag.key;
  const cert = certBag.cert;
  const pemKey = forge.pki.privateKeyToPem(privateKey);
  const pemCert = forge.pki.certificateToPem(cert);
  const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
  const certBase64 = forge.util.encode64(certDer);
  return { privateKey, cert, pemKey, pemCert, certBase64 };
}

module.exports = { loadP12 };
