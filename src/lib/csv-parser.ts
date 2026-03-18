/**
 * Client-side CSV parser.
 * Handles quoted fields, commas inside quotes, and newlines inside quotes.
 * No external dependencies.
 */
export function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = parseRows(text);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }
  const headers = lines[0].map((h) => h.trim());
  const rows = lines.slice(1).filter((row) => row.some((cell) => cell.trim() !== ""));
  return { headers, rows };
}

function parseRows(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        // Check for escaped quote ("")
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          // End of quoted field
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ",") {
        current.push(field);
        field = "";
        i++;
      } else if (ch === "\r") {
        // Handle \r\n or standalone \r
        current.push(field);
        field = "";
        rows.push(current);
        current = [];
        i++;
        if (i < text.length && text[i] === "\n") {
          i++;
        }
      } else if (ch === "\n") {
        current.push(field);
        field = "";
        rows.push(current);
        current = [];
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  // Push final field / row
  if (field !== "" || current.length > 0) {
    current.push(field);
    rows.push(current);
  }

  return rows;
}
