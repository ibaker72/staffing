"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity";

export async function uploadResume(candidateId: string, formData: FormData) {
  const file = formData.get("resume") as File;
  if (!file || file.size === 0) {
    throw new Error("No file selected.");
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error("File too large. Maximum size is 10MB.");
  }

  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!allowed.includes(file.type)) {
    throw new Error("Invalid file type. Please upload a PDF or Word document.");
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "pdf";
  const path = `${candidateId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    console.error("[uploadResume] Storage error:", uploadError.message);
    throw new Error("Failed to upload resume. Please try again.");
  }

  const { data: urlData } = supabase.storage
    .from("resumes")
    .getPublicUrl(path);

  const resumeUrl = urlData?.publicUrl ?? path;

  const { error: updateError } = await supabase
    .from("candidates")
    .update({ resume_url: resumeUrl })
    .eq("id", candidateId);

  if (updateError) {
    console.error("[uploadResume] DB update error:", updateError.message);
    throw new Error("File uploaded but failed to link to candidate.");
  }

  await logActivity("candidate", candidateId, "resume_upload",
    `Resume uploaded: ${file.name}`,
    { filename: file.name, size: file.size, type: file.type }
  );

  revalidatePath(`/candidates/${candidateId}`);
  revalidatePath("/candidates");

  return { url: resumeUrl };
}

export async function deleteResume(candidateId: string, resumeUrl: string) {
  const supabase = await createClient();

  // Extract the storage path from the URL
  const pathMatch = resumeUrl.match(/resumes\/(.+)$/);
  if (pathMatch) {
    await supabase.storage.from("resumes").remove([pathMatch[1]]);
  }

  const { error } = await supabase
    .from("candidates")
    .update({ resume_url: null })
    .eq("id", candidateId);

  if (error) {
    console.error("[deleteResume] DB update error:", error.message);
    throw new Error("Failed to remove resume link.");
  }

  await logActivity("candidate", candidateId, "resume_upload", "Resume removed");

  revalidatePath(`/candidates/${candidateId}`);
  revalidatePath("/candidates");
}
