"use client";

import { useState } from "react";
import { X, Lightbulb } from "lucide-react";

const SUGGESTIONS = [
  {
    category: "Assignment & Tracking",
    color: "bg-blue-50 border-blue-200 text-blue-800",
    dot: "bg-blue-500",
    ideas: [
      { title: "Project assignment", desc: "Link equipment to jobs — see what's deployed where and track utilization %" },
      { title: "Employee assignment", desc: "Assign equipment to specific operators with drag-and-drop" },
      { title: "QR code per asset", desc: "Scan on-site to instantly open the detail panel on mobile" },
    ],
  },
  {
    category: "Maintenance & Compliance",
    color: "bg-amber-50 border-amber-200 text-amber-800",
    dot: "bg-amber-500",
    ideas: [
      { title: "Scheduled service reminders", desc: "Set service intervals (e.g. every 250 hrs) and get alerts when due" },
      { title: "DOT / inspection due dates", desc: "Track annual inspections with expiry alerts like lease dates" },
      { title: "Operator certification tracking", desc: "Log which employees hold valid certs for each equipment type" },
    ],
  },
  {
    category: "Reporting & Export",
    color: "bg-emerald-50 border-emerald-200 text-emerald-800",
    dot: "bg-emerald-500",
    ideas: [
      { title: "PDF report per asset", desc: "Generate a maintenance history report for insurance or resale" },
      { title: "Fleet utilization dashboard", desc: "Charts showing Available vs In Use vs Repair over time" },
      { title: "Cost per project report", desc: "Roll up equipment billing rates across all items on a job" },
    ],
  },
  {
    category: "Infrastructure",
    color: "bg-violet-50 border-violet-200 text-violet-800",
    dot: "bg-violet-500",
    ideas: [
      { title: "Multi-user with roles", desc: "Admin (full CRUD) vs Viewer (read-only) for field crew" },
      { title: "Audit log", desc: "Who changed what and when — full history per item" },
      { title: "Offline-first PWA", desc: "Service worker so field staff can look up equipment with spotty connectivity" },
    ],
  },
];

const STORAGE_KEY = "fc_suggestions_dismissed";

export function SuggestionsCard() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "1";
  });

  if (dismissed) return null;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-stone-100 px-4 py-3">
        <div className="flex size-6 items-center justify-center rounded-md bg-orange-100 text-orange-600">
          <Lightbulb size={13} />
        </div>
        <p className="flex-1 text-[12px] font-bold text-stone-800">
          What could be added next
        </p>
        <button
          onClick={() => {
            setDismissed(true);
            localStorage.setItem(STORAGE_KEY, "1");
          }}
          className="flex size-6 items-center justify-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
          title="Dismiss"
        >
          <X size={12} />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-stone-100">
        {SUGGESTIONS.map((group) => (
          <div key={group.category} className="p-4">
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className={`size-1.5 rounded-full ${group.dot}`} />
              <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">
                {group.category}
              </p>
            </div>
            <ul className="space-y-2">
              {group.ideas.map((idea) => (
                <li key={idea.title}>
                  <p className="text-[11px] font-semibold text-stone-800">
                    {idea.title}
                  </p>
                  <p className="text-[10px] text-stone-500 leading-relaxed">
                    {idea.desc}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
