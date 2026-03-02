/**
 * Signature help provider
 * Provides function parameter hint functionality for PureBasic
 */

import {
    SignatureHelp,
    SignatureInformation,
    ParameterInformation,
    TextDocumentPositionParams
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getModuleFunctionCompletions as getModuleFunctions } from '../utils/module-resolver';
import { getActiveUsedModules } from '../utils/scope-manager';
import { escapeRegExp} from '../utils/string-utils';
import { ApiFunctionListing } from '../utils/api-function-listing';

/**
 * Handle signature help request
 */
export function handleSignatureHelp(
    params: TextDocumentPositionParams,
    document: TextDocument,
    documentCache: Map<string, TextDocument>,
    apiListing?: ApiFunctionListing
): SignatureHelp | null {
    const position = params.position;
    const text = document.getText();
    const lines = text.split('\n');
    const currentLine = lines[position.line] || '';
    const linePrefix = currentLine.substring(0, position.character);

    // Find function call (supports Module::Func and Func)
    const functionCall = findFunctionCall(linePrefix);
    if (!functionCall) {
        return null;
    }

    // Find function definition
    let functionDefinition = findFunctionDefinition(
        functionCall.functionName,
        document,
        documentCache,
        functionCall.moduleName || null,
        position.line,
        apiListing
    );

    if (!functionDefinition) {
        return null;
    }

    // Calculate current parameter position
    const activeParameter = calculateActiveParameter(functionCall.parametersText);

    // Create signature information
    const signature: SignatureInformation = {
        label: functionDefinition.signature,
        documentation: functionDefinition.documentation,
        parameters: functionDefinition.parameters
    };

    return {
        signatures: [signature],
        activeSignature: 0,
        activeParameter: Math.min(activeParameter, functionDefinition.parameters.length - 1)
    };
}

/**
 * Find function call in current line
 */
function findFunctionCall(linePrefix: string): {
    moduleName?: string;
    functionName: string;
    parametersText: string;
} | null {
    // 1) Module call: Module::Func(
    const modCall = linePrefix.match(/(\w+)::(\w+)\s*\(([^)]*)$/);
    if (modCall) {
        return {
            moduleName: modCall[1],
            functionName: modCall[2],
            parametersText: modCall[3] || ''
        };
    }

    // 2) Regular call: Func(
    const call = linePrefix.match(/(\w+)\s*\(([^)]*)$/);
    if (call) {
        return {
            functionName: call[1],
            parametersText: call[2] || ''
        };
    }

    return null;
}

/**
 * Find function definition
 */
function findFunctionDefinition(
    functionName: string,
    document: TextDocument,
    documentCache: Map<string, TextDocument>,
    moduleName: string | null,
    currentLine: number,
    apiListing?: ApiFunctionListing
): {
    signature: string;
    documentation: string;
    parameters: ParameterInformation[];
} | null {
    // Module functions first (if module name is explicitly specified)
    if (moduleName) {
        const funcs = getModuleFunctions(moduleName, document, documentCache);
        const item = funcs.find(f => f.name.toLowerCase() === functionName.toLowerCase());
        if (item) {
            const parameters = parseParameters(item.parameters || '');
            return {
                signature: item.signature,
                documentation: item.documentation,
                parameters
            };
        }
        // If not found in module, try user procedure/built-in later
        // 若模块内未找到，后续再尝试用户过程/内置
    }

    // Find user procedure in current document
    let definition = searchFunctionInDocument(functionName, document);
    if (definition) return definition;

    // Search in other open documents
    for (const [uri, doc] of documentCache) {
        if (uri !== document.uri) {
            definition = searchFunctionInDocument(functionName, doc);
            if (definition) return definition;
        }
    }

    // Search in modules imported by UseModule (when module name is not specified)
    if (!moduleName) {
        const used = getActiveUsedModules(document.getText(), currentLine);
        for (const mod of used) {
            const funcs = getModuleFunctions(mod, document, documentCache);
            const item = funcs.find(f => f.name.toLowerCase() === functionName.toLowerCase());
            if (item) {
                const parameters = parseParameters(item.parameters || '');
                return {
                    signature: item.signature,
                    documentation: item.documentation,
                    parameters
                };
            }
        }
    }

    // Check if this is an OS API function listed in APIFunctionListing.txt
    const apiSig = getApiFunctionSignature(functionName, apiListing);
    if (apiSig) return apiSig;

    // Check if it is a built-in function
    return getBuiltInFunctionSignature(functionName);
}

/**
 * Search for function definition in document
 */
