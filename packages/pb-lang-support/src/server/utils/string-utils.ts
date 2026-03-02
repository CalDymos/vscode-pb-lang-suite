/**
 * String processing utility functions
 */

/**
 * Check if entire line is within string literal
 */
export function isInStringLiteral(line: string): boolean {
    let inString = false;
    let inStringChar = '';

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (!inString) {
            if (char === '"' || char === "'") {
                inString = true;
                inStringChar = char;
            }
        } else {
            if (char === inStringChar) {
                // Check if it is an escape character
                if (i === 0 || line[i - 1] !== '\\') {
                    inString = false;
                    inStringChar = '';
                }
            }
        }
    }

    return inString;
}

/**
 * Check if specified position is within string literal
 */
export function isPositionInString(line: string, position: number): boolean {
    let inString = false;
    let inStringChar = '';
    let i = 0;

    while (i < line.length && i < position) {
        const char = line[i];

        if (!inString) {
            if (char === '"' || char === "'") {
                inString = true;
                inStringChar = char;
            }
        } else {
            if (char === inStringChar) {
                // Check if it is an escape character
                if (i === 0 || line[i - 1] !== '\\') {
                    inString = false;
                    inStringChar = '';
                }
            }
        }
        i++;
    }

    return inString;
}

/**
 * Strips inline comments (;...) outside of string literals.
 * Handles both double-quoted strings ("...") and single-char literals ('x').
 */
export function stripInlineComment(value: string): string {
    let inDoubleString = false;
    let inCharLiteral = false;

    for (let i = 0; i < value.length; i++) {
        const char = value[i];

        if (char === '"' && !inCharLiteral) {
            inDoubleString = !inDoubleString;
        } else if (char === "'" && !inDoubleString) {
            inCharLiteral = !inCharLiteral;
        } else if (char === ';' && !inDoubleString && !inCharLiteral) {
            return value.substring(0, i);
        }
    }
    return value;
}

/**
 * Returns a safe index for range calculations.
 * Falls back to 0 if the substring cannot be found.
 */
export function safeIndexOf(haystack: string, needle: string): number {
    const idx = haystack.indexOf(needle);
    return idx >= 0 ? idx : 0;
}

/**
 * Escape special characters in regular expressions
 */
export function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}