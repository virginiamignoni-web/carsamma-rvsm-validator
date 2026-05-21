# CARSAMMA RVSM Validator — API Reference

Complete function signatures, data types, and contracts for the modular validation engine.

---

## Parsers Module (`scripts/parsers/`)

### CSV Parser

```typescript
/**
 * Parse CSV text with flexible delimiter detection and escape handling.
 * @param text - Raw CSV content
 * @param sep - Explicit delimiter (auto-detect if omitted)
 * @returns 2D array of cell strings
 */
function parseCSV(text: string, sep?: string): string[][]

/**
 * Detect delimiter from first line (';' preferred over ',')
 */
function detectSeparator(text: string): ';' | ','
```

**Example:**
```typescript
const rows = parseCSV(csvText)
// rows[0] = headers
// rows[1..n] = data rows
```

---

### Tape Parser

```typescript
type TapeData = {
  headers: string[]
  data: Movement[]
}

type Movement = Record<string, string>

/**
 * Parse FIR movement tape CSV.
 * Auto-detects column names (case-insensitive, space-tolerant).
 * @param text - CSV content with headers
 * @returns Object with headers array and parsed rows
 */
function parseTape(text: string): TapeData

/**
 * Find column name in headers array (case-insensitive).
 * Returns first exact match or null.
 * Accepts aliases: "NIVEL ENT" ≈ "NIVELENT" ≈ "NIVEL_ENT"
 */
function findColumn(
  headers: string[],
  names: string[]  // aliases to try
): string | null
```

**Column Aliases Supported:**
```
INDICATIVO: CAMPO_INDICATIVO, CALLSIGN
AERONAVE: TYPE, ACTYPE, TIPO, AC_TYPE
NIVEL: FL, CRUISE_FL, NIVEL_CRZ
NIVEL_ENT: NIVELENT, ALTITUDE_IN, FL_IN
NIVEL_SAI: NIVELSAI, ALTITUDE_OUT, FL_OUT
AEROVIA: AWY, ROUTE, AIRWAY, ROTA
FIXOS: WAYPOINTS, ROTA_FIXOS, FIX_LIST
HORA_ENT: HORAENT, DEP_TIME, DEPARTURE
HORA_SAI: HORASAI, ARR_TIME, ARRIVAL, HORACHEG
```

---

### Mesh Parser

```typescript
type MeshGraph = {
  segMap: Map<string, number>
  fixToAwy: Map<string, Set<string>>
  awyFixos: Map<string, Set<string>>
}

/**
 * Parse airway mesh from CSV.
 * Columns required: A, B, AWY, DIST
 * @param text - CSV with mesh segments
 * @returns Indexed mesh for fast lookups
 */
function parseMesh(text: string): MeshGraph

// Internal structure:
//
// segMap: "FIXO_A|FIXO_B|AWY" → 42.5 (distance in NM)
//   - bidirectional: both "A|B|AWY" and "B|A|AWY" stored
//
// fixToAwy: "FIXO" → Set<"UZ1", "UZ2", ...>
//   - all aeroways containing this fixo
//
// awyFixos: "UZ1" → Set<"FIXO_A", "FIXO_B", ...>
//   - all fixos on this aeroway
```

**Example CSV Format:**
```
A;B;AWY;DIST
FIXO1;FIXO2;UZ1;42.5
FIXO2;FIXO3;UZ1;38.2
FIXO2;FIXO4;UZ2;35.0
```

---

### Aircraft Parser

```typescript
/**
 * Parse RVSM-approved aircraft list.
 * First column = ICAO type (A320, B738, etc.)
 * @param text - CSV with aircraft types
 * @returns Set of approved ICAO codes (uppercase)
 */
function parseAircraft(text: string): Set<string>
```

---

## Validators Module (`scripts/validators/`)

### Mandatory Fields

