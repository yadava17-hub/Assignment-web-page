"use client";

import { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { STATUSES, EquipmentStatus, STATUS_META } from "@/types/equipment";
import { EquipmentStore } from "@/hooks/useEquipment";
import { cn } from "@/lib/cn";

interface BulkBarProps {
  store: EquipmentStore;
  onBulkDelete: () => void;
  onDeleteAll: () => void;
}

export function BulkBar({ store, onBulkDelete, onDeleteAll }: BulkBarProps) {
  const { selected, clearSelection, bulkChangeStatus } = store;
  const [statusOpen, setStatusOpen] = useState(false);

  if (selected.size === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5">
      <span className="text-[11px] font-bold text-blue-700">
        {selected.size} selected
      </span>

      <div className="ml-auto flex items-center gap-2">
        {/* Change status */}
        <div className="relative">
          <button
            onClick={() => setStatusOpen((o) => !o)}
            className="flex h-7 items-center gap-1.5 rounded-lg bg-blue-700 px-3 text-[11px] font-bold text-white hover:bg-blue-800 transition-colors"
          >
            Change Status
            <ChevronDown size={11} />
          </button>
          {statusOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-xl bg-white py-1 shadow-xl ring-1 ring-stone-200">
              {STATUSES.map((s) => {
                const meta = STATUS_META[s];
                return (
                  <button
                    key={s}
                    onClick={() => {
                      bulkChangeStatus([...selected], s);
                      setStatusOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    <span className={cn("size-2 rounded-full", meta.dot)} />
                    {s}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Archive all */}
        <button
          onClick={() => {
            bulkChangeStatus([...selected], "Retired");
          }}
          className="h-7 rounded-lg border border-amber-300 bg-amber-100 px-3 text-[11px] font-semibold text-amber-700 hover:bg-amber-200 transition-colors"
        >
          Archive All
        </button>

        {/* Delete all */}
        <button
          onClick={onBulkDelete}
          className="h-7 rounded-lg border border-red-300 bg-red-100 px-3 text-[11px] font-semibold text-red-700 hover:bg-red-200 transition-colors"
        >
          Delete All
        </button>

        {/* Delete All (entire catalog) */}
        <button
          onClick={onDeleteAll}
          className="h-7 rounded-lg border border-red-400 bg-red-600 px-3 text-[11px] font-semibold text-white hover:bg-red-700 transition-colors"
        >
          Delete All
        </button>

        {/* Clear */}
        <button
          onClick={clearSelection}
          className="flex h-7 items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 text-[11px] font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
        >
          <X size={11} />
          Clear
        </button>
      </div>
    </div>
  );
}
