/**
 * Mesh Parser Module
 * Parses airway mesh data from CSV and builds graph structure
 */

import { parseCSVAsObjects } from './csv-parser';

/**
 * Graph structure for airway mesh
 * - segMap: Maps bidirectional segments to distances
 * - fixToAwy: Maps fixes to their connected airways
 * - awyFixos: Maps airways to their connected fixes
 */
export interface MeshGraph {
  segMap: Map<string, number>;
  fixToAwy: Map<string, Set<string>>;
  awyFixos: Map<string, Set<string>>;
}

/**
 * Parse mesh CSV data and build graph structure
 * 
 * CSV columns: A, B, AWY, DIST
 * - A, B: Fix identifiers
 * - AWY: Airway identifier
 * - DIST: Distance in float
 * 
 * @param csvText - Raw CSV content
 * @param sep - Optional CSV delimiter
 * @returns MeshGraph structure with segment, fix-to-airway, and airway-to-fix mappings
 */
export function parseMesh(csvText: string, sep?: string): MeshGraph {
  const rows = parseCSVAsObjects(csvText, sep);
  
  const segMap = new Map<string, number>();
  const fixToAwy = new Map<string, Set<string>>();
  const awyFixos = new Map<string, Set<string>>();

  for (const row of rows) {
    // Extract and normalize columns
    const fixA = row.A?.trim().toUpperCase();
    const fixB = row.B?.trim().toUpperCase();
    const awy = row.AWY?.trim().toUpperCase();
    const distStr = row.DIST?.trim();

    // Ignore empty rows
    if (!fixA || !fixB || !awy || !distStr) continue;

    // Parse distance as float
    const dist = parseFloat(distStr);
    if (isNaN(dist)) continue;

    // Create bidirectional segment keys
    const segKey1 = `${fixA}|${fixB}|${awy}`;
    const segKey2 = `${fixB}|${fixA}|${awy}`;

    // Populate segMap
    segMap.set(segKey1, dist);
    segMap.set(segKey2, dist);

    // Populate fixToAwy: fixA -> {awy}
    if (!fixToAwy.has(fixA)) {
      fixToAwy.set(fixA, new Set());
    }
    fixToAwy.get(fixA)!.add(awy);

    // Populate fixToAwy: fixB -> {awy}
    if (!fixToAwy.has(fixB)) {
      fixToAwy.set(fixB, new Set());
    }
    fixToAwy.get(fixB)!.add(awy);

    // Populate awyFixos: awy -> {fixA, fixB}
    if (!awyFixos.has(awy)) {
      awyFixos.set(awy, new Set());
    }
    awyFixos.get(awy)!.add(fixA);
    awyFixos.get(awy)!.add(fixB);
  }

  return {
    segMap,
    fixToAwy,
    awyFixos,
  };
}
