import React from "react";
import { cn } from "../lib/utils";

/**
 * Logos lavanet: cuadrado (sidebar, header) u horizontal (login/landing).
 */
const SRC = {
  square: "/lavanet-logo-transparent.png",
  wideLg: "/lavanet-logo-wide-120x80.png",
  wideSm: "/lavanet-logo-wide-100x70.png",
};

const SIZE_CLASS = {
  /** Barra superior móvil */
  header: "w-[152px] sm:w-[168px] h-auto",
  /** Sidebar escritorio */
  sidebar: "w-[248px] h-auto",
  /** Menú lateral móvil (drawer) */
  sidebarMobile: "w-[280px] max-w-[88vw] h-auto",
  /** Cabeceras internas (superadmin, legal) */
  panel: "w-[210px] sm:w-[228px] h-auto",
  /** Login / registro móvil (cuadrado, legacy) */
  hero: "w-[min(100%,340px)] h-auto",
  /** Login / registro panel izquierdo escritorio (cuadrado, legacy) */
  heroDesktop: "w-[400px] max-w-full h-auto",
  /** Login / landing escritorio — asset 120×80 */
  heroWide: "h-20 w-auto max-w-full mx-auto",
  /** Login / landing móvil — asset 100×70 */
  heroWideMobile: "h-[70px] w-auto max-w-full",
};

const SIZE_SRC = {
  heroWide: SRC.wideLg,
  heroWideMobile: SRC.wideSm,
};

export default function BrandLogo({
  className,
  imgClassName,
  size,
  alt = "lavanet — simple y poderosa",
}) {
  const src = (size && SIZE_SRC[size]) || SRC.square;

  return (
    <div className={cn(className)}>
      <img
        src={src}
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