```typescript
const MANDATORY_FIELDS = [
  'INDICATIVO', 'AERONAVE', 'ORIGEM', 'DESTINO',
  'FIXO_ENT', 'HORA_ENT', 'NIVEL_ENT',
  'AEROVIA', 'FIXO_SAI', 'HORA_SAI', 'NIVEL_SAI'
]

/**
 * Validate all mandatory fields present and non-empty.
 * @returns Array of error strings (empty if valid)
 */
function validateMandatoryFields(row: Movement): string[]

// Error format:
// "CAMPO VAZIO: INDICATIVO"
// "CAMPO VAZIO: NIVEL_ENT"
```

---

### Aircraft Type Validation

```typescript
/**
 * Validate aircraft type against RVSM approved list.
 * @param acType - ICAO aircraft type from movement
 * @param approved - Set of approved types (from parser)
 * @returns Error string or null
 */
function validateAircraftType(
  acType: string,
  approved: Set<string>
): string | null

// Error format:
// "AERONAVE NAO APROVADA RVSM: B744"
```

---

### Altitude Level Validation

```typescript
const FL_RVSM_INF = 290
const FL_RVSM_SUP = 410

/**
 * Parse flight level from various string formats.
 * Accepts: "290", "FL290", "F290", "290FT"
 * @param s - String representation
 * @returns Numeric FL or null if invalid
 */
function parseFL(s: string): number | null

/**
 * Validate FL is within RVSM block.
 * @param fl - Numeric flight level
 * @returns Error string or null
 */
function validateFLWithinRVSM(fl: number): string | null

// Error formats:
// "NIVEL INVALIDO (NIVEL_ENT=X): nao numerico"
// "NIVEL FORA DO ESPACO RVSM: FL500 (deve ser FL290-FL410)"
```

---

### Duplicate Detection

```typescript
/**
 * Detect duplicate rows by content hash.
 * Considers complete row content (all columns).
 * @param rows - Array of movements
 * @returns Boolean array, true if row is duplicate
 */
function detectDuplicates(rows: Movement[]): boolean[]

// Implementation: Hash each row by joining all values with "|"
// Mark as duplicate if count > 1
```

---

### Airway & Fixo Compatibility

```typescript
/**
 * Validate aeroway exists in mesh.
 * @param aerovia - String like "UZ1" or "UZ1/UZ2/UP10"
 * @param awyFixos - Map from mesh parser
 * @returns Array of not-found aeroway codes
 */
function validateAirwayExists(
  aerovia: string,
  awyFixos: Map<string, Set<string>>
): string[]

/**
 * Validate fixo belongs to at least one declared aeroway.
 * @param fixo - Waypoint code (e.g., "FIXO1")
 * @param declaredAwys - Array like ["UZ1", "UZ2"]
 * @param fixToAwy - Map from mesh parser
 * @returns Error string or null
 */
function validateFixoCompatibility(
  fixo: string,
  declaredAwys: string[],
  fixToAwy: Map<string, Set<string>>
): string | null

// Error formats:
// "AEROVIA NAO ENCONTRADA: UZ99"
// "FIXO INCOMPATIVEL: XXXX nao pertence a UZ1/UZ2"
```

---

## Routing Module (`scripts/routing/`)

### Distance Calculator

```typescript
/**
 * Calculate total distance for a route via segment traversal.
 * Performs BFS to find path through mesh segments.
 * @param fixos - Array of waypoint codes in order
 * @param awys - Array or string of aeroway codes ("UZ1/UP2")
 * @param segMap - From mesh parser
 * @returns Distance in NM, or null if no path found
 */
function calcRouteDistance(
  fixos: string[],
  awys: string | string[],
  segMap: Map<string, number>
): number | null

// Example:
// fixos = ["FIXO1", "FIXO2", "FIXO3"]
// awys = ["UZ1", "UZ2"]
// Returns sum of distances: d(FIXO1→FIXO2) + d(FIXO2→FIXO3)
```

---

### Route Continuity Recovery (Phase 1)

