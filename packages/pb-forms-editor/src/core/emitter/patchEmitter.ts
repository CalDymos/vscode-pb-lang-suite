import * as vscode from "vscode";
import { scanCalls } from "../parser/callScanner";
import { parseFormDocument } from "../parser/formParser";
import { asNumber, splitParams, unquoteString } from "../parser/tokenizer";
import { FormFont, FormImage, FormStatusBarField, FormWindow, Gadget, ScanRange, MENU_ENTRY_KIND, TOOLBAR_ENTRY_KIND, MenuEntryKind, ToolBarEntryKind } from "../model";

type PbCall = ReturnType<typeof scanCalls>[number];

/**
 * Escape special characters in regular expressions
 */
function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stableKey(assignedVar: string | undefined, params: string[]): string | undefined {
  if (params.length < 1) return undefined;

  const first = params[0].trim();
  if (first === "#PB_Any") {
    return assignedVar ?? "#PB_Any";
  }

  return first;
}

function normalizeProcParamName(raw: string): string {
  let name = raw.trim();
  name = name.replace(/^\*+/, "");
  const dot = name.indexOf(".");
  if (dot >= 0) name = name.slice(0, dot);
  return name.toLowerCase();
}

function tryPatchProcedureDefaults(
  document: vscode.TextDocument,
  fromLine: number,
  updates: Record<string, string>
): vscode.WorkspaceEdit | undefined {
  for (let i = Math.min(fromLine, document.lineCount - 1); i >= 0; i--) {
    const lineText = document.lineAt(i).text;

    if (/^\s*EndProcedure\b/i.test(lineText)) break;

    const m = /^(\s*Procedure(?:\.\w+)?\s+[\w:]+\s*)\((.*)\)\s*$/i.exec(lineText);
    if (!m) continue;

    const prefix = m[1];
    const rawArgs = m[2];
    const parts = splitParams(rawArgs);
    if (parts.length === 0) return undefined;

    let changed = false;
    const rebuiltParts = parts.map(p => {
      const eq = p.indexOf("=");
      if (eq < 0) return p;

      const left = p.slice(0, eq).trim();
      const right = p.slice(eq + 1).trim();
      const key = normalizeProcParamName(left);

      const newVal = updates[key];
      if (newVal === undefined) return p;
      if (right === newVal) return p;

      changed = true;
      return `${left} = ${newVal}`;
    });

    if (!changed) return undefined;

    const rebuiltLine = `${prefix}(${rebuiltParts.join(", ")})`;
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, document.lineAt(i).range, rebuiltLine);
    return edit;
  }

  return undefined;
}

function getLineIndent(document: vscode.TextDocument, line: number): string {
  if (line < 0 || line >= document.lineCount) return "";
  const text = document.lineAt(line).text;
  const m = /^\s*/.exec(text);
  return m?.[0] ?? "";
}

function scanDocumentCalls(document: vscode.TextDocument, scanRange?: ScanRange): PbCall[] {
  return scanCalls(document.getText(), scanRange);
}

function findCallByStableKey(
  calls: PbCall[],
  key: string,
  namePredicate?: (name: string) => boolean
) {
  return calls.find(c => {
    if (namePredicate && !namePredicate(c.name)) return false;
    const params = splitParams(c.args);
    const k = stableKey(c.assignedVar, params);
    return k === key;
  });
}

function findCallsByName(calls: PbCall[], nameLower: string) {
  return calls.filter(c => c.name.toLowerCase() === nameLower);
}

function firstParamOfCall(callArgs: string): string {
  const params = splitParams(callArgs);
  return (params[0] ?? "").trim();
}

function buildAddGadgetItemArgs(gadgetKey: string, args: GadgetItemArgs): string {
  const out: string[] = [];
  out.push(gadgetKey);
  out.push(args.posRaw);
  out.push(args.textRaw);

  if (args.imageRaw !== undefined || args.flagsRaw !== undefined) {
    out.push((args.imageRaw ?? "0").trim().length ? args.imageRaw! : "0");
  }

  if (args.flagsRaw !== undefined) {
    out.push(args.flagsRaw);
  }

  return out.join(", ");
}

function buildAddGadgetColumnArgs(gadgetKey: string, args: GadgetColumnArgs): string {
  const out: string[] = [];
  out.push(gadgetKey);
  out.push(args.colRaw);
  out.push(args.titleRaw);
  out.push(args.widthRaw);
  return out.join(", ");
}

function replaceCallLinePreserveSuffix(
  document: vscode.TextDocument,
  call: { name: string; args: string; range: { line: number; lineStart: number; end: number } },
  rebuiltLine: string
): vscode.WorkspaceEdit {
  const line = call.range.line;
  const lineText = document.lineAt(line).text;
  const endInLine = Math.max(0, call.range.end - call.range.lineStart);
  const suffix = lineText.slice(endInLine);

  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, document.lineAt(line).range, rebuiltLine + suffix);
  return edit;
}

export interface GadgetItemArgs {
  posRaw: string;
  textRaw: string;
  imageRaw?: string;
  flagsRaw?: string;
}

export interface GadgetColumnArgs {
  colRaw: string;
  titleRaw: string;
  widthRaw: string;
}

export interface WindowPropertyArgs {
  hiddenRaw?: string;
  disabledRaw?: string;
  colorRaw?: string;
}

export interface WindowOpenArgs {
  captionRaw?: string;
  flagsExpr?: string;
  parentRaw?: string;
}

export interface WindowEventArgs {
  eventFileRaw?: string;
}

export interface WindowEventProcBlock {
  selectLine: number;
  endLine: number;
  defaultLine?: number;
  procLine?: number;
  hasCaseBranches: boolean;
}

export interface EventCaseBranch {
  caseLine: number;
  caseRaw: string;
  procLine?: number;
  boundaryLine: number;
}


export interface MenuEntryArgs {
  kind: MenuEntryKind;
  idRaw?: string;
  textRaw?: string;
  shortcut?: string;
  iconRaw?: string;
}

export interface MenuEntryInsertOptions {
  parentSourceLine?: number;
}

export type MenuEntryMovePlacement = "before" | "after" | "appendChild";

export interface MenuEntryMoveOptions {
  targetSourceLine: number;
  placement: MenuEntryMovePlacement;
}

export interface ToolBarEntryArgs {
  kind: ToolBarEntryKind;
  idRaw?: string;
  iconRaw?: string;
  textRaw?: string;
  tooltip?: string;
  toggle?: boolean;
}

export interface StatusBarFieldArgs {
  widthRaw: string;
  textRaw?: string;
  imageRaw?: string;
  flagsRaw?: string;
  progressBar?: boolean;
  progressRaw?: string;
}

export interface FontArgs {
  idRaw: string;
  nameRaw: string;
  sizeRaw: string;
  flagsRaw?: string;
  assignedVar?: string;
}

export interface ImageArgs {
  inline: boolean;
  idRaw: string;
  imageRaw: string;
  assignedVar?: string;
}

export interface GadgetPropertyArgs {
  hiddenRaw?: string;
  disabledRaw?: string;
  tooltipRaw?: string;
  stateRaw?: string;
  frontColorRaw?: string;
  backColorRaw?: string;
  gadgetFontRaw?: string;
}

export interface GadgetOpenArgs {
  textRaw?: string;
  imageRaw?: string;
  minRaw?: string;
  maxRaw?: string;
  gadget1Raw?: string;
  gadget2Raw?: string;
  flagsExpr?: string;
}

function isCreateBoundary(nameLower: string): boolean {
  return (
    nameLower === "createmenu" ||
    nameLower === "createimagemenu" ||
    nameLower === "createtoolbar" ||
    nameLower === "createstatusbar" ||
    nameLower === "openwindow"
  );
}

function getCreateNameVariants(createNameLower: string): readonly string[] {
  if (createNameLower === "createmenu") {
    return ["createmenu", "createimagemenu"];
  }
  return [createNameLower];
}

function matchesCreateCallName(callNameLower: string, createNameLower: string): boolean {
  return getCreateNameVariants(createNameLower).includes(callNameLower);
}

function findNearestCreateAbove(
  calls: PbCall[],
  line: number,
  createNameLower: string
) {
  let best: (typeof calls)[number] | undefined;
  for (const c of calls) {
    if (!matchesCreateCallName(c.name.toLowerCase(), createNameLower)) continue;
    if (c.range.line <= line) best = c;
    else break;
  }
  return best;
}

function quotePbString(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function normalizeMenuTextForShortcut(textRaw: string): string {
  const raw = textRaw.trim();
  const tabConcat = /^(.*)\+\s*Chr\(\s*9\s*\)\s*\+\s*(.*)$/i.exec(raw);
  if (tabConcat) {
    const literal = unquoteString(tabConcat[1].trim());
    if (literal !== undefined) {
      return quotePbString(literal);
    }
  }

  const literal = unquoteString(raw);
  if (literal !== undefined) {
    const shortcutPos = literal.indexOf('"');
    const text = shortcutPos >= 0 ? literal.slice(0, shortcutPos) : literal;
    return quotePbString(text);
  }

  return raw;
}

function appendMenuShortcut(textRaw: string, shortcut: string | undefined): string {
  const shortcutText = shortcut?.trim();
  if (!shortcutText) return textRaw;
  const baseText = normalizeMenuTextForShortcut(textRaw);
  return `${baseText} + Chr(9) + ${quotePbString(shortcutText)}`;
}

function buildMenuEntryLine(args: MenuEntryArgs): string {
  switch (args.kind) {
    case MENU_ENTRY_KIND.MenuTitle:
      return `MenuTitle(${(args.textRaw ?? "\"\"").trim()})`;
    case MENU_ENTRY_KIND.MenuItem: {
      const id = (args.idRaw ?? "0").trim();
      const text = appendMenuShortcut((args.textRaw ?? "\"\"").trim(), args.shortcut);
      const icon = args.iconRaw?.trim();
      return icon ? `MenuItem(${id}, ${text}, ${icon})` : `MenuItem(${id}, ${text})`;
    }
    case MENU_ENTRY_KIND.MenuBar:
      return "MenuBar()";
    case MENU_ENTRY_KIND.OpenSubMenu:
      return `OpenSubMenu(${(args.textRaw ?? "\"\"").trim()})`;
    case MENU_ENTRY_KIND.CloseSubMenu:
      return "CloseSubMenu()";
    default:
      return "";
  }
}

function buildToolBarImageButtonLine(args: ToolBarEntryArgs): string {
  const id = (args.idRaw ?? "0").trim();
  const icon = (args.iconRaw ?? "0").trim();
  const toggle = args.toggle ? ", #PB_ToolBar_Toggle" : "";
  return `ToolBarImageButton(${id}, ${icon}${toggle})`;
}

function buildToolBarToolTipLine(toolBarId: string | undefined, args: ToolBarEntryArgs): string {
  const id = (args.idRaw ?? "0").trim();
  const text = (args.textRaw ?? "\"\"").trim();
  return toolBarId ? `ToolBarToolTip(${toolBarId.trim()}, ${id}, ${text})` : `ToolBarToolTip(${id}, ${text})`;
}

function buildToolBarEntryLines(args: ToolBarEntryArgs, toolBarId?: string): string[] {
  switch (args.kind) {
    case TOOLBAR_ENTRY_KIND.ToolBarStandardButton:
      return [buildToolBarImageButtonLine({ ...args, kind: TOOLBAR_ENTRY_KIND.ToolBarImageButton })];
    case TOOLBAR_ENTRY_KIND.ToolBarButton: {
      const lines = [buildToolBarImageButtonLine({ ...args, kind: TOOLBAR_ENTRY_KIND.ToolBarImageButton, toggle: false })];
      const text = args.textRaw?.trim();
      if (text?.length) {
        lines.push(buildToolBarToolTipLine(toolBarId, {
          kind: TOOLBAR_ENTRY_KIND.ToolBarToolTip,
          idRaw: args.idRaw,
          textRaw: text,
        }));
      }
      return lines;
    }
    case TOOLBAR_ENTRY_KIND.ToolBarImageButton:
      return [buildToolBarImageButtonLine(args)];
    case TOOLBAR_ENTRY_KIND.ToolBarSeparator:
      return ["ToolBarSeparator()"];
    case TOOLBAR_ENTRY_KIND.ToolBarToolTip:
      return [buildToolBarToolTipLine(toolBarId, args)];
    default:
      return [];
  }
}

function buildToolBarEntryText(args: ToolBarEntryArgs, toolBarId: string | undefined, indent = ""): string {
  return buildToolBarEntryLines(args, toolBarId)
    .map(line => `${indent}${line}`)
    .join("\n");
}

function buildToolBarEntryLine(args: ToolBarEntryArgs, toolBarId?: string): string {
  return buildToolBarEntryText(args, toolBarId);
}

function isToolBarButtonKind(kind: ToolBarEntryKind): boolean {
  return kind === TOOLBAR_ENTRY_KIND.ToolBarStandardButton
    || kind === TOOLBAR_ENTRY_KIND.ToolBarButton
    || kind === TOOLBAR_ENTRY_KIND.ToolBarImageButton;
}

function getToolBarEntryIdFromCall(call: PbCall): string | undefined {
  const params = splitParams(call.args);
  return params[0]?.trim();
}

function findToolBarToolTipCall(
  calls: PbCall[],
  toolBarId: string,
  entryIdRaw: string | undefined
): PbCall | undefined {
  const normalizedEntryId = entryIdRaw?.trim();
  if (!normalizedEntryId?.length) return undefined;

  return calls.find(call => {
    if (call.name.toLowerCase() !== TOOLBAR_ENTRY_KIND.ToolBarToolTip.toLowerCase()) return false;
    if (!isLineInCreateSection(calls, call.range.line, "createtoolbar", toolBarId)) return false;

    const parts = splitParams(call.args);
    const buttonIdRaw = (parts.length >= 3 ? parts[1] : parts[0])?.trim() ?? "";
    return buttonIdRaw === normalizedEntryId;
  });
}

// -----------------------------------------------------------------------------
// Helpers for window id / pbAny patching
// -----------------------------------------------------------------------------

type LineBlock = { startLine: number; endLine: number };

function findNamedEnumerationBlock(document: vscode.TextDocument, enumName: string): LineBlock | undefined {
  const startRe = new RegExp(`^\\s*Enumeration\\s+${enumName}\\b`, "i");
  let startLine: number | undefined;

  for (let i = 0; i < document.lineCount; i++) {
    const t = document.lineAt(i).text;
    if (startLine === undefined) {
      if (startRe.test(t)) startLine = i;
      continue;
    }
    if (/^\s*EndEnumeration\b/i.test(t)) {
      return { startLine, endLine: i };
    }
  }
  return undefined;
}

function findWindowGlobalInsertLine(document: vscode.TextDocument): number {
  let firstGlobal = document.lineCount;
  let firstAnchor = document.lineCount;

  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i).text;
    if (firstGlobal === document.lineCount && /^\s*Global\b/i.test(line)) {
      firstGlobal = i;
    }
    if (firstAnchor === document.lineCount && isTopLevelGlobalAnchorLine(line)) {
      firstAnchor = i;
    }
  }

  return firstGlobal !== document.lineCount ? firstGlobal : firstAnchor;
}

function ensureWindowGlobalLine(edit: vscode.WorkspaceEdit, document: vscode.TextDocument, varName: string) {
  const re = new RegExp("^\\s*Global\\s+" + escapeRegExp(varName) + "(?:\\s|$)");
  for (let i = 0; i < document.lineCount; i++) {
    if (re.test(document.lineAt(i).text)) return;
  }

  const insertLine = findWindowGlobalInsertLine(document);
  const block = `Global ${varName}\n\n`;
  edit.insert(document.uri, new vscode.Position(insertLine, 0), block);
}

function removeGlobalLine(edit: vscode.WorkspaceEdit, document: vscode.TextDocument, varName: string) {
  const re = new RegExp("^\\s*Global\\s+" + escapeRegExp(varName) + "(?:\\s|$)");
  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i);
    if (!re.test(line.text)) continue;

    let end = line.rangeIncludingLineBreak.end;
    if (i + 1 < document.lineCount && document.lineAt(i + 1).text.trim() === "") {
      end = document.lineAt(i + 1).rangeIncludingLineBreak.end;
    }

    edit.delete(document.uri, new vscode.Range(line.range.start, end));
  }
}

