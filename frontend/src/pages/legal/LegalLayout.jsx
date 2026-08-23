import React from "react";
import { Link } from "react-router-dom";
import BrandLogo from "../../components/BrandLogo";
import SiteFooter from "../../components/SiteFooter";

export default function LegalLayout({ title, children }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <header className="border-b bg-white dark:bg-slate-900 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Link to="/login" aria-label="Volver a lavanet">
            <BrandLogo size="panel" />
          </Link>
          <Link to="/login" className="text-sm text-brand font-semibold hover:underline">
            Iniciar sesión
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10">
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
          {title}
        </h1>
        <p className="text-xs text-slate-500 mb-8">Última actualización: 23 de agosto de 2026</p>
        <article className="prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed space-y-4">
          {children}
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
