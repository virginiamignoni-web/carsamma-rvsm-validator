/**
 * CARSAMMA RVSM Validator
 * Main application entry point with integrated validation pipeline
 */

import { parseMesh } from './parsers/mesh-parser';
import { calculateRouteDistance } from './routing/distance-calculator';
import {
  validateMandatoryFields,
  validateFlightLevel,
 } from './validators';
import { validateGroundSpeed } from './validators/speed-validator';
import { normalizeTime } from './utils/time-utils';

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
  speed?: ReturnType<typeof validateGroundSpeed>;
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
export function processTape(
  csvText: string,
  meshCsvText?: string
): TapeProcessingResult {
  // Step 1: Parse tape
  const tape = parseTape(csvText);
const mesh = meshCsvText
  ? parseMesh(meshCsvText)
  : null;
  const records: ProcessedRecord[] = [];
  let validCount = 0;

  // Step 2: Process each row
  for (const row of tape.data) {
    // Validate mandatory fields
    const mandatory = validateMandatoryFields(row);

    // Get corrected record
    const corrected = { ...mandatory.corrected };

    // Normalize times
    const horaEnt = normalizeTime(corrected.HORA_ENT || '');
    const horasai = normalizeTime(corrected.HORA_SAI || '');

    if (horaEnt) {
      corrected.HORA_ENT = horaEnt;
    }
    if (horasai) {
      corrected.HORA_SAI = horasai;
    }

    // Validate flight levels
    const nivelEnt = validateFlightLevel(corrected.NIVEL_ENT || '');
    const nivelSai = validateFlightLevel(corrected.NIVEL_SAI || '');
    
    // Temporary mock distance
    const moconst route = [
  corrected.FIXO_ENT,
  corrected.FIXO_SAI,
].filter(Boolean);ckDistanceNm = 120;
    const routeDistance =
  mesh && corrected.AEROVIA
    ? calculateRouteDistance(
        mesh,
        route,
        corrected.AEROVIA
      )
    : null;
    
    // Validate operational speed
   const speedValidation =
  routeDistance !== null
    ? validateGroundSpeed(
        corrected.TIPO || '',
        routeDistance,
        corrected.HORA_ENT || '',
        corrected.HORA_SAI || ''
      )
    : {
        valid: false,
        calculatedSpeed: null,
        referenceSpeed: 0,
        difference: null,
        errors: [
          {
            severity: 'WARNING',
            message: 'Route distance unavailable',
          },
        ],
      };

console.log(
  `Route distance: ${routeDistance} NM | Speed: ${speedValidation.calculatedSpeed} knots`
);
    // Build processed record
    const processedRecord: ProcessedRecord = {
      original: row,
      corrected,
      validations: {
        mandatory,
        nivelEnt,
        nivelSai,
        speed: speedValidation,
      },
    };

    records.push(processedRecord);

    // Check if record is valid (no critical errors)
    const hasCriticalErrors =
      !mandatory.valid ||
      !nivelEnt.valid ||
      !nivelSai.valid ||
      !speedValidation.valid;
    
    if (!hasCriticalErrors) {
      validCount++;
    }
  }

  // Step 3: Return results
  return {
    total: tape.data.length,
    valid: validCount,
    invalid: tape.data.length - validCount,
    records,
  };
}

// ============================================================================
// Temporary Operational Test Example
// ============================================================================

const sampleCsv = `ERROS;DATA;CHAMADA;TIPO;ORIGEM;DESTINO;FIXO ENT;HORA ENT;NIVEL ENT;AEROVIA;FIXO SAI;HORA SAI;NIVEL SAI;INDICATIVO;RVSM
;;B737;GIG;SDU;SUVAA;0815;FL350;UZ1;MAMBO;0900;FL380;TAP;Y
;;;A320;MAO;CGH;SOBRA;0730;FL320;UZ5;BRAVA;0845;FL350;;N
;;GOL;B738;VCP;GIG;SANTO;1000;900;UZ2;NORTE;1100;FL400;GOL;Y`;

console.log('\n--- CARSAMMA RVSM Validator - Test Example ---\n');
const result = processTape(sampleCsv);
console.log(result);

export default {
  processTape,
};
