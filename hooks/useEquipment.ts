"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Equipment,
  MaintenanceLog,
  FilterState,
  SortState,
  EquipmentStatus,
} from "@/types/equipment";
import {
  loadEquipment,
  saveEquipment,
  loadLogs,
  saveLogs,
  resetStorage,
} from "@/lib/storage";
import { filterEquipment, sortEquipment, newId, exportCsv } from "@/lib/utils";

interface UndoSnapshot {
  label: string;
  equipment: Equipment[];
  logs: MaintenanceLog[];
}

const DEFAULT_FILTERS: FilterState = {
  query: "",
  category: "",
  status: "",
  ownership: "",
};

const DEFAULT_SORT: SortState = { field: "name", dir: "asc" };
export const PAGE_SIZES = [5, 10, 25, 50] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export function useEquipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<UndoSnapshot | null>(null);
  const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [page, setPage] = useState(1);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setEquipment(loadEquipment());
    setLogs(loadLogs());
    setHydrated(true);
  }, []);

  // Persist whenever data changes (after hydration)
  useEffect(() => {
    if (hydrated) saveEquipment(equipment);
  }, [equipment, hydrated]);

  useEffect(() => {
    if (hydrated) saveLogs(logs);
  }, [logs, hydrated]);

  // ── Undo ────────────────────────────────────────────────────────────────────
  const pushUndo = useCallback(
    (label: string, prevEq: Equipment[], prevLogs: MaintenanceLog[]) => {
      if (undoTimer) clearTimeout(undoTimer);
      setUndoStack({ label, equipment: prevEq, logs: prevLogs });
      const t = setTimeout(() => setUndoStack(null), 8000);
      setUndoTimer(t);
    },
    [undoTimer]
  );

  const doUndo = useCallback(() => {
    if (!undoStack) return;
    setEquipment(undoStack.equipment);
    setLogs(undoStack.logs);
    setUndoStack(null);
    if (undoTimer) clearTimeout(undoTimer);
    // close detail panel if that item no longer exists
    if (activeId && !undoStack.equipment.find((e) => e.id === activeId)) {
      setActiveId(null);
    }
  }, [undoStack, undoTimer, activeId]);

  // ── Visible rows + pagination ───────────────────────────────────────────────
  const visible = useMemo(
    () => sortEquipment(filterEquipment(equipment, filters), sort),
    [equipment, filters, sort]
  );

  // Reset to page 1 whenever filters/sort/pageSize changes
  useEffect(() => {
    setPage(1);
  }, [filters, sort, pageSize]);

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(
    () => visible.slice((safePage - 1) * pageSize, safePage * pageSize),
    [visible, safePage, pageSize]
  );

  // ── Sort toggle ─────────────────────────────────────────────────────────────
  const toggleSort = useCallback(
    (field: SortState["field"]) => {
      setSort((s) =>
        s.field === field
          ? { field, dir: s.dir === "asc" ? "desc" : "asc" }
          : { field, dir: "asc" }
      );
    },
    []
  );

  // ── Filter helpers ──────────────────────────────────────────────────────────
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // ── CRUD ────────────────────────────────────────────────────────────────────
  const addEquipment = useCallback(
    (item: Omit<Equipment, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      const newItem: Equipment = {
        ...item,
        id: newId(),
        createdAt: now,
        updatedAt: now,
      };
      setEquipment((prev) => [...prev, newItem]);
      return newItem;
    },
    []
  );

  const updateEquipment = useCallback(
    (id: string, patch: Partial<Equipment>) => {
      const prev = equipment;
      const prevLogs = logs;
      pushUndo("Equipment updated", prev, prevLogs);
      setEquipment((items) =>
        items.map((e) =>
          e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e
        )
      );
    },
    [equipment, logs, pushUndo]
  );

  const deleteEquipment = useCallback(
    (id: string) => {
      const prev = equipment;
      const prevLogs = logs;
      const name = equipment.find((e) => e.id === id)?.name ?? "item";
      pushUndo(`"${name}" deleted`, prev, prevLogs);
      setEquipment((items) => items.filter((e) => e.id !== id));
      setLogs((l) => l.filter((log) => log.equipmentId !== id));
      if (activeId === id) setActiveId(null);
    },
    [equipment, logs, pushUndo, activeId]
  );

  const retireEquipment = useCallback(
    (id: string) => {
      const name = equipment.find((e) => e.id === id)?.name ?? "item";
      updateEquipment(id, { status: "Retired" });
      // pushUndo already called in updateEquipment — override label
      setUndoStack((u) => (u ? { ...u, label: `"${name}" archived` } : u));
    },
    [equipment, updateEquipment]
  );

  const changeStatus = useCallback(
    (id: string, status: EquipmentStatus) => {
      updateEquipment(id, { status });
    },
    [updateEquipment]
  );

  // ── Bulk actions ────────────────────────────────────────────────────────────
  const bulkChangeStatus = useCallback(
    (ids: string[], status: EquipmentStatus) => {
      const prev = equipment;
      pushUndo(`${ids.length} items → ${status}`, prev, logs);
      const now = new Date().toISOString();
      setEquipment((items) =>
        items.map((e) =>
          ids.includes(e.id) ? { ...e, status, updatedAt: now } : e
        )
      );
      setSelected(new Set());
    },
    [equipment, logs, pushUndo]
  );

  const bulkDelete = useCallback(
    (ids: string[]) => {
      const prev = equipment;
      const prevLogs = logs;
      const safe = ids.filter((id) => {
        const e = equipment.find((x) => x.id === id);
        return e && e.status !== "In Use";
      });
      pushUndo(`${safe.length} items deleted`, prev, prevLogs);
      setEquipment((items) => items.filter((e) => !safe.includes(e.id)));
      setLogs((l) => l.filter((log) => !safe.includes(log.equipmentId)));
      if (activeId && safe.includes(activeId)) setActiveId(null);
      setSelected(new Set());
      return safe.length;
    },
    [equipment, logs, pushUndo, activeId]
  );

  // ── Maintenance logs ────────────────────────────────────────────────────────
  const addLog = useCallback(
    (entry: Omit<MaintenanceLog, "id" | "createdAt">) => {
      const newLog: MaintenanceLog = {
        ...entry,
        id: newId("log"),
        createdAt: new Date().toISOString(),
      };
      setLogs((prev) => [...prev, newLog]);
    },
    []
  );

  const deleteLog = useCallback(
    (logId: string) => {
      const prev = equipment;
      const prevLogs = logs;
      pushUndo("Log entry deleted", prev, prevLogs);
      setLogs((l) => l.filter((log) => log.id !== logId));
    },
    [equipment, logs, pushUndo]
  );

  const logsFor = useCallback(
    (id: string) =>
      logs
        .filter((l) => l.equipmentId === id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [logs]
  );

  // ── Selection ───────────────────────────────────────────────────────────────
  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(
    (ids: string[]) => setSelected(new Set(ids)),
    []
  );

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  // ── Reset ───────────────────────────────────────────────────────────────────
  const resetData = useCallback(() => {
    resetStorage();
    const fresh = loadEquipment();
    const freshLogs = loadLogs();
    setEquipment(fresh);
    setLogs(freshLogs);
    setActiveId(null);
    setSelected(new Set());
    setUndoStack(null);
  }, []);

  // ── Delete all (non-In-Use) ─────────────────────────────────────────────────
  const deleteAll = useCallback(() => {
    const prev = equipment;
    const prevLogs = logs;
    const toDelete = equipment.filter((e) => e.status !== "In Use").map((e) => e.id);
    pushUndo(`${toDelete.length} items deleted`, prev, prevLogs);
    setEquipment((items) => items.filter((e) => e.status === "In Use"));
    setLogs((l) => l.filter((log) => !toDelete.includes(log.equipmentId)));
    if (activeId && toDelete.includes(activeId)) setActiveId(null);
    setSelected(new Set());
  }, [equipment, logs, pushUndo, activeId]);

  // ── CSV ─────────────────────────────────────────────────────────────────────
  const doExport = useCallback(() => {
    exportCsv(visible, logs);
  }, [visible, logs]);

  return {
    equipment,
    logs,
    visible,
    paged,
    filters,
    setFilters,
    sort,
    toggleSort,
    resetFilters,
    selected,
    toggleSelect,
    selectAll,
    clearSelection,
    activeId,
    setActiveId,
    undoStack,
    doUndo,
    hydrated,
    // Pagination
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    // CRUD
    addEquipment,
    updateEquipment,
    deleteEquipment,
    retireEquipment,
    changeStatus,
    // Bulk
    bulkChangeStatus,
    bulkDelete,
    deleteAll,
    // Logs
    addLog,
    deleteLog,
    logsFor,
    // Misc
    resetData,
    doExport,
  };
}

export type EquipmentStore = ReturnType<typeof useEquipment>;
