"use client";

import { useState, useEffect, useRef } from "react";
import { Equipment, CATEGORIES, STATUSES } from "@/types/equipment";
import { Modal } from "@/components/ui/Modal";
import { EquipmentStore } from "@/hooks/useEquipment";

interface EquipmentFormProps {
  open: boolean;
  onClose: () => void;
  editItem?: Equipment | null;
  store: EquipmentStore;
}

type FormData = {
  name: string;
  assetNumber: string;
  serialNumber: string;
  category: string;
  ownership: string;
  status: string;
  hourlyRate: string;
  dailyRate: string;
  replacementCost: string;
  leaseExpiry: string;
  notes: string;
};

const EMPTY: FormData = {
  name: "",
  assetNumber: "",
  serialNumber: "",
  category: "Excavator",
  ownership: "Owned",
  status: "Available",
  hourlyRate: "",
  dailyRate: "",
  replacementCost: "",
  leaseExpiry: "",
  notes: "",
};

export function EquipmentForm({
  open,
  onClose,
  editItem,
  store,
}: EquipmentFormProps) {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const [photoData, setPhotoData] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editItem) {
      setForm({
        name: editItem.name,
        assetNumber: editItem.assetNumber,
        serialNumber: editItem.serialNumber,
        category: editItem.category,
        ownership: editItem.ownership,
        status: editItem.status,
        hourlyRate: editItem.hourlyRate ? String(editItem.hourlyRate) : "",
        dailyRate: editItem.dailyRate ? String(editItem.dailyRate) : "",
        replacementCost: editItem.replacementCost
          ? String(editItem.replacementCost)
          : "",
        leaseExpiry: editItem.leaseExpiry ?? "",
        notes: editItem.notes,
      });
      setPhotoData(editItem.photoUrl ?? null);
    } else {
      setForm(EMPTY);
      setPhotoData(null);
    }
    setErrors({});
  }, [open, editItem]);

  function set(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.assetNumber.trim()) errs.assetNumber = "Asset # is required";
    else {
      const dup = store.equipment.find(
        (e) =>
          e.assetNumber.toLowerCase() === form.assetNumber.trim().toLowerCase() &&
          e.id !== editItem?.id
      );
      if (dup) errs.assetNumber = `Already used by "${dup.name}"`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const payload = {
      name: form.name.trim(),
      assetNumber: form.assetNumber.trim(),
      serialNumber: form.serialNumber.trim(),
      category: form.category as Equipment["category"],
      ownership: form.ownership as Equipment["ownership"],
      status: form.status as Equipment["status"],
      hourlyRate: parseFloat(form.hourlyRate) || 0,
      dailyRate: parseFloat(form.dailyRate) || 0,
      replacementCost: parseFloat(form.replacementCost) || 0,
      leaseExpiry:
        form.ownership === "Rented" && form.leaseExpiry
          ? form.leaseExpiry
          : undefined,
      photoUrl: photoData,
      notes: form.notes.trim(),
    };

    if (editItem) {
      store.updateEquipment(editItem.id, payload);
    } else {
      const newItem = store.addEquipment(payload);
      store.setActiveId(newItem.id);
    }
    onClose();
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Photo must be under 2 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoData(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  const F = ({ label, error, required, children }: {
    label: string; error?: string; required?: boolean; children: React.ReactNode;
  }) => (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
        {label}{required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {error && <span className="text-[10px] font-semibold text-red-600">{error}</span>}
    </div>
  );

  const inputCls = (err?: string) =>
    `h-9 w-full rounded-lg border px-3 text-sm text-stone-900 outline-none transition
     ${err ? "border-red-400 bg-red-50 focus:border-red-500" : "border-stone-200 bg-stone-50 focus:border-orange-400 focus:bg-white"}`;

  const selCls = inputCls();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editItem ? "Edit Equipment" : "Add Equipment"}
      subtitle={editItem ? editItem.name : "Fill in details for the new item"}
      size="lg"
      footer={
        <>
          <button
            onClick={onClose}
            className="h-9 rounded-lg border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="h-9 rounded-lg bg-orange-600 px-5 text-sm font-bold text-white hover:bg-orange-700 transition-colors"
          >
            {editItem ? "Save Changes" : "Add Equipment"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {/* Name — full width */}
        <div className="col-span-2">
          <F label="Name" required error={errors.name}>
            <input
              className={inputCls(errors.name)}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Main Street Excavator"
              autoFocus
            />
          </F>
        </div>

        <F label="Asset Number" required error={errors.assetNumber}>
          <input
            className={inputCls(errors.assetNumber) + " font-mono"}
            value={form.assetNumber}
            onChange={(e) => set("assetNumber", e.target.value)}
            placeholder="EXC-1001"
          />
        </F>

        <F label="Serial Number">
          <input
            className={inputCls() + " font-mono"}
            value={form.serialNumber}
            onChange={(e) => set("serialNumber", e.target.value)}
            placeholder="SN-EXC-44821"
          />
        </F>

        <F label="Category" required>
          <select
            className={selCls}
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </F>

        <F label="Ownership" required>
          <select
            className={selCls}
            value={form.ownership}
            onChange={(e) => set("ownership", e.target.value)}
          >
            <option>Owned</option>
            <option>Rented</option>
          </select>
        </F>

        <F label="Status" required>
          <select
            className={selCls}
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </F>

        {form.ownership === "Rented" && (
          <F label="Lease Expiry Date">
            <input
              type="date"
              className={inputCls()}
              value={form.leaseExpiry}
              onChange={(e) => set("leaseExpiry", e.target.value)}
            />
          </F>
        )}

        {/* Rates section header */}
        <div className="col-span-2 border-t border-stone-100 pt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Rates &amp; Valuation
          </span>
        </div>

        <F label="Hourly Rate ($)">
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputCls()}
            value={form.hourlyRate}
            onChange={(e) => set("hourlyRate", e.target.value)}
            placeholder="0.00"
          />
        </F>

        <F label="Daily Rate ($)">
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputCls()}
            value={form.dailyRate}
            onChange={(e) => set("dailyRate", e.target.value)}
            placeholder="0.00"
          />
        </F>

        <F label="Replacement Cost ($)">
          <input
            type="number"
            min="0"
            step="1"
            className={inputCls()}
            value={form.replacementCost}
            onChange={(e) => set("replacementCost", e.target.value)}
            placeholder="0"
          />
        </F>

        {/* Photo upload */}
        <div className="flex items-center gap-3">
          <div
            className="flex size-16 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 overflow-hidden cursor-pointer hover:border-orange-400 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {photoData ? (
              <img
                src={photoData}
                alt="preview"
                className="size-full object-cover"
              />
            ) : (
              <span className="text-xl text-stone-300">📷</span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="h-7 rounded-lg border border-stone-200 bg-white px-3 text-[11px] font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
            >
              {photoData ? "Change photo" : "Upload photo"}
            </button>
            {photoData && (
              <button
                type="button"
                onClick={() => setPhotoData(null)}
                className="h-7 rounded-lg border border-red-200 bg-red-50 px-3 text-[11px] font-semibold text-red-600 hover:bg-red-100 transition-colors"
              >
                Remove
              </button>
            )}
            <span className="text-[10px] text-stone-400">JPEG/PNG, max 2 MB</span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhoto}
          />
        </div>

        {/* Notes — full width */}
        <div className="col-span-2">
          <F label="Notes">
            <textarea
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-orange-400 focus:bg-white resize-none"
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Condition, operator requirements, storage location, project assignment…"
            />
          </F>
        </div>
      </div>
    </Modal>
  );
}
