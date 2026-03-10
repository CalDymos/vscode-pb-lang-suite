/**
 * Completion item factory
 * Responsible for creating standardized completion items
 */

import { CompletionItem, CompletionItemKind, InsertTextFormat } from 'vscode-languageserver';
import { PureBasicSymbol, SymbolKind } from '../../symbols/types';
import { CompletionContext, CompletionFactoryConfig, SymbolExtractResult } from './completion-types';

/**
 * Completion item factory class
 */
export class CompletionItemFactory {
    private config: CompletionFactoryConfig;

    constructor(config: Partial<CompletionFactoryConfig> = {}) {
        this.config = {
            includeDocumentation: true,
            includeTypeInfo: true,
            includeModuleInfo: true,
            sortWeights: {
                local: 100,
                module: 80,
                builtin: 60,
                structure: 40
            },
            ...config
        };
    }

    /**
     * Create a completion item from a symbol
     */
    createFromSymbol(symbol: PureBasicSymbol, context: CompletionContext, sourceType: 'local' | 'module' | 'builtin' | 'structure' = 'local'): CompletionItem {
        const item: CompletionItem = {
            label: symbol.name,
            kind: this.mapSymbolKindToCompletionKind(symbol.kind),
            detail: this.generateDetail(symbol, sourceType),
            documentation: this.config.includeDocumentation ? symbol.documentation : undefined,
            insertText: this.generateInsertText(symbol, context),
            insertTextFormat: InsertTextFormat.PlainText,
            sortText: this.generateSortText(symbol, sourceType),
            data: {
                symbol,
                sourceType
            }
        };

        // Add additional metadata
        if (this.config.includeTypeInfo && symbol.detail) {
            item.data.typeInfo = symbol.detail;
        }

        if (this.config.includeModuleInfo && symbol.module) {
            item.data.module = symbol.module;
        }

        return item;
    }

    /**
     * Create completion items in batch
     */
    createBatch(symbols: PureBasicSymbol[], context: CompletionContext, sourceType: 'local' | 'module' | 'builtin' | 'structure' = 'local'): CompletionItem[] {
        return symbols.map(symbol => this.createFromSymbol(symbol, context, sourceType));
    }

    /**
     * Create all completion items from an extract result
     */
    createFromExtractResult(result: SymbolExtractResult, context: CompletionContext): CompletionItem[] {
        const items: CompletionItem[] = [];

        // Local symbols
        if (result.documentSymbols.length > 0) {
            items.push(...this.createBatch(result.documentSymbols, context, 'local'));
        }

        // Module symbols
        if (result.moduleSymbols.length > 0) {
            items.push(...this.createBatch(result.moduleSymbols, context, 'module'));
        }

        // Structure symbols
        if (result.structureSymbols.length > 0) {
            items.push(...this.createBatch(result.structureSymbols, context, 'structure'));
        }

        // Built-in symbols
        if (result.builtinSymbols.length > 0) {
            items.push(...this.createBatch(result.builtinSymbols, context, 'builtin'));
        }

        return items;
    }

    /**
     * Map symbol type to completion item type
     */
    private mapSymbolKindToCompletionKind(symbolKind: SymbolKind): CompletionItemKind {
        switch (symbolKind) {
            case SymbolKind.Procedure:
            case SymbolKind.Function:
                return CompletionItemKind.Function;
            case SymbolKind.Variable:
                return CompletionItemKind.Variable;
            case SymbolKind.Constant:
                return CompletionItemKind.Constant;
            case SymbolKind.Structure:
                return CompletionItemKind.Struct;
            case SymbolKind.Interface:
                return CompletionItemKind.Interface;
            case SymbolKind.Module:
                return CompletionItemKind.Module;
            case SymbolKind.Keyword:
                return CompletionItemKind.Keyword;
            case SymbolKind.Operator:
                return CompletionItemKind.Operator;
            case SymbolKind.Parameter:
                return CompletionItemKind.TypeParameter;
            default:
                return CompletionItemKind.Text;
        }
    }

    /**
     * Generate detail information
     */
    private generateDetail(symbol: PureBasicSymbol, sourceType: string): string {
        let detail = symbol.detail || '';

        // Add source information
        if (sourceType === 'module' && symbol.module) {
            detail = `${detail} (from ${symbol.module})`;
        } else if (sourceType === 'builtin') {
            detail = `${detail} (built-in)`;
        } else if (sourceType === 'structure') {
            detail = `${detail} (structure)`;
        }

        return detail;
    }

    /**
     * Generate insert text
     */
    private generateInsertText(symbol: PureBasicSymbol, context: CompletionContext): string {
        const { currentWord, linePrefix } = context;

        // For functions and procedures, add parentheses
        if (symbol.kind === SymbolKind.Procedure || symbol.kind === SymbolKind.Function) {
            // If there is a dot before the cursor, it may be a module function call
            if (linePrefix.endsWith('.')) {
                return symbol.name;
            }
            return `${symbol.name}()`;
        }

        // For structures, add a dot to suggest member access
        if (symbol.kind === SymbolKind.Structure) {
            return `${symbol.name}.`;
        }

        // Default case
        return symbol.name;
    }

    /**
     * Generate sort text
     */
    private generateSortText(symbol: PureBasicSymbol, sourceType: string): string {
        const weight = this.config.sortWeights[sourceType as keyof typeof this.config.sortWeights] || 50;

        // Add extra weight based on symbol type
        let typeWeight = 0;
        switch (symbol.kind) {
            case SymbolKind.Procedure:
            case SymbolKind.Function:
                typeWeight = 10;
                break;
            case SymbolKind.Variable:
                typeWeight = 8;
                break;
            case SymbolKind.Constant:
                typeWeight = 6;
                break;
            case SymbolKind.Structure:
                typeWeight = 4;
                break;
            default:
                typeWeight = 2;
        }

        const totalWeight = weight + typeWeight;
        return totalWeight.toString().padStart(4, '0') + symbol.name.toLowerCase();
    }

    /**
     * Update factory configuration
     */
    updateConfig(config: Partial<CompletionFactoryConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get the current configuration
     */
    getConfig(): CompletionFactoryConfig {
        return { ...this.config };
    }
}