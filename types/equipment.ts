export type EquipmentCategory =
  | "Excavator"
  | "Scissor Lift"
  | "Generator"
  | "Compressor"
  | "Drill"
  | "Truck"
  | "Other";

export type EquipmentStatus =
  | "Available"
  | "In Use"
  | "Out for Repair"
  | "Retired";

export type Ownership = "Owned" | "Rented";

export type SortField =
  | "name"
  | "assetNumber"
  | "category"
  | "ownership"
  | "status"
  | "hourlyRate"
  | "dailyRate"
  | "replacementCost"
  | "leaseExpiry"
  | "updatedAt";

export type SortDir = "asc" | "desc";

export interface Equipment {
  id: string;
  name: string;
  assetNumber: string; // unique
  serialNumber: string;
  category: EquipmentCategory;
  ownership: Ownership;
  status: EquipmentStatus;
  hourlyRate: number;
  dailyRate: number;
  replacementCost: number;
  leaseExpiry?: string; // ISO date YYYY-MM-DD, rented items only
  photoUrl?: string | null; // base64 data URL
  notes: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface MaintenanceLog {
  id: string;
  equipmentId: string;
  date: string; // YYYY-MM-DD
  cost: number;
  notes: string;
  createdAt: string;
}

export interface FilterState {
  query: string;
  category: EquipmentCategory | "";
  status: EquipmentStatus | "";
  ownership: Ownership | "";
}

export interface SortState {
  field: SortField;
  dir: SortDir;
}

export const CATEGORIES: EquipmentCategory[] = [
  "Excavator",
  "Scissor Lift",
  "Generator",
  "Compressor",
  "Drill",
  "Truck",
  "Other",
];

export const STATUSES: EquipmentStatus[] = [
  "Available",
  "In Use",
  "Out for Repair",
  "Retired",
];

export const STATUS_META: Record<
  EquipmentStatus,
  { label: string; color: string; dot: string }
> = {
  Available: {
    label: "Available",
    color: "text-emerald-700 bg-emerald-50 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  "In Use": {
    label: "In Use",
    color: "text-blue-700 bg-blue-50 ring-blue-200",
    dot: "bg-blue-500",
  },
  "Out for Repair": {
    label: "Out for Repair",
    color: "text-amber-700 bg-amber-50 ring-amber-200",
    dot: "bg-amber-500",
  },
  Retired: {
    label: "Retired",
    color: "text-stone-500 bg-stone-100 ring-stone-200",
    dot: "bg-stone-400",
  },
};
