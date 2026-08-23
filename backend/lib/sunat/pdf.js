function escapePdfText(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildCpePdf({ payload, cdrDescription, digestValue }) {
  const company = payload.company || {};
  const client = payload.client || {};
  const tipoMap = { '01': 'FACTURA ELECTRONICA', '03': 'BOLETA DE VENTA ELECTRONICA', '07': 'NOTA DE CREDITO', '08': 'NOTA DE DEBITO' };
  const lines = [
    'VENTAX — Comprobante electronico',
    `${tipoMap[String(payload.tipoDoc)] || 'COMPROBANTE'} ${payload.serie}-${payload.correlativo}`,
    `Emisor: ${company.razonSocial || ''}  RUC ${company.ruc || ''}`,
    `Cliente: ${client.rznSocial || ''}  Doc ${client.tipoDoc || ''}-${client.numDoc || ''}`,
    `Fecha: ${String(payload.fechaEmision || '').slice(0, 19)}`,
    `Op. gravadas: S/ ${Number(payload.mtoOperGravadas || 0).toFixed(2)}`,
    `IGV: S/ ${Number(payload.mtoIGV || 0).toFixed(2)}`,
    `Total: S/ ${Number(payload.mtoImpVenta || 0).toFixed(2)}`,
    cdrDescription ? `SUNAT: ${cdrDescription}` : '',
    digestValue ? `Digest: ${digestValue}` : '',
    '',
    'Detalle:',
  ];
  (payload.details || []).forEach((it) => {
    lines.push(`- ${it.descripcion} x${it.cantidad}  S/ ${Number(it.mtoValorVenta + it.igv).toFixed(2)}`);
  });
  lines.push('', 'Representacion impresa. XML firmado y enviado a SUNAT.');

  const content = ['BT', '/F1 11 Tf', '40 780 Td', '13 TL'];
  lines.filter(Boolean).forEach((line, i) => {
    if (i === 0) content.push('/F1 14 Tf', `(${escapePdfText(line)}) Tj`, '/F1 10 Tf', '0 -18 Td');
    else content.push(`(${escapePdfText(line.slice(0, 90))}) Tj`, '0 -14 Td');
  });
  content.push('ET');
  const stream = content.join('\n');

  const objs = [];
  objs.push('1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n');
  objs.push('2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n');
  objs.push('3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj\n');
  objs.push(`4 0 obj<< /Length ${Buffer.byteLength(stream, 'utf8')} >>stream\n${stream}\nendstream\nendobj\n`);
  objs.push('5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n');

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const o of objs) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += o;
  }
  const xref = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objs.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

module.exports = { buildCpePdf };
