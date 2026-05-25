/**
 * Report Builder Module
 * Generates operational RVSM validation summaries
 */

import type { TapeProcessingResult } from '../app';

/**
 * Operational validation report
 */
export interface ValidationReport {
  totalFlights: number;
  validFlights: number;
  invalidFlights: number;

  rvsmOccupancyCount: number;
  rvsmCrossingCount: number;

  averageExposureMinutes: number;

  speedWarnings: number;
}

/**
 * Build operational validation report
 */
export function buildValidationReport(
  result: TapeProcessingResult
): ValidationReport {

  let rvsmOccupancyCount = 0;
  let rvsmCrossingCount = 0;

  let totalExposure = 0;
  let exposureCount = 0;

  let speedWarnings = 0;

  for (const record of result.records) {

    const occupancy =
      record.validations.occupancy;

    const exposure =
      record.validations.exposure;

    const speed =
      record.validations.speed;

    // RVSM occupancy
    if (occupancy?.occupiesRVSM) {
      rvsmOccupancyCount++;
    }

    // RVSM crossing
    if (occupancy?.crossingRVSM) {
      rvsmCrossingCount++;
    }

    // Exposure aggregation
    if (exposure) {
      totalExposure +=
        exposure.estimatedMinutes;

      exposureCount++;
    }

    // Speed warnings
    if (
      speed &&
      speed.errors &&
      speed.errors.length > 0
    ) {
      speedWarnings +=
        speed.errors.length;
    }
  }

  return {
    totalFlights: result.total,

    validFlights: result.valid,

    invalidFlights: result.invalid,

    rvsmOccupancyCount,

    rvsmCrossingCount,

    averageExposureMinutes:
      exposureCount > 0
        ? totalExposure / exposureCount
        : 0,

    speedWarnings,
  };
}
