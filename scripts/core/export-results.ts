/**
 * Export Results Module
 * Generates operational CSV output from validation results
 */

import type { TapeProcessingResult } from '../app';

import {
  generateCSV,
} from '../parsers/csv-parser';

/**
 * Export processed validation results as CSV
 */
export function exportResultsCSV(
  result: TapeProcessingResult
): string {

  const rows: string[][] = [];

  // CSV headers
  rows.push([
    'CHAMADA',
    'TIPO',
    'ORIGEM',
    'DESTINO',

    'HORA_ENT',
    'HORA_SAI',

    'NIVEL_ENT',
    'NIVEL_SAI',

    'RVSM_OCCUPANCY',
    'RVSM_CROSSING',

    'EXPOSURE_MIN',

    'GROUND_SPEED',

    'ANOMALIES',

    'VALID',
  ]);

  // Records
  for (const record of result.records) {

    const speed =
      record.validations.speed;

    const occupancy =
      record.validations.occupancy;

    const exposure =
      record.validations.exposure;

    const anomalies =
      record.validations.anomalies;

    const valid =
      record.validations.mandatory.valid &&
      record.validations.nivelEnt.valid &&
      record.validations.nivelSai.valid;

    rows.push([
      record.corrected.CHAMADA || '',

      record.corrected.TIPO || '',

      record.corrected.ORIGEM || '',

      record.corrected.DESTINO || '',

      record.corrected.HORA_ENT || '',

      record.corrected.HORA_SAI || '',

      record.corrected.NIVEL_ENT || '',

      record.corrected.NIVEL_SAI || '',

      occupancy?.occupiesRVSM
        ? 'YES'
        : 'NO',

      occupancy?.crossingRVSM
        ? 'YES'
        : 'NO',

      exposure
        ? exposure.estimatedMinutes.toFixed(2)
        : '',

      speed?.calculatedSpeed
        ? speed.calculatedSpeed.toFixed(2)
        : '',

      anomalies?.anomalies.join(' | ') || '',

      valid
        ? 'YES'
        : 'NO',
    ]);
  }

  return generateCSV(rows);
}
