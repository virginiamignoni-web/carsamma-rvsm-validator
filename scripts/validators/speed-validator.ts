/**
 * Speed Validator Module
 * Calculates and validates ground speed against aircraft reference speeds
 */

import { getReferenceSpeed } from '../parsers/aircraft-parser';
import { diffMinutes } from '../utils/time-utils';
import {
  ERROR_SEVERITY,
  MAX_SPEED_KTS,
  MIN_SPEED_KTS,
  type ErrorSeverity,
} from '../core/constants';

/**
 * Ground speed validation result structure
 */
export interface GroundSpeedValidationResult {
  /** Whether the calculated speed is valid */
  valid: boolean;
  /** Calculated ground speed in knots, or null if invalid */
  calculatedSpeed: number | null;
  /** Reference speed for aircraft type in knots */
  referenceSpeed: number;
  /** Difference from reference speed (calculated - reference) */
  difference: number | null;
  /** Array of validation errors */
  errors: Array<{
    severity: ErrorSeverity;
    message: string;
  }>;
}

/**
 * Calculate ground speed from distance and time
 * 
 * Formula: Ground Speed (knots) = Distance (nautical miles) / Time (hours)
 * 
 * @param distanceNm - Distance in nautical miles
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 * @returns Ground speed in knots, or null if calculation invalid
 * 
 * @example
 * calculateGroundSpeed(450, '08:00', '09:00') // 450
 * calculateGroundSpeed(225, '08:00', '08:30') // 450
 * calculateGroundSpeed(100, '08:00', '08:00') // null (zero time)
 */
export function calculateGroundSpeed(
  distanceNm: number,
  startTime: string,
  endTime: string
): number | null {
  // Validate inputs
  if (distanceNm <= 0) return null;

  // Calculate time difference in minutes
  const timeDiffMin = diffMinutes(startTime, endTime);

  // Validate time
  if (timeDiffMin <= 0) return null;

  // Convert minutes to hours
  const timeHours = timeDiffMin / 60;

  // Calculate ground speed in knots
  const groundSpeed = distanceNm / timeHours;

  return groundSpeed;
}

/**
 * Validate ground speed against aircraft reference and operational limits
 * 
 * Validation checks:
 * - Time interval must be positive (CRITICAL)
 * - Speed must be within operational limits (WARNING)
 * - Compare against ICAO reference speed
 * 
 * @param aircraftType - Aircraft type code (e.g., 'B737', 'A320')
 * @param distanceNm - Distance in nautical miles
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 * @returns Validation result with calculated speed and errors
 * 
 * @example
 * validateGroundSpeed('B737', 450, '08:00', '09:00')
 * // {
 * //   valid: true,
 * //   calculatedSpeed: 450,
 * //   referenceSpeed: 450,
 * //   difference: 0,
 * //   errors: []
 * // }
 * 
 * validateGroundSpeed('B737', 100, '08:00', '08:00')
 * // {
 * //   valid: false,
 * //   calculatedSpeed: null,
 * //   referenceSpeed: 450,
 * //   difference: null,
 * //   errors: [
 * //     {
 * //       severity: 'CRITICAL',
 * //       message: 'Invalid time interval'
 * //     }
 * //   ]
 * // }
 */
export function validateGroundSpeed(
  aircraftType: string,
  distanceNm: number,
  startTime: string,
  endTime: string
): GroundSpeedValidationResult {
  const errors: Array<{
    severity: ErrorSeverity;
    message: string;
  }> = [];

  // Get reference speed for aircraft
  const referenceSpeed = getReferenceSpeed(aircraftType);

  // Calculate ground speed
  const calculatedSpeed = calculateGroundSpeed(distanceNm, startTime, endTime);

  // Check for invalid time interval
  if (calculatedSpeed === null) {
    errors.push({
      severity: ERROR_SEVERITY.CRITICAL,
      message: 'Invalid time interval',
    });

    return {
      valid: false,
      calculatedSpeed: null,
      referenceSpeed,
      difference: null,
      errors,
    };
  }

  // Check if speed is below minimum operational limit
  if (calculatedSpeed < MIN_SPEED_KTS) {
    errors.push({
      severity: ERROR_SEVERITY.WARNING,
      message: `Calculated speed below operational minimum (${MIN_SPEED_KTS} knots)`,
    });
  }

  // Check if speed is above maximum operational limit
  if (calculatedSpeed > MAX_SPEED_KTS) {
    errors.push({
      severity: ERROR_SEVERITY.WARNING,
      message: `Calculated speed above operational maximum (${MAX_SPEED_KTS} knots)`,
    });
  }

  // Calculate difference from reference speed
  const difference = calculatedSpeed - referenceSpeed;

  return {
    valid: errors.length === 0,
    calculatedSpeed,
    referenceSpeed,
    difference,
    errors,
  };
}
