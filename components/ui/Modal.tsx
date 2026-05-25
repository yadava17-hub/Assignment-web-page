"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = "md",
  children,
  footer,
}: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className={cn(
          "my-8 w-full rounded-2xl bg-white shadow-2xl ring-1 ring-stone-900/10 animate-in fade-in slide-in-from-top-4 duration-200",
          size === "sm" && "max-w-sm",
          size === "md" && "max-w-xl",
          size === "lg" && "max-w-2xl"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-0">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-stone-900">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-lg bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-stone-100 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
