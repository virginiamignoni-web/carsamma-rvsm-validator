# CARSAMMA RVSM Validator — Architecture

## Overview

The RVSM Validator is being refactored from two monolithic HTML applications into a modular TypeScript/JavaScript platform with clear separation of concerns.

```
┌─────────────────────────────────────────────────────────────────┐
│                        UI Layer (Svelte/React)                  │
│  ┌─────────────────┬──────────────────┬──────────────────────┐  │
│  │   Phase 1 UI    │   Phase 2 UI     │   Common Components  │  │
│  │  (Route/Speed)  │ (RVSM Norm.)     │  (Upload, Table)     │  │
│  └─────────────────┴──────────────────┴──────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    Validation Engine                             │
│  ┌──────────────┬──────────────┬────────────┬──────────────┐   │
│  │   Parsers    │  Validators  │  Routing   │    RVSM      │   │
│  └──────────────┴──────────────┴────────────┴──────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     Data Models & Utils                          │
│  ┌─────────────┬────────────┬──────────┬──────────────────┐   │
│  │   Types     │  Constants │  Helpers │  Performance     │   │
│  └─────────────┴────────────┴──────────┴──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

### `/scripts/` — Core Validation Engine

#### `parsers/`
- `csv-parser.ts`: CSV parsing with auto-delimiter detection
- `tape-parser.ts`: FIR movement tape parsing + header detection
- `mesh-parser.ts`: Aeroway mesh graph construction
- `aircraft-parser.ts`: Approved aircraft list parsing

**Key Exports:**
```typescript
parseCSV(text: string, sep?: string): string[][]
parseTape(text: string): {headers: string[], data: Record<string, string>[]}
parseMesh(text: string): {segMap, fixToAwy, awyFixos}
parseAircraft(text: string): Set<string>
```

#### `validators/`
- `mandatory-fields.ts`: Mandatory field validation
- `aircraft-type.ts`: RVSM-approved aircraft validation
- `altitude-levels.ts`: FL boundary checks (FL290–FL410)
- `duplicates.ts`: Duplicate line detection
- `airway-mesh.ts`: Airway/fix compatibility checks

**Core Pattern:**
```typescript
type ValidationResult = {
  errors: string[]
  corrected: Record<string, string>
  hasFix: boolean
}

function validate(row: Record<string, string>, context): ValidationResult
```

#### `routing/`
- `distance-calculator.ts`: Route distance via segment traversal (Dijkstra)
- `route-continuity.ts`: **Phase 1** — automatic waypoint recovery
- `speed-normalizer.ts`: **Phase 1** — velocity validation + auto-correction
- `graph-builder.ts`: Graph construction from mesh (adjacency lists)

**Example:**
```typescript
// Calculate actual distance flown
const dist = calcRouteDistance(
  fixos: ['FIXO_A', 'FIXO_B', 'FIXO_C'],
  awys: ['UZ1', 'UZ2'],
  segMap
)

// Recover missing waypoint
const recovered = recoverRouteContinuity(
  fixoEnt: 'INVALID_FIX',
  fixoSai: 'VALID_FIX',
  aerovia: 'UZ1',
  malhaIdx
)
```

#### `rvsm/`
- `occupancy-detector.ts`: Detects if trajectory crosses RVSM airspace
- `occupancy-normalizer.ts`: **Phase 2** — normalizes FL entry/exit to boundaries
- `time-adjuster.ts`: Recalculates ETAs based on normalized altitudes
- `altitude-constants.ts`: FL_RVSM_INF=290, FL_RVSM_SUP=410, descent rates

**Core Logic (Phase 2):**
```typescript
// Detects if any part of trajectory occupies RVSM
cruzaRVSM(flEnt: number, flSai: number): boolean

