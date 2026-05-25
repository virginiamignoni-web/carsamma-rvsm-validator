/**
 * RVSM Exposure Estimator
 * Estimates time spent inside RVSM airspace
 */

import { diffMinutes } from '../utils/time-utils';

export interface ExposureResult {
  estimatedMinutes: number;
  enteredRVSM: boolean;
  exitedRVSM: boolean;
  crossing: boolean;
}

/**
 * Estimate RVSM exposure time
 */
export function estimateRVSMExposure(
  horaEnt: string,
  horaSai: string,
  entersRVSM: boolean,
  exitsRVSM: boolean,
  crossingRVSM: boolean
): ExposureResult {

  const totalMinutes = diffMinutes(
    horaEnt,
    horaSai
  );

  let estimatedMinutes = 0;

  // Entire flight inside RVSM
  if (entersRVSM && exitsRVSM) {
    estimatedMinutes = totalMinutes;
  }

  // Crossing RVSM during climb/descent
  else if (crossingRVSM) {
    estimatedMinutes = totalMinutes / 2;
  }

  // Outside RVSM
  else {
    estimatedMinutes = 0;
  }

  return {
    estimatedMinutes,
    enteredRVSM: entersRVSM,
    exitedRVSM: exitsRVSM,
    crossing: crossingRVSM,
  };
}
