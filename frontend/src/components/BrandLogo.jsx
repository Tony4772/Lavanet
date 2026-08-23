import React from "react";
import { cn } from "../lib/utils";

/**
 * Logo oficial Lavanet (fondo negro del asset).
 * En fondos claros usa `framed` para envolverlo en negro.
 */
export default function BrandLogo({
  className,
  imgClassName,
  framed = false,
  alt = "lavanet",
}) {
  const img = (
    <img
      src="/lavanet-logo.png"
      alt={alt}
      className={cn("block w-auto object-contain select-none", imgClassName)}
      draggable={false}
    />
  );

  if (!framed) return <div className={cn(className)}>{img}</div>;

  return (
    <div className={cn("inline-flex items-center justify-center rounded-xl bg-black p-2", className)}>
      {img}
    </div>
  );
}
