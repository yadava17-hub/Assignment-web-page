import {
  Equipment,
  FilterState,
  SortState,
  MaintenanceLog,
} from "@/types/equipment";

// ── Filtering ─────────────────────────────────────────────────────────────────
function norm(s: string) {
  return s.trim().toLowerCase();
}

export function filterEquipment(
  items: Equipment[],
  f: FilterState
): Equipment[] {
  const q = norm(f.query);
  return items.filter((e) => {
    if (
      q &&
      !norm(e.name).includes(q) &&
      !norm(e.assetNumber).includes(q) &&
      !norm(e.serialNumber).includes(q)
    )
      return false;
    if (f.category && e.category !== f.category) return false;
    if (f.status && e.status !== f.status) return false;
    if (f.ownership && e.ownership !== f.ownership) return false;
    return true;
  });
}

// ── Sorting ───────────────────────────────────────────────────────────────────
export function sortEquipment(items: Equipment[], s: SortState): Equipment[] {
  return [...items].sort((a, b) => {
    const dir = s.dir === "asc" ? 1 : -1;
    const av = a[s.field as keyof Equipment] as string | number | undefined;
    const bv = b[s.field as keyof Equipment] as string | number | undefined;
    if (av == null && bv == null) return 0;
    if (av == null) return dir;
    if (bv == null) return -dir;
    if (typeof av === "number" && typeof bv === "number")
      return dir * (av - bv);
    return dir * String(av).localeCompare(String(bv));
  });
}

// ── Formatting ────────────────────────────────────────────────────────────────
export function fmtCurrency(n: number): string {
  if (n === 0) return "—";
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
}

export function fmtTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Lease helpers ─────────────────────────────────────────────────────────────
export function leaseDaysLeft(leaseExpiry: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil(
    (new Date(leaseExpiry).getTime() - today.getTime()) / 86_400_000
  );
}

export type LeaseUrgency = "ok" | "warn" | "urgent" | "overdue";

export function leaseUrgency(days: number): LeaseUrgency {
  if (days < 0) return "overdue";
  if (days <= 7) return "urgent";
  if (days <= 30) return "warn";
  return "ok";
}

export function getExpiringLeases(
  items: Equipment[]
): Array<{ item: Equipment; days: number }> {
  return items
    .filter((e) => e.ownership === "Rented" && e.leaseExpiry)
    .map((e) => ({ item: e, days: leaseDaysLeft(e.leaseExpiry!) }))
    .filter(({ days }) => days <= 30)
    .sort((a, b) => a.days - b.days);
}

// ── Maintenance / TCO ─────────────────────────────────────────────────────────
export function totalMaintenance(logs: MaintenanceLog[], eqId: string): number {
  return logs
    .filter((l) => l.equipmentId === eqId)
    .reduce((sum, l) => sum + l.cost, 0);
}

export function maintenanceRatio(
  totalMaint: number,
  replacementCost: number
): number {
  if (replacementCost <= 0) return 0;
  return Math.min((totalMaint / replacementCost) * 100, 100);
}

export function daysToRecoup(totalMaint: number, dailyRate: number): string {
  if (!dailyRate) return "N/A";
  return Math.ceil(totalMaint / dailyRate) + " days";
}

// ── ID generation ─────────────────────────────────────────────────────────────
export function newId(prefix = "eq") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── CSV export ────────────────────────────────────────────────────────────────
export function exportCsv(items: Equipment[], logs: MaintenanceLog[]): void {
  const headers = [
    "Name",
    "Asset #",
    "Serial #",
    "Category",
    "Ownership",
    "Status",
    "Hourly Rate",
    "Daily Rate",
    "Replacement Cost",
    "Lease Expiry",
    "Maint. Entries",
    "Total Maint. Cost",
    "Notes",
    "Last Updated",
  ];
  const rows = items.map((e) => {
    const eqLogs = logs.filter((l) => l.equipmentId === e.id);
    const totalM = eqLogs.reduce((s, l) => s + l.cost, 0);
    return [
      `"${e.name.replace(/"/g, '""')}"`,
      e.assetNumber,
      e.serialNumber,
      e.category,
      e.ownership,
      e.status,
      e.hourlyRate,
      e.dailyRate,
      e.replacementCost,
      e.leaseExpiry ?? "",
      eqLogs.length,
      totalM,
      `"${e.notes.replace(/"/g, '""')}"`,
      e.updatedAt,
    ].join(",");
  });
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fleet-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
