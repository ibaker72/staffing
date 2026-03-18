"use client";

import { useEffect, useState } from "react";

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  children: React.ReactNode;
}

export function BulkActionBar({
  selectedCount,
  onClear,
  children,
}: BulkActionBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (selectedCount > 0) {
      // Small delay so the enter transition is visible
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [selectedCount]);

  if (selectedCount === 0) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 lg:left-60 z-40 transition-all duration-200 ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0"
      }`}
    >
      <div className="bg-zinc-900 text-white px-4 py-3 shadow-lg">
        <div className="mx-auto flex items-center justify-between gap-4 max-w-7xl">
          <span className="text-sm font-medium shrink-0">
            {selectedCount} selected
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            {children}
          </div>

          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
