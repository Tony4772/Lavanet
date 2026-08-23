import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import {
  COOKIE_CONSENT,
  hasCookieConsentChoice,
  setCookieConsent,
} from "../lib/cookies";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!hasCookieConsentChoice());
    const onChange = () => setVisible(!hasCookieConsentChoice());
    window.addEventListener("lavanet:cookie-consent", onChange);
    return () => window.removeEventListener("lavanet:cookie-consent", onChange);
  }, []);

  if (!visible) return null;

  const accept = () => {
    setCookieConsent(COOKIE_CONSENT.ACCEPTED);
    setVisible(false);
  };

  const reject = () => {
    setCookieConsent(COOKIE_CONSENT.REJECTED);
    setVisible(false);
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[70] p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      role="dialog"
      aria-label="Consentimiento de cookies"
      data-testid="cookie-consent-banner"
    >
      <div className="max-w-4xl mx-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-4 sm:p-5">
        <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">Usamos cookies</p>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
          Utilizamos cookies técnicas necesarias para iniciar sesión y operar lavanet. Si aceptas, también podremos usar
          cookies opcionales para mejorar el servicio. Puedes rechazar las opcionales y seguir usando la plataforma.{" "}
          <Link to="/privacidad#cookies" className="text-brand font-semibold hover:underline">
            Más información
          </Link>
        </p>
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button
            type="button"
            onClick={accept}
            className="bg-brand hover:bg-brand-dark h-10"
            data-testid="cookie-accept"
          >
            Aceptar cookies
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={reject}
            className="h-10"
            data-testid="cookie-reject"
          >
            Rechazar opcionales
          </Button>
        </div>
      </div>
    </div>
  );
}
