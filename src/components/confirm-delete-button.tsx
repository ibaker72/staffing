"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function ConfirmDeleteButton({
  action,
  hiddenFields,
  label = "×",
  title = "Delete item?",
  description = "This action cannot be undone.",
  confirmLabel = "Delete",
  className = "",
}: {
  action: (formData: FormData) => Promise<void>;
  hiddenFields: Record<string, string>;
  label?: string;
  title?: string;
  description?: string;
  confirmLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className={`text-xs px-2 py-1 text-red-500 hover:text-red-700 ${className}`}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <ConfirmDialog
        open={open}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        variant="danger"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          formRef.current?.requestSubmit();
        }}
      />
      <form ref={formRef} action={action} className="hidden">
        {Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      </form>
    </>
  );
}
