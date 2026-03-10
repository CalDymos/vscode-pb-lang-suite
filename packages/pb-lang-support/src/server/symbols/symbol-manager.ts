/**
 * Symbol manager
 * Responsible for parsing and managing PureBasic symbols
 */

import { PureBasicSymbol, SymbolKind } from './types';
import { symbolCache } from './symbol-cache';
import { optimizedSymbolParser } from './optimized-symbol-parser';
import { ParsedDocument } from './optimized-symbol-parser';

/**
 * Batch parse multiple documents (performance optimized)
 */
export async function parseMultipleDocuments(documents: Array<{ uri: string; text: string }>): Promise<Map<string, ParsedDocument>> {
    return await optimizedSymbolParser.parseMultipleDocuments(documents);
}

/**
 * Retrieve symbol cache statistics
 */
export function getSymbolCacheStats() {
    return symbolCache.getCacheStats();
}

/**
 * Retrieve performance statistics
 */
export function getPerformanceStats() {
    return optimizedSymbolParser.getPerformanceStats();
}

/**
 * Clean up performance cache
 */
export function cleanupPerformanceCache() {
    optimizedSymbolParser.cleanup();
}