/**
 * Core Constants Module
 * Operational constants for RVSM validation
 */

/**
 * Minimum flight level for RVSM operations (29,000 feet)
 */
export const FL_RVSM_MIN = 290;

/**
 * Maximum flight level for RVSM operations (41,000 feet)
 */
export const FL_RVSM_MAX = 410;

/**
 * Default reference speed in knots
 */
export const DEFAULT_REFERENCE_SPEED = 450;

/**
 * Maximum allowed speed in knots
 */
export const MAX_SPEED_KTS = 520;

/**
 * Minimum allowed speed in knots
 */
export const MIN_SPEED_KTS = 300;

/**
 * Default climb rate in feet per minute
 */
export const DEFAULT_CLIMB_RATE_FPM = 1000;

/**
 * Default descent rate in feet per minute
 */
export const DEFAULT_DESCENT_RATE_FPM = 1000;

/**
 * Conversion factor: nautical miles to minutes (60 nm/hour = 1 nm/minute)
 */
export const NM_PER_MIN_FACTOR = 60;

/**
 * Error severity levels for validation results
 */
export const ERROR_SEVERITY = {
  /** Critical error that prevents validation */
  CRITICAL: 'CRITICAL',
  /** Warning that may affect validation accuracy */
  WARNING: 'WARNING',
  /** Error that was successfully fixed */
  FIXED: 'FIXED',
  /** Record discarded due to errors */
  DISCARD: 'DISCARD',
} as const;

/**
 * Type for error severity levels
 */
export type ErrorSeverity =
  typeof ERROR_SEVERITY[keyof typeof ERROR_SEVERITY];
