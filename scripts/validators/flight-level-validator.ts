/**
 * Flight Level Validator Module
 * Normalizes and validates flight level values
 */

import {
  FL_RVSM_MIN,
  FL_RVSM_MAX,
  ERROR_SEVERITY,
  type ErrorSeverity,
} from '../core/constants';

/**
 * Flight level validation result structure
 */
export interface FlightLevelValidationResult {
  /** Whether the flight level is valid */
  valid: boolean;
  /** Normalized flight level (3-digit canonical form) */
  normalized: string;
  /** Numeric flight level value, or null if invalid */
  numericLevel: number | null;
  /** Whether flight level is within RVSM range (290-410) */
  rvsmEligible: boolean;
  /** Array of validation errors */
  errors: Array<{
    severity: ErrorSeverity;
    message: string;
  }>;
}

/**
 * Normalize flight level to canonical form
 * 
 * Supported input formats:
 * - FL350 (FL prefix)
 * - F350 (F prefix)
 * - 350 (3-digit canonical)
 * - 35000 (5-digit altitude in feet)
 * 
 * @param value - Raw flight level string
 * @returns Normalized flight level (3-digit), or empty string if invalid
 * 
 * @example
 * normalizeFlightLevel('FL350') // '350'
 * normalizeFlightLevel('35000') // '350'
 * normalizeFlightLevel('F350') // '350'
 * normalizeFlightLevel('350') // '350'
 * normalizeFlightLevel('invalid') // ''
 */
export function normalizeFlightLevel(value: string): string {
  if (!value || typeof value !== 'string') return '';

  // Remove spaces and convert to uppercase
  let fl = value.trim().toUpperCase().replace(/\s/g, '');

  // Remove FL or F prefix
  if (fl.startsWith('FL')) {
    fl = fl.slice(2);
  } else if (fl.startsWith('F')) {
    fl = fl.slice(1);
  }

  // Validate digits only
  if (!/^\d+$/.test(fl)) return '';

  // Convert 5-digit altitude to 3-digit flight level
  if (fl.length === 5) {
    // 35000 feet => 350 (divide by 100)
    const altitudeFeet = parseInt(fl, 10);
    if (altitudeFeet % 100 !== 0) return '';
    fl = String(altitudeFeet / 100);
  }

  // Validate 3-digit format
  if (fl.length !== 3) return '';

  // Validate numeric range (0-600)
  const flNum = parseInt(fl, 10);
  if (isNaN(flNum) || flNum < 0 || flNum > 600) return '';

  return fl;
}

/**
 * Validate a flight level value
 * 
 * Validation rules:
 * - Valid FL range: 0-600
 * - RVSM range: 290-410
 * - Invalid formats: CRITICAL error
 * - Out-of-range FL: WARNING error
 * 
 * @param value - Flight level string (any recognized format)
 * @returns Validation result with errors and RVSM eligibility
 * 
 * @example
 * validateFlightLevel('350')
 * // {
 * //   valid: true,
 * //   normalized: '350',
 * //   numericLevel: 350,
 * //   rvsmEligible: true,
 * //   errors: []
 * // }
 * 
 * validateFlightLevel('150')
 * // {
 * //   valid: true,
 * //   normalized: '150',
 * //   numericLevel: 150,
 * //   rvsmEligible: false,
 * //   errors: [
 * //     {
 * //       severity: 'WARNING',
 * //       message: 'Flight level outside RVSM range (290-410)'
 * //     }
 * //   ]
 * // }
 */
export function validateFlightLevel(value: string): FlightLevelValidationResult {
  const errors: Array<{
    severity: ErrorSeverity;
    message: string;
  }> = [];

  const normalized = normalizeFlightLevel(value);

  // Check if normalization failed
  if (!normalized) {
    return {
      valid: false,
      normalized: '',
      numericLevel: null,
      rvsmEligible: false,
      errors: [
        {
          severity: ERROR_SEVERITY.CRITICAL,
          message: 'Invalid flight level format',
        },
      ],
    };
  }

  const numericLevel = parseInt(normalized, 10);

  // Check if within valid range (0-600)
  if (numericLevel < 0 || numericLevel > 600) {
    errors.push({
      severity: ERROR_SEVERITY.CRITICAL,
      message: 'Flight level out of valid range (0-600)',
    });
  }

  // Check RVSM eligibility
  const rvsmEligible = numericLevel >= FL_RVSM_MIN && numericLevel <= FL_RVSM_MAX;
  if (!rvsmEligible && numericLevel >= 0 && numericLevel <= 600) {
    errors.push({
      severity: ERROR_SEVERITY.WARNING,
      message: `Flight level outside RVSM range (${FL_RVSM_MIN}-${FL_RVSM_MAX})`,
    });
  }

  return {
    valid: errors.length === 0,
    normalized,
    numericLevel,
    rvsmEligible,
    errors,
  };
}
