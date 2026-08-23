import React from "react";
import LegalLayout from "./LegalLayout";

export default function PoliticaPrivacidad() {
  return (
    <LegalLayout title="Política de privacidad">
      <p>
        La presente Política de Privacidad describe cómo <strong>EBYZOM E.I.R.L.</strong> (en adelante, &quot;EBYZOM&quot;)
        recopila, usa, almacena y protege los datos personales en relación con la plataforma{" "}
        <strong>lavanet</strong> (https://lavanet.ebyzom.com), de conformidad con la Ley N.° 29733, Ley de Protección de
        Datos Personales del Perú, y su reglamento.
      </p>

      <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">1. Responsable del tratamiento</h2>
      <p>
        <strong>EBYZOM E.I.R.L.</strong>
        <br />
        Producto: lavanet
        <br />
        Contacto: WhatsApp 906 591 037
      </p>

      <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">2. Datos que tratamos</h2>
      <p>Podemos tratar las siguientes categorías de datos:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Datos de cuenta:</strong> nombre, usuario, correo, rol, contraseña (almacenada cifrada), identificadores
          de sesión.
        </li>
        <li>
          <strong>Datos del negocio cliente:</strong> nombre comercial, contacto, configuración, precios acordados,
          información de facturación del servicio.
        </li>
        <li>
          <strong>Datos operativos cargados por el cliente:</strong> clientes finales, órdenes, ventas, inventario,
          movimientos de caja y reportes.
        </li>
        <li>
          <strong>Datos de pago del servicio lavanet:</strong> referencias de cobro, historial de pagos; no almacenamos
          números completos de tarjeta (el procesamiento puede realizarse vía proveedor de pagos certificado).
        </li>
        <li>
          <strong>Datos técnicos:</strong> dirección IP, navegador, registros de acceso y cookies (ver sección Cookies).
        </li>
        <li>
          <strong>Facturación SUNAT (si contratada):</strong> RUC, credenciales SOL, certificado digital y comprobantes
          emitidos, tratados solo para prestar ese servicio.
        </li>
      </ul>

      <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">3. Finalidades</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Prestar, mantener y mejorar lavanet.</li>
        <li>Gestionar cuentas, autenticación, soporte y comunicaciones del servicio.</li>
        <li>Facturar la suscripción y gestionar cobros acordados.</li>
        <li>Cumplir obligaciones legales y resolver incidencias de seguridad.</li>
        <li>Con consentimiento, usar cookies opcionales para analítica o mejora de producto.</li>
      </ul>

      <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">4. Base legal</h2>
      <p>
        El tratamiento se basa en la ejecución del contrato de servicio, el consentimiento cuando corresponda (cookies
        opcionales), el interés legítimo en seguridad y mejora del producto, y el cumplimiento de obligaciones legales.
      </p>

      <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">5. Conservación</h2>
      <p>
        Conservamos los datos mientras dure la relación contractual y el tiempo adicional necesario para obligaciones
        legales, contables o defensa de reclamos. Los datos de cuentas canceladas se eliminarán o anonimizarán conforme a
        procedimientos internos, salvo conservación exigida por ley.
      </p>

      <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">6. Destinatarios y transferencias</h2>
      <p>
        Podemos compartir datos con proveedores que nos ayudan a operar lavanet (hosting, base de datos, pasarela de
        pagos, mensajería), bajo obligaciones de confidencialidad. Los servidores pueden ubicarse fuera del Perú; en tal
        caso aplicamos medidas razonables de protección conforme a la normativa vigente.
      </p>

      <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">7. Seguridad</h2>
      <p>
        Adoptamos medidas técnicas y organizativas razonables: cifrado en tránsito (HTTPS), control de acceso,
        contraseñas hasheadas, aislamiento multi-tenant y copias de respaldo. Ningún sistema es 100% infalible; el
        cliente también debe proteger sus credenciales.
      </p>

      <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">8. Derechos del titular</h2>
      <p>
        Conforme a la Ley 29733, usted puede ejercer los derechos de acceso, rectificación, cancelación, oposición,
        información, revocación del consentimiento y portabilidad (cuando aplique), escribiendo a EBYZOM por WhatsApp{" "}
        <strong>906 591 037</strong> o el canal de contacto acordado. Responderemos en plazos legales.
      </p>

      <h2 id="cookies" className="text-lg font-bold text-slate-900 dark:text-white pt-2 scroll-mt-24">
        9. Cookies
      </h2>
      <p>lavanet utiliza cookies y tecnologías similares:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Cookies técnicas (necesarias):</strong> imprescindibles para iniciar sesión, mantener la sesión y
          garantizar la seguridad. Se usan aunque rechace cookies opcionales.
        </li>
        <li>
          <strong>Cookies opcionales:</strong> pueden usarse para analítica o mejora de experiencia. Solo se activan si
          usted pulsa &quot;Aceptar cookies&quot; en el banner.
        </li>
        <li>
          <strong>Almacenamiento local:</strong> guardamos su preferencia de cookies y, si corresponde, token de sesión
          en su dispositivo.
        </li>
      </ul>
      <p>
        Puede cambiar su decisión eliminando el almacenamiento del sitio en su navegador o contactándonos. Rechazar
        cookies opcionales no impide usar lavanet, salvo funciones que dependan expresamente de ellas.
      </p>

      <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">10. Menores de edad</h2>
      <p>
        lavanet está dirigido a empresas y usuarios adultos en contexto laboral. No recopilamos intencionalmente datos de
        menores de 14 años.
      </p>

      <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">11. Cambios</h2>
      <p>
        Podemos actualizar esta política. Publicaremos la versión vigente en esta página con la fecha de actualización.
      </p>

      <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">12. Contacto</h2>
      <p>
        Para consultas sobre privacidad: <strong>EBYZOM E.I.R.L.</strong> — WhatsApp 906 591 037.
      </p>
    </LegalLayout>
  );
}
