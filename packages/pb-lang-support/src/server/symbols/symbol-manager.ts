/**
 * 符号管理器
 * 负责解析和管理PureBasic符号
 */

import { PureBasicSymbol, SymbolKind } from './types';
import { symbolCache } from './symbol-cache';
import { optimizedSymbolParser } from './optimized-symbol-parser';
import { ParsedDocument } from './optimized-symbol-parser';

/**
 * 批量解析多个文档（性能优化）
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
 * 清理性能缓存
 */
export function cleanupPerformanceCache() {
    optimizedSymbolParser.cleanup();
}