"use client";

import { useState, useTransition } from "react";

interface ExportButtonProps {
  label?: string;
  fileName: string;
  exportAction: () => Promise<string>;
  className?: string;
}

export function ExportButton({ label = "Export CSV", fileName, exportAction, className }: ExportButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleExport() {
    setError(null);
    startTransition(async () => {
      try {
        const csv = await exportAction();
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Export failed");
      }
    });
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={handleExport}
        disabled={isPending}
        className={className ?? "inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        {isPending ? "Exporting..." : label}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

interface TemplateDownloadProps {
  label?: string;
  fileName: string;
  templateAction: () => Promise<string>;
}

export function TemplateDownloadButton({ label = "Download Template", fileName, templateAction }: TemplateDownloadProps) {
  const [isPending, startTransition] = useTransition();

  function handleDownload() {
    startTransition(async () => {
      const csv = await templateAction();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
      {isPending ? "Downloading..." : label}
    </button>
  );
}
