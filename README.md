# CARSAMMA RVSM Validator

A TypeScript-based validation and processing system for RVSM (Reduced Vertical Separation Minima) flight data from aviation tape records.

## Overview

The CARSAMMA RVSM Validator is a specialized tool designed to parse, validate, and normalize aviation flight data according to RVSM requirements. It processes CSV tape records containing flight information and applies comprehensive validation rules to ensure data integrity and compliance with operational standards.

The system performs multiple validation stages including mandatory field verification, flight level normalization, time normalization, and route/speed validation to ensure all flight records meet RVSM standards before operational use.

## Features

- **RVSM Validation**: Comprehensive validation of flight records against RVSM compliance rules
- **Flight Level Normalization**: Automatic normalization and validation of entry and exit flight levels (NIVEL_ENT, NIVEL_SAI)
- **Time Normalization**: Standardized processing of flight times with format correction (HORA_ENT, HORA_SAI)
- **Mandatory Field Validation**: Ensures all critical flight data fields are present and properly formatted
- **Route Validation**: Validates flight routes against known airways and fix points
- **Speed Validation**: Verification of aircraft speed parameters against operational limits
- **Data Correction**: Automated correction and standardization of flight record data
- **Detailed Reporting**: Comprehensive validation results with per-record and aggregate statistics

## Architecture

The validator follows a modular, pipeline-based architecture:

```
Input (CSV Tape)
    ↓
Parser Module (parseTape)
    ↓
Validation Pipeline
    ├─ Mandatory Fields Validator
    ├─ Flight Level Validator
    └─ Time Normalizer
    ↓
Output (Processed Records with Validations)
```

### Core Modules

The system is organized into the following module categories:

- **Parsers** (`./parsers`): CSV tape parsing and data extraction
- **Validators** (`./validators`): Validation rules and logic
- **Utils** (`./utils`): Utility functions including time normalization

## Processing Pipeline

The tape processing pipeline follows these sequential steps:

### Step 1: Parse Tape CSV
Reads raw CSV content and extracts structured flight records with all relevant fields.

### Step 2: For Each Record
- **Validate Mandatory Fields**: Ensures required fields (CHAMADA, TIPO, ORIGEM, DESTINO, etc.) are present
- **Extract and Correct Data**: Applies field validation rules and generates corrected record
- **Normalize Times**: Standardizes HORA_ENT and HORA_SAI fields to consistent format
- **Validate Flight Levels**: Ensures NIVEL_ENT and NIVEL_SAI are valid flight level designations

### Step 3: Generate Results
Returns comprehensive processing results including:
- Total record count
- Valid record count
- Invalid record count
- Detailed per-record validation information

## Operational Rules

The validator enforces the following operational rules:

### Flight Level Requirements
- Flight levels must conform to RVSM standard designations (FL###)
- Entry and exit flight levels are validated independently
- Flight level values are normalized to standard format

### Time Requirements
- Times are expected in HHMM format (24-hour)
- Entry time (HORA_ENT) and exit time (HORA_SAI) are normalized
- Time normalization handles common formatting variations

### Mandatory Fields
The following fields must be present for record validity:
- **CHAMADA**: Aircraft callsign
- **TIPO**: Aircraft type
- **ORIGEM**: Origin airport
- **DESTINO**: Destination airport
- **FIXO_ENT**: Entry fix point
- **HORA_ENT**: Entry time
- **NIVEL_ENT**: Entry flight level
- **FIXO_SAI**: Exit fix point
- **HORA_SAI**: Exit time
- **NIVEL_SAI**: Exit flight level

### Record Validity
A record is considered valid when:
- All mandatory field validations pass
- Entry flight level (NIVEL_ENT) is valid
- Exit flight level (NIVEL_SAI) is valid

## Current Modules

### Implemented

- **Tape Parser** (`parseTape`): Parses CSV tape content into structured records
- **Mandatory Fields Validator** (`validateMandatoryFields`): Validates presence and format of required fields
- **Flight Level Validator** (`validateFlightLevel`): Validates flight level designations
- **Time Normalizer** (`normalizeTime`): Standardizes time format to HHMM

### Processing Result Structure

```typescript
interface ProcessedRecord {
  original: Record<string, string>;        // Original CSV data
  corrected: Record<string, string>;       // Corrected data
  validations: {
    mandatory: ValidationResult;           // Mandatory field validation
    nivelEnt: ValidationResult;            // Entry flight level validation
    nivelSai: ValidationResult;            // Exit flight level validation
  };
}

interface TapeProcessingResult {
  total: number;                          // Total records processed
  valid: number;                          // Valid records count
  invalid: number;                        // Invalid records count
  records: ProcessedRecord[];             // Detailed record results
}
```

## Future Roadmap

### Phase 1: Extended Validation
- [ ] Airway validation against known airways (UZ routes, etc.)
- [ ] Aircraft speed validation for route compliance
- [ ] Detailed error messages and correction suggestions

### Phase 2: Occupancy Inference
- [ ] Occupancy status inference based on flight patterns
- [ ] RVSM occupancy determination (Y/N)
- [ ] Conflict detection and altitude slot assignment

### Phase 3: Advanced Analytics
- [ ] Route optimization analysis
- [ ] Historical compliance reporting
- [ ] Anomaly detection and flagging

### Phase 4: API & Integration
- [ ] REST API for external system integration
- [ ] Batch processing capabilities
- [ ] Real-time stream processing support
- [ ] Database persistence layer

## Project Structure

```
carsamma-rvsm-validator/
├── scripts/
│   └── app.ts                    # Main application entry point
├── parsers/
│   └── index.ts                  # CSV tape parser
├── validators/
│   └── index.ts                  # Validation rules and functions
├── utils/
│   └── time-utils.ts             # Time normalization utilities
├── README.md                     # This file
├── package.json                  # Project dependencies
└── tsconfig.json                 # TypeScript configuration
```

## Usage Example

```typescript
import { processTape } from './scripts/app';

const csvData = `ERROS;DATA;CHAMADA;TIPO;ORIGEM;DESTINO;FIXO ENT;HORA ENT;NIVEL ENT;AEROVIA;FIXO SAI;HORA SAI;NIVEL SAI;INDICATIVO;RVSM
;;B737;GIG;SDU;SUVAA;0815;FL350;UZ1;MAMBO;0900;FL380;TAP;Y
;;A320;MAO;CGH;SOBRA;0730;FL320;UZ5;BRAVA;0845;FL350;;N`;

const result = processTape(csvData);

console.log(`Total Records: ${result.total}`);
console.log(`Valid Records: ${result.valid}`);
console.log(`Invalid Records: ${result.invalid}`);

result.records.forEach((record, idx) => {
  console.log(`Record ${idx + 1}:`, record.validations);
});
```

## Technology Stack

- **Language**: TypeScript
- **Runtime**: Node.js
- **Format**: CSV (Comma-Separated Values)

## License

This project is part of the CARSAMMA initiative.

---

**Status**: Active Development (feature/core-parsers branch)  
**Last Updated**: 2026-05-25
