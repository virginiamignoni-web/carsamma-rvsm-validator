/**
 * Operational Anomaly Validator
 * Detects suspicious or impossible operational conditions
 */

export interface AnomalyResult {
  hasAnomaly: boolean;
  anomalies: string[];
}

/**
 * Detect operational anomalies
 */
export function validateOperationalAnomalies(
  nivelEnt: number,
  nivelSai: number,
  exposureMinutes: number,
  speed: number | null
): AnomalyResult {

  const anomalies: string[] = [];

  // Impossible speed
  if (
    speed !== null &&
    speed > 700
  ) {
    anomalies.push(
      'Impossible operational speed detected'
    );
  }

  // Impossible short exposure
  if (
    exposureMinutes > 0 &&
    exposureMinutes < 2
  ) {
    anomalies.push(
      'Suspicious RVSM exposure duration'
    );
  }

  // Excessive climb/descent rate
  const flDifference =
    Math.abs(nivelSai - nivelEnt);

  if (
    exposureMinutes > 0
  ) {

    const climbRate =
      (flDifference * 100) /
      exposureMinutes;

    if (climbRate > 4000) {
      anomalies.push(
        'Impossible climb/descent rate detected'
      );
    }
  }

  return {
    hasAnomaly:
      anomalies.length > 0,

    anomalies,
  };
}