// Normalizes crossing trajectories to RVSM boundaries
normalizarOcupacaoRVSM(
  row: Record<string, string>,
  corrected: Record<string, string>,
  parseFL: (s: string) => number | null
): {normalizado: boolean, msgNormalizacao: string | null}
```

#### `ui/`
- `table-renderer.ts`: Dynamic result table with filtering
- `progress-bar.ts`: Chunked processing feedback
- `stats-display.ts`: Error/fix/normalized counts
- `export-csv.ts`: BOM-aware CSV generation
- `file-upload.ts`: Drag-drop + file selection handlers

### `/assets/css/`
- `theme-variables.ts` / `.css`: Dark theme tokens (--accent, --red, --green, etc.)
- `components.css`: Reusable UI component styles
- `responsive.css`: Mobile-first breakpoints

### `/legacy/`
- `PURPLE_RVSM_fase 1 - ajuste rota e velocidade.html`: Phase 1 monolith (archived)
- `RVSM_Validator_fase_2_ajuste nivel RVSM.html`: Phase 2 monolith (archived)

### `/docs/`
- `ARCHITECTURE.md` (this file)
- `API.md`: Function signatures and data contracts
- `OPERATIONS.md`: User guides and workflows
- `DATA_FORMATS.md`: CSV column specifications
- `ERRORS.md`: Complete error catalog

---

## Data Flow

### Phase 1: Route & Speed Validation

```
┌─ Upload tape, mesh, aircraft ─┐
│                                │
├─ Parse CSV files ──────────────┤
│ • Detect delimiters            │
│ • Extract headers              │
│ • Map column names             │
│                                │
├─ Build mesh graph ─────────────┤
│ • Segment map (FIXO_A|FIXO_B)  │
│ • Fixo→Airway index            │
│ • Distance caching             │
│                                │
├─ Validate each movement ───────┤
│ • Mandatory fields check       │
│ • Aircraft type (RVSM approved)│
│ • FL boundaries (290–410)      │
│ • Airway existence             │
│ • Fixo compatibility           │
│ • Route continuity recovery ◄──┤ AUTO-CORRECT
│ • Speed validation ◄───────────┤ AUTO-CORRECT HORA SAI
│                                │
├─ Generate corrected CSV ───────┤
│ • Preserve original fields     │
│ • Apply all corrections        │
│ • Add ERROS column             │
│                                │
└─ Download validated tape ──────┘
```

### Phase 2: RVSM Occupancy Normalization

```
┌─ Upload tape, mesh, aircraft ─┐
│ (same as Phase 1)              │
│                                │
├─ Parse & build mesh ──────────┤
│                                │
├─ Validate each movement ───────┤
│ • All Phase 1 checks           │
│ • RVSM occupancy detection ◄───┤
│   - Does trajectory cross      │
│     FL290–FL410?               │
│ • Normalize if crossing ◄──────┤ AUTO-CORRECT FL & TIME
│   - Adjust FL_ENT/FL_SAI       │
│   - Recalc departure time      │
│ • Speed validation (Phase 1)   │
│                                │
├─ Generate corrected CSV ───────┤
│ • Include RVSM corrections     │
│                                │
└─ Download validated tape ──────┘
```

---

## Key Algorithms

### Route Continuity Recovery (Phase 1)

**Problem:** FIXO_ENT or FIXO_SAI invalid for declared airway.
**Solution:** BFS from valid waypoint to find closest valid alternative.

```typescript
// Pseudo-code
function recoverRouteContinuity(fixoEnt, fixoSai, aerovia, malhaIdx) {
  // Build adjacency from all segments in declared aeroways
  const adj = buildAdjacency(malhaIdx, aerovia)
  
  // Case 1: fixoEnt invalid, fixoSai valid
  if (!valid(fixoEnt) && valid(fixoSai)) {
    // BFS from fixoSai backward (up to 200 hops)
    // Find closest neighbor fixo that precedes logically
    return {novoFixoEnt, distância, horarioRecalculado}
  }
  
  // Case 2: fixoEnt valid, fixoSai invalid
  if (valid(fixoEnt) && !valid(fixoSai)) {
    // BFS from fixoEnt forward
    // Find closest neighbor fixo that follows logically
    return {novoFixoSai, distância, horarioRecalculado}
  }
  
  // Case 3: both invalid
  return {irrecuperavel: true}
}
```

### RVSM Occupancy Normalization (Phase 2)

**Rules:**
1. **Discard entirely** if trajectory never enters FL290–FL410
2. **Normalize boundaries** if crossing the entire RVSM block:
   - **Descent FL500→FL100:** normalize to FL410→FL290, recalc HORA_ENT
   - **Climb FL100→FL500:** normalize to FL290→FL410, recalc HORA_SAI
3. **Adjust single boundary** if entering or exiting RVSM partially

```typescript
function cruzaRVSM(flEnt, flSai) {
  const lo = Math.min(flEnt, flSai)
  const hi = Math.max(flEnt, flSai)
  // Overlaps RVSM block if [lo, hi] ∩ [290, 410] ≠ ∅
  return hi >= FL_RVSM_INF && lo <= FL_RVSM_SUP
}

