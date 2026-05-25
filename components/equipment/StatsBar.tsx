import { Equipment, MaintenanceLog } from "@/types/equipment";
import { fmtCurrency } from "@/lib/utils";

interface StatsBarProps {
  equipment: Equipment[];
  logs: MaintenanceLog[];
}

export function StatsBar({ equipment, logs: _logs }: StatsBarProps) {
  const available = equipment.filter((e) => e.status === "Available").length;
  const inUse = equipment.filter((e) => e.status === "In Use").length;
  const repair = equipment.filter((e) => e.status === "Out for Repair").length;
  const fleetValue = equipment.reduce((s, e) => s + e.replacementCost, 0);
  const availableDaily = equipment
    .filter((e) => e.status === "Available")
    .reduce((s, e) => s + e.dailyRate, 0);

  return (
    <div className="grid grid-cols-5 gap-3">
      <Card
        label="Total Fleet"
        value={String(equipment.length)}
        sub={`${new Set(equipment.map((e) => e.category)).size} categories`}
        accent="text-orange-600"
      />
      <Card
        label="Available"
        value={String(available)}
        sub="ready to deploy"
        accent="text-emerald-600"
      />
      <Card
        label="In Use"
        value={String(inUse)}
        sub="on site now"
        accent="text-blue-600"
      />
      <Card
        label="Out for Repair"
        value={String(repair)}
        sub="unavailable"
        accent="text-amber-600"
      />
      <Card
        label="Fleet Value"
        value={`$${(fleetValue / 1000).toFixed(0)}k`}
        sub={`${fmtCurrency(availableDaily)}/day available`}
        accent="text-stone-800"
        small
      />
    </div>
  );
}

function Card({
  label,
  value,
  sub,
  accent,
  small,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1">
        {label}
      </p>
      <p
        className={`font-bold tracking-tight leading-none ${accent} ${small ? "text-xl" : "text-3xl"}`}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] text-stone-400">{sub}</p>
    </div>
  );
}
