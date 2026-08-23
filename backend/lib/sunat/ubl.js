function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function asStr(v) {
  return String(v == null ? '' : v);
}

function fechaSolo(iso) {
  const s = asStr(iso);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function horaSolo(iso) {
  const s = asStr(iso);
  const m = s.match(/T(\d{2}:\d{2}:\d{2})/);
  return m ? m[1] : '00:00:00';
}

function buildParty(entity, isSupplier) {
  const docType = isSupplier ? '6' : asStr(entity.tipoDoc || '1');
  const numDoc = asStr(entity.ruc || entity.numDoc || '');
  const name = asStr(entity.razonSocial || entity.rznSocial || '-');
  const trade = asStr(entity.nombreComercial || name);
  const addr = entity.address || {};
  return `
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="${esc(docType)}" schemeName="Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">${esc(numDoc)}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name><![CDATA[${trade}]]></cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:ID schemeAgencyName="PE:INEI">${esc(addr.ubigueo || addr.ubigeo || '150101')}</cbc:ID>
        <cbc:StreetName>${esc(addr.direccion || '-')}</cbc:StreetName>
        <cbc:CitySubdivisionName>${esc(addr.distrito || 'LIMA')}</cbc:CitySubdivisionName>
        <cbc:CityName>${esc(addr.provincia || 'LIMA')}</cbc:CityName>
        <cbc:CountrySubentity>${esc(addr.departamento || 'LIMA')}</cbc:CountrySubentity>
        <cbc:District>${esc(addr.distrito || 'LIMA')}</cbc:District>
        <cac:Country>
          <cbc:IdentificationCode listID="ISO 3166-1 alpha-2" listAgencyName="United Nations Economic Commission for Europe" listName="Country">PE</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${name}]]></cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>`;
}

function taxTotal(igv, base) {
  return `
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="PEN">${Number(igv).toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="PEN">${Number(base).toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="PEN">${Number(igv).toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID schemeID="UN/ECE 5305" schemeName="Tax Category Identifier" schemeAgencyName="United Nations Economic Commission for Europe">S</cbc:ID>
        <cbc:Percent>18.00</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID schemeID="UN/ECE 5153" schemeAgencyName="PE:SUNAT" schemeName="Codigo de tributos">1000</cbc:ID>
          <cbc:Name>IGV</cbc:Name>
          <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>`;
}

function paymentTerms(payload) {
  const fp = payload.formaPago || { tipo: 'Contado' };
  const tipo = fp.tipo === 'Credito' ? 'Credito' : 'Contado';
  let xml = `
  <cac:PaymentTerms>
    <cbc:ID>FormaPago</cbc:ID>
    <cbc:PaymentMeansID>${tipo}</cbc:PaymentMeansID>
    ${tipo === 'Credito' ? `<cbc:Amount currencyID="PEN">${Number(fp.monto || payload.mtoImpVenta).toFixed(2)}</cbc:Amount>` : ''}
  </cac:PaymentTerms>`;
  if (tipo === 'Credito' && Array.isArray(payload.cuotas)) {
    payload.cuotas.forEach((c, i) => {
      xml += `
  <cac:PaymentTerms>
    <cbc:ID>FormaPago</cbc:ID>
    <cbc:PaymentMeansID>Cuota${String(i + 1).padStart(3, '0')}</cbc:PaymentMeansID>
    <cbc:Amount currencyID="PEN">${Number(c.monto).toFixed(2)}</cbc:Amount>
    <cbc:PaymentDueDate>${fechaSolo(c.fechaPago)}</cbc:PaymentDueDate>
  </cac:PaymentTerms>`;
    });
  }
  return xml;
}

function monetary(payload) {
  return `
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="PEN">${Number(payload.mtoOperGravadas).toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="PEN">${Number(payload.mtoImpVenta).toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="PEN">${Number(payload.mtoImpVenta).toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>`;
}

function nsHeader(root) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<${root} xmlns="urn:oasis:names:specification:ubl:schema:xsd:${root}-2"
 xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
 xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
 xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
 xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent></ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>`;
}

function signatureBlock(ruc, razonSocial) {
  return `
  <cac:Signature>
    <cbc:ID>${esc(asStr(ruc))}</cbc:ID>
    <cac:SignatoryParty>
      <cac:PartyIdentification>
        <cbc:ID>${esc(asStr(ruc))}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name><![CDATA[${asStr(razonSocial)}]]></cbc:Name>
      </cac:PartyName>
    </cac:SignatoryParty>
    <cac:DigitalSignatureAttachment>
      <cac:ExternalReference>
        <cbc:URI>#SignatureSP</cbc:URI>
      </cac:ExternalReference>
    </cac:DigitalSignatureAttachment>
  </cac:Signature>`;
}

function invoiceLines(details) {
  return (details || []).map((it, i) => {
    const n = i + 1;
    return `
  <cac:InvoiceLine>
    <cbc:ID>${n}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${esc(it.unidad || 'NIU')}">${Number(it.cantidad).toFixed(2)}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="PEN">${Number(it.mtoValorVenta).toFixed(2)}</cbc:LineExtensionAmount>
    <cac:PricingReference>
      <cac:AlternativeConditionPrice>
        <cbc:PriceAmount currencyID="PEN">${Number(it.mtoPrecioUnitario || 0).toFixed(2)}</cbc:PriceAmount>
        <cbc:PriceTypeCode listName="Tipo de Precio" listAgencyName="PE:SUNAT" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo16">01</cbc:PriceTypeCode>
      </cac:AlternativeConditionPrice>
    </cac:PricingReference>
    ${taxTotal(it.igv, it.mtoValorVenta)}
    <cac:Item>
      <cbc:Description><![CDATA[${asStr(it.descripcion)}]]></cbc:Description>
      <cac:SellersItemIdentification>
        <cbc:ID>${esc(it.codProducto || String(n))}</cbc:ID>
      </cac:SellersItemIdentification>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="PEN">${Number(it.mtoValorUnitario).toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
  }).join('');
}

