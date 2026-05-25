/**
 * CARSAMMA RVSM Validator
 * Main application entry point with integrated validation pipeline
 */

import { parseTape } from './parsers';
import { parseMesh } from './parsers/mesh-parser';
import { calculateRouteDistance } from './routing/distance-calculator';

import {
  validateMandatoryFields,
  validateFlightLevel,
} from './validators';

import { validateGroundSpeed } from './validators/speed-validator';
import { normalizeTime } from './utils/time-utils';
import { inferRVSMOccupancy } from './rvsm/occupancy-inference';

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
    occupancy?: ReturnType<typeof inferRVSMOccupancy>;
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
 * 2. Parse airway mesh
 * 3. For each row:
 *    - Validate mandatory fields
 *    - Normalize times
 *    - Validate flight levels
 *    - Calculate route distance
 *    - Validate operational speed
 * 4. Return results with statistics
 *
 * @param csvText - Raw CSV tape content
 * @param meshCsvText - Airway mesh CSV content
 * @returns Processing result with validation details
 */
export function processTape(
  csvText: string,
  meshCsvText?: string
): TapeProcessingResult {

  // Step 1: Parse tape
  const tape = parseTape(csvText);

  // Step 2: Parse airway mesh
  const mesh = meshCsvText
    ? parseMesh(meshCsvText)
    : null;

  const records: ProcessedRecord[] = [];
  let validCount = 0;

  // Step 3: Process each row
  for (const row of tape.data) {

    // Validate mandatory fields
    const mandatory = validateMandatoryFields(row);

    // Corrected record
    const corrected = { ...mandatory.corrected };

    // Normalize times
    const horaEnt = normalizeTime(
      corrected.HORA_ENT || ''
    );

    const horaSai = normalizeTime(
      corrected.HORA_SAI || ''
    );

    if (horaEnt) {
      corrected.HORA_ENT = horaEnt;
    }

    if (horaSai) {
      corrected.HORA_SAI = horaSai;
    }

    // Validate flight levels
    const nivelEnt = validateFlightLevel(
      corrected.NIVEL_ENT || ''
    );

    const nivelSai = validateFlightLevel(
      corrected.NIVEL_SAI || ''
    );
    
// Infer RVSM occupancy
const occupancy = inferRVSMOccupancy(
  nivelEnt.numericLevel || 0,
  nivelSai.numericLevel || 0
);
    
    // Build operational route
    const route = [
      corrected.FIXO_ENT,
      corrected.FIXO_SAI,
    ].filter(Boolean);

    // Calculate route distance
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
    : validateGroundSpeed(
        corrected.TIPO || '',
        1,
        '00:00',
        '00:01'
      );

console.log(
  `Route distance: ${routeDistance} NM | Speed: ${speedValidation.calculatedSpeed} knots`
);

console.log(
  `RVSM Occupancy: ${occupancy.occupiesRVSM} | Crossing: ${occupancy.crossingRVSM}`
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
        occupancy,
      },
    };

    records.push(processedRecord);

    // Check if record is valid
    const hasCriticalErrors =
      !mandatory.valid ||
      !nivelEnt.valid ||
      !nivelSai.valid ||
      !speedValidation.valid;

    if (!hasCriticalErrors) {
      validCount++;
    }
  }

  // Step 4: Return results
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

const sampleMeshCsv = `A;B;AWY;DIST
SUVAA;MAMBO;UZ1;120
SOBRA;BRAVA;UZ5;140
SANTO;NORTE;UZ2;160`;

console.log(
  '\n--- CARSAMMA RVSM Validator - Test Example ---\n'
);

const result = processTape(
  sampleCsv,
  sampleMeshCsv
);

export default {
  processTape,
};
