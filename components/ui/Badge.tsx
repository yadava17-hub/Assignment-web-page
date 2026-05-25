import { EquipmentStatus, STATUS_META } from "@/types/equipment";
import { cn } from "@/lib/cn";

interface StatusBadgeProps {
  status: EquipmentStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium ring-1",
        meta.color,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      )}
    >
      <span className={cn("rounded-full", meta.dot, size === "sm" ? "size-1.5" : "size-2")} />
      {status}
    </span>
  );
}

interface CategoryBadgeProps {
  category: string;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <span className="inline-flex rounded px-2 py-0.5 text-[10px] font-semibold bg-stone-100 text-stone-600 ring-1 ring-stone-200">
      {category}
    </span>
  );
}

interface OwnershipBadgeProps {
  ownership: "Owned" | "Rented";
}

export function OwnershipBadge({ ownership }: OwnershipBadgeProps) {
  return ownership === "Rented" ? (
    <span className="inline-flex rounded px-2 py-0.5 text-[10px] font-semibold bg-orange-50 text-orange-700 ring-1 ring-orange-200">
      Rented
    </span>
  ) : (
    <span className="inline-flex rounded px-2 py-0.5 text-[10px] font-semibold bg-stone-100 text-stone-600 ring-1 ring-stone-200">
      Owned
    </span>
  );
}
