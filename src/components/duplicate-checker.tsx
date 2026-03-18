"use client";

import { useState, useEffect } from "react";
import { DuplicateWarningPanel } from "./duplicate-warning";
import type { DuplicateWarning } from "@/actions/duplicates";
import { checkCompanyDuplicate, checkCandidateDuplicate, checkJobDuplicate } from "@/actions/duplicates";

// Debounced duplicate checker for company create form
export function CompanyDuplicateChecker({ name, location }: { name: string; location: string }) {
  const [warnings, setWarnings] = useState<DuplicateWarning[]>([]);

  useEffect(() => {
    if (name.length < 3) { setWarnings([]); return; }
    const timer = setTimeout(async () => {
      const result = await checkCompanyDuplicate(name, location || undefined);
      setWarnings(result);
    }, 500);
    return () => clearTimeout(timer);
  }, [name, location]);

  return <DuplicateWarningPanel warnings={warnings} entityType="company" />;
}

export function CandidateDuplicateChecker({ email, phone }: { email: string; phone: string }) {
  const [warnings, setWarnings] = useState<DuplicateWarning[]>([]);

  useEffect(() => {
    if (!email && !phone) { setWarnings([]); return; }
    if (email && email.length < 5) { setWarnings([]); return; }
    const timer = setTimeout(async () => {
      const result = await checkCandidateDuplicate(email || undefined, phone || undefined);
      setWarnings(result);
    }, 500);
    return () => clearTimeout(timer);
  }, [email, phone]);

  return <DuplicateWarningPanel warnings={warnings} entityType="candidate" />;
}

export function JobDuplicateChecker({ companyId, title, location }: { companyId: string; title: string; location: string }) {
  const [warnings, setWarnings] = useState<DuplicateWarning[]>([]);

  useEffect(() => {
    if (!companyId || title.length < 3) { setWarnings([]); return; }
    const timer = setTimeout(async () => {
      const result = await checkJobDuplicate(companyId, title, location || undefined);
      setWarnings(result);
    }, 500);
    return () => clearTimeout(timer);
  }, [companyId, title, location]);

  return <DuplicateWarningPanel warnings={warnings} entityType="job" />;
}
