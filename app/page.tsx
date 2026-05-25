"use client";

import { useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Equipment } from "@/types/equipment";
import { useEquipment } from "@/hooks/useEquipment";
import { getExpiringLeases } from "@/lib/utils";
import { StatsBar } from "@/components/equipment/StatsBar";
import { Toolbar } from "@/components/equipment/Toolbar";
import { EquipmentTable } from "@/components/equipment/EquipmentTable";
import { DetailPanel } from "@/components/equipment/DetailPanel";
import { EquipmentForm } from "@/components/equipment/EquipmentForm";
import { BulkBar } from "@/components/equipment/BulkBar";
import { LeaseBanner, UndoBanner } from "@/components/equipment/Banners";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TableFooter } from "@/components/equipment/TableFooter";
import { SuggestionsCard } from "@/components/equipment/SuggestionsCard";

type DialogState =
  | { type: "none" }
  | { type: "delete"; item: Equipment }
  | { type: "retire"; item: Equipment }
  | { type: "bulkDelete" }
  | { type: "deleteAll" }
  | { type: "resetData" };

export default function Home() {
  const store = useEquipment();
  const {
    equipment,
    logs,
    visible,
    filters,
    setFilters,
    resetFilters,
    selected,
    activeId,
    setActiveId,
    undoStack,
    doUndo,
    hydrated,
    deleteEquipment,
    retireEquipment,
    bulkDelete,
    deleteAll,
    resetData,
    doExport,
  } = store;

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Equipment | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ type: "none" });
  const [undoDismissed, setUndoDismissed] = useState(false);

  const activeItem = activeId ? equipment.find((e) => e.id === activeId) ?? null : null;
  const expiringLeases = getExpiringLeases(equipment);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      if (e.key === "/") {
        e.preventDefault();
        (document.querySelector('input[placeholder*="Search"]') as HTMLInputElement)?.focus();
      }
      if (e.key === "n" || e.key === "N") { setEditItem(null); setFormOpen(true); }
      if (e.key === "Escape") setActiveId(null);
      if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); doUndo(); }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [setActiveId, doUndo]);

  useEffect(() => {
    if (undoStack) setUndoDismissed(false);
  }, [undoStack]);

  function openEdit(item: Equipment) { setEditItem(item); setFormOpen(true); }

  function handleDelete(item: Equipment) { setDialog({ type: "delete", item }); }
  function handleRetire(item: Equipment) {
    if (item.status === "Retired") return;
    setDialog({ type: "retire", item });
  }
  function handleAddLog(item: Equipment) { setActiveId(item.id); }

  function confirmDialog() {
    if (dialog.type === "delete" && dialog.item.status !== "In Use") {
      deleteEquipment(dialog.item.id);
    } else if (dialog.type === "retire") {
      retireEquipment(dialog.item.id);
    } else if (dialog.type === "bulkDelete") {
      bulkDelete([...selected]);
    } else if (dialog.type === "deleteAll") {
      deleteAll();
    } else if (dialog.type === "resetData") {
      resetData();
    }
    setDialog({ type: "none" });
  }

  function dialogProps() {
    if (dialog.type === "delete") {
      const inUse = dialog.item.status === "In Use";
      return {
        title: inUse ? "Cannot Delete — In Use" : "Delete Equipment?",
        message: inUse
          ? <p><strong>{dialog.item.name}</strong> is currently <em>In Use</em>. Change its status first, or use Archive instead.</p>
          : <p>Permanently remove <strong>{dialog.item.name}</strong> ({dialog.item.assetNumber}) and all maintenance history? You can undo for 8 seconds.</p>,
        confirmLabel: inUse ? "Got it" : "Delete",
        danger: !inUse,
        onConfirm: () => { if (!inUse) deleteEquipment(dialog.item.id); setDialog({ type: "none" }); },
      };
    }
    if (dialog.type === "retire") return {
      title: "Archive Equipment?",
      message: <p><strong>{dialog.item.name}</strong> will be marked <em>Retired</em>. Stays in catalog for records.</p>,
      confirmLabel: "Archive", danger: false, onConfirm: confirmDialog,
    };
    if (dialog.type === "bulkDelete") {
      const inUseCount = [...selected].filter(id => equipment.find(e => e.id === id)?.status === "In Use").length;
      return {
        title: `Delete ${selected.size} Items?`,
        message: inUseCount > 0
          ? <p><strong>{inUseCount} In Use item(s)</strong> will be skipped. {selected.size - inUseCount} will be deleted.</p>
          : <p>Delete <strong>{selected.size} items</strong> and all maintenance history? You can undo for 8 seconds.</p>,
        confirmLabel: "Delete All", danger: true, onConfirm: confirmDialog,
      };
    }
    if (dialog.type === "deleteAll") return {
      title: "Delete Entire Catalog?",
      message: (
        <p>
          This will permanently delete <strong>all equipment</strong> except items{" "}
          <em>In Use</em>. Maintenance history will also be deleted. You can undo
          for 8 seconds.
        </p>
      ),
      confirmLabel: "Delete All", danger: true, onConfirm: confirmDialog,
    };
    if (dialog.type === "resetData") return {
      title: "Reset All Data?",
      message: <p>Restores the 14 default items and deletes all changes. Cannot be undone.</p>,
      confirmLabel: "Reset", danger: true, onConfirm: confirmDialog,
    };
    return { title: "", message: "", confirmLabel: "OK", danger: false, onConfirm: () => setDialog({ type: "none" }) };
  }

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-stone-200 border-t-orange-600" />
          <p className="text-sm font-medium text-stone-500">Loading catalog…</p>
        </div>
      </div>
    );
  }

  const dp = dialogProps();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-stone-50">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-stone-200 bg-stone-900 px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-orange-600 text-[15px]">⚙</div>
          <div>
            <p className="text-[13px] font-bold text-white leading-none">Fleet Catalog</p>
            <p className="text-[9px] text-stone-400 leading-none mt-0.5">Equipment Management</p>
          </div>
        </div>
        <div className="mx-2 h-5 w-px bg-stone-700" />
        <p className="hidden text-[10px] text-stone-500 sm:block">
          <kbd className="rounded bg-stone-700 px-1 py-0.5 font-mono text-[9px] text-stone-300">/</kbd> search &nbsp;
          <kbd className="rounded bg-stone-700 px-1 py-0.5 font-mono text-[9px] text-stone-300">N</kbd> add &nbsp;
          <kbd className="rounded bg-stone-700 px-1 py-0.5 font-mono text-[9px] text-stone-300">Esc</kbd> close &nbsp;
          <kbd className="rounded bg-stone-700 px-1 py-0.5 font-mono text-[9px] text-stone-300">⌘Z</kbd> undo
        </p>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setDialog({ type: "resetData" })}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-stone-700 bg-stone-800 px-3 text-[11px] font-semibold text-stone-400 hover:bg-stone-700 hover:text-stone-200 transition-colors"
          >
            <RotateCcw size={11} /> Reset Data
          </button>
          <button
            onClick={() => { setEditItem(null); setFormOpen(true); }}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-orange-600 px-4 text-[12px] font-bold text-white hover:bg-orange-700 transition-colors"
          >
            + Add Equipment
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Main */}
        <div className="flex flex-1 min-w-0 flex-col overflow-y-auto p-4 gap-3 pb-8">
          <StatsBar equipment={equipment} logs={logs} />
          {expiringLeases.length > 0 && <LeaseBanner items={expiringLeases} onExtend={openEdit} />}
          {undoStack && !undoDismissed && (
            <UndoBanner label={undoStack.label} onUndo={doUndo} onDismiss={() => setUndoDismissed(true)} />
          )}
          <Toolbar
            filters={filters}
            onChange={setFilters}
            onReset={resetFilters}
            onExport={doExport}
            count={{ visible: visible.length, total: equipment.length }}
          />
          <BulkBar
            store={store}
            onBulkDelete={() => setDialog({ type: "bulkDelete" })}
            onDeleteAll={() => setDialog({ type: "deleteAll" })}
          />
          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
            <EquipmentTable
              store={store}
              onEdit={openEdit}
              onDelete={handleDelete}
              onRetire={handleRetire}
              onAddLog={handleAddLog}
            />
            <TableFooter store={store} />
          </div>
          <SuggestionsCard />
        </div>

        {/* Detail panel */}
        {activeItem && (
          <DetailPanel
            key={activeItem.id}
            item={activeItem}
            store={store}
            onEdit={() => openEdit(activeItem)}
            onDelete={() => handleDelete(activeItem)}
            onRetire={() => handleRetire(activeItem)}
          />
        )}
      </div>

      <EquipmentForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditItem(null); }}
        editItem={editItem}
        store={store}
      />
      <ConfirmDialog
        open={dialog.type !== "none"}
        title={dp.title}
        message={dp.message}
        confirmLabel={dp.confirmLabel}
        danger={dp.danger}
        onConfirm={dp.onConfirm}
        onCancel={() => setDialog({ type: "none" })}
      />
    </div>
  );
}
