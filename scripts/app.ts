/**
 * CARSAMMA RVSM Validator
 * Main application entry point with integrated validation pipeline
 */

import { parseTape } from './parsers';
import {
  validateMandatoryFields,
  validateFlightLevel,
  normalizeTime,
} from './validators';

console.log('CARSAMMA RVSM Validator initialized');

/**
 * Processed record with original, corrected, and validation results
 */
export interface ProcessedRecord {
  original: Record<string, string>;
  corrected: Record<string, string>;
  validations: {
    mandatory: ReturnType<typeof validateMandatoryFields>;
    nivelEnt: ReturnType<typeof validateFlightLevel>;
    nivelSai: ReturnType<typeof validateFlightLevel>;
  };
}

/**
 * Tape processing result
 */
export interface TapeProcessingResult {
  total: number;
  valid: number;
  invalid: number;
  records: ProcessedRecord[];
}

/**
 * Process tape CSV through integrated validation pipeline
 * 
 * Pipeline steps:
 * 1. Parse tape CSV
 * 2. For each row:
 *    - Validate mandatory fields
 *    - Normalize times (HORA_ENT, HORA_SAI)
 *    - Validate flight levels (NIVEL_ENT, NIVEL_SAI)
 * 3. Return results with statistics
 * 
 * @param csvText - Raw CSV tape content
 * @returns Processing result with validation details
 */
export function processTape(csvText: string): TapeProcessingResult {
  // Step 1: Parse tape
  const tape = parseTape(csvText);

  const records: ProcessedRecord[] = [];
  let validCount = 0;

  // Step 2: Process each row
  for (const row of tape.records) {
    // Validate mandatory fields
    const mandatory = validateMandatoryFields(row);

    // Get corrected record
    const corrected = { ...mandatory.corrected };

    // Normalize times
    const horaPent = normalizeTime(corrected.HORA_ENT || '');
    const horasai = normalizeTime(corrected.HORA_SAI || '');

    if (horaPent) {
      corrected.HORA_ENT = horaPent;
    }
    if (horasai) {
      corrected.HORA_SAI = horasai;
    }

    // Validate flight levels
    const nivelEnt = validateFlightLevel(corrected.NIVEL_ENT || '');
    const nivelSai = validateFlightLevel(corrected.NIVEL_SAI || '');

    // Build processed record
    const processedRecord: ProcessedRecord = {
      original: row,
      corrected,
      validations: {
        mandatory,
        nivelEnt,
        nivelSai,
      },
    };

    records.push(processedRecord);

    // Check if record is valid (no critical errors)
    const hasCriticalErrors =
      !mandatory.valid ||
      !nivelEnt.valid ||
      !nivelSai.valid;

    if (!hasCriticalErrors) {
      validCount++;
    }
  }

  // Step 3: Return results
  return {
    total: tape.records.length,
    valid: validCount,
    invalid: tape.records.length - validCount,
    records,
  };
}

export default {
  processTape,
};
