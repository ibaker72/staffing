"use client";

import { useState, useCallback, useRef } from "react";
import { parseCSV } from "@/lib/csv-parser";
import {
  checkCompanyDuplicates,
  checkCandidateDuplicates,
  checkJobDuplicates,
  importCompanies,
  importCandidates,
  importJobs,
} from "@/actions/import";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EntityType = "companies" | "candidates" | "jobs";

interface FieldDef {
  key: string;
  label: string;
  required: boolean;
}

const FIELD_DEFS: Record<EntityType, FieldDef[]> = {
  companies: [
    { key: "name", label: "Name", required: true },
    { key: "website", label: "Website", required: false },
    { key: "industry", label: "Industry", required: false },
    { key: "location", label: "Location", required: false },
    { key: "contact_email", label: "Contact Email", required: false },
    { key: "contact_name", label: "Contact Name", required: false },
    { key: "contact_phone", label: "Contact Phone", required: false },
    { key: "notes", label: "Notes", required: false },
    { key: "status", label: "Status", required: false },
  ],
  candidates: [
    { key: "full_name", label: "Full Name", required: true },
    { key: "email", label: "Email", required: false },
    { key: "phone", label: "Phone", required: false },
    { key: "location", label: "Location", required: false },
    { key: "skills", label: "Skills", required: false },
    { key: "notes", label: "Notes", required: false },
    { key: "source", label: "Source", required: false },
    { key: "years_experience", label: "Years Experience", required: false },
    { key: "desired_salary", label: "Desired Salary", required: false },
  ],
  jobs: [
    { key: "title", label: "Title", required: true },
    { key: "company_name", label: "Company Name", required: true },
    { key: "description", label: "Description", required: false },
    { key: "location", label: "Location", required: false },
    { key: "salary_range", label: "Salary Range", required: false },
    { key: "priority", label: "Priority", required: false },
    { key: "employment_type", label: "Employment Type", required: false },
    { key: "pay_type", label: "Pay Type", required: false },
  ],
};

