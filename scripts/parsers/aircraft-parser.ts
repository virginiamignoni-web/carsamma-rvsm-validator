/**
 * Aircraft Parser Module
 * Parses aircraft types and provides speed reference data
 */

import { parseCSV } from './csv-parser';

/**
 * Reference speeds for aircraft types in knots
 */
export const ICAO_SPEEDS: Record<string, number> = {
  A318: 440,
  A319: 440,
  A320: 450,
  A321: 450,
  A330: 470,
  A332: 470,
  A333: 470,
  A359: 488,
  B737: 450,
  B738: 455,
  B739: 460,
  B744: 490,
  B748: 495,
  B763: 470,
  B77W: 495,
  E190: 430,
  E195: 430,
  CRJ9: 430,
};

/**
 * Get reference speed for aircraft type
 * 
 * @param acType - Aircraft type code (normalized to uppercase internally)
 * @returns Reference speed in knots, or 450 as fallback
 */
export function getReferenceSpeed(acType: string): number {
  const normalized = acType.trim().toUpperCase();
  return ICAO_SPEEDS[normalized] ?? 450;
}

/**
 * Parse aircraft list from CSV or plain text
 * 
 * Supports:
 * - CSV with headers (first column contains ICAO type)
 * - Plain text list (one aircraft per line)
 * - Single-column CSV
 * 
 * @param data - CSV or plain text content
 * @param sep - Optional CSV delimiter
 * @returns Set of uppercase aircraft type codes
 */
export function parseAircraft(data: string, sep?: string): Set<string> {
  const aircraft = new Set<string>();
  const lines = data.split(/\r?\n/);
  
  // Try parsing as CSV first
  const rows = parseCSV(data, sep);
  
  if (rows.length > 0) {
    // Check if first row looks like headers (typical header keywords)
    const headerKeywords = ['type', 'aircraft', 'icao', 'code', 'ac', 'model'];
    const firstRowIsHeader = rows[0].some(cell =>
      headerKeywords.includes(cell.toLowerCase().trim())
    );

    // Start from row 1 if headers detected, otherwise row 0
    const startIdx = firstRowIsHeader ? 1 : 0;

    for (let i = startIdx; i < rows.length; i++) {
      const cells = rows[i];
      if (cells.length === 0) continue;

      const acType = cells[0]?.trim().toUpperCase();
      if (acType) {
        aircraft.add(acType);
      }
    }
  } else {
    // Fallback to plain text parsing
    for (const line of lines) {
      const acType = line.trim().toUpperCase();
      if (acType) {
        aircraft.add(acType);
      }
    }
  }

  return aircraft;
}