```typescript
type RecoveryResult = {
  novoFixoEnt?: string
  novoFixoSai?: string
  distFinal: number | null
  entRecuperado: boolean
  saiRecuperado: boolean
  irrecuperavel: boolean
  horarioEntAjustado?: string
  horarioSaiAjustado?: string
}

/**
 * Automatically recover invalid entry/exit fixos.
 * Uses BFS to find closest valid waypoint on declared aeroways.
 * Recalculates departure/arrival times based on distance.
 * 
 * CASES:
 * 1. fixoEnt invalid, fixoSai valid → find closest fixo before SAI
 * 2. fixoEnt valid, fixoSai invalid → find closest fixo after ENT
 * 3. both invalid → return irrecuperavel=true
 * 
 * @param fixoEnt - Entry waypoint
 * @param fixoSai - Exit waypoint
 * @param aerovia - String like "UZ1" or "UZ1/UP2"
 * @param malhaIdx - Mesh graph
 * @returns Recovery object or null if no mesh
 */
function recoverRouteContinuity(
  fixoEnt: string,
  fixoSai: string,
  aerovia: string,
  malhaIdx: MeshGraph
): RecoveryResult | null

// Error context:
// "FIXO ENT RECUPERADO: INVALID → FIXO1 | HORA ENT: 0815 → 0802"
// "TRAJETORIA IRRECUPERAVEL: sem continuidade valida"
```

---

### Speed Validation & Correction (Phase 1)

```typescript
/**
 * Validate flight speed against aircraft reference speed.
 * Calculates V = distance / flight_time.
 * Tolerance: ±20% of reference speed.
 * 
 * If invalid: auto-correct departure time to match reference speed.
 * 
 * @param fixos - Route waypoints
 * @param horaEnt - Entry time (HHMM format)
 * @param horaSai - Exit time (HHMM format)
 * @param aerovia - Declared aeroways
 * @param acType - Aircraft type for reference speed lookup
 * @param segMap - Mesh segments
 * @returns {isValid, calcSpeed, refSpeed, correctedHoraSai}
 */
function validateSpeed(
  fixos: string[],
  horaEnt: string,
  horaSai: string,
  aerovia: string,
  acType: string,
  segMap: Map<string, number>
): {
  isValid: boolean
  calcSpeed: number    // calculated speed in kt
  refSpeed: number     // reference speed from ICAO_SPEEDS
  correctedHoraSai?: string  // if correction needed
  error?: string
}

// ICAO_SPEEDS includes:
// { A320: 450, B744: 490, B737: 450, E190: 430, ... }
// Default fallback: 450 kt

// Error format:
// "VELOCIDADE INCOMPATIVEL: 520 kt (ref 490) → HORA SAI corrigido 0845 → 0833"
```

---

### Graph Builder

```typescript
/**
 * Build adjacency structure from mesh for pathfinding.
 * @param malhaIdx - Mesh graph from parser
 * @param aerovia - Filter segments to specific aeroways
 * @returns Adjacency map: fixo → [{vizinho, dist}]
 */
function buildAdjacency(
  malhaIdx: MeshGraph,
  aerovia: string
): Record<string, Array<{vizinho: string, dist: number}>>
```

---

## RVSM Module (`scripts/rvsm/`)

### Occupancy Detector (Phase 2)

```typescript
const FL_RVSM_INF = 290  // bottom of RVSM block
const FL_RVSM_SUP = 410  // top of RVSM block

/**
 * Detect if trajectory crosses or occupies RVSM airspace (FL290–FL410).
 * Returns true if ANY part of trajectory is in RVSM block.
 * 
 * @param flEnt - Entry flight level
 * @param flSai - Exit flight level
 * @returns true if trajectory overlaps [290, 410]
 */
function cruzaRVSM(flEnt: number, flSai: number): boolean

// Math: trajectory interval [min(ENT,SAI), max(ENT,SAI)]
// Overlaps RVSM if: hi >= 290 && lo <= 410
```

---

### Occupancy Normalizer (Phase 2)

