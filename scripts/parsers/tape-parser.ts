import { parseCSVAsObjects } from './csv-parser';

/**
 * Tape parser module
 * Parses flight tape data with case-insensitive and accent-tolerant column detection
 * Supports multiple column name aliases
 */

/**
 * Column name aliases mapping
 * Maps canonical column names to their accepted aliases
 */
const COLUMN_ALIASES: Record<string, string[]> = {
  INDICATIVO: ['CAMPO_INDICATIVO', 'CALLSIGN'],
  AERONAVE: ['TYPE', 'ACTYPE', 'TIPO', 'AC_TYPE'],
  NIVEL: ['FL', 'CRUISE_FL', 'NIVEL_CRZ'],
  NIVEL_ENT: ['NIVELENT', 'ALTITUDE_IN', 'FL_IN'],
  NIVEL_SAI: ['NIVELSAI', 'ALTITUDE_OUT', 'FL_OUT'],
  AEROVIA: ['AWY', 'ROUTE', 'AIRWAY', 'ROTA'],
  FIXOS: ['WAYPOINTS', 'ROTA_FIXOS', 'FIX_LIST'],
  HORA_ENT: ['HORAENT', 'DEP_TIME', 'DEPARTURE'],
  HORA_SAI: ['HORASAI', 'ARR_TIME', 'ARRIVAL'],
};

/**
 * Normalizes a column name for comparison
 * - Converts to uppercase
 * - Removes spaces and underscores
 * - Removes accents and diacritics
 * @param name - Column name to normalize
 * @returns Normalized column name
 */
export function normalizeColumnName(name: string): string {
  return name
    .toUpperCase()
    .replace(/[\s_]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Finds the canonical column name for a given header
 * Searches through aliases using case-insensitive and accent-tolerant matching
 * @param headerName - Header name to search for
 * @returns Canonical column name or null if not found
 */
export function findColumn(headerName: string): string | null {
  const normalizedHeader = normalizeColumnName(headerName);

  // Search through all canonical names and their aliases
  for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
    // Check canonical name
    if (normalizeColumnName(canonical) === normalizedHeader) {
      return canonical;
    }

    // Check aliases
    for (const alias of aliases) {
      if (normalizeColumnName(alias) === normalizedHeader) {
        return canonical;
      }
    }
  }

  return null;
}

/**
 * Tape data structure
 */
export interface TapeData {
  headers: string[];
  data: Record<string, string>[];
}

/**
 * Parses tape CSV data with column alias detection
 * @param csvContent - CSV content string
 * @param delimiter - Field delimiter (auto-detected if not provided)
 * @returns Parsed tape data with headers and records
 */
export function parseTape(csvContent: string, delimiter?: string): TapeData {
  // Parse CSV into objects
  const records = parseCSVAsObjects(csvContent, delimiter);

  if (records.length === 0) {
    return {
      headers: [],
      data: [],
    };
  }

  // Get original headers from first record keys
  const originalHeaders = Object.keys(records[0]);

  // Map original headers to canonical column names
  const headerMap: Record<string, string> = {};
  const canonicalHeaders: string[] = [];

  for (const originalHeader of originalHeaders) {
    const canonical = findColumn(originalHeader);
    if (canonical) {
      headerMap[originalHeader] = canonical;
      if (!canonicalHeaders.includes(canonical)) {
        canonicalHeaders.push(canonical);
      }
    } else {
      // Keep original header if no mapping found
      headerMap[originalHeader] = originalHeader;
      if (!canonicalHeaders.includes(originalHeader)) {
        canonicalHeaders.push(originalHeader);
      }
    }
  }

  // Remap data records with canonical column names
  const remappedData: Record<string, string>[] = records.map((record) => {
    const remapped: Record<string, string> = {};

    for (const [originalKey, value] of Object.entries(record)) {
      const canonicalKey = headerMap[originalKey];
      remapped[canonicalKey] = value;
    }

    return remapped;
  });

  return {
    headers: canonicalHeaders,
    data: remappedData,
  };
}
