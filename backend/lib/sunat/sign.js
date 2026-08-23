const crypto = require('crypto');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
const { SignedXml } = require('xml-crypto');

function signXml(xml, pemKey, certBase64) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const extContent = doc.getElementsByTagNameNS(
    'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
    'ExtensionContent'
  )[0] || doc.getElementsByTagName('ext:ExtensionContent')[0];
  if (!extContent) throw new Error('XML sin ExtensionContent para firmar');

  // Placeholder vacio: xml-crypto inserta la firma aqui.
  while (extContent.firstChild) extContent.removeChild(extContent.firstChild);

  const unsigned = new XMLSerializer().serializeToString(doc);
  const sig = new SignedXml({
    privateKey: pemKey,
    publicCert: `-----BEGIN CERTIFICATE-----\n${certBase64.match(/.{1,64}/g).join('\n')}\n-----END CERTIFICATE-----`,
    signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
    canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
  });

  sig.addReference({
    xpath: "/*",
    transforms: [
      'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
      'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    ],
    digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
    isEmptyUri: true,
  });

  sig.getKeyInfoContent = () => `<ds:X509Data><ds:X509Certificate>${certBase64}</ds:X509Certificate></ds:X509Data>`;

  sig.computeSignature(unsigned, {
    prefix: 'ds',
    location: {
      reference: "//*[local-name(.)='ExtensionContent']",
      action: 'append',
    },
    attrs: { Id: 'SignatureSP' },
  });

  const signed = sig.getSignedXml();
  const digestMatch = signed.match(/<ds:DigestValue>([^<]+)<\/ds:DigestValue>/);
  const digestValue = digestMatch ? digestMatch[1] : '';
  return { xml: signed, digestValue };
}

function sha1Base64(buf) {
  return crypto.createHash('sha1').update(buf).digest('base64');
}

module.exports = { signXml, sha1Base64 };