function buildInvoiceXml(payload) {
  const legend = (payload.legends && payload.legends[0] && payload.legends[0].value) || '';
  return `${nsHeader('Invoice')}
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>${esc(payload.serie)}-${esc(payload.correlativo)}</cbc:ID>
  <cbc:IssueDate>${fechaSolo(payload.fechaEmision)}</cbc:IssueDate>
  <cbc:IssueTime>${horaSolo(payload.fechaEmision)}</cbc:IssueTime>
  <cbc:InvoiceTypeCode listID="${esc(payload.tipoOperacion || '0101')}" listAgencyName="PE:SUNAT" listName="Tipo de Documento" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01" name="Tipo de Operacion" listSchemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo51">${esc(payload.tipoDoc)}</cbc:InvoiceTypeCode>
  <cbc:Note languageLocaleID="1000"><![CDATA[${legend}]]></cbc:Note>
  <cbc:DocumentCurrencyCode listID="ISO 4217 Alpha" listName="Currency" listAgencyName="United Nations Economic Commission for Europe">PEN</cbc:DocumentCurrencyCode>
  ${signatureBlock(payload.company.ruc, payload.company.razonSocial)}
  <cac:AccountingSupplierParty>${buildParty(payload.company, true)}</cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>${buildParty(payload.client, false)}</cac:AccountingCustomerParty>
  ${paymentTerms(payload)}
  ${taxTotal(payload.mtoIGV, payload.mtoOperGravadas)}
  ${monetary(payload)}
  ${invoiceLines(payload.details)}
</Invoice>`;
}

