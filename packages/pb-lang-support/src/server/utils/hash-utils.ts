/**
 * Hash utility functions
 * Used to generate hash values of document content for convenient cache management
 */

import * as crypto from 'crypto';

/**
 * Generate MD5 hash value of a string
 */
export function generateHash(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Simple string hash function (faster alternative solution)
 */
export function simpleHash(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;

    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    return hash;
}
