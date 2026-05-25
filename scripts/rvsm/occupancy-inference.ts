/**
 * RVSM Occupancy Inference Module
 * Infers whether an aircraft occupied or crossed RVSM airspace
 */

import {
  FL_RVSM_MIN,
  FL_RVSM_MAX,
} from '../core/constants';

/**
 * Occupancy inference result
 */
export interface OccupancyResult {
  entersRVSM: boolean;
  exitsRVSM: boolean;
  occupiesRVSM: boolean;
  crossingRVSM: boolean;
  estimated: boolean;
}

/**
 * Check if flight level is inside RVSM band
 */
function isRVSM(level: number): boolean {
  return (
    level >= FL_RVSM_MIN &&
    level <= FL_RVSM_MAX
  );
}

/**
 * Infer RVSM occupancy from entry and exit flight levels
 */
export function inferRVSMOccupancy(
  nivelEnt: number,
  nivelSai: number
): OccupancyResult {

  const entersRVSM = isRVSM(nivelEnt);

  const exitsRVSM = isRVSM(nivelSai);

  const occupiesRVSM =
    entersRVSM || exitsRVSM;

  const crossingRVSM =
    (nivelEnt < FL_RVSM_MIN &&
      nivelSai >= FL_RVSM_MIN) ||

    (nivelEnt > FL_RVSM_MAX &&
      nivelSai <= FL_RVSM_MAX) ||

    (nivelEnt <= FL_RVSM_MAX &&
      nivelSai > FL_RVSM_MAX) ||

    (nivelEnt >= FL_RVSM_MIN &&
      nivelSai < FL_RVSM_MIN);

  return {
    entersRVSM,
    exitsRVSM,
    occupiesRVSM,
    crossingRVSM,
    estimated: crossingRVSM,
  };
}
