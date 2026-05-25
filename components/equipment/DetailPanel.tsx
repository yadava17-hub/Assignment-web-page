"use client";

import { useState } from "react";
import {
  X,
  Pencil,
  Archive,
  Trash2,
  Camera,
  Plus,
  Minus,
} from "lucide-react";
import { Equipment, STATUSES, CATEGORIES, STATUS_META } from "@/types/equipment";
import { StatusBadge, CategoryBadge, OwnershipBadge } from "@/components/ui/Badge";
import {
  fmtCurrency,
  fmtDate,
  fmtTimestamp,
  leaseDaysLeft,
  leaseUrgency,
  totalMaintenance,
  maintenanceRatio,
  daysToRecoup,
} from "@/lib/utils";
import { EquipmentStore } from "@/hooks/useEquipment";
import { cn } from "@/lib/cn";

interface DetailPanelProps {
  item: Equipment;
  store: EquipmentStore;
  onEdit: () => void;
  onDelete: () => void;
  onRetire: () => void;
}

const LEASE_PILL = {
  overdue: "bg-red-100 text-red-700 ring-1 ring-red-200",
  urgent: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  warn: "bg-orange-100 text-orange-700 ring-1 ring-orange-200",
  ok: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
};

export function DetailPanel({ item, store, onEdit, onDelete, onRetire }: DetailPanelProps) {
  const { setActiveId, updateEquipment, logsFor, addLog, deleteLog } = store;
  const [logOpen, setLogOpen] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [logCost, setLogCost] = useState("");
  const [logNotes, setLogNotes] = useState("");
  const [logErr, setLogErr] = useState("");

  // Inline editing state
  const [editingField, setEditingField] = useState<string | null>(null);

  const logs = logsFor(item.id).sort((a, b) => b.date.localeCompare(a.date));
  const totalM = totalMaintenance(store.logs, item.id);
  const pct = maintenanceRatio(totalM, item.replacementCost);

  const days = item.leaseExpiry ? leaseDaysLeft(item.leaseExpiry) : null;
  const urg = days !== null ? leaseUrgency(days) : null;

  function saveField<K extends keyof Equipment>(field: K, value: Equipment[K]) {
    updateEquipment(item.id, { [field]: value } as Partial<Equipment>);
    setEditingField(null);
  }

  function handleAddLog() {
    if (!logDate || !logNotes.trim()) {
      setLogErr("Date and notes are required");
      return;
    }
    addLog({
      equipmentId: item.id,
      date: logDate,
      cost: parseFloat(logCost) || 0,
      notes: logNotes.trim(),
    });
    setLogOpen(false);
    setLogDate(new Date().toISOString().split("T")[0]);
    setLogCost("");
    setLogNotes("");
    setLogErr("");
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("Max 2 MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => updateEquipment(item.id, { photoUrl: ev.target?.result as string });
    reader.readAsDataURL(file);
  }

  const Sec = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border-b border-stone-100 px-4 py-3">
      <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-stone-400">{title}</p>
      {children}
    </div>
  );

  const Field = ({ label, children, editBtn }: { label: string; children: React.ReactNode; editBtn?: React.ReactNode }) => (
    <div className="mb-2 last:mb-0">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">{label}</span>
        {editBtn}
      </div>
      <div className="mt-0.5">{children}</div>
    </div>
  );

  const InlineSelect = ({ field, options, current }: {
    field: keyof Equipment;
    options: readonly string[];
    current: string;
  }) => (
    editingField === field ? (
      <div className="mt-1 flex items-center gap-2">
        <select
          autoFocus
          defaultValue={current}
          onChange={(e) => saveField(field, e.target.value as Equipment[typeof field])}
          className="h-8 flex-1 rounded-lg border border-orange-300 bg-white px-2 text-sm outline-none focus:ring-2 focus:ring-orange-200"
        >
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
        <button onClick={() => setEditingField(null)} className="text-xs text-stone-400 hover:text-stone-600">✕</button>
      </div>
    ) : null
  );

  return (
    <aside className="flex h-full w-[360px] shrink-0 flex-col overflow-y-auto border-l border-stone-200 bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-start gap-2 border-b border-stone-100 bg-white px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-stone-900">{item.name}</p>
          <p className="font-mono text-[10px] text-stone-400">
            {item.assetNumber} · {item.serialNumber || "—"}
          </p>
          <p className="text-[9px] text-stone-400 mt-0.5">
            Updated {fmtTimestamp(item.updatedAt)}
          </p>
        </div>
        <button
          onClick={() => setActiveId(null)}
          className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      {/* Photo */}
      <div className="relative border-b border-stone-100">
        {item.photoUrl ? (
          <div className="relative h-32">
            <img src={item.photoUrl} alt={item.name} className="h-full w-full object-cover" />
            <button
              onClick={() => updateEquipment(item.id, { photoUrl: null })}
              className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
            >
              <X size={11} />
            </button>
          </div>
        ) : (
          <label className="flex h-20 cursor-pointer items-center justify-center gap-2 bg-stone-50 hover:bg-stone-100 transition-colors">
            <Camera size={16} className="text-stone-400" />
            <span className="text-xs text-stone-400">Upload photo</span>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </label>
        )}
      </div>

      {/* Status & Classification */}
      <Sec title="Status & Classification">
        <Field
          label="Status"
          editBtn={
            <button
              onClick={() => setEditingField(editingField === "status" ? null : "status")}
              className="text-[9px] font-semibold text-orange-600 hover:text-orange-700"
            >
              ✎ Change
            </button>
          }
        >
          <StatusBadge status={item.status} />
          <InlineSelect field="status" options={STATUSES} current={item.status} />
        </Field>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <Field
            label="Category"
            editBtn={
              <button onClick={() => setEditingField(editingField === "category" ? null : "category")} className="text-[9px] font-semibold text-orange-600 hover:text-orange-700">✎</button>
            }
          >
            <CategoryBadge category={item.category} />
            <InlineSelect field="category" options={CATEGORIES} current={item.category} />
          </Field>
          <Field
            label="Ownership"
            editBtn={
              <button onClick={() => setEditingField(editingField === "ownership" ? null : "ownership")} className="text-[9px] font-semibold text-orange-600 hover:text-orange-700">✎</button>
            }
          >
            <OwnershipBadge ownership={item.ownership} />
            <InlineSelect field="ownership" options={["Owned", "Rented"]} current={item.ownership} />
          </Field>
        </div>

        {/* Lease expiry */}
        <Field
          label={`Lease Expiry${days !== null && urg ? ` — ${days < 0 ? Math.abs(days) + "d overdue" : days + "d left"}` : ""}`}
          editBtn={
            <button
              onClick={() => setEditingField(editingField === "leaseExpiry" ? null : "leaseExpiry")}
              className="text-[9px] font-semibold text-orange-600 hover:text-orange-700"
            >
              {item.leaseExpiry ? "✎ Change" : "+ Set date"}
            </button>
          }
        >
          {item.leaseExpiry && days !== null && urg ? (
            <div className="flex items-center gap-2">
              <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold font-mono", LEASE_PILL[urg])}>
                {fmtDate(item.leaseExpiry)}
              </span>
              <button
                onClick={() => saveField("leaseExpiry", undefined as unknown as string)}
                className="text-[9px] text-red-500 hover:text-red-700"
              >
                ✕ Clear
              </button>
            </div>
          ) : (
            <span className="text-[11px] text-stone-400">No lease date set</span>
          )}
          {editingField === "leaseExpiry" && (
            <div className="mt-1 flex items-center gap-2">
              <input
                type="date"
                autoFocus
                defaultValue={item.leaseExpiry ?? ""}
                className="h-8 flex-1 rounded-lg border border-orange-300 bg-white px-2 text-sm outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveField("leaseExpiry", (e.target as HTMLInputElement).value || undefined as unknown as string);
                  if (e.key === "Escape") setEditingField(null);
                }}
              />
              <button
                onClick={(e) => {
                  const inp = (e.currentTarget.previousSibling as HTMLInputElement);
                  saveField("leaseExpiry", inp.value || undefined as unknown as string);
                }}
                className="h-8 rounded-lg bg-orange-600 px-3 text-[11px] font-bold text-white hover:bg-orange-700"
              >
                Save
              </button>
              <button onClick={() => setEditingField(null)} className="text-xs text-stone-400">✕</button>
            </div>
          )}
        </Field>
      </Sec>

      {/* Rates */}
      <Sec title="Rates (click to edit)">
        <div className="grid grid-cols-3 gap-2">
          {(["hourlyRate", "dailyRate", "replacementCost"] as const).map((field) => {
            const labels = { hourlyRate: "Hourly", dailyRate: "Daily", replacementCost: "Replacement" };
            const suffix = field === "hourlyRate" ? "/hr" : field === "dailyRate" ? "/day" : "";
            return (
              <div
                key={field}
                onClick={() => setEditingField(editingField === field ? null : field)}
                className={cn(
                  "cursor-pointer rounded-xl border p-2 text-center transition-colors",
                  editingField === field ? "border-orange-400 bg-orange-50" : "border-stone-200 bg-stone-50 hover:border-orange-300 hover:bg-orange-50/50"
                )}
              >
                <p className="text-[8px] font-bold uppercase tracking-wider text-stone-400 mb-1">{labels[field]}</p>
                {editingField === field ? (
                  <input
                    type="number"
                    min="0"
                    step={field === "replacementCost" ? "1" : "0.01"}
                    autoFocus
                    defaultValue={item[field] || ""}
                    className="w-full rounded border border-orange-300 bg-white px-1 py-0.5 text-center text-[11px] font-mono outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveField(field, parseFloat((e.target as HTMLInputElement).value) || 0);
                      if (e.key === "Escape") setEditingField(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <p className="font-mono text-xs font-semibold text-stone-800">
                    {fmtCurrency(item[field] as number)}{suffix && <span className="text-stone-400">{suffix}</span>}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        {["hourlyRate", "dailyRate", "replacementCost"].includes(editingField ?? "") && (
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => setEditingField(null)} className="h-7 rounded-lg border border-stone-200 px-3 text-[11px] font-semibold text-stone-600 hover:bg-stone-50">Cancel</button>
            <button
              onClick={() => {
                const inp = document.querySelector(`input[type="number"]`) as HTMLInputElement;
                if (inp) saveField(editingField as keyof Equipment, parseFloat(inp.value) || 0);
              }}
              className="h-7 rounded-lg bg-orange-600 px-3 text-[11px] font-bold text-white hover:bg-orange-700"
            >
              Save
            </button>
          </div>
        )}
      </Sec>

      {/* TCO */}
      <Sec title="TCO Summary">
        <div className="space-y-1.5 rounded-xl bg-stone-50 p-3">
          <TcoRow label="Total maintenance" value={fmtCurrency(totalM)} warn={pct > 60} />
          <TcoRow label="Replacement cost" value={fmtCurrency(item.replacementCost)} />
          <TcoRow label="Maintenance ratio" value={item.replacementCost ? pct.toFixed(1) + "%" : "N/A"} warn={pct > 60} />
          <TcoRow label="Days to recoup" value={daysToRecoup(totalM, item.dailyRate)} />
          {item.replacementCost > 0 && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-200">
              <div
                className={cn("h-full rounded-full transition-all", pct > 60 ? "bg-red-500" : pct > 30 ? "bg-amber-500" : "bg-emerald-500")}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
      </Sec>

      {/* Notes */}
      <Sec title="Notes">
        {editingField === "notes" ? (
          <div className="flex flex-col gap-2">
            <textarea
              autoFocus
              defaultValue={item.notes}
              rows={4}
              className="w-full rounded-lg border border-orange-300 bg-white px-3 py-2 text-sm outline-none resize-none"
              id="notes-ta"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingField(null)} className="h-7 rounded-lg border border-stone-200 px-3 text-[11px] font-semibold text-stone-600 hover:bg-stone-50">Cancel</button>
              <button
                onClick={() => {
                  const ta = document.getElementById("notes-ta") as HTMLTextAreaElement;
                  saveField("notes", ta.value.trim());
                }}
                className="h-7 rounded-lg bg-orange-600 px-3 text-[11px] font-bold text-white hover:bg-orange-700"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setEditingField("notes")}
            className={cn(
              "cursor-pointer rounded-lg p-2 text-[11px] leading-relaxed text-stone-700 transition-colors",
              item.notes ? "bg-stone-50 hover:bg-stone-100" : "bg-stone-50 text-stone-400 hover:bg-orange-50"
            )}
          >
            {item.notes || "Click to add notes…"}
          </div>
        )}
      </Sec>

      {/* Maintenance Log */}
      <div className="flex-1 px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
            Maintenance Log ({logs.length})
          </p>
          <button
            onClick={() => setLogOpen((o) => !o)}
            className="flex h-6 items-center gap-1 rounded-lg bg-orange-600 px-2.5 text-[10px] font-bold text-white hover:bg-orange-700 transition-colors"
          >
            <Plus size={10} /> Add
          </button>
        </div>

        {logOpen && (
          <div className="mb-3 rounded-xl border border-orange-200 bg-orange-50 p-3">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-stone-500">Date</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="mt-0.5 h-8 w-full rounded-lg border border-stone-200 bg-white px-2 text-[11px] outline-none focus:border-orange-400"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-stone-500">Cost ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={logCost}
                  onChange={(e) => setLogCost(e.target.value)}
                  placeholder="0.00"
                  className="mt-0.5 h-8 w-full rounded-lg border border-stone-200 bg-white px-2 text-[11px] outline-none focus:border-orange-400"
                />
              </div>
            </div>
            <textarea
              value={logNotes}
              onChange={(e) => setLogNotes(e.target.value)}
              placeholder="Describe the service performed…"
              rows={2}
              className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-[11px] outline-none focus:border-orange-400 resize-none"
            />
            {logErr && <p className="mt-1 text-[10px] text-red-600 font-semibold">{logErr}</p>}
            <div className="mt-2 flex justify-end gap-2">
              <button onClick={() => { setLogOpen(false); setLogErr(""); }} className="h-7 rounded-lg border border-stone-200 bg-white px-3 text-[11px] font-semibold text-stone-600 hover:bg-stone-50">Cancel</button>
              <button onClick={handleAddLog} className="h-7 rounded-lg bg-orange-600 px-3 text-[11px] font-bold text-white hover:bg-orange-700">Save Entry</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {logs.length === 0 && !logOpen && (
            <p className="py-4 text-center text-[11px] text-stone-400">No entries yet</p>
          )}
          {logs.map((log) => (
            <div key={log.id} className="relative rounded-xl border border-stone-100 bg-stone-50 p-2.5">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono text-[10px] text-stone-400">{fmtDate(log.date)}</span>
                <span className="font-mono text-[11px] font-bold text-orange-700">
                  {log.cost > 0 ? fmtCurrency(log.cost) : "—"}
                </span>
              </div>
              <p className="text-[11px] text-stone-700 leading-snug">{log.notes}</p>
              <button
                onClick={() => deleteLog(log.id)}
                className="absolute right-2 top-2 flex size-5 items-center justify-center rounded text-stone-300 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>

        {logs.length > 0 && (
          <div className="mt-2 flex items-center justify-between rounded-xl bg-stone-100 px-3 py-2">
            <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500">Total</span>
            <span className="font-mono text-sm font-bold text-stone-800">{fmtCurrency(totalM)}</span>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="sticky bottom-0 flex gap-2 border-t border-stone-100 bg-white p-3">
        <button
          onClick={onEdit}
          className="flex-1 h-8 rounded-lg bg-orange-600 text-[11px] font-bold text-white hover:bg-orange-700 transition-colors"
        >
          ✎ Full Edit
        </button>
        <button
          onClick={onRetire}
          disabled={item.status === "Retired"}
          className="h-8 rounded-lg border border-stone-200 px-3 text-[11px] font-semibold text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-40"
        >
          Archive
        </button>
        <button
          onClick={onDelete}
          className="h-8 rounded-lg border border-red-200 bg-red-50 px-3 text-[11px] font-semibold text-red-600 hover:bg-red-100 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </aside>
  );
}

function TcoRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-stone-500">{label}</span>
      <span className={cn("font-mono text-[11px] font-semibold", warn ? "text-amber-700" : "text-stone-700")}>
        {value}
      </span>
    </div>
  );
}
