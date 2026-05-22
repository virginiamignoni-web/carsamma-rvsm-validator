/**
 * Time Utilities Module
 * Handles time parsing, conversion, and arithmetic in HH:MM format
 */

/**
 * Normalize time string to HH:MM format
 * 
 * Supported input formats:
 * - 0815, 815 (HHMM or HMM)
 * - 08:15, 8:15 (HH:MM or H:MM)
 * - 08;15 (alternative separator)
 * 
 * @param value - Raw time string
 * @returns Normalized time in HH:MM format, or empty string if invalid
 * 
 * @example
 * normalizeTime('0815') // '08:15'
 * normalizeTime('8:15') // '08:15'
 * normalizeTime('08;15') // '08:15'
 * normalizeTime('invalid') // ''
 */
export function normalizeTime(value: string): string {
  if (!value || typeof value !== 'string') return '';

  // Remove spaces
  let time = value.trim().replace(/\s/g, '');

  // Replace semicolon with colon
  time = time.replace(/;/g, ':');

  // Parse different formats
  let hours = 0;
  let minutes = 0;

  if (time.includes(':')) {
    // Format: H:MM or HH:MM
    const parts = time.split(':');
    if (parts.length !== 2) return '';

    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1], 10);
  } else {
    // Format: HMM or HHMM
    if (time.length < 3 || time.length > 4) return '';
    if (!/^\d+$/.test(time)) return '';

    if (time.length === 3) {
      // HMM format
      hours = parseInt(time[0], 10);
      minutes = parseInt(time.slice(1), 10);
    } else {
      // HHMM format
      hours = parseInt(time.slice(0, 2), 10);
      minutes = parseInt(time.slice(2), 10);
    }
  }

  // Validate values
  if (isNaN(hours) || isNaN(minutes)) return '';
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return '';

  // Format as HH:MM
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Convert HH:MM time string to total minutes
 * 
 * @param hhmm - Time string in any recognized format (normalized or raw)
 * @returns Total minutes from midnight (0-1439), or 0 if invalid
 * 
 * @example
 * hmToMin('08:15') // 495
 * hmToMin('0815') // 495
 * hmToMin('23:59') // 1439
 */
export function hmToMin(hhmm: string): number {
  const normalized = normalizeTime(hhmm);
  if (!normalized) return 0;

  const [h, m] = normalized.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Convert total minutes to HH:MM time string
 * Wraps around 24-hour clock
 * 
 * @param minutes - Total minutes (can exceed 24h)
 * @returns Time string in HH:MM format
 * 
 * @example
 * minToHM(495) // '08:15'
 * minToHM(1439) // '23:59'
 * minToHM(1500) // '01:00' (wraps around)
 */
export function minToHM(minutes: number): string {
  // Normalize to 0-1439 range (24 hours)
  let normalizedMin = minutes % (24 * 60);
  if (normalizedMin < 0) {
    normalizedMin += 24 * 60;
  }

  const hours = Math.floor(normalizedMin / 60);
  const mins = normalizedMin % 60;

  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Add minutes to a time string
 * 
 * @param hhmm - Start time string
 * @param delta - Minutes to add (can be negative)
 * @returns New time in HH:MM format, or empty string if input invalid
 * 
 * @example
 * addMinutes('08:15', 45) // '09:00'
 * addMinutes('23:30', 90) // '01:00'
 */
export function addMinutes(hhmm: string, delta: number): string {
  const minutes = hmToMin(hhmm);
  if (minutes === 0 && normalizeTime(hhmm) === '') return '';

  return minToHM(minutes + delta);
}

/**
 * Subtract minutes from a time string
 * 
 * @param hhmm - Start time string
 * @param delta - Minutes to subtract (can be negative)
 * @returns New time in HH:MM format, or empty string if input invalid
 * 
 * @example
 * subtractMinutes('09:00', 45) // '08:15'
 * subtractMinutes('01:00', 90) // '23:30'
 */
export function subtractMinutes(hhmm: string, delta: number): string {
  return addMinutes(hhmm, -delta);
}

/**
 * Calculate difference in minutes between two times
 * Handles wrap-around at midnight
 * 
 * @param start - Start time string
 * @param end - End time string
 * @returns Difference in minutes (end - start)
 *          Negative if end is before start within same day
 * 
 * @example
 * diffMinutes('08:00', '09:30') // 90
 * diffMinutes('23:00', '01:00') // 120 (next day)
 * diffMinutes('09:00', '08:00') // -60
 */
export function diffMinutes(start: string, end: string): number {
  const startMin = hmToMin(start);
  const endMin = hmToMin(end);

  if ((startMin === 0 && normalizeTime(start) === '') ||
      (endMin === 0 && normalizeTime(end) === '')) {
    return 0;
  }

  let diff = endMin - startMin;

  // If negative and significant, assume end is next day
  if (diff < -12 * 60) {
    diff += 24 * 60;
  } else if (diff > 12 * 60) {
    diff -= 24 * 60;
  }

  return diff;
}
