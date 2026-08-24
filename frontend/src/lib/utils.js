import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Campo decimal editable: vacío en lugar de 0 inicial (mejor en móvil). */
export function decimalInputValue(value) {
  if (value === "" || value == null || value === 0) return "";
  return String(value);
}

export function sanitizeDecimalInput(raw) {
  const v = String(raw).replace(",", ".");
  if (v === "") return "";
  if (/^\d*\.?\d*$/.test(v)) return v;
  return null;
}

export function parseDecimalInput(raw, fallback = 0) {
  const n = Number(String(raw).replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

export function sanitizeIntegerInput(raw) {
  const v = String(raw);
  if (v === "") return "";
  if (/^\d*$/.test(v)) return v;
  return null;
}

export function parseIntegerInput(raw, fallback = 0) {
  const n = parseInt(String(raw), 10);
  return Number.isFinite(n) ? n : fallback;
}
