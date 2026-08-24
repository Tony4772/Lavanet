import React from "react";
import { cn } from "../lib/utils";

/**
 * Logos lavanet: cuadrado (sidebar, header) u horizontal (login/landing).
 */
const SRC = {
  square: "/lavanet-logo-transparent.png",
  wideDesktop: "/escritorio.svg",
  wideMobile: "/lavanet-logo-wide.svg",
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
  /** Login / landing escritorio — SVG escritorio.svg, 120px alto */
  heroWide: "h-[160px] w-auto max-w-full mx-auto",
  /** Login / landing móvil — SVG vectorial, 200px alto */
  heroWideMobile: "h-[200px] w-auto max-w-full mx-auto",
};

const SIZE_SRC = {
  heroWide: SRC.wideDesktop,
  heroWideMobile: SRC.wideMobile,
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
