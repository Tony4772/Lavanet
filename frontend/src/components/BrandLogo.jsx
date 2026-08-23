import React from "react";
import { cn } from "../lib/utils";

/**
 * Logo + slogan lavanet (asset cuadrado; el slogan va debajo del wordmark).
 * Usar `size` para mantener proporciones legibles en cada contexto.
 */
const SIZE_CLASS = {
  /** Barra superior móvil */
  header: "w-[152px] sm:w-[168px] h-auto",
  /** Sidebar escritorio */
  sidebar: "w-[248px] h-auto",
  /** Menú lateral móvil (drawer) */
  sidebarMobile: "w-[280px] max-w-[88vw] h-auto",
  /** Cabeceras internas (superadmin, legal) */
  panel: "w-[210px] sm:w-[228px] h-auto",
  /** Login / registro móvil */
  hero: "max-h-[100px] w-auto max-w-[min(100%,240px)] h-auto",
  /** Login / registro panel izquierdo escritorio */
  heroDesktop: "max-h-[130px] w-auto max-w-[280px] h-auto",
};

export default function BrandLogo({
  className,
  imgClassName,
  size,
  alt = "lavanet — simple y poderosa",
}) {
  return (
    <div className={cn(className)}>
      <img
        src="/lavanet-logo-transparent.png"
        alt={alt}
        className={cn(
          "block object-contain object-center select-none",
          size ? SIZE_CLASS[size] : "w-auto max-w-full h-auto",
          imgClassName
        )}
        draggable={false}
      />
    </div>
  );
}
