"use client";

import { AlertTriangle, Undo2, X } from "lucide-react";
import { Equipment } from "@/types/equipment";
import { leaseDaysLeft, leaseUrgency, fmtDate } from "@/lib/utils";
import { cn } from "@/lib/cn";

interface LeaseBannerProps {
  items: Array<{ item: Equipment; days: number }>;
  onExtend: (item: Equipment) => void;
}

const PILL_COLORS = {
  overdue: "bg-red-100 text-red-700",
  urgent: "bg-amber-100 text-amber-700",
  warn: "bg-orange-100 text-orange-700",
  ok: "bg-emerald-100 text-emerald-700",
};

export function LeaseBanner({ items, onExtend }: LeaseBannerProps) {
  if (!items.length) return null;
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
      <AlertTriangle
        size={15}
        className="mt-0.5 shrink-0 text-amber-600"
      />
      <div className="flex-1">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
          Lease Expiry Alerts
        </p>
        {items.map(({ item, days }) => {
          const urg = leaseUrgency(days);
          return (
            <div
              key={item.id}
              className="mb-1 flex items-center gap-2 text-[11px] last:mb-0"
            >
              <strong className="text-stone-800">{item.name}</strong>
              <span className="text-stone-500">·</span>
              <span className="text-stone-600">{fmtDate(item.leaseExpiry!)}</span>
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[9px] font-bold",
                  PILL_COLORS[urg]
                )}
              >
                {days < 0
                  ? `${Math.abs(days)}d overdue`
                  : `${days}d left`}
              </span>
              <button
                onClick={() => onExtend(item)}
                className="text-[10px] font-semibold text-amber-700 hover:text-amber-900 underline"
              >
                Extend →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface UndoBannerProps {
  label: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoBanner({ label, onUndo, onDismiss }: UndoBannerProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2.5">
      <span className="flex-1 text-[11px] font-semibold text-violet-800">
        {label}
      </span>
      <button
        onClick={onUndo}
        className="flex items-center gap-1.5 rounded-lg bg-violet-700 px-3 py-1 text-[11px] font-bold text-white hover:bg-violet-800 transition-colors"
      >
        <Undo2 size={11} />
        Undo
      </button>
      <button
        onClick={onDismiss}
        className="text-violet-400 hover:text-violet-600 transition-colors"
      >
        <X size={13} />
      </button>
    </div>
  );
}
