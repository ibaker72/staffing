type SupabaseErrorLike = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

export type MetricQueryResult = {
  table: string;
  value: number;
  hasError: boolean;
  missingTable: boolean;
  errorMessage?: string;
};

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const maybeError = error as SupabaseErrorLike;
  const code = maybeError.code ?? "";
  const message = maybeError.message ?? "";

  if (code === "42P01" || code === "PGRST205") {
    return true;
  }

  return /(relation|table).*(does not exist|not found)/i.test(message);
}

function toSafeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const coerced = Number(value);
  return Number.isFinite(coerced) ? coerced : 0;
}

export async function safeMetricQuery(
  table: string,
  loader: () => Promise<unknown>
): Promise<MetricQueryResult> {
  try {
    const value = await loader();

    return {
      table,
      value: toSafeNumber(value),
      hasError: false,
      missingTable: false,
    };
  } catch (error) {
    const maybeError = (error ?? {}) as SupabaseErrorLike;

    console.error(`[dashboard] Failed to load metric for table '${table}'`, {
      code: maybeError.code,
      message: maybeError.message,
      details: maybeError.details,
      hint: maybeError.hint,
    });

    return {
      table,
      value: 0,
      hasError: true,
      missingTable: isMissingTableError(error),
      errorMessage: maybeError.message ?? "Unknown Supabase error",
    };
  }
}