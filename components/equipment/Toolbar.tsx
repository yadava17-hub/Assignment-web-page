"use client";

import { Search, RotateCcw, Download } from "lucide-react";
import { CATEGORIES, STATUSES, FilterState } from "@/types/equipment";

interface ToolbarProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onReset: () => void;
  onExport: () => void;
  count: { visible: number; total: number };
}

export function Toolbar({ filters, onChange, onReset, onExport, count }: ToolbarProps) {
  function set<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    onChange({ ...filters, [key]: value });
  }

  const hasFilters =
    filters.query || filters.category || filters.status || filters.ownership;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
      {/* Search */}
      <div className="relative min-w-[200px] flex-1">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
        />
        <input
          type="text"
          value={filters.query}
          onChange={(e) => set("query", e.target.value)}
          placeholder="Search name, asset #, serial #…"
          className="h-8 w-full rounded-lg border border-stone-200 bg-stone-50 pl-8 pr-3 text-sm text-stone-900 outline-none transition focus:border-orange-400 focus:bg-white"
        />
      </div>

      {/* Separator */}
      <div className="hidden h-5 w-px bg-stone-200 sm:block" />

      {/* Category filter */}
      <select
        value={filters.category}
        onChange={(e) =>
          set("category", e.target.value as FilterState["category"])
        }
        className="h-8 rounded-lg border border-stone-200 bg-stone-50 px-2 pr-7 text-[12px] text-stone-700 outline-none transition focus:border-orange-400 focus:bg-white appearance-none cursor-pointer"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239e998f' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center" }}
      >
        <option value="">All Types</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {/* Status filter */}
      <select
        value={filters.status}
        onChange={(e) =>
          set("status", e.target.value as FilterState["status"])
        }
        className="h-8 rounded-lg border border-stone-200 bg-stone-50 px-2 pr-7 text-[12px] text-stone-700 outline-none transition focus:border-orange-400 focus:bg-white appearance-none cursor-pointer"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239e998f' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center" }}
      >
        <option value="">All Statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {/* Ownership filter */}
      <select
        value={filters.ownership}
        onChange={(e) =>
          set("ownership", e.target.value as FilterState["ownership"])
        }
        className="h-8 rounded-lg border border-stone-200 bg-stone-50 px-2 pr-7 text-[12px] text-stone-700 outline-none transition focus:border-orange-400 focus:bg-white appearance-none cursor-pointer"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239e998f' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center" }}
      >
        <option value="">All Ownership</option>
        <option value="Owned">Owned</option>
        <option value="Rented">Rented</option>
      </select>

      {hasFilters && (
        <button
          onClick={onReset}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 text-[11px] font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
        >
          <RotateCcw size={11} />
          Reset
        </button>
      )}

      <div className="ml-auto flex items-center gap-2">
        <span className="text-[11px] text-stone-400">
          <strong className="text-stone-700">{count.visible}</strong>/{count.total}
        </span>
        <button
          onClick={onExport}
          title="Export visible rows as CSV"
          className="flex h-8 items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 text-[11px] font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
        >
          <Download size={11} />
          CSV
        </button>
      </div>
    </div>
  );
}
