/**
 * Mandatory Fields Validator Module
 * Validates and corrects mandatory fields for flight records
 */

import { ERROR_SEVERITY, type ErrorSeverity } from '../core/constants';

/**
 * Validation result structure
 */
export interface ValidationResult {
  /** Whether the record is valid (no critical errors) */
  valid: boolean;
  /** Record with corrected and normalized values */
  corrected: Record<string, string>;
  /** List of missing mandatory fields */
  missing: string[];
  /** Array of validation errors */
  errors: Array<{
    field: string;
    severity: ErrorSeverity;
    message: string;
  }>;
}

/**
 * Mandatory fields that must not be empty
 */
const MANDATORY_FIELDS = [
  'DATA',
  'TIPO',
  'ORIGEM',
  'DESTINO',
  'FIXO_ENT',
  'HORA_ENT',
  'NIVEL_ENT',
  'AEROVIA',
  'FIXO_SAI',
  'HORA_SAI',
  'NIVEL_SAI',
  'RVSM',
];

/**
 * Validate and correct mandatory fields in a flight record
 * 
 * Operational rules:
 * - INDICATIVO: Auto-fill with "XXX" if empty
 * - CHAMADA: Auto-fill with INDICATIVO value if empty
 * - Mandatory fields: Must not be empty
 * 
 * @param record - Flight record with field values
 * @returns Validation result with corrected record and error list
 * 
 * @example
 * const result = validateMandatoryFields({
 *   INDICATIVO: '',
 *   CHAMADA: '',
 *   DATA: '2025-05-22',
 *   TIPO: 'B737',
 *   // ... other fields
 * });
 * 
 * // Result:
 * // {
 * //   valid: true,
 * //   corrected: {
 * //     INDICATIVO: 'XXX',
 * //     CHAMADA: 'XXX',
 * //     DATA: '2025-05-22',
 * //     ...
 * //   },
 * //   missing: [],
 * //   errors: [
 * //     {
 * //       field: 'INDICATIVO',
 * //       severity: 'FIXED',
 * //       message: 'Auto-filled with XXX'
 * //     },
 * //     {
 * //       field: 'CHAMADA',
 * //       severity: 'FIXED',
 * //       message: 'Auto-filled from INDICATIVO'
 * //     }
 * //   ]
 * // }
 */
export function validateMandatoryFields(
  record: Record<string, string>
): ValidationResult {
  // Create a corrected copy with all values trimmed
  const corrected: Record<string, string> = {};
  const errors: Array<{
    field: string;
    severity: ErrorSeverity;
    message: string;
  }> = [];
  const missing: string[] = [];

  // Trim all existing values
  for (const [key, value] of Object.entries(record)) {
    corrected[key] = (value ?? '').trim();
  }

  // Rule 1: Auto-fill INDICATIVO with "XXX" if empty
  if (!corrected.INDICATIVO) {
    corrected.INDICATIVO = 'XXX';
    errors.push({
      field: 'INDICATIVO',
      severity: ERROR_SEVERITY.FIXED,
      message: 'Auto-filled with XXX',
    });
  }

  // Rule 2: Auto-fill CHAMADA with INDICATIVO if empty
  if (!corrected.CHAMADA) {
    corrected.CHAMADA = corrected.INDICATIVO;
    errors.push({
      field: 'CHAMADA',
      severity: ERROR_SEVERITY.FIXED,
      message: 'Auto-filled from INDICATIVO',
    });
  }

  // Rule 3: Check mandatory fields
  for (const field of MANDATORY_FIELDS) {
    if (!corrected[field]) {
      missing.push(field);
      errors.push({
        field,
        severity: ERROR_SEVERITY.CRITICAL,
        message: 'ERRO CAMPO VAZIO',
      });
    }
  }

  return {
    valid: missing.length === 0,
    corrected,
    missing,
    errors,
  };
}