function normalizarOcupacaoRVSM(row, corrected, parseFL) {
  const flEnt = parseFL(corrected['NIVEL ENT'])
  const flSai = parseFL(corrected['NIVEL SAI'])
  
  // Full crossing: descent
  if (flEnt > 410 && flSai < 290) {
    const tempoRVSM = calcVerticalTime(410 - 290)
    corrected['NIVEL ENT'] = '410'
    corrected['NIVEL SAI'] = '290'
    corrected['HORA ENT'] = subtractMin(corrected['HORA SAI'], tempoRVSM)
    return {normalizado: true, msg: '...'}
  }
  
  // Full crossing: climb
  if (flEnt < 290 && flSai > 410) {
    const tempoRVSM = calcVerticalTime(410 - 290)
    corrected['NIVEL ENT'] = '290'
    corrected['NIVEL SAI'] = '410'
    corrected['HORA SAI'] = addMin(corrected['HORA ENT'], tempoRVSM)
    return {normalizado: true, msg: '...'}
  }
  
  // ... single-boundary adjustments ...
}
```

---

## Type System (TypeScript)

```typescript
// CSV row with flexible column names
type Movement = Record<string, string>

// Mesh graph representation
type MeshGraph = {
  segMap: Map<string, number>        // "FIXO_A|FIXO_B|AWY" → distance
  fixToAwy: Map<string, Set<string>> // "FIXO" → Set<"AWY1", "AWY2">
  awyFixos: Map<string, Set<string>> // "AWY" → Set<"FIXO_A", "FIXO_B">
}

// Validation output per movement
type ValidationResult = {
  original: Movement
  corrected: Movement
  errors: string[]
  hasError: boolean
  hasFix: boolean
  isNormalized?: boolean
}

// Phase 1 context
type ValidationContextPhase1 = {
  malhaIdx: MeshGraph
  approvedAC: Set<string>
  columnMap: ColumnMap  // detected header aliases
}

// Phase 2 context (extends Phase 1)
type ValidationContextPhase2 = ValidationContextPhase1 & {
  rvsm: RVSMConfig
}

type ColumnMap = {
  indicative?: string
  aeronave?: string
  nivelEnt?: string
  nivelSai?: string
  horaEnt?: string
  horaSai?: string
  aerovia?: string
  fixos?: string
}
```

---

## Performance Considerations

### Phase 1 (Route & Speed)
- **Bottleneck:** Distance calculations via segment traversal
- **Optimization:** Pre-compute Dijkstra for each waypoint pair (LRU cache)
- **Chunking:** Process 500 rows at a time to yield UI thread

### Phase 2 (RVSM)
- **Bottleneck:** FL boundary checking for every movement
- **Optimization:** Vectorize boundary logic (avoid repeated function calls)
- **Memory:** Store mesh in indexed maps (not 2D arrays)

### Recommended Limits
- **CSV size:** < 50MB (browser memory)
- **Rows per tape:** < 100k (processing time < 30s)
- **Table preview:** Show max 2000 rows (DOM rendering)

---

## Integration Points

### For UI Frameworks (Svelte/React)

```typescript
// Import core validators
import { validateMovement } from './scripts/validators'
import { ValidationContextPhase1 } from './scripts/types'

// Example React component
async function ValidationForm() {
  const [results, setResults] = useState([])
  
  const handleValidate = async (tape, mesh, aircraft) => {
    const context = await buildContext(tape, mesh, aircraft)
    const validated = tape.data.map(row =>
      validateMovement(row, context)
    )
    setResults(validated)
  }
  
  return (...)
}
```

### For CLI / Server

```typescript
// Node.js / CLI usage
import { parseTape, parseMesh, validateMovement } from './scripts'
import { buildMeshGraph } from './scripts/routing'

async function validateTapeFile(tapeFile, meshFile, acFile) {
  const tape = parseTape(await fs.readFile(tapeFile))
  const mesh = parseMesh(await fs.readFile(meshFile))
  const ac = parseAircraft(await fs.readFile(acFile))
  
  const context = {malhaIdx: mesh, approvedAC: ac}
  
  return tape.data.map(row =>
    validateMovement(row, context)
  )
}
```

---

## Testing Strategy

### Unit Tests (per module)
```
scripts/parsers/__tests__/csv-parser.test.ts
scripts/validators/__tests__/altitude-levels.test.ts
scripts/routing/__tests__/distance-calculator.test.ts
scripts/rvsm/__tests__/occupancy-detector.test.ts
```

### Integration Tests
```
__tests__/phase1-full-flow.test.ts
__tests__/phase2-full-flow.test.ts
```

### Test Data
```
test-data/
├── tape-valid.csv
├── tape-with-errors.csv
├── mesh-sample.csv
└── aircraft-list.csv
```

---

## Future Roadmap

- [ ] WebWorker offload for heavy processing
- [ ] Real-time tape streaming (ws://)
- [ ] Multi-language error messages
- [ ] Batch validation API
- [ ] Database integration (PostgreSQL mesh snapshots)
- [ ] Audit logging + replay
- [ ] Performance profiling dashboards
