/**
 * CSV Parser Module
 * Handles flexible delimiter detection and robust CSV parsing
 */

/**
 * Detect CSV delimiter from first line
 * Prefers semicolon (;) over comma (,) for European CSV format
 */
export function detectSeparator(text: string): ';' | ',' {
  const firstLine = text.split(/\r?\n/)[0];
  if (!firstLine) return ';';
  return firstLine.includes(';') ? ';' : ',';
}

/**
 * Parse CSV text with specified or auto-detected delimiter
 * Handles quoted fields and escape sequences
 * 
 * @param text - Raw CSV content
 * @param sep - Optional delimiter; auto-detected if omitted
 * @returns 2D array of cell strings
 * 
 * @example
 * const rows = parseCSV(csvText);
 * const headers = rows[0];
 * const data = rows.slice(1);
 */
export function parseCSV(text: string, sep?: string): string[][] {
  if (!sep) {
    sep = detectSeparator(text);
  }

  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n');

  const rows: string[][] = [];

  for (const line of lines) {
    if (line.trim() === '') continue;

    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const next = line[i + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          // Escaped quote: "" → "
          current += '"';
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === sep && !inQuotes) {
        // Cell separator
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Push final cell
    cells.push(current.trim());
    rows.push(cells);
  }

  return rows;
}

/**
 * Parse CSV and return as array of objects with header keys
 * 
 * @param text - CSV content
 * @param sep - Optional delimiter
 * @returns Array of row objects: {header1: value1, header2: value2, ...}
 */
export function parseCSVAsObjects(
  text: string,
  sep?: string
): Record<string, string>[] {
  const rows = parseCSV(text, sep);
  if (rows.length < 2) return [];

  const headers = rows[0];
  const result: Record<string, string>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const obj: Record<string, string> = {};
    const cells = rows[i];

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = cells[j] ?? '';
    }

    result.push(obj);
  }

  return result;
}

/**
 * Escape CSV cell for safe output
 * Quotes cells containing semicolon, quote, or newline
 * 
 * @param val - Cell value
 * @returns Escaped string safe for CSV output
 */
export function csvEscape(val: any): string {
  if (val === null || val === undefined) return '';

  const s = String(val);
  if (s.includes(';') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }

  return s;
}

/**
 * Generate CSV line from values
 * Properly escapes cells and joins with delimiter
 * 
 * @param values - Array of cell values
 * @param sep - Delimiter (default: ";")
 * @returns CSV line string
 */
export function generateCSVLine(
  values: any[],
  sep: string = ';'
): string {
  return values.map(csvEscape).join(sep);
}

/**
 * Generate complete CSV from 2D array
 * Includes UTF-8 BOM for Excel compatibility
 * 
 * @param rows - Array of rows (first row = headers)
 * @param includeBOM - Add UTF-8 BOM prefix (default: true)
 * @returns Complete CSV text
 */
export function generateCSV(
  rows: string[][],
  includeBOM: boolean = true
): string {
  const lines = rows.map(row => generateCSVLine(row));
  const csv = lines.join('\r\n');

  return includeBOM ? '\ufeff' + csv : csv;
}