function buildNoteXml(payload) {
  const isCredit = String(payload.tipoDoc) === '07';
  const root = isCredit ? 'CreditNote' : 'DebitNote';
  const lineTag = isCredit ? 'CreditNoteLine' : 'DebitNoteLine';
  const qtyTag = isCredit ? 'CreditedQuantity' : 'DebitedQuantity';
  const lines = (payload.details || []).map((it, i) => {
    const n = i + 1;
    return `
  <cac:${lineTag}>
    <cbc:ID>${n}</cbc:ID>
    <cbc:${qtyTag} unitCode="${esc(it.unidad || 'NIU')}">${Number(it.cantidad).toFixed(2)}</cbc:${qtyTag}>
    <cbc:LineExtensionAmount currencyID="PEN">${Number(it.mtoValorVenta).toFixed(2)}</cbc:LineExtensionAmount>
    <cac:PricingReference>
      <cac:AlternativeConditionPrice>
        <cbc:PriceAmount currencyID="PEN">${Number(it.mtoPrecioUnitario || 0).toFixed(2)}</cbc:PriceAmount>
        <cbc:PriceTypeCode listName="Tipo de Precio" listAgencyName="PE:SUNAT" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo16">01</cbc:PriceTypeCode>
      </cac:AlternativeConditionPrice>
    </cac:PricingReference>
    ${taxTotal(it.igv, it.mtoValorVenta)}
    <cac:Item>
      <cbc:Description><![CDATA[${asStr(it.descripcion)}]]></cbc:Description>
      <cac:SellersItemIdentification>
        <cbc:ID>${esc(it.codProducto || String(n))}</cbc:ID>
      </cac:SellersItemIdentification>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="PEN">${Number(it.mtoValorUnitario).toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:${lineTag}>`;
  }).join('');

  const legend = (payload.legends && payload.legends[0] && payload.legends[0].value) || '';
  const totals = isCredit
    ? `<cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="PEN">${Number(payload.mtoOperGravadas).toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="PEN">${Number(payload.mtoImpVenta).toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="PEN">${Number(payload.mtoImpVenta).toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>`
    : `<cac:RequestedMonetaryTotal>
    <cbc:PayableAmount currencyID="PEN">${Number(payload.mtoImpVenta).toFixed(2)}</cbc:PayableAmount>
  </cac:RequestedMonetaryTotal>`;

  return `${nsHeader(root)}
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>${esc(payload.serie)}-${esc(payload.correlativo)}</cbc:ID>
  <cbc:IssueDate>${fechaSolo(payload.fechaEmision)}</cbc:IssueDate>
  <cbc:IssueTime>${horaSolo(payload.fechaEmision)}</cbc:IssueTime>
  <cbc:Note languageLocaleID="1000"><![CDATA[${legend}]]></cbc:Note>
  <cbc:DocumentCurrencyCode listID="ISO 4217 Alpha" listName="Currency" listAgencyName="United Nations Economic Commission for Europe">PEN</cbc:DocumentCurrencyCode>
  <cac:DiscrepancyResponse>
    <cbc:ReferenceID>${esc(payload.numDocfectado)}</cbc:ReferenceID>
    <cbc:ResponseCode>${esc(payload.codMotivo)}</cbc:ResponseCode>
    <cbc:Description><![CDATA[${asStr(payload.desMotivo)}]]></cbc:Description>
  </cac:DiscrepancyResponse>
  <cac:BillingReference>
    <cac:InvoiceDocumentReference>
      <cbc:ID>${esc(payload.numDocfectado)}</cbc:ID>
      <cbc:DocumentTypeCode>${esc(payload.tipDocAfectado)}</cbc:DocumentTypeCode>
    </cac:InvoiceDocumentReference>
  </cac:BillingReference>
  ${signatureBlock(payload.company.ruc, payload.company.razonSocial)}
  <cac:AccountingSupplierParty>${buildParty(payload.company, true)}</cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>${buildParty(payload.client, false)}</cac:AccountingCustomerParty>
  ${taxTotal(payload.mtoIGV, payload.mtoOperGravadas)}
  ${totals}
  ${lines}
</${root}>`;
}

function buildXml(payload) {
  const tipo = String(payload.tipoDoc);
  if (tipo === '07' || tipo === '08') return buildNoteXml(payload);
  return buildInvoiceXml(payload);
}

function documentFileName(payload) {
  const ruc = asStr(payload.company.ruc).replace(/\D/g, '');
  return `${ruc}-${payload.tipoDoc}-${payload.serie}-${payload.correlativo}`;
}

module.exports = { buildXml, documentFileName };
