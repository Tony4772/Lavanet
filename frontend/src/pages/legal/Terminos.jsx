import React from "react";
import LegalLayout from "./LegalLayout";

export default function Terminos() {
  return (
    <LegalLayout title="Términos y condiciones de uso">
      <p>
        Los presentes Términos y Condiciones regulan el acceso y uso de la plataforma{" "}
        <strong>lavanet</strong>, software en la nube para gestión de lavanderías, operado por{" "}
        <strong>EBYZOM E.I.R.L.</strong> (en adelante, &quot;EBYZOM&quot; o &quot;nosotros&quot;), con domicilio en la
        República del Perú y sitio web <strong>https://lavanet.ebyzom.com</strong>.
      </p>

      <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">1. Aceptación</h2>
      <p>
        Al registrarse, acceder o utilizar lavanet, el cliente o usuario acepta estos términos. Si no está de acuerdo,
        debe abstenerse de usar el servicio.
      </p>

      <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">2. Descripción del servicio</h2>
      <p>
        lavanet es un sistema SaaS (Software as a Service) que permite a lavanderías gestionar órdenes, punto de venta,
        clientes, inventario, caja, reportes y funciones complementarias acordadas individualmente (por ejemplo,
        facturación electrónica SUNAT). El alcance concreto depende del contrato y precio acordado con cada cliente.
      </p>

      <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">3. Registro y cuentas</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>El alta de cuentas comerciales la realiza EBYZOM; no hay registro público abierto.</li>
        <li>El cliente es responsable de la confidencialidad de sus credenciales y de la actividad en su cuenta.</li>
        <li>Debe proporcionar información veraz y mantenerla actualizada.</li>
        <li>EBYZOM puede suspender cuentas por incumplimiento de pago, uso indebido o riesgo de seguridad.</li>
      </ul>

      <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">4. Precio, prueba y facturación</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>El precio mensual se acuerda individualmente con cada cliente; no existen planes públicos fijos. Los importes indicados incluyen IGV.</li>
        <li>Salvo pacto distinto, puede aplicarse un periodo de prueba gratuito al inicio del servicio.</li>
        <li>Los cobros recurrentes se procesan según las condiciones acordadas (transferencia, Yape u otros medios habilitados).</li>
        <li>El impago puede generar periodo de gracia y, posteriormente, suspensión del acceso.</li>
      </ul>

      <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">5. Uso permitido</h2>
      <p>El usuario se compromete a:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Usar la plataforma solo para fines lícitos relacionados con su negocio.</li>
        <li>No intentar acceder a datos de otros clientes ni vulnerar la seguridad del sistema.</li>
        <li>No copiar, descompilar, revender ni sublicenciar el software sin autorización escrita.</li>
        <li>Cumplir la normativa aplicable, incluida la tributaria y de protección de datos de sus propios clientes finales.</li>
      </ul>

      <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">6. Datos del cliente</h2>
      <p>
        Los datos que el cliente carga en lavanet (clientes, ventas, inventario, etc.) son de su propiedad. EBYZOM los
        trata conforme a la{" "}
        <a href="/privacidad" className="text-brand font-semibold hover:underline">
          Política de Privacidad
        </a>
        , exclusivamente para prestar y mejorar el servicio.
      </p>

      <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">7. Disponibilidad y soporte</h2>
      <p>
        EBYZOM procurará mantener la plataforma disponible de forma razonable, pero no garantiza ausencia total de
        interrupciones por mantenimiento, fallas de terceros o fuerza mayor. El soporte se presta por los canales
        acordados (por ejemplo, WhatsApp <strong>906 591 037</strong>).
      </p>

      <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">8. Propiedad intelectual</h2>
      <p>
        lavanet, su código, diseño, marca y documentación son propiedad de EBYZOM E.I.R.L. o sus licenciantes. Estos
        términos no transfieren derechos de propiedad intelectual al usuario.
      </p>

      <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">9. Limitación de responsabilidad</h2>
      <p>
        En la medida permitida por la ley peruana, EBYZOM no será responsable por lucro cesante, pérdida de datos por
        mal uso del cliente, ni daños indirectos. La responsabilidad total de EBYZOM, si la hubiera, se limitará al monto
        pagado por el cliente en los tres (3) meses anteriores al hecho que originó el reclamo.
      </p>

      <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">10. Terminación</h2>
      <p>
        El cliente puede solicitar la baja del servicio conforme a su acuerdo comercial. EBYZOM puede terminar o suspender
        el acceso por incumplimiento grave o falta de pago. Tras la terminación, EBYZOM podrá conservar datos el tiempo
        necesario para obligaciones legales y luego eliminarlos según la política de privacidad.
      </p>

      <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">11. Modificaciones</h2>
      <p>
        EBYZOM puede actualizar estos términos. Los cambios relevantes se comunicarán por medios razonables. El uso
        continuado del servicio implica aceptación de la versión vigente.
      </p>

      <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">12. Ley aplicable y jurisdicción</h2>
      <p>
        Estos términos se rigen por las leyes de la República del Perú. Cualquier controversia se someterá a los
        tribunales competentes de Lima, Perú, salvo norma imperativa en contrario.
      </p>

      <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-2">13. Contacto</h2>
      <p>
        <strong>EBYZOM E.I.R.L.</strong>
        <br />
        Web: https://lavanet.ebyzom.com
        <br />
        WhatsApp: 906 591 037
      </p>
    </LegalLayout>
  );
}
