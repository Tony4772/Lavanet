import React from "react";
import { Link } from "react-router-dom";

const YEAR = new Date().getFullYear();

export default function SiteFooter({ className = "", compact = false }) {
  if (compact) {
    return (
      <footer
        className={`shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-[10px] text-slate-500 ${className}`}
        data-testid="site-footer"
      >
        <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span>© {YEAR} EBYZOM E.I.R.L. · lavanet</span>
          <nav className="flex flex-wrap gap-x-3">
            <Link to="/terminos" className="hover:text-brand underline-offset-2 hover:underline">
              Términos
            </Link>
            <Link to="/privacidad" className="hover:text-brand underline-offset-2 hover:underline">
              Privacidad
            </Link>
          </nav>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className={`border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-xs text-slate-500 ${className}`}
      data-testid="site-footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p>
            © {YEAR} <strong className="text-slate-700 dark:text-slate-300">EBYZOM E.I.R.L.</strong> Todos los derechos reservados.
          </p>
          <p>
            <span className="text-brand font-semibold">lavanet</span> es un producto de EBYZOM E.I.R.L.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-1">
          <Link to="/terminos" className="hover:text-brand underline-offset-2 hover:underline">
            Términos y condiciones
          </Link>
          <Link to="/privacidad" className="hover:text-brand underline-offset-2 hover:underline">
            Política de privacidad
          </Link>
        </nav>
      </div>
    </footer>
  );
}
