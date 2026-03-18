"use client";

import { useState, useCallback, useTransition } from "react";
import { BulkActionBar } from "./bulk-action-bar";

interface SelectableListProps<T extends { id: string }> {
  items: T[];
  renderItem: (
    item: T,
    isSelected: boolean,
    onToggle: () => void
  ) => React.ReactNode;
  actions: (
    selectedIds: string[],
    clearSelection: () => void,
    isPending: boolean,
    startTransition: (fn: () => void) => void
  ) => React.ReactNode;
  className?: string;
}

export function SelectableList<T extends { id: string }>({
  items,
  renderItem,
  actions,
  className = "",
}: SelectableListProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const toggleItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === items.length) {
        return new Set();
      }
      return new Set(items.map((item) => item.id));
    });
  }, [items]);

  const selectedArray = Array.from(selectedIds);
  const allSelected = items.length > 0 && selectedIds.size === items.length;

  return (
    <>
      {items.length > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
          />
          <span className="text-sm text-zinc-500">
            {allSelected ? "Deselect all" : "Select all"}
          </span>
        </div>
      )}

      <div className={className}>
        {items.map((item) =>
          renderItem(item, selectedIds.has(item.id), () => toggleItem(item.id))
        )}
      </div>

      <BulkActionBar selectedCount={selectedIds.size} onClear={clearSelection}>
        {actions(selectedArray, clearSelection, isPending, startTransition)}
      </BulkActionBar>
    </>
  );
}
