"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Eye,
  Pencil,
  Wrench,
  Trash2,
} from "lucide-react";
import { Equipment, SortState, STATUSES, STATUS_META } from "@/types/equipment";
import { StatusBadge, CategoryBadge, OwnershipBadge } from "@/components/ui/Badge";
import { fmtCurrency, fmtDate, leaseDaysLeft, leaseUrgency } from "@/lib/utils";
import { EquipmentStore } from "@/hooks/useEquipment";
import { cn } from "@/lib/cn";

interface EquipmentTableProps {
  store: EquipmentStore;
  onEdit: (item: Equipment) => void;
  onDelete: (item: Equipment) => void;
  onRetire: (item: Equipment) => void;
  onAddLog: (item: Equipment) => void;
}

interface CtxMenu {
  x: number;
  y: number;
  item: Equipment;
}

const LEASE_COLORS = {
  overdue: "bg-red-100 text-red-700 ring-1 ring-red-200",
  urgent:  "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  warn:    "bg-orange-100 text-orange-700 ring-1 ring-orange-200",
  ok:      "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
};

export function EquipmentTable({
  store,
  onEdit,
  onDelete,
  onRetire,
  onAddLog,
}: EquipmentTableProps) {
  const { visible, paged, sort, toggleSort, selected, toggleSelect, selectAll, clearSelection, activeId, setActiveId, changeStatus } = store;
  const [ctx, setCtx] = useState<CtxMenu | null>(null);
  const ctxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ctx) return;
    const handler = (e: MouseEvent) => {
      if (ctxRef.current && !ctxRef.current.contains(e.target as Node))
        setCtx(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ctx]);

  const allSelected =
    paged.length > 0 && paged.every((e) => selected.has(e.id));
  const someSelected = paged.some((e) => selected.has(e.id));

  function SortIcon({ field }: { field: SortState["field"] }) {
    if (sort.field !== field)
      return <ChevronsUpDown size={12} className="text-stone-400" />;
    return sort.dir === "asc" ? (
      <ChevronUp size={12} className="text-orange-500" />
    ) : (
      <ChevronDown size={12} className="text-orange-500" />
    );
  }

  function Th({
    field,
    label,
    className,
  }: {
    field: SortState["field"];
    label: string;
    className?: string;
  }) {
    return (
      <th
        onClick={() => toggleSort(field)}
        className={cn(
          "cursor-pointer select-none whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-stone-500 hover:text-stone-700 transition-colors",
          sort.field === field && "text-orange-600",
          className
        )}
      >
        <div className="flex items-center gap-1">
          {label}
          <SortIcon field={field} />
        </div>
      </th>
    );
  }

  if (!visible.length) {  // still check visible so empty state shows when filters produce 0 results
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-400">
        <span className="text-4xl mb-3">⊘</span>
        <p className="font-semibold text-stone-600">No equipment found</p>
        <p className="text-sm mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/80">
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = !allSelected && someSelected;
                  }}
                  onChange={(e) => {
                    e.target.checked
                      ? selectAll(paged.map((x) => x.id))
                      : clearSelection();
                  }}
                  className="size-3.5 accent-orange-600 cursor-pointer"
                />
              </th>
              <Th field="name" label="Name" className="min-w-[180px]" />
              <Th field="assetNumber" label="Asset #" className="min-w-[90px]" />
              <Th field="category" label="Type" className="min-w-[100px]" />
              <Th field="ownership" label="Own." />
              <Th field="status" label="Status" className="min-w-[110px]" />
              <Th field="hourlyRate" label="Hourly" />
              <Th field="dailyRate" label="Daily" />
              <Th field="replacementCost" label="Replacement" />
              <Th field="leaseExpiry" label="Lease Exp." />
              <th className="px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paged.map((item) => {
              const isSel = selected.has(item.id);
              const isDet = activeId === item.id;
              const isRet = item.status === "Retired";
              const days =
                item.leaseExpiry ? leaseDaysLeft(item.leaseExpiry) : null;
              const urg = days !== null ? leaseUrgency(days) : null;

              return (
                <tr
                  key={item.id}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setCtx({ x: e.clientX, y: e.clientY, item });
                  }}
                  className={cn(
                    "border-b border-stone-100 transition-colors",
                    isDet && "bg-orange-50",
                    isSel && !isDet && "bg-blue-50/60",
                    isRet && "opacity-50",
                    !isDet && !isSel && "hover:bg-stone-50"
                  )}
                >
                  {/* Checkbox */}
                  <td className="w-10 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => toggleSelect(item.id)}
                      className="size-3.5 accent-orange-600 cursor-pointer"
                    />
                  </td>

                  {/* Name */}
                  <td
                    className="px-3 py-2.5 cursor-pointer"
                    onClick={() =>
                      setActiveId(activeId === item.id ? null : item.id)
                    }
                  >
                    <div className="max-w-[200px]">
                      <p className="font-semibold text-stone-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] font-mono text-stone-400 mt-0.5">
                        {item.serialNumber || item.assetNumber}
                      </p>
                    </div>
                  </td>

                  {/* Asset # */}
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-[11px] text-stone-600">
                      {item.assetNumber}
                    </span>
                  </td>

                  {/* Category */}
                  <td className="px-3 py-2.5">
                    <CategoryBadge category={item.category} />
                  </td>

                  {/* Ownership */}
                  <td className="px-3 py-2.5">
                    <OwnershipBadge ownership={item.ownership} />
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2.5">
                    <StatusBadge status={item.status} size="sm" />
                  </td>

                  {/* Hourly */}
                  <td className="px-3 py-2.5 font-mono text-[11px] text-stone-700">
                    {fmtCurrency(item.hourlyRate)}
                    {item.hourlyRate > 0 && (
                      <span className="text-stone-400">/hr</span>
                    )}
                  </td>

                  {/* Daily */}
                  <td className="px-3 py-2.5 font-mono text-[11px] text-stone-700">
                    {fmtCurrency(item.dailyRate)}
                    {item.dailyRate > 0 && (
                      <span className="text-stone-400">/day</span>
                    )}
                  </td>

                  {/* Replacement */}
                  <td className="px-3 py-2.5 font-mono text-[11px] text-stone-500">
                    {fmtCurrency(item.replacementCost)}
                  </td>

                  {/* Lease */}
                  <td className="px-3 py-2.5">
                    {item.leaseExpiry && days !== null && urg ? (
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={cn(
                            "inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold font-mono",
                            LEASE_COLORS[urg]
                          )}
                        >
                          {fmtDate(item.leaseExpiry)}
                        </span>
                        <span className="text-[9px] text-stone-400">
                          {days < 0
                            ? `${Math.abs(days)}d overdue`
                            : `${days}d left`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-stone-300">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <ActionBtn
                        title="Open detail"
                        onClick={() =>
                          setActiveId(activeId === item.id ? null : item.id)
                        }
                        icon={<Eye size={13} />}
                        active={isDet}
                      />
                      <ActionBtn
                        title="Edit"
                        onClick={() => onEdit(item)}
                        icon={<Pencil size={13} />}
                        className="text-blue-600 hover:bg-blue-50"
                      />
                      <ActionBtn
                        title="Add maintenance log"
                        onClick={() => onAddLog(item)}
                        icon={<Wrench size={13} />}
                      />
                      <ActionBtn
                        title="Delete"
                        onClick={() => onDelete(item)}
                        icon={<Trash2 size={13} />}
                        className="text-red-500 hover:bg-red-50"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Context Menu */}
      {ctx && (
        <div
          ref={ctxRef}
          className="fixed z-50 min-w-[180px] rounded-xl bg-white py-1 shadow-xl ring-1 ring-stone-200 animate-in fade-in zoom-in-95 duration-100"
          style={{ left: ctx.x, top: ctx.y }}
        >
          <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-stone-400">
            Quick Change Status
          </div>
          {STATUSES.map((s) => {
            const meta = STATUS_META[s];
            return (
              <button
                key={s}
                onClick={() => {
                  changeStatus(ctx.item.id, s);
                  setCtx(null);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors",
                  ctx.item.status === s && "bg-orange-50 font-bold text-orange-700"
                )}
              >
                <span className={cn("size-2 rounded-full", meta.dot)} />
                {s}
              </button>
            );
          })}
          <div className="my-1 border-t border-stone-100" />
          <CtxItem label="Edit" onClick={() => { onEdit(ctx.item); setCtx(null); }} />
          <CtxItem label="Open detail" onClick={() => { setActiveId(ctx.item.id); setCtx(null); }} />
          <CtxItem label="Add maintenance log" onClick={() => { onAddLog(ctx.item); setCtx(null); }} />
          <div className="my-1 border-t border-stone-100" />
          <CtxItem
            label="Archive"
            onClick={() => { onRetire(ctx.item); setCtx(null); }}
            className="text-amber-700"
          />
          <CtxItem
            label="Delete"
            onClick={() => { onDelete(ctx.item); setCtx(null); }}
            className="text-red-600"
          />
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  icon,
  title,
  onClick,
  className,
  active,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  className?: string;
  active?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        "flex size-6 items-center justify-center rounded-md text-stone-400 transition-colors",
        active
          ? "bg-orange-100 text-orange-600"
          : "hover:bg-stone-100 hover:text-stone-700",
        className
      )}
    >
      {icon}
    </button>
  );
}

function CtxItem({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full px-3 py-1.5 text-left text-sm text-stone-700 hover:bg-stone-50 transition-colors",
        className
      )}
    >
      {label}
    </button>
  );
}
