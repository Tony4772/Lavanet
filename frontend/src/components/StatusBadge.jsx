import React from "react";
import { STATUS_STYLE } from "../lib/seed";

export const StatusBadge = ({ status }) => {
  const cls = STATUS_STYLE[status] || "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span
      data-testid={`status-badge-${status}`}
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}
      role="status"
      aria-label={status}
    >
      {status}
    </span>
  );
};
