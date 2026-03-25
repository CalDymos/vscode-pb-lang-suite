declare module "vscode" {
  export type Uri = unknown;

  export class Position {
    line: number;
    character: number;
    constructor(line: number, character: number);
  }

  export class Range {
    start: Position;
    end: Position;
    constructor(start: Position, end: Position);
    constructor(startLine: number, startCharacter: number, endLine: number, endCharacter: number);
  }

  export interface TextLine {
    text: string;
    range: Range;
    rangeIncludingLineBreak: Range;
  }

  export interface TextDocument {
    uri: unknown;
    lineCount: number;
    getText(): string;
    lineAt(line: number): TextLine;
    positionAt(offset: number): Position;
    offsetAt(position: Position): number;
  }

  export class WorkspaceEdit {
    replace(uri: unknown, range: Range, newText: string): void;
    insert(uri: unknown, position: Position, newText: string): void;
    delete(uri: unknown, range: Range): void;
    set?(uri: unknown, edits: unknown[]): void;
    get?(uri: unknown): unknown[];
    getOperations(): Array<{
      kind: "replace" | "insert" | "delete";
      uri: unknown;
      range?: Range;
      position?: Position;
      newText?: string;
    }>;
  }
}
