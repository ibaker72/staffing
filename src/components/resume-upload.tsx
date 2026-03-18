"use client";

import { useState } from "react";
import { uploadResume, deleteResume } from "@/actions/resume";
import { Button } from "@/components/ui/button";

export function ResumeUpload({
  candidateId,
  currentUrl,
}: {
  candidateId: string;
  currentUrl: string | null;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(formData: FormData) {
    setUploading(true);
    setError(null);
    try {
      await uploadResume(candidateId, formData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!currentUrl) return;
    setError(null);
    try {
      await deleteResume(candidateId, currentUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-3">
      {currentUrl ? (
        <div className="flex items-center gap-3">
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-900 underline truncate max-w-xs"
          >
            View Resume
          </a>
          <form action={handleDelete}>
            <Button type="submit" variant="ghost" className="text-xs text-red-600">
              Remove
            </Button>
          </form>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">No resume uploaded yet.</p>
      )}

      <form action={handleUpload}>
        <div className="flex items-center gap-3">
          <input
            type="file"
            name="resume"
            accept=".pdf,.doc,.docx"
            className="block text-sm text-zinc-500 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
          />
          <Button type="submit" variant="secondary" className="text-xs" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </form>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
