"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { PAGE_SIZES, PageSize, EquipmentStore } from "@/hooks/useEquipment";

interface TableFooterProps {
  store: EquipmentStore;
}

export function TableFooter({ store }: TableFooterProps) {
  const { visible, paged, page, setPage, pageSize, setPageSize, totalPages } = store;

  const start = visible.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, visible.length);

  return (
    <div className="flex items-center justify-between border-t border-stone-100 px-4 py-2.5 text-[11px] text-stone-500">
      {/* Left: count */}
      <span>
        {visible.length === 0 ? (
          "No items"
        ) : (
          <>
            Showing <strong className="text-stone-700">{start}–{end}</strong> of{" "}
            <strong className="text-stone-700">{visible.length}</strong> items
          </>
        )}
      </span>

      {/* Centre: page size picker */}
      <div className="flex items-center gap-1.5">
        <span className="text-stone-400">Rows per page:</span>
        <div className="flex items-center rounded-lg border border-stone-200 overflow-hidden">
          {PAGE_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => setPageSize(size as PageSize)}
              className={`px-2.5 py-1 text-[11px] font-semibold transition-colors border-r border-stone-200 last:border-r-0 ${
                pageSize === size
                  ? "bg-orange-600 text-white"
                  : "bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Right: prev / page indicator / next */}
      <div className="flex items-center gap-2">
        <span className="text-stone-400">
          Page <strong className="text-stone-700">{totalPages === 0 ? 0 : page}</strong> of{" "}
          <strong className="text-stone-700">{totalPages}</strong>
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="flex size-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="flex size-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