const STEPS = ["Select Type", "Upload CSV", "Map Fields", "Preview", "Import"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ImportPage() {
  const [step, setStep] = useState(0);
  const [entityType, setEntityType] = useState<EntityType>("companies");

  // CSV data
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);

  // Column mapping: db field key -> csv column index (-1 = unmapped)
  const [mapping, setMapping] = useState<Record<string, number>>({});

  // Duplicate warnings
  const [duplicates, setDuplicates] = useState<{ row: number; match: string }[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // Import results
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    errors: { row: number; message: string }[];
  } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  // ---- Helpers ----

  const fields = FIELD_DEFS[entityType];

  const getMappedRows = useCallback((): Record<string, string>[] => {
    return csvRows.map((row) => {
      const obj: Record<string, string> = {};
      for (const field of fields) {
        const colIdx = mapping[field.key];
        if (colIdx !== undefined && colIdx >= 0 && colIdx < row.length) {
          obj[field.key] = row[colIdx];
        }
      }
      return obj;
    });
  }, [csvRows, mapping, fields]);

  const getValidationErrors = useCallback((): Map<number, string[]> => {
    const errs = new Map<number, string[]>();
    const mapped = getMappedRows();
    const required = fields.filter((f) => f.required);

    mapped.forEach((row, i) => {
      const rowErrors: string[] = [];
      for (const f of required) {
        if (!row[f.key]?.trim()) {
          rowErrors.push(`Missing ${f.label}`);
        }
      }
      if (rowErrors.length > 0) errs.set(i, rowErrors);
    });

    return errs;
  }, [getMappedRows, fields]);

  // ---- Auto-map columns by header name similarity ----
  const autoMap = useCallback(
    (headers: string[]) => {
      const newMapping: Record<string, number> = {};
      for (const field of FIELD_DEFS[entityType]) {
        const normalized = field.key.toLowerCase().replace(/_/g, "");
        const idx = headers.findIndex((h) => {
          const nh = h.toLowerCase().replace(/[_\s-]/g, "");
          return nh === normalized || nh === field.label.toLowerCase().replace(/\s/g, "");
        });
        newMapping[field.key] = idx;
      }
      setMapping(newMapping);
    },
    [entityType]
  );

  // ---- Step handlers ----

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers, rows } = parseCSV(text);
      setCsvHeaders(headers);
      setCsvRows(rows);
      autoMap(headers);
      setStep(2);
    };
    reader.readAsText(file);
  };

  const handleCheckDuplicates = async () => {
    setCheckingDuplicates(true);
    try {
      const mapped = getMappedRows();
      let dupes: { row: number; match: string }[] = [];

      if (entityType === "companies") {
        dupes = await checkCompanyDuplicates(
          mapped.map((r) => ({ name: r.name || "", location: r.location }))
        );
      } else if (entityType === "candidates") {
        dupes = await checkCandidateDuplicates(
          mapped.map((r) => ({ email: r.email, phone: r.phone }))
        );
      } else {
        dupes = await checkJobDuplicates(
          mapped.map((r) => ({
            company_name: r.company_name || "",
            title: r.title || "",
            location: r.location,
          }))
        );
      }

      setDuplicates(dupes);
    } catch (err) {
      console.error("Duplicate check failed:", err);
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const mapped = getMappedRows();
      let res: { imported: number; errors: { row: number; message: string }[] };

      if (entityType === "companies") {
        res = await importCompanies(mapped);
      } else if (entityType === "candidates") {
        res = await importCandidates(mapped);
      } else {
        res = await importJobs(mapped);
      }

      setResult(res);
      setStep(4);
    } catch (err) {
      console.error("Import failed:", err);
      setResult({
        imported: 0,
        errors: [{ row: -1, message: err instanceof Error ? err.message : "Import failed" }],
      });
      setStep(4);
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setStep(0);
    setCsvHeaders([]);
    setCsvRows([]);
    setMapping({});
    setDuplicates([]);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // ---- Render helpers ----

  const validationErrors = step >= 3 ? getValidationErrors() : new Map<number, string[]>();
  const previewRows = getMappedRows().slice(0, 10);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">CSV Import</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Import companies, candidates, or jobs from a CSV file
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-1 sm:gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-1 sm:gap-2">
            {i > 0 && (
              <div
                className={`hidden sm:block w-6 h-px ${
                  i <= step ? "bg-zinc-900" : "bg-zinc-300"
                }`}
              />
            )}
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium ${
                i < step
                  ? "bg-zinc-900 text-white"
                  : i === step
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-400"
              }`}
            >
              {i < step ? "\u2713" : i + 1}
            </div>
            <span
              className={`text-xs hidden sm:inline ${
                i <= step ? "text-zinc-900 font-medium" : "text-zinc-400"
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 0: Select entity type */}
      {step === 0 && (
        <div className="border border-zinc-200 rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-medium text-zinc-900">
            What are you importing?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(["companies", "candidates", "jobs"] as EntityType[]).map((type) => (
              <button
                key={type}
                onClick={() => setEntityType(type)}
                className={`border rounded-lg p-4 text-left transition-colors ${
                  entityType === type
                    ? "border-zinc-900 bg-zinc-50"
                    : "border-zinc-200 hover:border-zinc-400"
                }`}
              >
                <div className="text-sm font-medium text-zinc-900 capitalize">
                  {type}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {type === "companies" && "Import company records"}
                  {type === "candidates" && "Import candidate profiles"}
                  {type === "jobs" && "Import job listings"}
                </div>
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setStep(1)}
              className="bg-zinc-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Upload CSV */}
      {step === 1 && (
        <div className="border border-zinc-200 rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-medium text-zinc-900">
            Upload a CSV file for{" "}
            <span className="capitalize">{entityType}</span>
          </h2>
          <p className="text-xs text-zinc-500">
            The first row should contain column headers. Required fields:{" "}
            {fields
              .filter((f) => f.required)
              .map((f) => f.label)
              .join(", ")}
          </p>
          <div className="border-2 border-dashed border-zinc-300 rounded-lg p-8 text-center">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer inline-flex flex-col items-center gap-2"
            >
              <svg
                className="w-8 h-8 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <span className="text-sm text-zinc-600">
                Click to select a CSV file
              </span>
              <span className="text-xs text-zinc-400">
                .csv files only
              </span>
            </label>
          </div>
          <div className="flex justify-between">
            <button
              onClick={() => setStep(0)}
              className="bg-zinc-100 text-zinc-700 text-sm px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Map columns */}
      {step === 2 && (
        <div className="border border-zinc-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-900">
              Map CSV columns to fields
            </h2>
            <span className="text-xs text-zinc-500">
              {csvRows.length} rows found
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Match each database field to the corresponding CSV column.
            Fields marked with * are required.
          </p>

          <div className="space-y-2">
            {fields.map((field) => (
              <div
                key={field.key}
                className="flex items-center gap-3 py-2 border-b border-zinc-100 last:border-0"
              >
                <div className="w-40 text-sm text-zinc-700 shrink-0">
                  {field.label}
                  {field.required && (
                    <span className="text-red-500 ml-0.5">*</span>
                  )}
                </div>
                <svg
                  className="w-4 h-4 text-zinc-400 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
                <select
                  value={mapping[field.key] ?? -1}
                  onChange={(e) =>
                    setMapping((prev) => ({
                      ...prev,
                      [field.key]: parseInt(e.target.value, 10),
                    }))
                  }
                  className="flex-1 border border-zinc-200 rounded-lg px-3 py-1.5 text-sm text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-300"
                >
                  <option value={-1}>-- Skip --</option>
                  {csvHeaders.map((h, idx) => (
                    <option key={idx} value={idx}>
                      {h}
                      {csvRows[0]?.[idx] ? ` (e.g. "${csvRows[0][idx].slice(0, 30)}")` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(1)}
              className="bg-zinc-100 text-zinc-700 text-sm px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => {
                setDuplicates([]);
                setStep(3);
              }}
              className="bg-zinc-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Preview Data
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview + duplicates */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Preview table */}
          <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-900">
                Data Preview (first 10 rows)
              </h2>
              <span className="text-xs text-zinc-500">
                {csvRows.length} total rows &middot;{" "}
                {validationErrors.size} with errors
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="text-left py-2 px-2 text-zinc-500 font-medium">
                      #
                    </th>
                    {fields
                      .filter((f) => mapping[f.key] >= 0)
                      .map((f) => (
                        <th
                          key={f.key}
                          className="text-left py-2 px-2 text-zinc-500 font-medium whitespace-nowrap"
                        >
                          {f.label}
                          {f.required && (
                            <span className="text-red-500">*</span>
                          )}
                        </th>
                      ))}
                    <th className="text-left py-2 px-2 text-zinc-500 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => {
                    const rowErrs = validationErrors.get(i);
                    const dupe = duplicates.find((d) => d.row === i);
                    return (
                      <tr
                        key={i}
                        className={`border-b border-zinc-100 ${
                          rowErrs ? "bg-red-50" : dupe ? "bg-amber-50" : ""
                        }`}
                      >
                        <td className="py-1.5 px-2 text-zinc-400">{i + 1}</td>
                        {fields
                          .filter((f) => mapping[f.key] >= 0)
                          .map((f) => (
                            <td
                              key={f.key}
                              className="py-1.5 px-2 text-zinc-700 max-w-[200px] truncate"
                            >
                              {row[f.key] || (
                                <span className="text-zinc-300">--</span>
                              )}
                            </td>
                          ))}
                        <td className="py-1.5 px-2">
                          {rowErrs && (
                            <span className="inline-block bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded font-medium">
                              {rowErrs.join(", ")}
                            </span>
                          )}
                          {dupe && !rowErrs && (
                            <span className="inline-block bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-medium">
                              {dupe.match}
                            </span>
                          )}
                          {!rowErrs && !dupe && (
                            <span className="inline-block bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-medium">
                              OK
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {csvRows.length > 10 && (
              <p className="text-xs text-zinc-400">
                ...and {csvRows.length - 10} more rows
              </p>
            )}
          </div>

          {/* Duplicate check */}
          <div className="border border-zinc-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-zinc-900">
                  Duplicate Check
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Check for existing records that match your import data
                </p>
              </div>
              <button
                onClick={handleCheckDuplicates}
                disabled={checkingDuplicates}
                className="bg-zinc-100 text-zinc-700 text-sm px-3 py-1.5 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {checkingDuplicates ? "Checking..." : "Check Duplicates"}
              </button>
            </div>
            {duplicates.length > 0 && (
              <div className="space-y-1">
                {duplicates.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded"
                  >
                    <span className="font-medium">Row {d.row + 1}:</span>
                    <span>{d.match}</span>
                  </div>
                ))}
              </div>
            )}
            {duplicates.length === 0 && !checkingDuplicates && (
              <p className="text-xs text-zinc-400">
                No duplicate check run yet. Click the button above to check.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="bg-zinc-100 text-zinc-700 text-sm px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={importing || validationErrors.size === csvRows.length}
              className="bg-zinc-900 text-white text-sm px-5 py-2 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              {importing ? "Importing..." : `Import ${csvRows.length} Rows`}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Results */}
      {step === 4 && result && (
        <div className="border border-zinc-200 rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-medium text-zinc-900">Import Complete</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="border border-zinc-200 rounded-lg p-4">
              <div className="text-2xl font-semibold text-emerald-600">
                {result.imported}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                Successfully imported
              </div>
            </div>
            <div className="border border-zinc-200 rounded-lg p-4">
              <div className="text-2xl font-semibold text-red-600">
                {result.errors.length}
              </div>
              <div className="text-xs text-zinc-500 mt-1">Errors</div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              <h3 className="text-xs font-medium text-zinc-700">
                Error Details
              </h3>
              {result.errors.map((err, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs text-red-700 bg-red-50 px-3 py-1.5 rounded"
                >
                  {err.row >= 0 && (
                    <span className="font-medium shrink-0">
                      Row {err.row + 1}:
                    </span>
                  )}
                  <span>{err.message}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              onClick={resetImport}
              className="bg-zinc-100 text-zinc-700 text-sm px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Import More
            </button>
            <a
              href={`/${entityType}`}
              className="bg-zinc-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors inline-block"
            >
              View {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