```typescript
type NormalizationResult = {
  normalizado: boolean
  msgNormalizacao: string | null
  corrections: {
    nivelEnt?: string
    nivelSai?: string
    horaEnt?: string
    horaSai?: string
  }
}

/**
 * Normalize trajectory crossing RVSM block to boundaries.
 * 
 * RULES:
 * 1. Discard if trajectory entirely below FL290 or above FL410
 * 2. Full descent (ENT > FL410, SAI < FL290) → normalize to FL410/FL290
 *    - Recalc HORA_ENT: SAI time minus descent time
 * 3. Full climb (ENT < FL290, SAI > FL410) → normalize to FL290/FL410
 *    - Recalc HORA_SAI: ENT time plus climb time
 * 4. Partial crossing → adjust single boundary to RVSM limit
 * 
 * Descent rate constant: 1500 ft/min (RAZAO_VERTICAL_MEDIA)
 * 
 * @param row - Original movement
 * @param corrected - Corrected movement (modified in-place)
 * @param colConfig - {nivelEnt, nivelSai, horaEnt, horaSai}
 * @returns Normalization result
 */
function normalizarOcupacaoRVSM(
  row: Movement,
  corrected: Movement,
  colConfig: ColumnMap
): NormalizationResult

// Error formats:
// "NORMALIZADO PARA OCUPAÇÃO RVSM: FL500/FL050 → FL410/FL290 | 0815/0930 → 0735/0930"
// "DESCARTAR — trajetória inteiramente fora RVSM: FL100/FL200"
// "NÍVEL ENT ACIMA RVSM (FL450) — ENT corrigido para FL410"
```

---

### Time Adjuster (Phase 2)

```typescript
/**
 * Convert HHMM string to minutes since midnight.
 * @param s - Time string ("0815", "08:15", "8:15")
 * @returns Minutes [0..1439] or null if invalid
 */
function hmToMin(s: string): number | null

/**
 * Convert minutes since midnight to HHMM string.
 * Handles wrap-around (1500 min → 0300 next day).
 * @param m - Minutes
 * @returns HHMM format ("0300")
 */
function minToHM(m: number): string

/**
 * Add minutes to a time string.
 * @param horaStr - Time in HHMM format
 * @param minutos - Minutes to add
 * @returns New time in HHMM format
 */
function adicionarMinutos(horaStr: string, minutos: number): string

/**
 * Subtract minutes from a time string.
 * @param horaStr - Time in HHMM format
 * @param minutos - Minutes to subtract
 * @returns New time in HHMM format (wraps backward)
 */
function subtrairMinutos(horaStr: string, minutos: number): string

// Example:
// adicionarMinutos("0815", 45) → "0900"
// subtrairMinutos("0100", 30) → "2330" (previous day)
```

---

## Main Orchestrators

### Phase 1 Validation

```typescript
type ValidationContextPhase1 = {
  malhaIdx: MeshGraph
  approvedAC: Set<string>
  columnMap: ColumnMap
}

/**
 * Full Phase 1 validation pipeline: Route & Speed.
 * Applied in order:
 * 1. Mandatory fields
 * 2. Aircraft type approval
 * 3. FL boundaries
 * 4. Aeroway existence
 * 5. Fixo compatibility
 * 6. Route continuity recovery (auto-correct)
 * 7. Speed validation (auto-correct HORA SAI)
 * 
 * @param row - Movement to validate
 * @param context - Parsed mesh, aircraft, columns
 * @returns ValidationResult with errors and corrections
 */
function validateMovementPhase1(
  row: Movement,
  context: ValidationContextPhase1
): ValidationResult
```

---

### Phase 2 Validation

```typescript
type ValidationContextPhase2 = ValidationContextPhase1 & {
  rvsm: {
    flInf: number      // default 290
    flSup: number      // default 410
    descentRate: number // default 1500 ft/min
  }
}

/**
 * Full Phase 2 validation pipeline: RVSM Occupancy Normalization.
 * Includes all Phase 1 checks plus:
 * 8. RVSM occupancy detection
 * 9. RVSM occupancy normalization (auto-correct FL & time)
 * 10. Speed re-validation (Phase 1 again)
 * 
 * @param row - Movement to validate
 * @param context - Extended with RVSM config
 * @returns ValidationResult with RVSM corrections
 */
function validateMovementPhase2(
  row: Movement,
  context: ValidationContextPhase2
): ValidationResult
```