function searchFunctionInDocument(
    functionName: string,
    document: TextDocument
): {
    signature: string;
    documentation: string;
    parameters: ParameterInformation[];
} | null {
    const text = document.getText();
    const lines = text.split('\n');
    const safeFunction = escapeRegExp(functionName);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Match procedure definition
        const procMatch = line.match(new RegExp(`^Procedure(?:\\.(\\w+))?\\s+(${safeFunction})\\s*\\(([^)]*)\\)`, 'i'));
        if (procMatch) {
            const returnType = procMatch[1] || '';
            const name = procMatch[2];
            const paramsText = procMatch[3] || '';

            const signature = returnType
                ? `Procedure.${returnType} ${name}(${paramsText})`
                : `Procedure ${name}(${paramsText})`;

            const parameters = parseParameters(paramsText);

            return {
                signature,
                documentation: `User-defined procedure: ${name}`,
                parameters
            };
        }
    }

    return null;
}

/**
 * Parse parameter list
 */
function parseParameters(paramsText: string): ParameterInformation[] {
    if (!paramsText.trim()) {
        return [];
    }

    const parameters: ParameterInformation[] = [];
    const paramList = paramsText.split(',');

    for (const param of paramList) {
        const trimmedParam = param.trim();
        if (trimmedParam) {
            // Analyze parameter names and types
            const match = trimmedParam.match(/^(Array|List|Map\s+)?(\*?)(\w+)(?:\.(\w+))?(?:\(\d*\))?/i);
            if (match) {
                const keyword = match[1] ? match[1].trim() + ' ' : '';
                const isPointer = match[2];
                const name = match[3];
                const type = match[4] || 'unknown';
                const label = `${keyword}${isPointer}${name}.${type}`;
                const documentation = keyword
                    ? `Parameter: ${name} (${type}) [${keyword.trim()}]`
                    : `Parameter: ${name} (${type})`;

                parameters.push({
                    label,
                    documentation
                });
            }
        }
    }

    return parameters;
}

/**
 * Build signature help from APIFunctionListing.txt entries.
 */
function getApiFunctionSignature(
    functionName: string,
    apiListing?: ApiFunctionListing
): {
    signature: string;
    documentation: string;
    parameters: ParameterInformation[];
} | null {
    if (!apiListing) return null;

    const entry = apiListing.find(functionName);
    if (!entry) return null;

    const signature = entry.rawParams ? `${entry.pbName}(${entry.rawParams})` : `${entry.pbName}()`;
    const documentation = entry.comment ? `${entry.signature}\n${entry.comment}` : entry.signature;

    const parameters = (entry.params || []).map(p => ({
        label: p,
        documentation: ''
    }));

    return { signature, documentation, parameters };
}

/**
 * Get built-in function signature
 */
function getBuiltInFunctionSignature(functionName: string): {
    signature: string;
    documentation: string;
    parameters: ParameterInformation[];
} | null {
    // Common built-in function signature definitions
    const builtInSignatures: { [key: string]: any } = {
        'Debug': {
            signature: 'Debug(Text$)',
            documentation: 'Display debug information',
            parameters: [
                { label: 'Text$', documentation: 'String to display in debug output' }
            ]
        },
        'OpenWindow': {
            signature: 'OpenWindow(#Window, X, Y, Width, Height, Title$, Flags)',
            documentation: 'Open a new window',
            parameters: [
                { label: '#Window', documentation: 'Window identifier' },
                { label: 'X', documentation: 'X position' },
                { label: 'Y', documentation: 'Y position' },
                { label: 'Width', documentation: 'Window width' },
                { label: 'Height', documentation: 'Window height' },
                { label: 'Title$', documentation: 'Window title' },
                { label: 'Flags', documentation: 'Window flags' }
            ]
        },
        'MessageRequester': {
            signature: 'MessageRequester(Title$, Text$, Flags)',
            documentation: 'Display a message dialog',
            parameters: [
                { label: 'Title$', documentation: 'Dialog title' },
                { label: 'Text$', documentation: 'Message text' },
                { label: 'Flags', documentation: 'Dialog flags' }
            ]
        }
    };

    const lowerFunctionName = functionName.toLowerCase();
    for (const [key, value] of Object.entries(builtInSignatures)) {
        if (key.toLowerCase() === lowerFunctionName) {
            return value;
        }
    }

    return null;
}

/**
 * Calculate index of current active parameter
 */
function calculateActiveParameter(parametersText: string): number {
    if (!parametersText.trim()) {
        return 0;
    }

    // Calculate comma count, but consider parenthesis nesting and strings
    let commaCount = 0;
    let parenDepth = 0;
    let inString = false;

    for (let i = 0; i < parametersText.length; i++) {
        const char = parametersText[i];

        if (char === '"' && (i === 0 || parametersText[i-1] !== '\\')) {
            inString = !inString;
        } else if (!inString) {
            if (char === '(') {
                parenDepth++;
            } else if (char === ')') {
                parenDepth--;
            } else if (char === ',' && parenDepth === 0) {
                commaCount++;
            }
        }
    }

    return commaCount;
}
