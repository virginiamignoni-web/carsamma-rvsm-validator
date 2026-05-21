/**
 * CSV Parser Module
 * Robust CSV parsing and generation with auto-delimiter detection
 * Supports quoted fields, escaped quotes, and UTF-8 BOM for Excel compatibility
 */

/**
 * Detects the delimiter used in CSV content
 * Preference order: semicolon (;) > comma (,) > tab (\t) > pipe (|)
 * @param content - CSV content string
 * @param sampleLines - Number of lines to sample for detection (default: 5)
 * @returns Detected delimiter character
 */
export function detectSeparator(content: string, sampleLines: number = 5): string {
  const lines = content.split('\n').slice(0, sampleLines);
  const delimiters = [';', ',', '\t', '|'];
  
  let bestDelimiter = ',';
  let bestScore = 0;

  for (const delimiter of delimiters) {
    let score = 0;
    let consistency = 0;
    let previousFieldCount: number | null = null;

    for (const line of lines) {
      if (!line.trim()) continue;

      const fieldCount = countFields(line, delimiter);
      if (fieldCount > 1) {
        score += fieldCount;
        if (previousFieldCount === null) {
          previousFieldCount = fieldCount;
        } else if (previousFieldCount === fieldCount) {
          consistency++;
        }
      }
    }

    const totalScore = score + consistency * 10;
    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
}

/**
 * Counts the number of fields in a line respecting quoted sections
 * @param line - CSV line
 * @param delimiter - Field delimiter
 * @returns Number of fields
 */
function countFields(line: string, delimiter: string): number {
  let fieldCount = 1;
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        i++; // Skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      fieldCount++;
    }
  }

  return fieldCount;
}

/**
 * Parses CSV content into a 2D array of strings
 * @param content - CSV content string
 * @param delimiter - Field delimiter (auto-detected if not provided)
 * @returns 2D array of parsed fields
 */
export function parseCSV(content: string, delimiter?: string): string[][] {
  const sep = delimiter || detectSeparator(content);
  const lines = content.split('\n');
  const result: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const fields = parseCSVLine(line, sep);
    result.push(fields);
  }

  return result;
}

/**
 * Parses a single CSV line respecting quoted fields and escaped quotes
 * @param line - CSV line
 * @param delimiter - Field delimiter
 * @returns Array of parsed fields
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // Field delimiter found outside quotes
      fields.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }

  // Add last field
  fields.push(currentField.trim());

  return fields;
}

/**
 * Parses CSV content into an array of objects
 * First row is treated as headers
 * @param content - CSV content string
 * @param delimiter - Field delimiter (auto-detected if not provided)
 * @returns Array of objects with header keys
 */
export function parseCSVAsObjects(
  content: string,
  delimiter?: string
): Record<string, string>[] {
  const rows = parseCSV(content, delimiter);

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0];
  const result: Record<string, string>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj: Record<string, string> = {};

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j] || '';
    }

    result.push(obj);
  }

  return result;
}

/**
 * Escapes a CSV field value for safe CSV output
 * Handles quotes and special characters
 * @param value - Field value to escape
 * @returns Escaped field value
 */
export function csvEscape(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // Check if field needs quoting
  if (str.includes('"') || str.includes(',') || str.includes(';') || str.includes('\n') || str.includes('\r')) {
    // Escape quotes by doubling them
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Generates a CSV line from an array of values
 * @param values - Array of field values
 * @param delimiter - Field delimiter (default: ',')
 * @returns CSV line string
 */
export function generateCSVLine(
  values: (string | number | boolean | null | undefined)[],
  delimiter: string = ','
): string {
  return values.map(csvEscape).join(delimiter);
}

/**
 * Generates complete CSV content from 2D array with optional UTF-8 BOM
 * @param rows - 2D array of values
 * @param delimiter - Field delimiter (default: ',')
 * @param includeUTF8BOM - Add UTF-8 BOM for Excel compatibility (default: true)
 * @returns CSV content string
 */
export function generateCSV(
  rows: (string | number | boolean | null | undefined)[][],
  delimiter: string = ',',
  includeUTF8BOM: boolean = true
): string {
  const lines = rows.map((row) => generateCSVLine(row, delimiter));
  const csv = lines.join('\n');

  if (includeUTF8BOM) {
    return '\uFEFF' + csv;
  }

  return csv;
}