---

## Export Module (`scripts/ui/`)

### CSV Generation

```typescript
/**
 * Escape CSV cell for safe output.
 * Quotes if contains semicolon, quote, or newline.
 * @param val - Cell value
 * @returns Escaped string
 */
function csvEscape(val: any): string

/**
 * Generate complete CSV from validation results.
 * Includes ERROS column as first column.
 * Adds UTF-8 BOM for Excel compatibility.
 * 
 * @param results - Array of ValidationResult
 * @param headers - Original column names
 * @returns CSV text (with BOM)
 */
function generateCSV(
  results: ValidationResult[],
  headers: string[]
): string

/**
 * Download CSV file to client.
 * @param csvText - CSV content
 * @param filename - Suggested filename
 */
function downloadCSV(csvText: string, filename: string): void

// Generated CSV structure:
// ERROS;INDICATIVO;AERONAVE;NIVEL_ENT;NIVEL_SAI;...
// "";CALLSIGN1;A320;290;410;...
// "FIXO RECUPERADO";CALLSIGN2;B744;FL410;FL050;...
```

---

## Error Message Standards

### Format
```
ERROR_CODE | ERROR_DESCRIPTION (optional context)
```

### Severity Levels

**CRITICAL** (stops validation of row):
- CAMPO VAZIO: {field}
- AERONAVE NAO APROVADA RVSM: {acType}
- AEROVIA NAO ENCONTRADA: {awy}

**WARNING** (row marked with error but continues):
- VELOCIDADE INCOMPATIVEL: {calc}kt (ref {ref}kt)
- FIXO INCOMPATIVEL: {fixo} nao pertence a {awy}

**FIXED** (auto-corrected, not reported as error):
- FIXO ENT RECUPERADO: {old} → {new}
- HORA SAI corrigida: {old} → {new}
- NORMALIZADO PARA OCUPAÇÃO RVSM: FL{old}→FL{new}

**DISCARD** (movement excluded from output):
- LINHA DUPLICADA
- DESCARTAR — trajetória inteiramente fora RVSM

---

## Data Type Summary

```typescript
// Core
type Movement = Record<string, string>
type ValidationResult = {
  original: Movement
  corrected: Movement
  errors: string[]
  hasError: boolean
  hasFix: boolean
  isNormalized?: boolean
}

// Mesh
type MeshGraph = {
  segMap: Map<string, number>
  fixToAwy: Map<string, Set<string>>
  awyFixos: Map<string, Set<string>>
}

// Configuration
type ColumnMap = Record<string, string | undefined>
type ValidationContext = {
  malhaIdx: MeshGraph
  approvedAC: Set<string>
  columnMap: ColumnMap
  rvsm?: RVSMConfig
}
```

---

## Batch Operations

```typescript
/**
 * Validate entire tape at once.
 * Processes in chunks with progress callback.
 * @param movements - All rows from tape
 * @param context - Validation context
 * @param onProgress - Callback (completed, total)
 * @returns Array of ValidationResult
 */
async function batchValidate(
  movements: Movement[],
  context: ValidationContext,
  onProgress?: (completed: number, total: number) => void
): Promise<ValidationResult[]>

// Example:
const results = await batchValidate(
  tapeData,
  context,
  (done, total) => console.log(`${done}/${total}`)
)
```

---

## Changelog / Versioning

**v3.0** (Current)
- Phase 2: RVSM Occupancy Normalization
- Automatic FL boundary adjustment
- Time recalculation for normalized flights
- Improved error categorization

**v2.2**
- Phase 1: Route & Speed Validation
- Route continuity recovery
- Speed validation with auto-correction

**v1.0**
- Basic CSV validation
- Monolithic HTML application