function findWindowEnumInsertLine(document: vscode.TextDocument): number {
  for (let i = 0; i < document.lineCount; i++) {
    const text = document.lineAt(i).text;
    const trimmed = text.trim();
    if (/^Enumeration\s+FormGadget\b/i.test(trimmed)
      || /^Enumeration\s+FormMenu\b/i.test(trimmed)
      || /^Enumeration\s+FormImage\b/i.test(trimmed)
      || /^Enumeration\s+FormFont\b/i.test(trimmed)
      || isCustomGadgetInitMarkerLine(text)
      || isImageDecoderLine(text)
      || /^LoadImage\s*\(/i.test(trimmed)
      || /^CatchImage\s*\(/i.test(trimmed)
      || /^LoadFont\s*\(/i.test(trimmed)
      || isTopLevelHeadBoundaryLine(text)) {
      return i;
    }
  }

  return document.lineCount;
}

function ensureWindowEnumeration(edit: vscode.WorkspaceEdit, document: vscode.TextDocument, enumSymbol: string, enumValueRaw: string | undefined) {
  const block = findNamedEnumerationBlock(document, "FormWindow");
  if (block) {
    // Ensure the entry exists; if it exists, optionally update.
    const current = applyWindowEnumValuePatch(document, enumSymbol, enumValueRaw);
    if (current) {
      // Merge edits by replaying them into the passed edit (WorkspaceEdit has no merge API).
      // We'll just insert a replace into the same edit by re-running minimal logic here.
      for (let i = block.startLine + 1; i <= block.endLine - 1; i++) {
        const line = document.lineAt(i).text;
        const noComment = (line.split(";")[0] ?? "").trim();
        const m = /^(#\w+)\b/.exec(noComment);
        if (!m || m[1] !== enumSymbol) continue;
        const indent = getLineIndent(document, i);
        const newLine = enumValueRaw && enumValueRaw.trim().length
          ? `${indent}${enumSymbol}=${enumValueRaw.trim()}`
          : `${indent}${enumSymbol}`;
        edit.replace(document.uri, document.lineAt(i).range, newLine);
        return;
      }

      const insertLine = block.endLine;
      const indent = "  ";
      const newLine = enumValueRaw && enumValueRaw.trim().length
        ? `${indent}${enumSymbol}=${enumValueRaw.trim()}\n`
        : `${indent}${enumSymbol}\n`;
      edit.insert(document.uri, new vscode.Position(insertLine, 0), newLine);
      return;
    }
    return;
  }

  const anchor = findWindowEnumInsertLine(document);

  const entry = enumValueRaw && enumValueRaw.trim().length
    ? `  ${enumSymbol}=${enumValueRaw.trim()}`
    : `  ${enumSymbol}`;

  const blockText = `Enumeration FormWindow\n${entry}\nEndEnumeration\n\n`;
  edit.insert(document.uri, new vscode.Position(anchor, 0), blockText);
}

function findProcedureBlock(document: vscode.TextDocument, line: number): LineBlock | undefined {
  let startLine: number | undefined;
  for (let i = line; i >= 0; i--) {
    const t = document.lineAt(i).text;
    if (/^\s*EndProcedure\b/i.test(t)) break;
    if (/^\s*Procedure\b/i.test(t)) {
      startLine = i;
      break;
    }
  }
  if (startLine === undefined) return undefined;
  for (let i = line; i < document.lineCount; i++) {
    const t = document.lineAt(i).text;
    if (/^\s*EndProcedure\b/i.test(t)) {
      return { startLine, endLine: i };
    }
  }
  return undefined;
}

function parseProcedureName(line: string): { name: string; nameStart: number; nameEnd: number } | undefined {
  // Matches: Procedure xxx(...), Procedure.i xxx(...), Procedure.s xxx(...)
  const m = /^\s*Procedure(?:\.\w+)?\s+([A-Za-z_]\w*)\s*\(/.exec(line);
  if (!m) return undefined;

  const name = m[1];
  const idx = line.indexOf(name);
  if (idx < 0) return undefined;

  return { name, nameStart: idx, nameEnd: idx + name.length };
}

function findProcedureBlockByName(document: vscode.TextDocument, procName: string): LineBlock | undefined {
  for (let i = 0; i < document.lineCount; i++) {
    const parsed = parseProcedureName(document.lineAt(i).text);
    if (!parsed || parsed.name !== procName) continue;
    return findProcedureBlock(document, i);
  }

  return undefined;
}

function resolveWindowEventProcedureBlock(
  document: vscode.TextDocument,
  window: FormWindow,
  openCallLine: number
): { openProc: LineBlock; eventProc: LineBlock; usesSeparateEventProc: boolean } | undefined {
  const openProc = findProcedureBlock(document, openCallLine);
  if (!openProc) return undefined;

  const eventProcName = `${window.variable}_Events`;
  const separateProc = findProcedureBlockByName(document, eventProcName);
  if (separateProc) {
    return { openProc, eventProc: separateProc, usesSeparateEventProc: true };
  }

  return { openProc, eventProc: openProc, usesSeparateEventProc: false };
}

function replaceWordInRange(
  edit: vscode.WorkspaceEdit,
  document: vscode.TextDocument,
  fromLine: number,
  toLine: number,
  oldWord: string,
  newWord: string
) {
  const wordRe = new RegExp(`\\b${escapeRegExp(oldWord)}\\b`, "g");
  for (let i = fromLine; i <= toLine; i++) {
    const line = document.lineAt(i).text;
    if (!wordRe.test(line)) continue;
    const updated = line.replace(wordRe, newWord);
    edit.replace(document.uri, document.lineAt(i).range, updated);
  }
}

function toOpenProcName(windowName: string): string | undefined {
  const base = windowName.trim().replace(/^#/, "");
  if (!base.length) return undefined;

  // PureBasic identifiers: keep it conservative
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(base)) return undefined;

  return `Open${base}`;
}

function patchProcedureNameInBlock(
  edit: vscode.WorkspaceEdit,
  document: vscode.TextDocument,
  proc: { startLine: number; endLine: number } | undefined,
  oldProcName: string,
  newProcName: string
) {
  if (!proc) return;
  if (oldProcName === newProcName) return;

  const headerLine = document.lineAt(proc.startLine);
  const m = /^(\s*Procedure\s+)([A-Za-z_][A-Za-z0-9_]*)(\s*\()/.exec(headerLine.text);
  if (!m) return;

  if (m[2] !== oldProcName) return;

  const rebuilt = `${m[1]}${newProcName}${m[3]}`;
  edit.replace(document.uri, headerLine.range, headerLine.text.replace(/^(\s*Procedure\s+)([A-Za-z_][A-Za-z0-9_]*)(\s*\()/, rebuilt));
}

function patchProcedureCallsBestEffort(
  edit: vscode.WorkspaceEdit,
  document: vscode.TextDocument,
  calls: PbCall[],
  oldProcName: string,
  newProcName: string,
  scanRange?: ScanRange
) {
  if (oldProcName === newProcName) return;

  // Prefer callScanner data when available; fallback would be raw regex, but we avoid that here.
  const procCalls = calls.filter(c => c.name === oldProcName);
  for (const c of procCalls) {
    // Replace only the name token, keep args/assignment/indent
    const indent = c.indent ?? getLineIndent(document, c.range.line);
    const rebuiltCall = `${newProcName}(${c.args})`;
    const updatedLine = c.assignedVar ? `${indent}${c.assignedVar} = ${rebuiltCall}` : `${indent}${rebuiltCall}`;

    edit.replace(
      document.uri,
      new vscode.Range(document.positionAt(c.range.lineStart), document.positionAt(c.range.end)),
      updatedLine
    );
  }
}

function replaceTokenGlobal(
  edit: vscode.WorkspaceEdit,
  document: vscode.TextDocument,
  oldToken: string,
  newToken: string
) {
  if (oldToken === newToken) return;

  // Word boundary replacement, keeps things like OpenOldEx intact.
  const re = new RegExp(`\\b${escapeRegExp(oldToken)}\\b`, "g");

  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i);
    if (!re.test(line.text)) continue;

    const updated = line.text.replace(re, newToken);
    if (updated !== line.text) {
      edit.replace(document.uri, line.range, updated);
    }
  }
}

function windowBaseFromSymbol(sym: string): string {
  return sym.trim().replace(/^#/, "");
}

function buildOpenProcName(base: string): string {
  return `Open${base}`;
}

function buildEventsProcName(base: string): string {
  return `${base}_Events`;
}

function buildResizeProcName(base: string): string {
  return `ResizeGadgets${base}`;
}

function renameProcedureHeaderGlobal(
  edit: vscode.WorkspaceEdit,
  document: vscode.TextDocument,
  oldProc: string,
  newProc: string
) {
  if (oldProc === newProc) return;

  const re = new RegExp(`^(\\s*Procedure(?:\\.\\w+)?\\s+)${escapeRegExp(oldProc)}(\\s*\\()`, "i");

  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i);
    if (!re.test(line.text)) continue;

    const updated = line.text.replace(re, `$1${newProc}$2`);
    edit.replace(document.uri, line.range, updated);
  }
}

function renameCallsGlobalByScanner(
  edit: vscode.WorkspaceEdit,
  document: vscode.TextDocument,
  calls: PbCall[],
  oldName: string,
  newName: string
) {
  if (oldName === newName) return;

  for (const c of calls) {
    if (c.name !== oldName) continue;

    const rebuilt = `${newName}(${c.args})`;
    const indent = c.indent ?? getLineIndent(document, c.range.line);
    const updated = c.assignedVar ? `${indent}${c.assignedVar} = ${rebuilt}` : `${indent}${rebuilt}`;

    const replaceStart = c.assignedVar ? c.range.lineStart : c.range.start;

    edit.replace(
      document.uri,
      new vscode.Range(document.positionAt(replaceStart), document.positionAt(c.range.end)),
      updated
    );
  }
}

function replaceEnumSymbolGlobal(
  edit: vscode.WorkspaceEdit,
  document: vscode.TextDocument,
  oldEnum: string,
  newEnum: string
) {
  if (oldEnum === newEnum) return;

  // Replace '#Old' as a token (avoid '#OldX'); allow punctuation after it.
  const re = new RegExp(`(^|[^A-Za-z0-9_])${escapeRegExp(oldEnum)}(?![A-Za-z0-9_])`, "g");

  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i);
    if (!re.test(line.text)) continue;

    const updated = line.text.replace(re, `$1${newEnum}`);
    if (updated !== line.text) {
      edit.replace(document.uri, line.range, updated);
    }
  }
}

function replaceCallArgsEdit(
  document: vscode.TextDocument,
  call: PbCall,
  params: string[]
): vscode.WorkspaceEdit {
  const rebuilt = `${call.name}(${params.join(", ")})`;
  const updated = call.assignedVar ? `${call.indent ?? ""}${call.assignedVar} = ${rebuilt}` : rebuilt;
  const replaceStart = call.assignedVar ? call.range.lineStart : call.range.start;

  const edit = new vscode.WorkspaceEdit();
  edit.replace(
    document.uri,
    new vscode.Range(document.positionAt(replaceStart), document.positionAt(call.range.end)),
    updated
  );
  return edit;
}

export function applyMovePatch(
  document: vscode.TextDocument,
  gadgetKey: string,
  x: number,
  y: number,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const calls = scanDocumentCalls(document, scanRange);
  const call = findCallByStableKey(calls, gadgetKey);

  if (!call) return undefined;

  const params = splitParams(call.args);
  if (params.length < 3) return undefined;

  params[1] = String(Math.trunc(x));
  params[2] = String(Math.trunc(y));

  return replaceCallArgsEdit(document, call, params);
}

export function applyRectPatch(
  document: vscode.TextDocument,
  gadgetKey: string,
  x: number,
  y: number,
  w: number,
  h: number,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const calls = scanDocumentCalls(document, scanRange);
  const call = findCallByStableKey(calls, gadgetKey);

  if (!call) return undefined;

  const params = splitParams(call.args);
  if (params.length < 5) return undefined;

  params[1] = String(Math.trunc(x));
  params[2] = String(Math.trunc(y));
  params[3] = String(Math.trunc(w));
  params[4] = String(Math.trunc(h));

  return replaceCallArgsEdit(document, call, params);
}

export function applyWindowRectPatch(
  document: vscode.TextDocument,
  windowKey: string,
  x: number,
  y: number,
  w: number,
  h: number,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const calls = scanDocumentCalls(document, scanRange);
  const call = findCallByStableKey(calls, windowKey, name => name === "OpenWindow");

  if (!call) return undefined;

  const params = splitParams(call.args);
  if (params.length < 5) return undefined;

  // PureBasic Form Designer pattern:
  //   Procedure OpenX(x=..., y=..., width=..., height=...)
  //     OpenWindow(..., x, y, width, height, ...)
  // In this case, patch the procedure defaults instead of hardcoding literals into OpenWindow().
  const p1 = (params[1] ?? "").trim().toLowerCase();
  const p2 = (params[2] ?? "").trim().toLowerCase();
  const p3 = (params[3] ?? "").trim().toLowerCase();
  const p4 = (params[4] ?? "").trim().toLowerCase();
  const usesProcDefaults = p1 === "x" && p2 === "y" && p3 === "width" && p4 === "height";
  if (usesProcDefaults) {
    const procEdit = tryPatchProcedureDefaults(document, call.range.line, {
      x: String(Math.trunc(x)),
      y: String(Math.trunc(y)),
      width: String(Math.trunc(w)),
      height: String(Math.trunc(h))
    });
    if (procEdit) return procEdit;
  }

  params[1] = String(Math.trunc(x));
  params[2] = String(Math.trunc(y));
  params[3] = String(Math.trunc(w));
  params[4] = String(Math.trunc(h));

  return replaceCallArgsEdit(document, call, params);
}


export function applyWindowOpenArgsUpdate(
  document: vscode.TextDocument,
  windowKey: string,
  args: WindowOpenArgs,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const calls = scanDocumentCalls(document, scanRange);
  const call = findCallByStableKey(calls, windowKey, name => name === "OpenWindow");

  if (!call) return undefined;

  const params = splitParams(call.args);
  if (params.length < 6) return undefined;

  const captionRaw = normalizeOptionalRaw(args.captionRaw) ?? (params[5]?.trim().length ? params[5].trim() : '""');
  const parentRaw = normalizeOptionalRaw(args.parentRaw);
  let flagsExpr = normalizeOptionalRaw(args.flagsExpr);

  if (parentRaw && !flagsExpr) {
    flagsExpr = "0";
  }

  params[5] = captionRaw;
  params[6] = flagsExpr ?? "";
  params[7] = parentRaw ?? "";

  while (params.length > 6 && !(params[params.length - 1]?.trim().length)) {
    params.pop();
  }

  return replaceCallArgsEdit(document, call, params);
}

type GadgetCtorLayout = {
  minParamCount: number;
  textIndex?: number;
  imageIndex?: number;
  minIndex?: number;
  maxIndex?: number;
  gadget1Index?: number;
  gadget2Index?: number;
  flagsIndex?: number;
};

function getGadgetCtorLayout(name: string): GadgetCtorLayout | undefined {
  switch (name) {
    case "ButtonGadget":
    case "CheckBoxGadget":
    case "ExplorerComboGadget":
    case "ExplorerListGadget":
    case "ExplorerTreeGadget":
    case "FrameGadget":
    case "StringGadget":
    case "TextGadget":
    case "WebGadget":
      return { minParamCount: 6, textIndex: 5, flagsIndex: 6 };

    case "ButtonImageGadget":
    case "ImageGadget":
      return { minParamCount: 6, imageIndex: 5, flagsIndex: 6 };

    case "CalendarGadget":
      return { minParamCount: 6, flagsIndex: 6 };

    case "CanvasGadget":
    case "ComboBoxGadget":
    case "ContainerGadget":
    case "EditorGadget":
    case "ListViewGadget":
    case "OpenGLGadget":
    case "TreeGadget":
    case "WebViewGadget":
      return { minParamCount: 5, flagsIndex: 5 };

    case "DateGadget":
    case "HyperLinkGadget":
    case "ListIconGadget":
      return { minParamCount: 7, textIndex: 5, flagsIndex: 7 };

    case "ProgressBarGadget":
    case "SpinGadget":
    case "TrackBarGadget":
      return { minParamCount: 7, minIndex: 5, maxIndex: 6, flagsIndex: 7 };

    case "ScrollBarGadget":
    case "ScrollAreaGadget":
      return { minParamCount: 8, minIndex: 5, maxIndex: 6, flagsIndex: 8 };

    case "SplitterGadget":
      return { minParamCount: 7, gadget1Index: 5, gadget2Index: 6, flagsIndex: 7 };

    case "OptionGadget":
      return { minParamCount: 6, textIndex: 5 };

    default:
      return undefined;
  }
}

function setRequiredCtorParam(params: string[], index: number | undefined, raw: string | undefined): void {
  if (index === undefined || raw === undefined) return;
  const normalized = normalizeOptionalRaw(raw);
  if (!normalized) return;
  while (params.length <= index) params.push("");
  params[index] = normalized;
}

function setOptionalCtorParam(params: string[], index: number | undefined, raw: string | undefined): void {
  if (index === undefined) return;
  while (params.length <= index) params.push("");
  params[index] = normalizeOptionalRaw(raw) ?? "";
}

export function applyGadgetOpenArgsUpdate(
  document: vscode.TextDocument,
  gadgetKey: string,
  args: GadgetOpenArgs,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const calls = scanDocumentCalls(document, scanRange);
  const call = findCallByStableKey(calls, gadgetKey, name => /gadget$/i.test(name));

  if (!call) return undefined;

  const layout = getGadgetCtorLayout(call.name);
  if (!layout) return undefined;

  const params = splitParams(call.args);
  if (params.length < 5) return undefined;

  setRequiredCtorParam(params, layout.textIndex, args.textRaw);
  setRequiredCtorParam(params, layout.imageIndex, args.imageRaw);
  setRequiredCtorParam(params, layout.minIndex, args.minRaw);
  setRequiredCtorParam(params, layout.maxIndex, args.maxRaw);
  setRequiredCtorParam(params, layout.gadget1Index, args.gadget1Raw);
  setRequiredCtorParam(params, layout.gadget2Index, args.gadget2Raw);
  if (args.flagsExpr !== undefined) {
    setOptionalCtorParam(params, layout.flagsIndex, args.flagsExpr);
  }

  while (params.length > layout.minParamCount && !(params[params.length - 1]?.trim().length)) {
    params.pop();
  }

  return replaceCallArgsEdit(document, call, params);
}

export function applyWindowPbAnyToggle(
  document: vscode.TextDocument,
  windowKey: string,
  toPbAny: boolean,
  variableName: string,
  enumSymbol: string,
  enumValueRaw: string | undefined,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const calls = scanDocumentCalls(document, scanRange);

  const openWin = calls.find(c => {
    if (c.name !== "OpenWindow") return false;
    const params = splitParams(c.args);
    return stableKey(c.assignedVar, params) === windowKey;
  });
  if (!openWin) return undefined;

  const openParams = splitParams(openWin.args);
  if (openParams.length < 6) return undefined;

  const isFirstParamPbAny = (openParams[0] ?? "").trim() === "#PB_Any";

  const edit = new vscode.WorkspaceEdit();

  // Locate the surrounding procedure block (used for consistent global/enum placement + optional id replacements).
  const proc = findProcedureBlock(document, openWin.range.line);

  if (toPbAny) {
    // 1) Remove Enumeration FormWindow block.
    const enumBlock = findNamedEnumerationBlock(document, "FormWindow");
    if (enumBlock) {
      edit.delete(
        document.uri,
        new vscode.Range(
          new vscode.Position(enumBlock.startLine, 0),
          document.lineAt(enumBlock.endLine).rangeIncludingLineBreak.end
        )
      );
    }

    // 2) Ensure Global variable exists.
    ensureWindowGlobalLine(edit, document, variableName);

    // 3) Rewrite OpenWindow line to "Var = OpenWindow(#PB_Any, ...)".
    openParams[0] = "#PB_Any";
    const rebuilt = `OpenWindow(${openParams.join(", ")})`;
    const indent = openWin.indent ?? getLineIndent(document, openWin.range.line);
    const updated = `${indent}${variableName} = ${rebuilt}`;
    edit.replace(
      document.uri,
      new vscode.Range(document.positionAt(openWin.range.lineStart), document.positionAt(openWin.range.end)),
      updated
    );

    // 4) Best-effort: replace enumSymbol usage in first-call-arg within the procedure to variableName.
    if (proc) {
      const inProc = calls.filter(c => c.range.line >= proc.startLine && c.range.line <= proc.endLine);
      for (const c of inProc) {
        if (c.name === "OpenWindow") continue;
        const p = splitParams(c.args);
        if (!p.length) continue;
        if ((p[0] ?? "").trim() !== enumSymbol) continue;
        p[0] = variableName;
        const rebuiltCall = `${c.name}(${p.join(", ")})`;
        const indent = c.indent ?? getLineIndent(document, c.range.line);
        const updatedLine = c.assignedVar ? `${indent}${c.assignedVar} = ${rebuiltCall}` : `${indent}${rebuiltCall}`;
        edit.replace(
          document.uri,
          new vscode.Range(document.positionAt(c.range.lineStart), document.positionAt(c.range.end)),
          updatedLine
        );
      }
    }

    return edit;
  }

  // toPbAny == false
  // 1) Remove Global variable.
  removeGlobalLine(edit, document, variableName);

  // 2) Ensure Enumeration FormWindow block exists and has enumSymbol.
  ensureWindowEnumeration(edit, document, enumSymbol, enumValueRaw);

  // 3) Rewrite OpenWindow line to "OpenWindow(#Dlg, ...)" without assignment.
  openParams[0] = enumSymbol;
  const rebuilt = `OpenWindow(${openParams.join(", ")})`;
  const indent = openWin.indent ?? getLineIndent(document, openWin.range.line);
  const updated = `${indent}${rebuilt}`;
  edit.replace(
    document.uri,
    new vscode.Range(document.positionAt(openWin.range.lineStart), document.positionAt(openWin.range.end)),
    updated
  );

  // 4) Best-effort: replace variableName usage in first-call-arg within the procedure to enumSymbol.
  if (proc) {
    const inProc = calls.filter(c => c.range.line >= proc.startLine && c.range.line <= proc.endLine);
    for (const c of inProc) {
      if (c.name === "OpenWindow") continue;
      const p = splitParams(c.args);
      if (!p.length) continue;
      if ((p[0] ?? "").trim() !== variableName) continue;
      p[0] = enumSymbol;
      const rebuiltCall = `${c.name}(${p.join(", ")})`;
      const indent = c.indent ?? getLineIndent(document, c.range.line);
      const updatedLine = c.assignedVar ? `${indent}${c.assignedVar} = ${rebuiltCall}` : `${indent}${rebuiltCall}`;
      edit.replace(
        document.uri,
        new vscode.Range(document.positionAt(c.range.lineStart), document.positionAt(c.range.end)),
        updatedLine
      );
    }
  }

  return edit;
}

export function applyWindowEnumValuePatch(
  document: vscode.TextDocument,
  enumSymbol: string,
  enumValueRaw: string | undefined,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const block = findNamedEnumerationBlock(document, "FormWindow");
  if (!block) return undefined;

  const edit = new vscode.WorkspaceEdit();
  // Find the enum entry inside the block.
  for (let i = block.startLine + 1; i <= block.endLine - 1; i++) {
    const line = document.lineAt(i).text;
    const noComment = (line.split(";")[0] ?? "").trim();
    if (!noComment.length) continue;
    const m = /^(#\w+)\b/.exec(noComment);
    if (!m) continue;
    if (m[1] !== enumSymbol) continue;

    const indent = getLineIndent(document, i);
    const newLine = enumValueRaw && enumValueRaw.trim().length
      ? `${indent}${enumSymbol}=${enumValueRaw.trim()}`
      : `${indent}${enumSymbol}`;

    edit.replace(document.uri, document.lineAt(i).range, newLine);
    return edit;
  }

  // If not found, insert it before EndEnumeration.
  const insertLine = block.endLine;
  const indent = "  ";
  const newLine = enumValueRaw && enumValueRaw.trim().length
    ? `${indent}${enumSymbol}=${enumValueRaw.trim()}\n`
    : `${indent}${enumSymbol}\n`;

  edit.insert(document.uri, new vscode.Position(insertLine, 0), newLine);
  return edit;
}

export function applyWindowVariableNamePatch(
  document: vscode.TextDocument,
  variableName: string,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const newVar = variableName.trim();
  if (!newVar.length) return undefined;

  const calls = scanDocumentCalls(document, scanRange);

  const openWin = calls.find(c => c.name === "OpenWindow");
  if (!openWin) return undefined;

  const params = splitParams(openWin.args);
  if (params.length < 1) return undefined;

  const first = (params[0] ?? "").trim();
  const edit = new vscode.WorkspaceEdit();

  const proc = findProcedureBlock(document, openWin.range.line);

  // ---------------------------------------------------------------------------
  // PB_Any mode:  <oldVar> = OpenWindow(#PB_Any, ...)
  // ---------------------------------------------------------------------------
  if (first === "#PB_Any") {
    const oldVar = (openWin.assignedVar ?? "").trim();
    if (!oldVar.length) {
      return undefined;
    }

    // Procedure rename: Open<oldVar> -> Open<newVar>
    const oldProcName = toOpenProcName(oldVar);
    const newProcName = toOpenProcName(newVar);

    // 1) Rename Global line
    if (oldVar !== newVar) {
      removeGlobalLine(edit, document, oldVar);
      ensureWindowGlobalLine(edit, document, newVar);
    } else {
      ensureWindowGlobalLine(edit, document, newVar);
    }

    // 2) Rewrite OpenWindow assignment line
    const indent = openWin.indent ?? getLineIndent(document, openWin.range.line);
    const rebuilt = `OpenWindow(${params.join(", ")})`;
    const updated = `${indent}${newVar} = ${rebuilt}`;
    edit.replace(
      document.uri,
      new vscode.Range(document.positionAt(openWin.range.lineStart), document.positionAt(openWin.range.end)),
      updated
    );

    // 3) Best-effort: rewrite first-call-arg within the same procedure: oldVar -> newVar
    if (proc && oldVar !== newVar) {
      const inProc = calls.filter(c => c.range.line >= proc.startLine && c.range.line <= proc.endLine);
      for (const c of inProc) {
        if (c.name === "OpenWindow") continue;
        const p = splitParams(c.args);
        if (!p.length) continue;
        if ((p[0] ?? "").trim() !== oldVar) continue;

        p[0] = newVar;
        const rebuiltCall = `${c.name}(${p.join(", ")})`;
        const i2 = c.indent ?? getLineIndent(document, c.range.line);
        const updatedLine = c.assignedVar ? `${i2}${c.assignedVar} = ${rebuiltCall}` : `${i2}${rebuiltCall}`;

        edit.replace(
          document.uri,
          new vscode.Range(document.positionAt(c.range.lineStart), document.positionAt(c.range.end)),
          updatedLine
        );
      }
    }

    // 4) Patch "Procedure OpenX(...)" (and calls) if possible
    if (oldProcName && newProcName) {
      patchProcedureNameInBlock(edit, document, proc, oldProcName, newProcName);
      patchProcedureCallsBestEffort(edit, document, calls, oldProcName, newProcName, scanRange);
    }

    // --- rename derived procedure names + call-sites globally ---
    if (oldVar !== newVar) {
      const oldBase = oldVar;
      const newBase = newVar;

      const oldOpen = buildOpenProcName(oldBase);
      const newOpen = buildOpenProcName(newBase);

      const oldEvents = buildEventsProcName(oldBase);
      const newEvents = buildEventsProcName(newBase);

      const oldResize = buildResizeProcName(oldBase);
      const newResize = buildResizeProcName(newBase);

      // Procedure headers
      renameProcedureHeaderGlobal(edit, document, oldOpen, newOpen);
      renameProcedureHeaderGlobal(edit, document, oldEvents, newEvents);
      renameProcedureHeaderGlobal(edit, document, oldResize, newResize);

      // Calls (outside Open-procedure too)
      renameCallsGlobalByScanner(edit, document, calls, oldOpen, newOpen);
      renameCallsGlobalByScanner(edit, document, calls, oldEvents, newEvents);
      renameCallsGlobalByScanner(edit, document, calls, oldResize, newResize);

      // Best-effort: if someone references '#Dlg' even in PB_Any mode
      replaceEnumSymbolGlobal(edit, document, `#${oldBase}`, `#${newBase}`);
    }  

    return edit;
  }

  // ---------------------------------------------------------------------------
  // Enum mode: OpenWindow(#Dlg, ...)  -> rename #Dlg to #NewVar
  // ---------------------------------------------------------------------------
  const oldEnum = first; // e.g. "#Dlg"
  const newEnum = newVar.startsWith("#") ? newVar : `#${newVar}`;

  const oldProcName = toOpenProcName(oldEnum);
  const newProcName = toOpenProcName(newEnum);

  // 1) Patch Enumeration FormWindow entry name if present
  const block = findNamedEnumerationBlock(document, "FormWindow");
  if (block) {
    for (let i = block.startLine + 1; i <= block.endLine - 1; i++) {
      const lineText = document.lineAt(i).text;
      const re = new RegExp(`^(\\s*)${escapeRegExp(oldEnum)}(\\b.*)$`);
      const m = re.exec(lineText);
      if (!m) continue;

      const rebuiltLine = `${m[1]}${newEnum}${m[2]}`;
      edit.replace(document.uri, document.lineAt(i).range, rebuiltLine);
      break;
    }
  }

  // 2) Rewrite OpenWindow first param
  params[0] = newEnum;
  const indent = openWin.indent ?? getLineIndent(document, openWin.range.line);
  const rebuilt = `OpenWindow(${params.join(", ")})`;
  edit.replace(
    document.uri,
    new vscode.Range(document.positionAt(openWin.range.lineStart), document.positionAt(openWin.range.end)),
    `${indent}${rebuilt}`
  );

  // 3) Best-effort: rewrite first-call-arg within the same procedure: oldEnum -> newEnum
  if (proc && oldEnum !== newEnum) {
    const inProc = calls.filter(c => c.range.line >= proc.startLine && c.range.line <= proc.endLine);
    for (const c of inProc) {
      if (c.name === "OpenWindow") continue;
      const p = splitParams(c.args);
      if (!p.length) continue;
      if ((p[0] ?? "").trim() !== oldEnum) continue;

      p[0] = newEnum;
      const rebuiltCall = `${c.name}(${p.join(", ")})`;
      const i2 = c.indent ?? getLineIndent(document, c.range.line);
      const updatedLine = c.assignedVar ? `${i2}${c.assignedVar} = ${rebuiltCall}` : `${i2}${rebuiltCall}`;

      edit.replace(
        document.uri,
        new vscode.Range(document.positionAt(c.range.lineStart), document.positionAt(c.range.end)),
        updatedLine
      );
    }
  }

  // 4) Patch "Procedure OpenX(...)" (and calls) if possible
  if (oldProcName && newProcName) {
    patchProcedureNameInBlock(edit, document, proc, oldProcName, newProcName);
    patchProcedureCallsBestEffort(edit, document, calls, oldProcName, newProcName, scanRange);
  }

  return edit;
}

function findInsertAfterLineForGadgetEntry(
  document: vscode.TextDocument,
  calls: PbCall[],
  gadgetKey: string,
  entryNameLower: string
): { insertAfterLine: number; indent: string } | undefined {
  const own = findCallsByName(calls, entryNameLower).filter(c => firstParamOfCall(c.args) === gadgetKey);

  let insertAfterLine: number | undefined;
  if (own.length > 0) {
    insertAfterLine = own[own.length - 1].range.line;
  } else {
    const all = findCallsByName(calls, entryNameLower);
    if (all.length > 0) {
      insertAfterLine = all[all.length - 1].range.line;
    } else {
      const createCall = findCallByStableKey(calls, gadgetKey, n => /gadget$/i.test(n));
      if (!createCall) return undefined;
      insertAfterLine = createCall.range.line;
    }
  }

  const indent = getLineIndent(document, insertAfterLine);
  return { insertAfterLine, indent };
}

function findGadgetEntryCallAtLine(
  calls: PbCall[],
  entryNameLower: string,
  gadgetKey: string,
  sourceLine: number
): PbCall | undefined {
  return calls.find(
    c => c.name.toLowerCase() === entryNameLower && c.range.line === sourceLine && firstParamOfCall(c.args) === gadgetKey
  );
}

export function applyGadgetItemInsert(
  document: vscode.TextDocument,
  gadgetKey: string,
  args: GadgetItemArgs,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const calls = scanDocumentCalls(document, scanRange);

  const insert = findInsertAfterLineForGadgetEntry(document, calls, gadgetKey, "addgadgetitem");
  if (!insert) return undefined;

  const insertPos = new vscode.Position(Math.min(document.lineCount, insert.insertAfterLine + 1), 0);
  const line = `${insert.indent}AddGadgetItem(${buildAddGadgetItemArgs(gadgetKey, args)})\n`;

  const edit = new vscode.WorkspaceEdit();
  edit.insert(document.uri, insertPos, line);
  return edit;
}

export function applyGadgetItemUpdate(
  document: vscode.TextDocument,
  gadgetKey: string,
  sourceLine: number,
  args: GadgetItemArgs,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  if (sourceLine < 0 || sourceLine >= document.lineCount) return undefined;

  const calls = scanDocumentCalls(document, scanRange);

  const call = findGadgetEntryCallAtLine(calls, "addgadgetitem", gadgetKey, sourceLine);
  if (!call) return undefined;

  const indent = getLineIndent(document, sourceLine);
  const rebuilt = `${indent}AddGadgetItem(${buildAddGadgetItemArgs(gadgetKey, args)})`;
  return replaceCallLinePreserveSuffix(document, call, rebuilt);
}

export function applyGadgetItemDelete(
  document: vscode.TextDocument,
  gadgetKey: string,
  sourceLine: number,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  if (sourceLine < 0 || sourceLine >= document.lineCount) return undefined;

  const calls = scanDocumentCalls(document, scanRange);

  const call = findGadgetEntryCallAtLine(calls, "addgadgetitem", gadgetKey, sourceLine);
  if (!call) return undefined;

  const edit = new vscode.WorkspaceEdit();
  edit.delete(document.uri, document.lineAt(sourceLine).rangeIncludingLineBreak);
  return edit;
}

export function applyGadgetColumnInsert(
  document: vscode.TextDocument,
  gadgetKey: string,
  args: GadgetColumnArgs,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const calls = scanDocumentCalls(document, scanRange);

  const insert = findInsertAfterLineForGadgetEntry(document, calls, gadgetKey, "addgadgetcolumn");
  if (!insert) return undefined;

  const insertPos = new vscode.Position(Math.min(document.lineCount, insert.insertAfterLine + 1), 0);
  const line = `${insert.indent}AddGadgetColumn(${buildAddGadgetColumnArgs(gadgetKey, args)})\n`;

  const edit = new vscode.WorkspaceEdit();
  edit.insert(document.uri, insertPos, line);
  return edit;
}

export function applyGadgetColumnUpdate(
  document: vscode.TextDocument,
  gadgetKey: string,
  sourceLine: number,
  args: GadgetColumnArgs,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  if (sourceLine < 0 || sourceLine >= document.lineCount) return undefined;

  const calls = scanDocumentCalls(document, scanRange);

  const call = findGadgetEntryCallAtLine(calls, "addgadgetcolumn", gadgetKey, sourceLine);
  if (!call) return undefined;

  const indent = getLineIndent(document, sourceLine);
  const rebuilt = `${indent}AddGadgetColumn(${buildAddGadgetColumnArgs(gadgetKey, args)})`;
  return replaceCallLinePreserveSuffix(document, call, rebuilt);
}

export function applyGadgetColumnDelete(
  document: vscode.TextDocument,
  gadgetKey: string,
  sourceLine: number,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  if (sourceLine < 0 || sourceLine >= document.lineCount) return undefined;

  const calls = scanDocumentCalls(document, scanRange);

  const call = findGadgetEntryCallAtLine(calls, "addgadgetcolumn", gadgetKey, sourceLine);
  if (!call) return undefined;

  const edit = new vscode.WorkspaceEdit();
  edit.delete(document.uri, document.lineAt(sourceLine).rangeIncludingLineBreak);
  return edit;
}

// -----------------------------------------------------------------------------
// Menu / ToolBar / StatusBar emitters
// -----------------------------------------------------------------------------

const MENU_ENTRY_NAMES = new Set(["menutitle", "menuitem", "menubar", "opensubmenu", "closesubmenu"]);
const TOOLBAR_ENTRY_NAMES = new Set([
  "toolbarstandardbutton",
  "toolbarbutton",
  "toolbarimagebutton",
  "toolbarseparator",
  "toolbartooltip"
]);
const STATUSBAR_FIELD_NAMES = new Set(["addstatusbarfield", "statusbartext", "statusbarprogress", "statusbarimage"]);
const IMAGE_ENTRY_NAMES = new Set(["loadimage", "catchimage"]);
const WINDOW_PROPERTY_NAMES = new Set(["hidewindow", "disablewindow", "setwindowcolor"]);
const GADGET_PROPERTY_NAMES = new Set(["hidegadget", "disablegadget", "gadgettooltip", "setgadgetstate", "setgadgetcolor", "setgadgetfont"]);

function cloneGadgetForProperties(gadget: Gadget): Gadget {
  return {
    ...gadget,
    items: gadget.items ? [...gadget.items] : undefined,
    columns: gadget.columns ? [...gadget.columns] : undefined,
  };
}

function normalizeOptionalRaw(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  return trimmed && trimmed.length ? trimmed : undefined;
}

function cloneWindowForProperties(window: FormWindow): FormWindow {
  return { ...window };
}

function findWindowEventIncludeLine(document: vscode.TextDocument, procedureStartLine: number): number | undefined {
  for (let i = Math.min(procedureStartLine - 1, document.lineCount - 1); i >= 0; i--) {
    const line = document.lineAt(i).text;

    if (/^\s*Procedure\b/i.test(line) || /^\s*EndProcedure\b/i.test(line)) {
      break;
    }

    if (/^\s*XIncludeFile\s+(~?"(?:""|[^"])*")/i.test(line)) {
      return i;
    }
  }

  return undefined;
}

function findWindowEventGadgetBlock(document: vscode.TextDocument, proc: LineBlock): WindowEventProcBlock | undefined {
  let selectLine: number | undefined;

  for (let i = proc.startLine; i <= proc.endLine; i++) {
    const line = document.lineAt(i).text.split(";")[0]?.trim() ?? "";
    if (/^Select\s+EventGadget\s*\(\s*\)\s*$/i.test(line)) {
      selectLine = i;
      break;
    }
  }

  if (selectLine === undefined) return undefined;

  let depth = 0;
  let defaultLine: number | undefined;
  let procLine: number | undefined;
  let pendingDefaultProc = false;
  let hasCaseBranches = false;

  for (let i = selectLine; i <= proc.endLine; i++) {
    const line = document.lineAt(i).text.split(";")[0]?.trim() ?? "";
    if (!line.length) continue;

    if (/^Select\b/i.test(line)) {
      depth++;
      continue;
    }

    if (/^EndSelect\b/i.test(line)) {
      depth--;
      if (depth <= 0) {
        return { selectLine, endLine: i, defaultLine, procLine, hasCaseBranches };
      }
      continue;
    }

    if (depth !== 1) continue;

    if (/^Case\b/i.test(line)) {
      hasCaseBranches = true;
      pendingDefaultProc = false;
      continue;
    }

    if (/^Default\b/i.test(line)) {
      defaultLine = i;
      pendingDefaultProc = true;
      continue;
    }

    if (!pendingDefaultProc) continue;

    if (/^[A-Za-z_][A-Za-z0-9_]*\s*\(/.test(line)) {
      procLine = i;
      pendingDefaultProc = false;
    }
  }

  return undefined;
}

function findEventCaseBranch(
  document: vscode.TextDocument,
  block: LineBlock,
  matchesCase: (caseRaw: string) => boolean
): EventCaseBranch | undefined {
  let depth = 0;
  let current: EventCaseBranch | undefined;

  const finalizeCurrent = (boundaryLine: number): EventCaseBranch | undefined => {
    if (!current) return undefined;
    current.boundaryLine = boundaryLine;
    const result = matchesCase(current.caseRaw) ? current : undefined;
    current = undefined;
    return result;
  };

  for (let i = block.startLine; i <= block.endLine; i++) {
    const line = document.lineAt(i).text.split(";")[0]?.trim() ?? "";
    if (!line.length) continue;

    if (/^Select\b/i.test(line)) {
      depth++;
      continue;
    }

    if (/^EndSelect\b/i.test(line)) {
      if (depth === 1) {
        const branch = finalizeCurrent(i);
        if (branch) return branch;
      }

      depth--;
      if (depth <= 0) break;
      continue;
    }

    if (depth !== 1) continue;

    if (/^Default\b/i.test(line)) {
      const branch = finalizeCurrent(i);
      if (branch) return branch;
      continue;
    }

    const caseMatch = /^Case\b(.+)$/.exec(line);
    if (caseMatch) {
      const branch = finalizeCurrent(i);
      if (branch) return branch;

      current = {
        caseLine: i,
        caseRaw: caseMatch[1]?.trim() ?? "",
        boundaryLine: block.endLine,
      };
      continue;
    }

    if (!current || current.procLine !== undefined) continue;

    if (/^[A-Za-z_][A-Za-z0-9_]*\s*\(/.test(line)) {
      current.procLine = i;
    }
  }

  return undefined;
}

function insertEventCaseBranch(
  document: vscode.TextDocument,
  insertLine: number,
  selectLine: number,
  caseRaw: string,
  procCall: string
): vscode.WorkspaceEdit {
  const selectIndent = getLineIndent(document, selectLine);
  const caseIndent = `${selectIndent}  `;
  const procIndent = `${caseIndent}  `;
  const edit = new vscode.WorkspaceEdit();
  edit.insert(document.uri, new vscode.Position(insertLine, 0), `${caseIndent}Case ${caseRaw}
${procIndent}${procCall}
`);
  return edit;
}

function replaceEventProcLine(
  document: vscode.TextDocument,
  procLine: number,
  procCall: string
): vscode.WorkspaceEdit {
  const indent = getLineIndent(document, procLine);
  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, document.lineAt(procLine).range, `${indent}${procCall}`);
  return edit;
}

function insertEventProcLineAfterCase(
  document: vscode.TextDocument,
  caseLine: number,
  procCall: string
): vscode.WorkspaceEdit {
  const procIndent = `${getLineIndent(document, caseLine)}  `;
  const edit = new vscode.WorkspaceEdit();
  edit.insert(document.uri, new vscode.Position(caseLine + 1, 0), `${procIndent}${procCall}
`);
  return edit;
}

function deleteEventCaseBranch(
  document: vscode.TextDocument,
  branch: EventCaseBranch
): vscode.WorkspaceEdit {
  const edit = new vscode.WorkspaceEdit();
  edit.delete(
    document.uri,
    new vscode.Range(
      new vscode.Position(branch.caseLine, 0),
      new vscode.Position(branch.boundaryLine, 0)
    )
  );
  return edit;
}

function findWindowEventMenuBlock(document: vscode.TextDocument, proc: LineBlock): LineBlock | undefined {
  let selectLine: number | undefined;

  for (let i = proc.startLine; i <= proc.endLine; i++) {
    const line = document.lineAt(i).text.split(";")[0]?.trim() ?? "";
    if (/^Select\s+EventMenu\s*\(\s*\)\s*$/i.test(line)) {
      selectLine = i;
      break;
    }
  }

  if (selectLine === undefined) return undefined;

  let depth = 0;

  for (let i = selectLine; i <= proc.endLine; i++) {
    const line = document.lineAt(i).text.split(";")[0]?.trim() ?? "";
    if (!line.length) continue;

    if (/^Select\b/i.test(line)) {
      depth++;
      continue;
    }

    if (/^EndSelect\b/i.test(line)) {
      depth--;
      if (depth <= 0) {
        return { startLine: selectLine, endLine: i };
      }
    }
  }

  return undefined;
}

function findWindowEventSelectBlock(document: vscode.TextDocument, proc: LineBlock): WindowEventProcBlock | undefined {
  let selectLine: number | undefined;

  for (let i = proc.startLine; i <= proc.endLine; i++) {
    const line = document.lineAt(i).text.split(";")[0]?.trim() ?? "";
    if (/^Select\s+event\b/i.test(line)) {
      selectLine = i;
      break;
    }
  }

  if (selectLine === undefined) return undefined;

  let depth = 0;
  let defaultLine: number | undefined;
  let procLine: number | undefined;
  let pendingDefaultProc = false;
  let hasCaseBranches = false;

  for (let i = selectLine; i <= proc.endLine; i++) {
    const line = document.lineAt(i).text.split(";")[0]?.trim() ?? "";
    if (!line.length) continue;

    if (/^Select\b/i.test(line)) {
      depth++;
      continue;
    }

    if (/^EndSelect\b/i.test(line)) {
      depth--;
      if (depth <= 0) {
        return { selectLine, endLine: i, defaultLine, procLine, hasCaseBranches };
      }
      continue;
    }

    if (depth !== 1) continue;

    if (/^Case\b/i.test(line)) {
      hasCaseBranches = true;
      pendingDefaultProc = false;
      continue;
    }

    if (/^Default\b/i.test(line)) {
      defaultLine = i;
      pendingDefaultProc = true;
      continue;
    }

    if (!pendingDefaultProc) continue;

    if (/^[A-Za-z_][A-Za-z0-9_]*\s*\(/.test(line)) {
      procLine = i;
      pendingDefaultProc = false;
    }
  }

  return undefined;
}

function findWindowDefaultHandlerBlock(document: vscode.TextDocument, proc: LineBlock): WindowEventProcBlock | undefined {
  return findWindowEventSelectBlock(document, proc) ?? findWindowEventGadgetBlock(document, proc);
}

function blockHasCaseBranches(document: vscode.TextDocument, block: LineBlock): boolean {
  let depth = 0;

  for (let i = block.startLine; i <= block.endLine; i++) {
    const line = document.lineAt(i).text.split(";")[0]?.trim() ?? "";
    if (!line.length) continue;

    if (/^Select\b/i.test(line)) {
      depth++;
      continue;
    }

    if (/^EndSelect\b/i.test(line)) {
      depth--;
      if (depth <= 0) break;
      continue;
    }

    if (depth === 1 && /^Case\b/i.test(line)) {
      return true;
    }
  }

  return false;
}

function buildWindowEventProcCall(window: FormWindow, procName: string, usesSeparateEventProc: boolean): string {
  return usesSeparateEventProc ? `${procName}(event, ${window.id})` : `${procName}()`;
}

function buildGadgetEventProcCall(procName: string, usesSeparateEventProc: boolean): string {
  return usesSeparateEventProc ? `${procName}(EventType())` : `${procName}()`;
}

function buildMenuEventProcCall(procName: string, usesSeparateEventProc: boolean): string {
  return usesSeparateEventProc ? `${procName}(EventMenu())` : `${procName}()`;
}

export function applyWindowEventUpdate(
  document: vscode.TextDocument,
  windowKey: string,
  args: WindowEventArgs,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const parsed = parseFormDocument(document.getText());
  const window = parsed.window;
  if (!window || window.id !== windowKey) return undefined;

  const calls = scanDocumentCalls(document, scanRange);
  const openCall = findCallByStableKey(calls, windowKey, name => name === "OpenWindow");
  if (!openCall) return undefined;

  const proc = findProcedureBlock(document, openCall.range.line);
  if (!proc) return undefined;

  const includeLine = findWindowEventIncludeLine(document, proc.startLine);
  const eventFileRaw = normalizeOptionalRaw(args.eventFileRaw);
  const edit = new vscode.WorkspaceEdit();

  if (includeLine !== undefined) {
    if (!eventFileRaw) {
      edit.delete(document.uri, document.lineAt(includeLine).rangeIncludingLineBreak);
      return edit;
    }

    const indent = getLineIndent(document, includeLine);
    edit.replace(document.uri, document.lineAt(includeLine).range, `${indent}XIncludeFile ${eventFileRaw}`);
    return edit;
  }

  if (!eventFileRaw) return undefined;

  edit.insert(document.uri, new vscode.Position(proc.startLine, 0), `XIncludeFile ${eventFileRaw}\n`);
  return edit;
}

export function applyWindowGenerateEventLoopUpdate(
  document: vscode.TextDocument,
  windowKey: string,
  enabled: boolean,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const parsed = parseFormDocument(document.getText());
  const window = parsed.window;
  if (!window || window.id !== windowKey) return undefined;

  const calls = scanDocumentCalls(document, scanRange);
  const openCall = findCallByStableKey(calls, windowKey, name => name === "OpenWindow");
  if (!openCall) return undefined;

  const context = resolveWindowEventProcedureBlock(document, window, openCall.range.line);
  if (!context) return undefined;

  const eventGadgetBlock = findWindowEventGadgetBlock(document, context.eventProc);
  const eventMenuBlock = findWindowEventMenuBlock(document, context.eventProc);

  if (enabled) {
    if (eventGadgetBlock || eventMenuBlock || context.usesSeparateEventProc) return undefined;

    const bodyIndent = getLineIndent(document, openCall.range.line);
    const edit = new vscode.WorkspaceEdit();
    edit.insert(
      document.uri,
      new vscode.Position(context.openProc.endLine, 0),
      `${bodyIndent}Select EventGadget()
${bodyIndent}EndSelect
`
    );
    return edit;
  }

  if (!eventGadgetBlock && !eventMenuBlock) return undefined;

  if (context.usesSeparateEventProc) {
    const menuHasCases = eventMenuBlock ? blockHasCaseBranches(document, eventMenuBlock) : false;
    const gadgetHasCases = eventGadgetBlock?.hasCaseBranches ?? false;
    if (menuHasCases || gadgetHasCases) return undefined;

    const edit = new vscode.WorkspaceEdit();
    edit.delete(
      document.uri,
      new vscode.Range(
        new vscode.Position(context.eventProc.startLine, 0),
        new vscode.Position(context.eventProc.endLine + 1, 0)
      )
    );
    return edit;
  }

  if (eventMenuBlock) return undefined;
  if (!eventGadgetBlock) return undefined;
  if (eventGadgetBlock.hasCaseBranches) return undefined;

  const edit = new vscode.WorkspaceEdit();
  edit.delete(
    document.uri,
    new vscode.Range(
      new vscode.Position(eventGadgetBlock.selectLine, 0),
      new vscode.Position(eventGadgetBlock.endLine + 1, 0)
    )
  );
  return edit;
}

export function applyWindowEventProcUpdate(
  document: vscode.TextDocument,
  windowKey: string,
  eventProc: string | undefined,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const parsed = parseFormDocument(document.getText());
  const window = parsed.window;
  if (!window || window.id !== windowKey) return undefined;

  const calls = scanDocumentCalls(document, scanRange);
  const openCall = findCallByStableKey(calls, windowKey, name => name === "OpenWindow");
  if (!openCall) return undefined;

  const context = resolveWindowEventProcedureBlock(document, window, openCall.range.line);
  if (!context) return undefined;

  const block = findWindowDefaultHandlerBlock(document, context.eventProc);
  if (!block) return undefined;

  const normalizedEventProc = normalizeOptionalRaw(eventProc);
  const procCall = normalizedEventProc
    ? buildWindowEventProcCall(window, normalizedEventProc, context.usesSeparateEventProc)
    : undefined;
  const edit = new vscode.WorkspaceEdit();

  if (block.procLine !== undefined) {
    if (!procCall) {
      edit.delete(document.uri, document.lineAt(block.procLine).rangeIncludingLineBreak);
      return edit;
    }

    return replaceEventProcLine(document, block.procLine, procCall);
  }

  if (!procCall) return undefined;

  if (block.defaultLine !== undefined) {
    const indent = `${getLineIndent(document, block.defaultLine)}  `;
    edit.insert(document.uri, new vscode.Position(block.defaultLine + 1, 0), `${indent}${procCall}
`);
    return edit;
  }

  const selectIndent = getLineIndent(document, block.selectLine);
  const defaultIndent = `${selectIndent}  `;
  const procIndent = `${defaultIndent}  `;
  edit.insert(
    document.uri,
    new vscode.Position(block.endLine, 0),
    `${defaultIndent}Default
${procIndent}${procCall}
`
  );
  return edit;
}

export function applyGadgetEventProcUpdate(
  document: vscode.TextDocument,
  gadgetKey: string,
  eventProc: string | undefined,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const parsed = parseFormDocument(document.getText());
  const gadget = parsed.gadgets.find((entry) => entry.id === gadgetKey);
  if (!gadget) return undefined;
  const window = parsed.window;
  if (!window) return undefined;

  const calls = scanDocumentCalls(document, scanRange);
  const openCall = findCallByStableKey(calls, window.id, (name) => name === "OpenWindow");
  if (!openCall) return undefined;

  const context = resolveWindowEventProcedureBlock(document, window, openCall.range.line);
  if (!context) return undefined;

  const block = findWindowEventGadgetBlock(document, context.eventProc);
  if (!block) return undefined;

  const caseRaw = gadget.id;
  const branch = findEventCaseBranch(document, { startLine: block.selectLine, endLine: block.endLine }, (raw) => raw === caseRaw);
  const normalizedEventProc = normalizeOptionalRaw(eventProc);
  const procCall = normalizedEventProc
    ? buildGadgetEventProcCall(normalizedEventProc, context.usesSeparateEventProc)
    : undefined;

  if (branch) {
    if (!procCall) {
      return deleteEventCaseBranch(document, branch);
    }

    if (branch.procLine !== undefined) {
      return replaceEventProcLine(document, branch.procLine, procCall);
    }

    return insertEventProcLineAfterCase(document, branch.caseLine, procCall);
  }

  if (!procCall) return undefined;

  const insertLine = block.defaultLine ?? block.endLine;
  return insertEventCaseBranch(document, insertLine, block.selectLine, caseRaw, procCall);
}

export function applyMenuEntryEventUpdate(
  document: vscode.TextDocument,
  entryIdRaw: string,
  eventProc: string | undefined,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const parsed = parseFormDocument(document.getText());
  const menuEntry = parsed.menus.flatMap((menu) => menu.entries).find((entry) => entry.idRaw === entryIdRaw);
  if (!menuEntry) return undefined;
  const window = parsed.window;
  if (!window) return undefined;

  const calls = scanDocumentCalls(document, scanRange);
  const openCall = findCallByStableKey(calls, window.id, (name) => name === "OpenWindow");
  if (!openCall) return undefined;

  const context = resolveWindowEventProcedureBlock(document, window, openCall.range.line);
  if (!context) return undefined;

  const block = findWindowEventMenuBlock(document, context.eventProc);
  if (!block) return undefined;

  const branch = findEventCaseBranch(document, block, (raw) => raw === entryIdRaw);
  const normalizedEventProc = normalizeOptionalRaw(eventProc);
  const procCall = normalizedEventProc
    ? buildMenuEventProcCall(normalizedEventProc, context.usesSeparateEventProc)
    : undefined;

  if (branch) {
    if (!procCall) {
      return deleteEventCaseBranch(document, branch);
    }

    if (branch.procLine !== undefined) {
      return replaceEventProcLine(document, branch.procLine, procCall);
    }

    return insertEventProcLineAfterCase(document, branch.caseLine, procCall);
  }

  if (!procCall) return undefined;

  return insertEventCaseBranch(document, block.endLine, block.startLine, entryIdRaw, procCall);
}

export function applyToolBarEntryEventUpdate(
  document: vscode.TextDocument,
  entryIdRaw: string,
  eventProc: string | undefined,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const parsed = parseFormDocument(document.getText());
  const toolBarEntry = parsed.toolbars.flatMap((toolBar) => toolBar.entries).find((entry) => entry.idRaw === entryIdRaw);
  if (!toolBarEntry) return undefined;
  const window = parsed.window;
  if (!window) return undefined;

  const calls = scanDocumentCalls(document, scanRange);
  const openCall = findCallByStableKey(calls, window.id, (name) => name === "OpenWindow");
  if (!openCall) return undefined;

  const context = resolveWindowEventProcedureBlock(document, window, openCall.range.line);
  if (!context) return undefined;

  const block = findWindowEventMenuBlock(document, context.eventProc);
  if (!block) return undefined;

  const branch = findEventCaseBranch(document, block, (raw) => raw === entryIdRaw);
  const normalizedEventProc = normalizeOptionalRaw(eventProc);
  const procCall = normalizedEventProc
    ? buildMenuEventProcCall(normalizedEventProc, context.usesSeparateEventProc)
    : undefined;

  if (branch) {
    if (!procCall) {
      return deleteEventCaseBranch(document, branch);
    }

    if (branch.procLine !== undefined) {
      return replaceEventProcLine(document, branch.procLine, procCall);
    }

    return insertEventProcLineAfterCase(document, branch.caseLine, procCall);
  }

  if (!procCall) return undefined;

  return insertEventCaseBranch(document, block.endLine, block.startLine, entryIdRaw, procCall);
}

function buildWindowPropertyLines(windowKey: string, window: FormWindow, indent: string): string {
  const lines: string[] = [];

  const hiddenRaw = normalizeOptionalRaw(window.hiddenRaw);
  if (hiddenRaw) {
    lines.push(`${indent}HideWindow(${windowKey}, ${hiddenRaw})`);
  }

  const disabledRaw = normalizeOptionalRaw(window.disabledRaw);
  if (disabledRaw) {
    lines.push(`${indent}DisableWindow(${windowKey}, ${disabledRaw})`);
  }

  const colorRaw = normalizeOptionalRaw(window.colorRaw);
  if (colorRaw) {
    lines.push(`${indent}SetWindowColor(${windowKey}, ${colorRaw})`);
  }

  return lines.length ? `${lines.join("\n")}\n` : "";
}

function applyWindowPropertyMutation(
  document: vscode.TextDocument,
  windowKey: string,
  mutate: (window: FormWindow) => boolean,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const parsed = parseFormDocument(document.getText());
  const window = parsed.window;
  if (!window || window.id !== windowKey) return undefined;

  const nextWindow = cloneWindowForProperties(window);
  if (!mutate(nextWindow)) return undefined;

  const calls = scanDocumentCalls(document, scanRange);
  const openCall = findCallByStableKey(calls, windowKey, name => name === "OpenWindow");
  if (!openCall) return undefined;

  const proc = findProcedureBlock(document, openCall.range.line);
  const propertyCalls = calls.filter(call => {
    const nameLower = call.name.toLowerCase();
    if (!WINDOW_PROPERTY_NAMES.has(nameLower)) return false;
    if (firstParamOfCall(call.args) !== windowKey) return false;
    if (!proc) return true;
    return call.range.line >= proc.startLine && call.range.line <= proc.endLine;
  }).sort((a, b) => a.range.line - b.range.line);

  const anchorLine = propertyCalls.length ? propertyCalls[0].range.line : openCall.range.line + 1;
  const indentSourceLine = propertyCalls.length ? propertyCalls[0].range.line : openCall.range.line;
  const indent = getLineIndent(document, indentSourceLine);
  const rebuilt = buildWindowPropertyLines(windowKey, nextWindow, indent);

  const edit = new vscode.WorkspaceEdit();

  for (const call of propertyCalls) {
    edit.delete(document.uri, document.lineAt(call.range.line).rangeIncludingLineBreak);
  }

  if (rebuilt) {
    edit.insert(document.uri, new vscode.Position(Math.min(document.lineCount, anchorLine), 0), rebuilt);
  }

  return propertyCalls.length || rebuilt ? edit : undefined;
}

export function applyWindowPropertyUpdate(
  document: vscode.TextDocument,
  windowKey: string,
  args: WindowPropertyArgs,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  return applyWindowPropertyMutation(
    document,
    windowKey,
    window => {
      window.hiddenRaw = normalizeOptionalRaw(args.hiddenRaw);
      window.disabledRaw = normalizeOptionalRaw(args.disabledRaw);
      window.colorRaw = normalizeOptionalRaw(args.colorRaw);
      return true;
    },
    scanRange
  );
}

function buildGadgetPropertyLines(gadgetKey: string, gadget: Gadget, indent: string): string {
  const lines: string[] = [];

  const hiddenRaw = normalizeOptionalRaw(gadget.hiddenRaw);
  if (hiddenRaw) {
    lines.push(`${indent}HideGadget(${gadgetKey}, ${hiddenRaw})`);
  }

  const disabledRaw = normalizeOptionalRaw(gadget.disabledRaw);
  if (disabledRaw) {
    lines.push(`${indent}DisableGadget(${gadgetKey}, ${disabledRaw})`);
  }

  const tooltipRaw = normalizeOptionalRaw(gadget.tooltipRaw);
  if (tooltipRaw) {
    lines.push(`${indent}GadgetToolTip(${gadgetKey}, ${tooltipRaw})`);
  }

  const backColorRaw = normalizeOptionalRaw(gadget.backColorRaw);
  if (backColorRaw) {
    lines.push(`${indent}SetGadgetColor(${gadgetKey}, #PB_Gadget_BackColor, ${backColorRaw})`);
  }

  const frontColorRaw = normalizeOptionalRaw(gadget.frontColorRaw);
  if (frontColorRaw) {
    lines.push(`${indent}SetGadgetColor(${gadgetKey}, #PB_Gadget_FrontColor, ${frontColorRaw})`);
  }

  const gadgetFontRaw = normalizeOptionalRaw(gadget.gadgetFontRaw);
  if (gadgetFontRaw) {
    lines.push(`${indent}SetGadgetFont(${gadgetKey}, ${gadgetFontRaw})`);
  }

  const stateRaw = normalizeOptionalRaw(gadget.stateRaw);
  if (stateRaw) {
    lines.push(`${indent}SetGadgetState(${gadgetKey}, ${stateRaw})`);
  }

  return lines.length ? `${lines.join("\n")}\n` : "";
}

function applyGadgetPropertyMutation(
  document: vscode.TextDocument,
  gadgetKey: string,
  mutate: (gadget: Gadget) => boolean,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const parsed = parseFormDocument(document.getText());
  const gadget = parsed.gadgets.find(entry => entry.id === gadgetKey);
  if (!gadget) return undefined;

  const nextGadget = cloneGadgetForProperties(gadget);
  if (!mutate(nextGadget)) return undefined;

  const calls = scanDocumentCalls(document, scanRange);
  const createCall = findCallByStableKey(calls, gadgetKey, name => /gadget$/i.test(name));
  if (!createCall) return undefined;

  const proc = findProcedureBlock(document, createCall.range.line);
  const propertyCalls = calls.filter(call => {
    const nameLower = call.name.toLowerCase();
    if (!GADGET_PROPERTY_NAMES.has(nameLower)) return false;
    if (firstParamOfCall(call.args) !== gadgetKey) return false;
    if (!proc) return true;
    return call.range.line >= proc.startLine && call.range.line <= proc.endLine;
  }).sort((a, b) => a.range.line - b.range.line);

  const anchorLine = propertyCalls.length ? propertyCalls[0].range.line : createCall.range.line + 1;
  const indentSourceLine = propertyCalls.length ? propertyCalls[0].range.line : createCall.range.line;
  const indent = getLineIndent(document, indentSourceLine);
  const rebuilt = buildGadgetPropertyLines(gadgetKey, nextGadget, indent);

  const edit = new vscode.WorkspaceEdit();

  for (const call of propertyCalls) {
    edit.delete(document.uri, document.lineAt(call.range.line).rangeIncludingLineBreak);
  }

  if (rebuilt) {
    edit.insert(document.uri, new vscode.Position(Math.min(document.lineCount, anchorLine), 0), rebuilt);
  }

  return propertyCalls.length || rebuilt ? edit : undefined;
}

export function applyGadgetPropertyUpdate(
  document: vscode.TextDocument,
  gadgetKey: string,
  args: GadgetPropertyArgs,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  return applyGadgetPropertyMutation(
    document,
    gadgetKey,
    gadget => {
      gadget.hiddenRaw = normalizeOptionalRaw(args.hiddenRaw);
      gadget.disabledRaw = normalizeOptionalRaw(args.disabledRaw);
      gadget.tooltipRaw = normalizeOptionalRaw(args.tooltipRaw);
      gadget.stateRaw = normalizeOptionalRaw(args.stateRaw);
      gadget.frontColorRaw = normalizeOptionalRaw(args.frontColorRaw);
      gadget.backColorRaw = normalizeOptionalRaw(args.backColorRaw);
      gadget.gadgetFontRaw = normalizeOptionalRaw(args.gadgetFontRaw);
      return true;
    },
    scanRange
  );
}

function buildImageLine(args: ImageArgs): string {
  const procName = args.inline ? "CatchImage" : "LoadImage";
  const idRaw = args.idRaw.trim();
  const imageRaw = args.imageRaw.trim();

  if (idRaw === "#PB_Any") {
    const assignedVar = args.assignedVar?.trim();
    if (assignedVar) {
      return `${assignedVar} = ${procName}(#PB_Any, ${imageRaw})`;
    }
  }

  return `${procName}(${idRaw}, ${imageRaw})`;
}

function buildFontLine(args: FontArgs): string {
  const idRaw = args.idRaw.trim();
  const nameRaw = args.nameRaw.trim();
  const sizeRaw = args.sizeRaw.trim();
  const flagsRaw = normalizeOptionalRaw(args.flagsRaw);

  if (idRaw === "#PB_Any") {
    const assignedVar = args.assignedVar?.trim();
    if (assignedVar) {
      return `${assignedVar} = LoadFont(#PB_Any, ${nameRaw}, ${sizeRaw}${flagsRaw ? `, ${flagsRaw}` : ""})`;
    }
  }

  return `LoadFont(${idRaw}, ${nameRaw}, ${sizeRaw}${flagsRaw ? `, ${flagsRaw}` : ""})`;
}

function cloneFormFont(font: FormFont): FormFont {
  return {
    id: font.id,
    pbAny: font.pbAny,
    variable: font.variable,
    firstParam: font.firstParam,
    nameRaw: font.nameRaw,
    name: font.name,
    sizeRaw: font.sizeRaw,
    size: font.size,
    flagsRaw: font.flagsRaw,
    source: font.source,
  };
}

function mapFontArgsToFont(args: FontArgs): FormFont {
  const firstParam = args.idRaw.trim();
  const pbAny = firstParam === "#PB_Any";
  const assignedVar = args.assignedVar?.trim();
  const nameRaw = args.nameRaw.trim();
  const sizeRaw = args.sizeRaw.trim();
  const name = unquoteString(nameRaw) ?? undefined;
  const size = asNumber(sizeRaw);

  return {
    id: pbAny ? (assignedVar || "#PB_Any") : firstParam,
    pbAny,
    variable: pbAny ? (assignedVar || undefined) : firstParam.replace(/^#/, ""),
    firstParam,
    nameRaw,
    name,
    sizeRaw,
    size: typeof size === "number" ? size : undefined,
    flagsRaw: normalizeOptionalRaw(args.flagsRaw),
  };
}

function cloneFormImage(image: FormImage): FormImage {
  return {
    id: image.id,
    pbAny: image.pbAny,
    variable: image.variable,
    firstParam: image.firstParam,
    imageRaw: image.imageRaw,
    image: image.image,
    inline: image.inline,
    source: image.source,
  };
}

function mapImageArgsToImage(args: ImageArgs): FormImage {
  const firstParam = args.idRaw.trim();
  const pbAny = firstParam === "#PB_Any";
  const assignedVar = args.assignedVar?.trim();
  const imageRaw = args.imageRaw.trim();
  const normalized = args.inline
    ? imageRaw.replace(/^\?+/, "").trim() || undefined
    : (imageRaw.match(/^~?"([\s\S]*)"$/)?.[1]?.replace(/""/g, '"') ?? (imageRaw || undefined));

  return {
    id: pbAny ? (assignedVar || "#PB_Any") : firstParam,
    pbAny,
    variable: pbAny ? (assignedVar || undefined) : firstParam.replace(/^#/, ""),
    firstParam,
    imageRaw,
    image: normalized,
    inline: args.inline,
  };
}

function isTopLevelHeadBoundaryLine(text: string): boolean {
  const trimmed = text.trim();
  return /^Declare\b/i.test(trimmed)
    || /^XIncludeFile\b/i.test(trimmed)
    || /^ProcedureDLL\b/i.test(trimmed)
    || /^Procedure(?:\.\w+)?\b/i.test(trimmed)
    || /^\s*;\s*IDE Options\b/i.test(text);
}

function isCustomGadgetInitMarkerLine(text: string): boolean {
  return /^\s*;\s*\d+\s+Custom gadget initialisation \(do Not remove this line\)\s*$/i.test(text);
}

function isTopLevelImageOrFontBoundaryLine(text: string): boolean {
  const trimmed = text.trim();
  return isImageDecoderLine(text)
    || /^LoadImage\s*\(/i.test(trimmed)
    || /^CatchImage\s*\(/i.test(trimmed)
    || /^Enumeration\s+FormFont\b/i.test(trimmed)
    || /^LoadFont\s*\(/i.test(trimmed)
    || isTopLevelHeadBoundaryLine(text);
}

function findCustomGadgetInitBoundaryLine(document: vscode.TextDocument, startLine = 0): number | undefined {
  let seenMarker = false;

  for (let i = Math.max(0, startLine); i < document.lineCount; i++) {
    const text = document.lineAt(i).text;
    if (!seenMarker) {
      if (isCustomGadgetInitMarkerLine(text)) {
        seenMarker = true;
      }
      continue;
    }

    if (isTopLevelImageOrFontBoundaryLine(text)) {
      return i;
    }
  }

  return seenMarker ? document.lineCount : undefined;
}

function isTopLevelGlobalAnchorLine(text: string): boolean {
  const trimmed = text.trim();
  return /^Enumeration\b/i.test(trimmed)
    || isImageDecoderLine(text)
    || /^LoadImage\s*\(/i.test(trimmed)
    || /^CatchImage\s*\(/i.test(trimmed)
    || /^LoadFont\s*\(/i.test(trimmed)
    || isTopLevelHeadBoundaryLine(text);
}

function getFirstProcedureLine(document: vscode.TextDocument): number {
  for (let i = 0; i < document.lineCount; i++) {
    if (/^\s*ProcedureDLL\b/i.test(document.lineAt(i).text) || /^\s*Procedure(?:\.\w+)?\b/i.test(document.lineAt(i).text)) return i;
  }
  return document.lineCount;
}

function findFontLoadCalls(calls: PbCall[], document: vscode.TextDocument): PbCall[] {
  const firstProcedureLine = getFirstProcedureLine(document);
  return calls.filter(call => call.name === "LoadFont" && call.range.line < firstProcedureLine);
}

function getFontGlobalVars(fonts: FormFont[]): string[] {
  return fonts
    .filter(font => font.pbAny)
    .map(font => font.id?.trim() ?? "")
    .filter(id => id.length > 0 && !id.startsWith("#"));
}

function getFontEnumSymbols(fonts: FormFont[]): string[] {
  return fonts
    .filter(font => !font.pbAny)
    .map(font => font.firstParam.trim())
    .filter(id => id.length > 0 && id.startsWith("#"));
}

function buildFontGlobalBlock(fonts: FormFont[]): string {
  const globals = getFontGlobalVars(fonts);
  if (!globals.length) return "";
  return `Global ${globals.join(", ")}

`;
}

function buildFontEnumBlock(fonts: FormFont[]): string {
  const symbols = getFontEnumSymbols(fonts);
  if (!symbols.length) return "";
  return `Enumeration FormFont
${symbols.map(symbol => `  ${symbol}`).join("\n")}
EndEnumeration

`;
}

function findFontGlobalBlock(document: vscode.TextDocument, fonts: FormFont[]): LineBlock | undefined {
  const fontGlobalNames = new Set(getFontGlobalVars(fonts));
  if (!fontGlobalNames.size) return undefined;

  let topAnchor = document.lineCount;
  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i).text;
    if (isTopLevelGlobalAnchorLine(line)) {
      topAnchor = i;
      break;
    }
  }

  for (let i = 0; i < topAnchor; i++) {
    const vars = parseGlobalVarNames(document.lineAt(i).text);
    if (!vars.length) continue;
    if (!vars.some(name => fontGlobalNames.has(name))) continue;
    return expandBlockWithTrailingBlank(document, { startLine: i, endLine: i });
  }

  return undefined;
}

function findFontGlobalInsertLine(document: vscode.TextDocument): number {
  return findImageGlobalInsertLine(document);
}

function findFontBlockInsertLine(document: vscode.TextDocument, calls: PbCall[]): number {
  const fontLoadCalls = findFontLoadCalls(calls, document);
  if (fontLoadCalls.length) return fontLoadCalls[0].range.line;

  const decoderLines: number[] = [];
  for (let i = 0; i < document.lineCount; i++) {
    if (isImageDecoderLine(document.lineAt(i).text)) decoderLines.push(i);
  }

  const imageCalls = calls.filter(c => IMAGE_ENTRY_NAMES.has(c.name.toLowerCase()));
  if (imageCalls.length || decoderLines.length) {
    const lastLine = Math.max(
      imageCalls.length ? imageCalls[imageCalls.length - 1].range.line : -1,
      decoderLines.length ? decoderLines[decoderLines.length - 1] : -1
    );
    let insertLine = lastLine + 1;
    while (insertLine < document.lineCount && document.lineAt(insertLine).text.trim() === "") insertLine += 1;
    return insertLine;
  }

  const preferredEnums = ["FormWindow", "FormGadget", "FormMenu", "FormImage"];
  let lastBlock: LineBlock | undefined;
  for (const enumName of preferredEnums) {
    const block = findNamedEnumerationBlock(document, enumName);
    if (block && (!lastBlock || block.endLine > lastBlock.endLine)) lastBlock = block;
  }

  if (lastBlock) {
    let insertLine = lastBlock.endLine + 1;
    while (insertLine < document.lineCount && document.lineAt(insertLine).text.trim() === "") insertLine += 1;
    const customInitBoundary = findCustomGadgetInitBoundaryLine(document, insertLine);
    if (customInitBoundary !== undefined) return customInitBoundary;
    return insertLine;
  }

  const customInitBoundary = findCustomGadgetInitBoundaryLine(document);
  if (customInitBoundary !== undefined) return customInitBoundary;

  return findImageBlockInsertLine(document, calls);
}

function buildFontLoadBlock(fonts: FormFont[], indent: string): string {
  if (!fonts.length) return "";

  const lines = fonts.map(font => `${indent}${buildFontLine({
    idRaw: font.firstParam,
    nameRaw: font.nameRaw,
    sizeRaw: font.sizeRaw,
    flagsRaw: font.flagsRaw,
    assignedVar: font.pbAny ? font.id : undefined,
  })}`);

  return `${lines.join("\n")}

`;
}

function applyFontMutation(
  document: vscode.TextDocument,
  mutate: (fonts: FormFont[]) => boolean,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const parsed = parseFormDocument(document.getText());
  const nextFonts = parsed.fonts.map(cloneFormFont);
  if (!mutate(nextFonts)) return undefined;

  const calls = scanDocumentCalls(document, scanRange);
  const fontLoadCalls = findFontLoadCalls(calls, document);
  const anchorLine = fontLoadCalls.length ? fontLoadCalls[0].range.line : findFontBlockInsertLine(document, calls);
  const indent = document.lineCount ? getLineIndent(document, Math.min(anchorLine, Math.max(0, document.lineCount - 1))) : "";
  const rebuiltLoadBlock = buildFontLoadBlock(nextFonts, indent);

  const edit = new vscode.WorkspaceEdit();

  const fontGlobalBlock = findFontGlobalBlock(document, parsed.fonts);
  applyOptionalBlockPatch(edit, document, fontGlobalBlock, findFontGlobalInsertLine(document), "");

  const fontEnumBlock = findNamedEnumerationBlock(document, "FormFont");
  const fontEnumInsertLine = findFontBlockInsertLine(document, calls);
  const combineFreshEnumAndLoadInsert = !fontLoadCalls.length && !fontEnumBlock && !!buildFontEnumBlock(nextFonts);

  if (!combineFreshEnumAndLoadInsert) {
    applyOptionalBlockPatch(
      edit,
      document,
      fontEnumBlock ? expandBlockWithTrailingBlank(document, fontEnumBlock) : undefined,
      fontEnumInsertLine,
      buildFontEnumBlock(nextFonts)
    );
  }

  if (fontLoadCalls.length) {
    const firstLine = fontLoadCalls[0].range.line;
    const lastLine = fontLoadCalls[fontLoadCalls.length - 1].range.line;
    edit.replace(
      document.uri,
      new vscode.Range(new vscode.Position(firstLine, 0), getHeadBlockReplaceEnd(document, lastLine)),
      rebuiltLoadBlock
    );
    return edit;
  }

  if (!rebuiltLoadBlock) {
    const hasStructuralFontBlock = !!fontGlobalBlock || !!fontEnumBlock || !!buildFontEnumBlock(nextFonts);
    return hasStructuralFontBlock ? edit : undefined;
  }

  if (combineFreshEnumAndLoadInsert) {
    edit.insert(document.uri, new vscode.Position(fontEnumInsertLine, 0), `${buildFontEnumBlock(nextFonts)}${rebuiltLoadBlock}`);
    return edit;
  }

  edit.insert(document.uri, new vscode.Position(fontEnumInsertLine, 0), rebuiltLoadBlock);
  return edit;
}

const IMAGE_DECODER_ORDER = [
  { name: "UseJPEGImageDecoder", pattern: /(?:jpg|jpeg)/i },
  { name: "UsePNGImageDecoder", pattern: /png/i },
  { name: "UseJTAImageDecoder", pattern: /tga/i },
  { name: "UseTIFFImageDecoder", pattern: /tiff/i },
] as const;

function getRequiredImageDecoders(images: FormImage[]): string[] {
  const result: string[] = [];

  for (const decoder of IMAGE_DECODER_ORDER) {
    const hasMatch = images.some(image => !image.inline && decoder.pattern.test(image.image ?? image.imageRaw));
    if (hasMatch) {
      result.push(decoder.name);
    }
  }

  return result;
}

function isImageDecoderLine(text: string): boolean {
  const trimmed = text.trim();
  return IMAGE_DECODER_ORDER.some(decoder => trimmed === `${decoder.name}()`);
}

function findImageBlockInsertLine(document: vscode.TextDocument, calls: PbCall[]): number {
  for (let i = 0; i < document.lineCount; i++) {
    const text = document.lineAt(i).text.trim();
    if (/^Enumeration\s+FormFont\b/i.test(text)) return i;
    if (/^LoadFont\s*\(/i.test(text)) return i;
    if (isTopLevelHeadBoundaryLine(document.lineAt(i).text)) return i;
  }

  return document.lineCount;
}

function getImageGlobalVars(images: FormImage[]): string[] {
  return images
    .filter(image => image.pbAny)
    .map(image => image.id?.trim() ?? "")
    .filter(id => id.length > 0 && !id.startsWith("#"));
}

function getImageEnumSymbols(images: FormImage[]): string[] {
  return images
    .filter(image => !image.pbAny)
    .map(image => image.firstParam.trim())
    .filter(id => id.length > 0 && id.startsWith("#"));
}

function buildImageGlobalBlock(images: FormImage[]): string {
  const globals = getImageGlobalVars(images);
  if (!globals.length) return "";
  return `Global ${globals.join(", ")}

`;
}

function buildImageEnumBlock(images: FormImage[]): string {
  const symbols = getImageEnumSymbols(images);
  if (!symbols.length) return "";
  return `Enumeration FormImage
${symbols.map(symbol => `  ${symbol}`).join("\n")}
EndEnumeration

`;
}

function parseGlobalVarNames(line: string): string[] {
  const match = /^\s*Global\s+(.+?)\s*$/.exec(line);
  if (!match) return [];
  return match[1]
    .split(",")
    .map(part => part.trim())
    .filter(Boolean);
}

function expandBlockWithTrailingBlank(document: vscode.TextDocument, block: LineBlock): LineBlock {
  let endLine = block.endLine;
  if (endLine + 1 < document.lineCount && document.lineAt(endLine + 1).text.trim() === "") {
    endLine += 1;
  }
  return { startLine: block.startLine, endLine };
}

function findImageGlobalBlock(document: vscode.TextDocument, images: FormImage[]): LineBlock | undefined {
  const imageGlobalNames = new Set(getImageGlobalVars(images));
  if (!imageGlobalNames.size) return undefined;

  let topAnchor = document.lineCount;
  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i).text;
    if (isTopLevelGlobalAnchorLine(line)) {
      topAnchor = i;
      break;
    }
  }

  for (let i = 0; i < topAnchor; i++) {
    const vars = parseGlobalVarNames(document.lineAt(i).text);
    if (!vars.length) continue;
    if (!vars.some(name => imageGlobalNames.has(name))) continue;
    return expandBlockWithTrailingBlank(document, { startLine: i, endLine: i });
  }

  return undefined;
}

function findImageGlobalInsertLine(document: vscode.TextDocument): number {
  let lastGlobal = -1;
  let firstAnchor = document.lineCount;

  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i).text;
    if (/^\s*Global\b/i.test(line)) lastGlobal = i;
    if (firstAnchor === document.lineCount && isTopLevelGlobalAnchorLine(line)) {
      firstAnchor = i;
    }
  }

  if (lastGlobal >= 0) {
    let insertLine = lastGlobal + 1;
    while (insertLine < document.lineCount && document.lineAt(insertLine).text.trim() === "") {
      insertLine += 1;
    }
    return insertLine;
  }

  return firstAnchor;
}

function findImageEnumInsertLine(document: vscode.TextDocument, calls: PbCall[]): number {
  const preferredEnums = ["FormWindow", "FormGadget", "FormMenu"];
  let lastBlock: LineBlock | undefined;

  for (const enumName of preferredEnums) {
    const block = findNamedEnumerationBlock(document, enumName);
    if (block && (!lastBlock || block.endLine > lastBlock.endLine)) {
      lastBlock = block;
    }
  }

  if (lastBlock) {
    let insertLine = lastBlock.endLine + 1;
    while (insertLine < document.lineCount && document.lineAt(insertLine).text.trim() === "") {
      insertLine += 1;
    }
    return insertLine;
  }

  return findImageBlockInsertLine(document, calls);
}

function applyOptionalBlockPatch(
  edit: vscode.WorkspaceEdit,
  document: vscode.TextDocument,
  block: LineBlock | undefined,
  insertLine: number,
  rebuilt: string
): void {
  if (block) {
    const range = new vscode.Range(
      new vscode.Position(block.startLine, 0),
      document.lineAt(block.endLine).rangeIncludingLineBreak.end
    );
    if (rebuilt.length) {
      edit.replace(document.uri, range, rebuilt);
    } else {
      edit.delete(document.uri, range);
    }
    return;
  }

  if (rebuilt.length) {
    edit.insert(document.uri, new vscode.Position(insertLine, 0), rebuilt);
  }
}

function getHeadBlockReplaceEnd(document: vscode.TextDocument, lastLine: number): vscode.Position {
  const trailingBlankLine = lastLine + 1;
  if (trailingBlankLine < document.lineCount && document.lineAt(trailingBlankLine).text.trim() === "") {
    return document.lineAt(trailingBlankLine).rangeIncludingLineBreak.end;
  }

  return document.lineAt(lastLine).rangeIncludingLineBreak.end;
}

function buildImageBlock(images: FormImage[], indent: string): string {
  if (!images.length) return "";

  const decoderLines = getRequiredImageDecoders(images).map(name => `${indent}${name}()`);
  const imageLines = images.map(image => `${indent}${buildImageLine({
    inline: image.inline,
    idRaw: image.firstParam,
    imageRaw: image.imageRaw,
    assignedVar: image.pbAny ? image.id : undefined,
  })}`);

  const parts: string[] = [];
  if (decoderLines.length) {
    parts.push(...decoderLines, "");
  }
  parts.push(...imageLines, "");
  return `${parts.join("\n")}
`;
}

function findImageInsertLine(document: vscode.TextDocument, calls: PbCall[]): number {
  let insertAfterLine = -1;

  for (const call of calls) {
    const nameLower = call.name.toLowerCase();
    if (IMAGE_ENTRY_NAMES.has(nameLower)) {
      insertAfterLine = call.range.line;
    }
  }

  if (insertAfterLine >= 0) return insertAfterLine;
  return findImageBlockInsertLine(document, calls) - 1;
}

function applyImageMutation(
  document: vscode.TextDocument,
  mutate: (images: FormImage[]) => boolean,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const parsed = parseFormDocument(document.getText());
  const nextImages = parsed.images.map(cloneFormImage);
  if (!mutate(nextImages)) return undefined;

  const calls = scanDocumentCalls(document, scanRange);
  const imageCalls = calls.filter(c => IMAGE_ENTRY_NAMES.has(c.name.toLowerCase()));
  const decoderLines: number[] = [];
  for (let i = 0; i < document.lineCount; i++) {
    if (isImageDecoderLine(document.lineAt(i).text)) {
      decoderLines.push(i);
    }
  }

  const anchorLine = imageCalls.length
    ? imageCalls[0].range.line
    : (decoderLines.length ? decoderLines[0] : findImageBlockInsertLine(document, calls));
  const indent = document.lineCount ? getLineIndent(document, Math.min(anchorLine, document.lineCount - 1)) : "";
  const rebuilt = buildImageBlock(nextImages, indent);

  const edit = new vscode.WorkspaceEdit();

  const imageGlobalBlock = findImageGlobalBlock(document, parsed.images);
  const rebuiltGlobalBlock = buildImageGlobalBlock(nextImages);
  applyOptionalBlockPatch(
    edit,
    document,
    imageGlobalBlock,
    findImageGlobalInsertLine(document),
    rebuiltGlobalBlock
  );

  const imageEnumBlock = findNamedEnumerationBlock(document, "FormImage");
  const rebuiltEnumBlock = buildImageEnumBlock(nextImages);
  const imageBlockInsertLine = findImageBlockInsertLine(document, calls);
  const imageEnumInsertLine = findImageEnumInsertLine(document, calls);
  const combineFreshEnumAndImageInsert = !imageCalls.length
    && !decoderLines.length
    && !imageEnumBlock
    && !!rebuiltEnumBlock
    && imageEnumInsertLine === imageBlockInsertLine;

  if (!combineFreshEnumAndImageInsert) {
    applyOptionalBlockPatch(
      edit,
      document,
      imageEnumBlock ? expandBlockWithTrailingBlank(document, imageEnumBlock) : undefined,
      imageEnumInsertLine,
      rebuiltEnumBlock
    );
  }

  if (imageCalls.length || decoderLines.length) {
    const firstLine = Math.min(
      imageCalls.length ? imageCalls[0].range.line : Number.MAX_SAFE_INTEGER,
      decoderLines.length ? decoderLines[0] : Number.MAX_SAFE_INTEGER
    );
    const lastLine = Math.max(
      imageCalls.length ? imageCalls[imageCalls.length - 1].range.line : -1,
      decoderLines.length ? decoderLines[decoderLines.length - 1] : -1
    );
    edit.replace(
      document.uri,
      new vscode.Range(new vscode.Position(firstLine, 0), getHeadBlockReplaceEnd(document, lastLine)),
      rebuilt
    );
    return edit;
  }

  if (!rebuilt) return undefined;

  if (combineFreshEnumAndImageInsert) {
    edit.insert(document.uri, new vscode.Position(imageEnumInsertLine, 0), `${rebuiltEnumBlock}${rebuilt}`);
    return edit;
  }

  edit.insert(document.uri, new vscode.Position(imageBlockInsertLine, 0), rebuilt);
  return edit;
}

function findCreateCallById(calls: PbCall[], createNameLower: string, id: string): PbCall | undefined {
  return calls.find(c => matchesCreateCallName(c.name.toLowerCase(), createNameLower) && firstParamOfCall(c.args) === id);
}

function findSectionEndIndex(calls: PbCall[], startIdx: number): number {
  for (let i = startIdx + 1; i < calls.length; i++) {
    if (isCreateBoundary(calls[i].name.toLowerCase())) {
      return i;
    }
  }
  return calls.length;
}

function findLastEntryLineInSection(
  calls: PbCall[],
  startIdx: number,
  endIdx: number,
  entryNamesLower: Set<string>
): number {
  let insertAfterLine = calls[startIdx].range.line;
  for (let i = startIdx + 1; i < endIdx; i++) {
    if (entryNamesLower.has(calls[i].name.toLowerCase())) {
      insertAfterLine = calls[i].range.line;
    }
  }
  return insertAfterLine;
}

function isLineInCreateSection(calls: PbCall[], line: number, createNameLower: string, expectedId: string): boolean {
  const create = findNearestCreateAbove(calls, line, createNameLower);
  return !!create && firstParamOfCall(create.args) === expectedId;
}

function applySectionEntryInsert(
  document: vscode.TextDocument,
  calls: PbCall[],
  createNameLower: string,
  sectionId: string,
  entryNamesLower: Set<string>,
  buildLine: (indent: string) => string
 ): vscode.WorkspaceEdit | undefined {
  const create = findCreateCallById(calls, createNameLower, sectionId);
  if (!create) return undefined;

  const startIdx = calls.indexOf(create);
  const endIdx = findSectionEndIndex(calls, startIdx);
  const insertAfterLine = findLastEntryLineInSection(calls, startIdx, endIdx, entryNamesLower);

  const indent = getLineIndent(document, insertAfterLine);
  const line = `${buildLine(indent)}\n`;
  const insertPos = new vscode.Position(Math.min(document.lineCount, insertAfterLine + 1), 0);

  const edit = new vscode.WorkspaceEdit();
  edit.insert(document.uri, insertPos, line);
  return edit;
}

function findAnchoredMenuEntryInsert(
  document: vscode.TextDocument,
  calls: PbCall[],
  menuId: string,
  parentSourceLine: number
): { insertLine: number; indent: string } | undefined {
  const create = findCreateCallById(calls, "createmenu", menuId);
  if (!create) return undefined;

  const parsed = parseFormDocument(document.getText());
  const menu = parsed.menus.find(entry => entry.id === menuId);
  if (!menu) return undefined;

  const parentIndex = menu.entries.findIndex(entry => entry.source?.line === parentSourceLine);
  if (parentIndex < 0) return undefined;

  const parentEntry = menu.entries[parentIndex];
  if (parentEntry.kind !== MENU_ENTRY_KIND.MenuTitle && parentEntry.kind !== MENU_ENTRY_KIND.OpenSubMenu) {
    return undefined;
  }

  const parentLevel = Math.max(0, parentEntry.level ?? 0);
  let insertLine: number | undefined;

  for (let i = parentIndex + 1; i < menu.entries.length; i++) {
    const entry = menu.entries[i];
    const level = Math.max(0, entry.level ?? 0);
    if (level <= parentLevel) {
      insertLine = entry.source?.line;
      break;
    }
  }

  if (typeof insertLine !== "number") {
    const startIdx = calls.indexOf(create);
    const endIdx = findSectionEndIndex(calls, startIdx);
    const insertAfterLine = findLastEntryLineInSection(calls, startIdx, endIdx, MENU_ENTRY_NAMES);
    return {
      insertLine: Math.min(document.lineCount, insertAfterLine + 1),
      indent: getLineIndent(document, insertAfterLine)
    };
  }

  if (!isLineInCreateSection(calls, insertLine, "createmenu", menuId)) return undefined;
  return { insertLine, indent: getLineIndent(document, insertLine) };
}

function findMenuEntryBlockRange(
  document: vscode.TextDocument,
  calls: PbCall[],
  menuId: string,
  sourceLine: number,
  entryNameLower: string
): { startLine: number; endLine: number } | undefined {
  if (sourceLine < 0 || sourceLine >= document.lineCount) return undefined;
  if (!isLineInCreateSection(calls, sourceLine, "createmenu", menuId)) return undefined;

  const parsed = parseFormDocument(document.getText());
  const menu = parsed.menus.find(entry => entry.id === menuId);
  if (!menu) return undefined;

  const entryIndex = menu.entries.findIndex(entry => {
    const entryLine = entry.source?.line;
    return entryLine === sourceLine && entry.kind.toLowerCase() === entryNameLower;
  });
  if (entryIndex < 0) return undefined;

  const entry = menu.entries[entryIndex];
  const startLine = entry.source?.line;
  if (typeof startLine !== "number") return undefined;

  if (entry.kind !== MENU_ENTRY_KIND.MenuTitle && entry.kind !== MENU_ENTRY_KIND.OpenSubMenu) {
    return { startLine, endLine: startLine };
  }

  if (entry.kind === MENU_ENTRY_KIND.OpenSubMenu) {
    const targetLevel = Math.max(0, entry.level ?? 0);
    for (let i = entryIndex + 1; i < menu.entries.length; i++) {
      const nextEntry = menu.entries[i];
      if (nextEntry.kind !== MENU_ENTRY_KIND.CloseSubMenu) continue;
      if (Math.max(0, nextEntry.level ?? 0) !== targetLevel) continue;

      const endLine = nextEntry.source?.line;
      if (typeof endLine === "number") {
        return { startLine, endLine };
      }
      break;
    }
  }

  const targetLevel = Math.max(0, entry.level ?? 0);
  let endLine = startLine;

  for (let i = entryIndex + 1; i < menu.entries.length; i++) {
    const nextEntry = menu.entries[i];
    const nextLine = nextEntry.source?.line;
    if (typeof nextLine !== "number") continue;

    const nextLevel = Math.max(0, nextEntry.level ?? 0);
    if (nextLevel <= targetLevel && nextEntry.kind !== MENU_ENTRY_KIND.CloseSubMenu) {
      break;
    }

    endLine = nextLine;
  }

  return { startLine, endLine };
}

function applySectionEntryUpdate(
  document: vscode.TextDocument,
  calls: PbCall[],
  createNameLower: string,
  sectionId: string,
  sourceLine: number,
  entryNameLower: string,
  rebuiltWithoutIndent: string
): vscode.WorkspaceEdit | undefined {
  if (sourceLine < 0 || sourceLine >= document.lineCount) return undefined;

  const call = calls.find(c => c.range.line === sourceLine && c.name.toLowerCase() === entryNameLower);
  if (!call) return undefined;

  if (!isLineInCreateSection(calls, sourceLine, createNameLower, sectionId)) return undefined;

  const indent = getLineIndent(document, sourceLine);
  const rebuilt = `${indent}${rebuiltWithoutIndent}`;
  return replaceCallLinePreserveSuffix(document, call, rebuilt);
}

function applySectionEntryDelete(
  document: vscode.TextDocument,
  calls: PbCall[],
  createNameLower: string,
  sectionId: string,
  sourceLine: number,
  entryNameLower: string
): vscode.WorkspaceEdit | undefined {
  if (sourceLine < 0 || sourceLine >= document.lineCount) return undefined;

  const call = calls.find(c => c.range.line === sourceLine && c.name.toLowerCase() === entryNameLower);
  if (!call) return undefined;

  if (!isLineInCreateSection(calls, sourceLine, createNameLower, sectionId)) return undefined;

  const edit = new vscode.WorkspaceEdit();
  edit.delete(document.uri, document.lineAt(sourceLine).rangeIncludingLineBreak);
  return edit;
}

function applySectionDelete(
  document: vscode.TextDocument,
  calls: PbCall[],
  createNameLower: string,
  sectionId: string
): vscode.WorkspaceEdit | undefined {
  const create = findCreateCallById(calls, createNameLower, sectionId);
  if (!create) return undefined;

  const startIdx = calls.indexOf(create);
  const endIdx = findSectionEndIndex(calls, startIdx);
  const endLine = endIdx > startIdx + 1
    ? calls[endIdx - 1].range.line
    : create.range.line;

  const edit = new vscode.WorkspaceEdit();
  edit.delete(
    document.uri,
    new vscode.Range(
      new vscode.Position(create.range.line, 0),
      document.lineAt(endLine).rangeIncludingLineBreak.end
    )
  );
  return edit;
}

function mapStatusBarArgsToField(args: StatusBarFieldArgs): FormStatusBarField {
  return {
    widthRaw: args.widthRaw,
    textRaw: args.textRaw,
    imageRaw: args.imageRaw,
    flagsRaw: args.flagsRaw,
    progressBar: args.progressBar,
    progressRaw: args.progressRaw,
  };
}

function mergeStatusBarFieldArgs(field: FormStatusBarField, args: StatusBarFieldArgs): FormStatusBarField {
  const next: FormStatusBarField = {
    ...field,
    widthRaw: args.widthRaw,
  };

  if (args.textRaw !== undefined) next.textRaw = args.textRaw;
  if (args.imageRaw !== undefined) next.imageRaw = args.imageRaw;
  if (args.flagsRaw !== undefined) next.flagsRaw = args.flagsRaw;
  if (args.progressBar !== undefined) next.progressBar = args.progressBar;
  if (args.progressRaw !== undefined) next.progressRaw = args.progressRaw;

  return next;
}

function buildStatusBarDecorationLine(statusBarId: string, field: FormStatusBarField, index: number): string | undefined {
  const flags = field.flagsRaw?.trim();
  const flagsSuffix = flags ? `, ${flags}` : "";

  if (field.progressBar) {
    const progress = field.progressRaw?.trim() || "0";
    return `StatusBarProgress(${statusBarId}, ${index}, ${progress}${flagsSuffix})`;
  }

  const image = field.imageRaw?.trim();
  if (image) {
    return `StatusBarImage(${statusBarId}, ${index}, ${image}${flagsSuffix})`;
  }

  const text = field.textRaw?.trim();
  if (text) {
    return `StatusBarText(${statusBarId}, ${index}, ${text}${flagsSuffix})`;
  }

  return undefined;
}

function buildStatusBarSectionText(statusBarId: string, fields: FormStatusBarField[], indent: string): string {
  const lines: string[] = [];

  fields.forEach((field, index) => {
    lines.push(`${indent}AddStatusBarField(${field.widthRaw.trim()})`);

    const decoration = buildStatusBarDecorationLine(statusBarId, field, index);
    if (decoration) {
      lines.push(`${indent}${decoration}`);
    }
  });

  return lines.length ? `${lines.join("\n")}\n` : "";
}

function cloneStatusBarField(field: FormStatusBarField): FormStatusBarField {
  return {
    widthRaw: field.widthRaw,
    textRaw: field.textRaw,
    text: field.text,
    imageRaw: field.imageRaw,
    imageId: field.imageId,
    flagsRaw: field.flagsRaw,
    progressBar: field.progressBar,
    progressRaw: field.progressRaw,
    source: field.source,
  };
}

function applyStatusBarFieldMutation(
  document: vscode.TextDocument,
  statusBarId: string,
  mutate: (fields: FormStatusBarField[]) => boolean,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const parsed = parseFormDocument(document.getText());
  const statusBar = parsed.statusbars.find(sb => sb.id === statusBarId);
  if (!statusBar) return undefined;

  const nextFields = statusBar.fields.map(cloneStatusBarField);
  if (!mutate(nextFields)) return undefined;

  const calls = scanDocumentCalls(document, scanRange);
  const create = findCreateCallById(calls, "createstatusbar", statusBarId);
  if (!create) return undefined;

  const startIdx = calls.indexOf(create);
  const endIdx = findSectionEndIndex(calls, startIdx);
  const endLineExclusive = endIdx < calls.length ? calls[endIdx].range.line : Number.POSITIVE_INFINITY;
  const statusCalls = calls.filter(c => c.range.line > create.range.line && c.range.line < endLineExclusive && STATUSBAR_FIELD_NAMES.has(c.name.toLowerCase()));

  const indentLine = statusCalls.length ? statusCalls[0].range.line : create.range.line;
  const indent = getLineIndent(document, indentLine);
  const rebuilt = buildStatusBarSectionText(statusBarId, nextFields, indent);

  const edit = new vscode.WorkspaceEdit();

  if (statusCalls.length) {
    const firstLine = statusCalls[0].range.line;
    const lastLine = statusCalls[statusCalls.length - 1].range.line;
    edit.replace(
      document.uri,
      new vscode.Range(new vscode.Position(firstLine, 0), getHeadBlockReplaceEnd(document, lastLine)),
      rebuilt
    );
    return edit;
  }

  if (!rebuilt) return undefined;

  edit.insert(document.uri, new vscode.Position(Math.min(document.lineCount, create.range.line + 1), 0), rebuilt);
  return edit;
}

export function applyMenuEntryInsert(
  document: vscode.TextDocument,
  menuId: string,
  args: MenuEntryArgs,
  scanRange?: ScanRange,
  insertOptions?: MenuEntryInsertOptions
): vscode.WorkspaceEdit | undefined {
  const calls = scanDocumentCalls(document, scanRange);
  const insertText = args.kind === MENU_ENTRY_KIND.OpenSubMenu
    ? (indent: string) => `${indent}${buildMenuEntryLine(args)}
${indent}CloseSubMenu()`
    : (indent: string) => `${indent}${buildMenuEntryLine(args)}`;

  if (typeof insertOptions?.parentSourceLine === "number") {
    const anchored = findAnchoredMenuEntryInsert(document, calls, menuId, insertOptions.parentSourceLine);
    if (!anchored) return undefined;

    const edit = new vscode.WorkspaceEdit();
    edit.insert(document.uri, new vscode.Position(Math.min(document.lineCount, anchored.insertLine), 0), `${insertText(anchored.indent)}
`);
    return edit;
  }

  return applySectionEntryInsert(
    document,
    calls,
    "createmenu",
    menuId,
    MENU_ENTRY_NAMES,
    insertText
  );
}

export function applyMenuEntryUpdate(
  document: vscode.TextDocument,
  menuId: string,
  sourceLine: number,
  args: MenuEntryArgs,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const calls = scanDocumentCalls(document, scanRange);
  return applySectionEntryUpdate(
    document,
    calls,
    "createmenu",
    menuId,
    sourceLine,
    args.kind.toLowerCase(),
    buildMenuEntryLine(args)
  );
}

export function applyMenuEntryDelete(
  document: vscode.TextDocument,
  menuId: string,
  sourceLine: number,
  kind: MenuEntryKind,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const calls = scanDocumentCalls(document, scanRange);
  const deleteRange = findMenuEntryBlockRange(document, calls, menuId, sourceLine, kind.toLowerCase());
  if (!deleteRange) return undefined;

  const edit = new vscode.WorkspaceEdit();
  edit.delete(
    document.uri,
    new vscode.Range(
      new vscode.Position(deleteRange.startLine, 0),
      document.lineAt(deleteRange.endLine).rangeIncludingLineBreak.end
    )
  );
  return edit;
}

export function applyMenuEntryMove(
  document: vscode.TextDocument,
  menuId: string,
  sourceLine: number,
  kind: MenuEntryKind,
  options: MenuEntryMoveOptions,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const calls = scanDocumentCalls(document, scanRange);
  const blockRange = findMenuEntryBlockRange(document, calls, menuId, sourceLine, kind.toLowerCase());
  if (!blockRange) return undefined;

  const parsed = parseFormDocument(document.getText());
  const menu = parsed.menus.find(entry => entry.id === menuId);
  if (!menu) return undefined;

  let insertLine: number | undefined;

  if (options.placement === "appendChild") {
    const anchored = findAnchoredMenuEntryInsert(document, calls, menuId, options.targetSourceLine);
    if (!anchored) return undefined;
    insertLine = anchored.insertLine;
  } else {
    const targetEntry = menu.entries.find(entry => entry.source?.line === options.targetSourceLine);
    if (!targetEntry) return undefined;

    const targetRange = findMenuEntryBlockRange(
      document,
      calls,
      menuId,
      options.targetSourceLine,
      targetEntry.kind.toLowerCase()
    );
    if (!targetRange) return undefined;

    insertLine = options.placement === "before"
      ? targetRange.startLine
      : Math.min(document.lineCount, targetRange.endLine + 1);
  }

  if (typeof insertLine !== "number") return undefined;
  if (insertLine >= blockRange.startLine && insertLine <= blockRange.endLine + 1) {
    return undefined;
  }

  const blockTextRange = new vscode.Range(
    new vscode.Position(blockRange.startLine, 0),
    document.lineAt(blockRange.endLine).rangeIncludingLineBreak.end
  );
  let blockText = "";
  for (let line = blockRange.startLine; line <= blockRange.endLine; line++) {
    const textLine = document.lineAt(line);
    blockText += textLine.text;
    if (textLine.rangeIncludingLineBreak.end.line > textLine.range.end.line) {
      blockText += "\n";
    }
  }
  if (insertLine < document.lineCount && !blockText.endsWith("\n") && !blockText.endsWith("\r\n")) {
    blockText += "\n";
  }

  const edit = new vscode.WorkspaceEdit();
  edit.delete(document.uri, blockTextRange);
  edit.insert(document.uri, new vscode.Position(insertLine, 0), blockText);
  return edit;
}

export function applyToolBarEntryInsert(
  document: vscode.TextDocument,
  toolBarId: string,
  args: ToolBarEntryArgs,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const calls = scanDocumentCalls(document, scanRange);
  return applySectionEntryInsert(
    document,
    calls,
    "createtoolbar",
    toolBarId,
    TOOLBAR_ENTRY_NAMES,
    indent => buildToolBarEntryText(args, toolBarId, indent)
  );
}


export function applyToolBarEntryUpdate(
  document: vscode.TextDocument,
  toolBarId: string,
  sourceLine: number,
  args: ToolBarEntryArgs,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  if (sourceLine < 0 || sourceLine >= document.lineCount) return undefined;

  const calls = scanDocumentCalls(document, scanRange);
  const call = calls.find(c => c.range.line === sourceLine && c.name.toLowerCase() === args.kind.toLowerCase());
  if (!call) return undefined;
  if (!isLineInCreateSection(calls, sourceLine, "createtoolbar", toolBarId)) return undefined;

  const indent = getLineIndent(document, sourceLine);
  const rebuilt = buildToolBarEntryText(args, toolBarId, indent);
  const lineText = document.lineAt(sourceLine).text;
  const endInLine = Math.max(0, call.range.end - call.range.lineStart);
  const suffix = lineText.slice(endInLine);

  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, document.lineAt(sourceLine).range, rebuilt + suffix);

  const previousEntryId = getToolBarEntryIdFromCall(call);
  const nextEntryId = args.idRaw?.trim() || previousEntryId;
  const tipCall = findToolBarToolTipCall(calls, toolBarId, previousEntryId);

  if (tipCall && tipCall.range.line !== sourceLine) {
    if (args.kind === TOOLBAR_ENTRY_KIND.ToolBarButton) {
      edit.delete(document.uri, document.lineAt(tipCall.range.line).rangeIncludingLineBreak);
    } else if (args.kind === TOOLBAR_ENTRY_KIND.ToolBarImageButton && previousEntryId && nextEntryId && previousEntryId !== nextEntryId) {
      const tipParts = splitParams(tipCall.args);
      const textRaw = (tipParts.length >= 3 ? tipParts[2] : tipParts[1])?.trim() ?? '""';
      const rebuiltTipLine = buildToolBarEntryText({
        kind: TOOLBAR_ENTRY_KIND.ToolBarToolTip,
        idRaw: nextEntryId,
        textRaw,
      }, toolBarId, getLineIndent(document, tipCall.range.line));
      edit.replace(document.uri, document.lineAt(tipCall.range.line).range, rebuiltTipLine);
    }
  }

  return edit;
}

export function applyToolBarEntryDelete(
  document: vscode.TextDocument,
  toolBarId: string,
  sourceLine: number,
  kind: ToolBarEntryKind,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const calls = scanDocumentCalls(document, scanRange);
  if (sourceLine < 0 || sourceLine >= document.lineCount) return undefined;

  const call = calls.find(c => c.range.line === sourceLine && c.name.toLowerCase() === kind.toLowerCase());
  if (!call) return undefined;
  if (!isLineInCreateSection(calls, sourceLine, "createtoolbar", toolBarId)) return undefined;

  const edit = new vscode.WorkspaceEdit();
  edit.delete(document.uri, document.lineAt(sourceLine).rangeIncludingLineBreak);

  if (isToolBarButtonKind(kind)) {
    const entryId = getToolBarEntryIdFromCall(call);
    const tipCall = findToolBarToolTipCall(calls, toolBarId, entryId);
    if (tipCall && tipCall.range.line !== sourceLine) {
      edit.delete(document.uri, document.lineAt(tipCall.range.line).rangeIncludingLineBreak);
    }
  }

  return edit;
}

export function applyToolBarEntryTooltipSet(
  document: vscode.TextDocument,
  toolBarId: string,
  sourceLine: number,
  entryIdRaw: string,
  textRaw: string | undefined,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  if (sourceLine < 0 || sourceLine >= document.lineCount) return undefined;

  const calls = scanDocumentCalls(document, scanRange);
  if (!isLineInCreateSection(calls, sourceLine, "createtoolbar", toolBarId)) return undefined;

  const normalizedEntryId = entryIdRaw.trim();
  if (!normalizedEntryId.length) return undefined;

  const tipCall = calls.find(call => {
    if (call.name.toLowerCase() !== TOOLBAR_ENTRY_KIND.ToolBarToolTip.toLowerCase()) return false;
    if (!isLineInCreateSection(calls, call.range.line, "createtoolbar", toolBarId)) return false;
    const parts = splitParams(call.args);
    const buttonIdRaw = (parts.length >= 3 ? parts[1] : parts[0])?.trim() ?? "";
    return buttonIdRaw === normalizedEntryId;
  });

  const normalizedText = textRaw?.trim();
  if (!normalizedText?.length) {
    if (!tipCall) return undefined;
    const edit = new vscode.WorkspaceEdit();
    edit.delete(document.uri, document.lineAt(tipCall.range.line).rangeIncludingLineBreak);
    return edit;
  }

  const rebuiltLine = buildToolBarEntryLine({
    kind: TOOLBAR_ENTRY_KIND.ToolBarToolTip,
    idRaw: normalizedEntryId,
    textRaw: normalizedText,
  }, toolBarId);

  if (tipCall) {
    const indent = getLineIndent(document, tipCall.range.line);
    return replaceCallLinePreserveSuffix(document, tipCall, `${indent}${rebuiltLine}`);
  }

  const indent = getLineIndent(document, sourceLine);
  const insertPos = new vscode.Position(Math.min(document.lineCount, sourceLine + 1), 0);
  const edit = new vscode.WorkspaceEdit();
  edit.insert(document.uri, insertPos, `${indent}${rebuiltLine}
`);
  return edit;
}

export function applyMenuDelete(
  document: vscode.TextDocument,
  menuId: string,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const calls = scanDocumentCalls(document, scanRange);
  return applySectionDelete(document, calls, "createmenu", menuId);
}

export function applyToolBarDelete(
  document: vscode.TextDocument,
  toolBarId: string,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const calls = scanDocumentCalls(document, scanRange);
  return applySectionDelete(document, calls, "createtoolbar", toolBarId);
}

export function applyStatusBarDelete(
  document: vscode.TextDocument,
  statusBarId: string,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  const calls = scanDocumentCalls(document, scanRange);
  return applySectionDelete(document, calls, "createstatusbar", statusBarId);
}

export function applyStatusBarFieldInsert(
  document: vscode.TextDocument,
  statusBarId: string,
  args: StatusBarFieldArgs,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  return applyStatusBarFieldMutation(
    document,
    statusBarId,
    fields => {
      fields.push(mapStatusBarArgsToField(args));
      return true;
    },
    scanRange
  );
}

export function applyStatusBarFieldUpdate(
  document: vscode.TextDocument,
  statusBarId: string,
  sourceLine: number,
  args: StatusBarFieldArgs,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  return applyStatusBarFieldMutation(
    document,
    statusBarId,
    fields => {
      const index = fields.findIndex(field => field.source?.line === sourceLine);
      if (index < 0) return false;
      fields[index] = mergeStatusBarFieldArgs(fields[index], args);
      return true;
    },
    scanRange
  );
}

export function applyStatusBarFieldDelete(
  document: vscode.TextDocument,
  statusBarId: string,
  sourceLine: number,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  return applyStatusBarFieldMutation(
    document,
    statusBarId,
    fields => {
      const index = fields.findIndex(field => field.source?.line === sourceLine);
      if (index < 0) return false;
      fields.splice(index, 1);
      return true;
    },
    scanRange
  );
}


export function applyFontInsert(
  document: vscode.TextDocument,
  args: FontArgs,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  return applyFontMutation(
    document,
    fonts => {
      fonts.push(mapFontArgsToFont(args));
      return true;
    },
    scanRange
  );
}

export function applyFontUpdate(
  document: vscode.TextDocument,
  sourceLine: number,
  args: FontArgs,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  return applyFontMutation(
    document,
    fonts => {
      const index = fonts.findIndex(font => font.source?.line === sourceLine);
      if (index < 0) return false;
      fonts[index] = {
        ...fonts[index],
        ...mapFontArgsToFont(args),
        source: fonts[index].source,
      };
      return true;
    },
    scanRange
  );
}

export function applyFontDelete(
  document: vscode.TextDocument,
  sourceLine: number,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  return applyFontMutation(
    document,
    fonts => {
      const index = fonts.findIndex(font => font.source?.line === sourceLine);
      if (index < 0) return false;
      fonts.splice(index, 1);
      return true;
    },
    scanRange
  );
}

export function applyImageInsert(
  document: vscode.TextDocument,
  args: ImageArgs,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  return applyImageMutation(
    document,
    images => {
      images.push(mapImageArgsToImage(args));
      return true;
    },
    scanRange
  );
}

export function applyImageUpdate(
  document: vscode.TextDocument,
  sourceLine: number,
  args: ImageArgs,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  return applyImageMutation(
    document,
    images => {
      const index = images.findIndex(image => image.source?.line === sourceLine);
      if (index < 0) return false;
      images[index] = {
        ...images[index],
        ...mapImageArgsToImage(args),
        source: images[index].source,
      };
      return true;
    },
    scanRange
  );
}

export function applyImageDelete(
  document: vscode.TextDocument,
  sourceLine: number,
  scanRange?: ScanRange
): vscode.WorkspaceEdit | undefined {
  return applyImageMutation(
    document,
    images => {
      const index = images.findIndex(image => image.source?.line === sourceLine);
      if (index < 0) return false;
      images.splice(index, 1);
      return true;
    },
    scanRange
  );
}
