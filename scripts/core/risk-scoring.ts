/**
 * Operational Risk Scoring Module
 * Calculates operational risk level for RVSM flights
 */

export type RiskLevel =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';

export interface RiskScoringResult {
  riskLevel: RiskLevel;
  score: number;
  reasons: string[];
}

/**
 * Calculate operational risk score
 */
export function calculateRiskScore(
  anomalyCount: number,
  crossingRVSM: boolean,
  exposureMinutes: number,
  speedWarnings: number
): RiskScoringResult {

  let score = 0;

  const reasons: string[] = [];

  // Operational anomalies
  if (anomalyCount > 0) {
    score += anomalyCount * 25;

    reasons.push(
      `${anomalyCount} operational anomalies`
    );
  }

  // RVSM crossing
  if (crossingRVSM) {
    score += 15;

    reasons.push(
      'RVSM crossing detected'
    );
  }

  // Excessive RVSM exposure
  if (exposureMinutes > 120) {
    score += 20;

    reasons.push(
      'High RVSM exposure time'
    );
  }

  // Speed warnings
  if (speedWarnings > 0) {
    score += speedWarnings * 10;

    reasons.push(
      `${speedWarnings} speed warnings`
    );
  }

  let riskLevel: RiskLevel;

  if (score >= 80) {
    riskLevel = 'CRITICAL';
  }

  else if (score >= 50) {
    riskLevel = 'HIGH';
  }

  else if (score >= 25) {
    riskLevel = 'MEDIUM';
  }

  else {
    riskLevel = 'LOW';
  }

  return {
    riskLevel,
    score,
    reasons,
  };
}
