class Position {
  constructor(line, character) {
    this.line = line;
    this.character = character;
  }
}

class Range {
  constructor(a, b, c, d) {
    if (a instanceof Position && b instanceof Position) {
      this.start = a;
      this.end = b;
      return;
    }

    this.start = new Position(a, b);
    this.end = new Position(c, d);
  }
}

class WorkspaceEdit {
  constructor() {
    this._ops = [];
  }

  replace(uri, range, newText) {
    this._ops.push({ kind: "replace", uri, range, newText });
  }

  insert(uri, position, newText) {
    this._ops.push({ kind: "insert", uri, position, newText });
  }

  delete(uri, range) {
    this._ops.push({ kind: "delete", uri, range });
  }

  entries() {
    const grouped = new Map();

    for (const op of this._ops) {
      const edits = grouped.get(op.uri) ?? [];
      if (op.kind === "insert") {
        edits.push({ range: new Range(op.position, op.position), newText: op.newText ?? "" });
      }
      else if (op.kind === "replace") {
        edits.push({ range: op.range, newText: op.newText ?? "" });
      }
      else if (op.kind === "delete") {
        edits.push({ range: op.range, newText: "" });
      }
      grouped.set(op.uri, edits);
    }

    return Array.from(grouped.entries());
  }

  getOperations() {
    return [...this._ops];
  }
}

module.exports = {
  Position,
  Range,
  WorkspaceEdit,
};
