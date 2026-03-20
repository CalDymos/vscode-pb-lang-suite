import * as fs from "fs";
import * as vscode from "vscode";
import { parseFormDocument } from "./core/parser/formParser";
import {
  applyGadgetColumnDelete,
  applyGadgetColumnInsert,
  applyGadgetColumnUpdate,
  applyGadgetOpenArgsUpdate,
  applyCustomGadgetCodeUpdate,
  applyGadgetPropertyUpdate,
  applyImageDelete,
  applyImageInsert,
  applyImageUpdate,
  applyGadgetEventProcUpdate,
  applyGadgetItemDelete,
  applyGadgetItemInsert,
  applyGadgetItemUpdate,
  applyMenuDelete,
  applyMenuEntryDelete,
  applyMenuEntryEventUpdate,
  applyMenuEntryInsert,
  applyMenuEntryMove,
  applyMenuEntryUpdate,
  applyMovePatch,
  applyRectPatch,
  applyResizeGadgetDelete,
  applyResizeGadgetRawUpdate,
  applyStatusBarDelete,
  applyStatusBarFieldDelete,
  applyStatusBarFieldInsert,
  applyStatusBarFieldUpdate,
  applyToolBarDelete,
  applyToolBarEntryDelete,
  applyToolBarEntryEventUpdate,
  applyToolBarEntryInsert,
  applyToolBarEntryTooltipSet,
  applyToolBarEntryUpdate,
  applyWindowEnumValuePatch,
  applyWindowEventProcUpdate,
  applyWindowEventUpdate,
  applyWindowGenerateEventLoopUpdate,
  applyWindowOpenArgsUpdate,
  applyWindowPropertyUpdate,
  applyWindowVariableNamePatch,
  applyWindowPbAnyToggle,
  applyWindowRectPatch
} from "./core/emitter/patchEmitter";
import { readDesignerSettings, SETTINGS_SECTION, DesignerSettings } from "./config/settings";
import { FormDocument, PBFD_SYMBOLS } from "./core/model";
import { relativizeImagePath, toPbFilePathLiteral } from "./core/imagePathUtils";
import { readImageDimensions } from "./core/imageDimensionUtils";
import {
  discoverProcedureSourcePaths,
  extractProcedureNamesFromText,
  isProcedureSourceFilePath,
  resolveProcedureEventFilePath,
  sortUniqueProcedureNames
} from "./core/procedureListUtils";
import {
  PB_WRONG_VARIABLE_NAME_MESSAGE,
  isValidPbVariableReference,
  requiresPbVariableValidation
} from "./core/propertyValidationUtils";

const CONFIG_KEYS = {
  expectedPbVersion: "expectedPbVersion"
} as const;

const ALLOWED_MENU_ENTRY_KINDS: ReadonlySet<string> = new Set(PBFD_SYMBOLS.menuEntryKinds);
const ALLOWED_TOOLBAR_ENTRY_KINDS: ReadonlySet<string> = new Set(PBFD_SYMBOLS.toolBarEntryKinds);

function normalizeFsPathForCompare(filePath: string): string {
  const normalized = vscode.Uri.file(filePath).fsPath;
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

function isSameFsPath(left: string | undefined, right: string | undefined): boolean {
  if (!left || !right) return false;
  return normalizeFsPathForCompare(left) === normalizeFsPathForCompare(right);
}

function tryReadProcedureSourceTextSync(filePath: string | undefined): string | undefined {
  if (!filePath) return undefined;

  const openDocument = vscode.workspace.textDocuments.find(doc => doc.uri.scheme === "file" && isSameFsPath(doc.uri.fsPath, filePath));
  if (openDocument) return openDocument.getText();

  try {
    const buffer = fs.readFileSync(filePath);
    return Buffer.from(buffer).toString("utf8");
  } catch {
    return undefined;
  }
}

function getWorkspaceRootForDocument(documentUri: vscode.Uri): string | undefined {
  return vscode.workspace.getWorkspaceFolder(documentUri)?.uri.fsPath;
}

function collectProcedureNames(documentPath: string, text: string, model: FormDocument, workspaceRoot?: string): string[] {
  const names: string[] = [];
  for (const sourcePath of discoverProcedureSourcePaths(documentPath, workspaceRoot, model.window?.eventFile)) {
    const sourceText = isSameFsPath(sourcePath, documentPath) ? text : tryReadProcedureSourceTextSync(sourcePath);
    if (!sourceText) continue;
    names.push(...extractProcedureNamesFromText(sourceText));
  }

  return sortUniqueProcedureNames(names);
}

function shouldRefreshProcedureListFromDocumentChange(changedDocument: vscode.TextDocument, formDocumentUri: vscode.Uri, currentEventFilePath?: string): boolean {
  if (changedDocument.uri.scheme !== "file") return false;
  if (changedDocument.uri.toString() === formDocumentUri.toString()) return true;
  if (isSameFsPath(changedDocument.uri.fsPath, currentEventFilePath)) return true;

  const workspaceRoot = getWorkspaceRootForDocument(formDocumentUri);
  if (!workspaceRoot) return false;
  const changedWorkspace = vscode.workspace.getWorkspaceFolder(changedDocument.uri)?.uri.fsPath;
  if (!changedWorkspace || !isSameFsPath(changedWorkspace, workspaceRoot)) return false;

  return isProcedureSourceFilePath(changedDocument.uri.fsPath);
}

function shouldRefreshProcedureListFromFileChanges(changedUris: readonly vscode.Uri[], formDocumentUri: vscode.Uri, currentEventFilePath?: string): boolean {
  const workspaceRoot = getWorkspaceRootForDocument(formDocumentUri);

  return changedUris.some(uri => {
    if (uri.scheme !== "file") return false;
    if (isSameFsPath(uri.fsPath, currentEventFilePath)) return true;
    if (!workspaceRoot) return false;

    const changedWorkspace = vscode.workspace.getWorkspaceFolder(uri)?.uri.fsPath;
    if (!changedWorkspace || !isSameFsPath(changedWorkspace, workspaceRoot)) return false;

    return isProcedureSourceFilePath(uri.fsPath);
  });
}

const EXT_TO_WEBVIEW_MSG_TYPE = {
  init: "init",
  settings: "settings",
  error: "error"
} as const;

const WEBVIEW_TO_EXT_MSG_TYPE = {
  ready: "ready",

  moveGadget: "moveGadget",
  setGadgetRect: "setGadgetRect",
  setGadgetOpenArgs: "setGadgetOpenArgs",
  setCustomGadgetCode: "setCustomGadgetCode",
  setGadgetProperties: "setGadgetProperties",
  setGadgetEventProc: "setGadgetEventProc",
  setGadgetImageRaw: "setGadgetImageRaw",
  setGadgetStateRaw: "setGadgetStateRaw",
  setGadgetResizeRaw: "setGadgetResizeRaw",
  setWindowRect: "setWindowRect",
  setWindowOpenArgs: "setWindowOpenArgs",
  setWindowProperties: "setWindowProperties",
  toggleWindowPbAny: "toggleWindowPbAny",
  setWindowEnumValue: "setWindowEnumValue",
  setWindowVariableName: "setWindowVariableName",
  setWindowEventFile: "setWindowEventFile",
  setWindowEventProc: "setWindowEventProc",
  setWindowGenerateEventLoop: "setWindowGenerateEventLoop",

  insertGadgetItem: "insertGadgetItem",
  updateGadgetItem: "updateGadgetItem",
  deleteGadgetItem: "deleteGadgetItem",

  insertGadgetColumn: "insertGadgetColumn",
  updateGadgetColumn: "updateGadgetColumn",
  deleteGadgetColumn: "deleteGadgetColumn",

  insertMenuEntry: "insertMenuEntry",
  moveMenuEntry: "moveMenuEntry",
  updateMenuEntry: "updateMenuEntry",
  deleteMenuEntry: "deleteMenuEntry",
  deleteMenu: "deleteMenu",
  setMenuEntryEvent: "setMenuEntryEvent",

  insertToolBarEntry: "insertToolBarEntry",
  updateToolBarEntry: "updateToolBarEntry",
  deleteToolBarEntry: "deleteToolBarEntry",
  deleteToolBar: "deleteToolBar",
  setToolBarEntryEvent: "setToolBarEntryEvent",
  setToolBarEntryTooltip: "setToolBarEntryTooltip",

  insertStatusBarField: "insertStatusBarField",
  updateStatusBarField: "updateStatusBarField",
  deleteStatusBarField: "deleteStatusBarField",
  deleteStatusBar: "deleteStatusBar",

  insertImage: "insertImage",
  updateImage: "updateImage",
  deleteImage: "deleteImage",
  relativizeImagePath: "relativizeImagePath",
  chooseImageFileForEntry: "chooseImageFileForEntry",
  toggleImagePbAny: "toggleImagePbAny",

  createAndAssignGadgetImage: "createAndAssignGadgetImage",
  chooseFileAndAssignGadgetImage: "chooseFileAndAssignGadgetImage",
  createAndAssignMenuEntryImage: "createAndAssignMenuEntryImage",
  createAndAssignToolBarEntryImage: "createAndAssignToolBarEntryImage",
  createAndAssignStatusBarFieldImage: "createAndAssignStatusBarFieldImage",
  chooseFileAndAssignMenuEntryImage: "chooseFileAndAssignMenuEntryImage",
  chooseFileAndAssignToolBarEntryImage: "chooseFileAndAssignToolBarEntryImage",
  chooseFileAndAssignStatusBarFieldImage: "chooseFileAndAssignStatusBarFieldImage"
} as const;

type WebviewToExtensionMessage =
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.ready }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.moveGadget; id: string; x: number; y: number }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setGadgetRect; id: string; x: number; y: number; w: number; h: number }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setGadgetOpenArgs; id: string; textRaw?: string; minRaw?: string; maxRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setCustomGadgetCode; id: string; customInitRaw?: string; customCreateRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setGadgetProperties; id: string; hiddenRaw?: string; disabledRaw?: string; tooltipRaw?: string; frontColorRaw?: string; backColorRaw?: string; gadgetFontRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setGadgetEventProc; id: string; eventProc?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setGadgetImageRaw; id: string; imageRaw: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setGadgetStateRaw; id: string; stateRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setGadgetResizeRaw; id: string; xRaw?: string; yRaw?: string; wRaw?: string; hRaw?: string; deleteResize?: boolean }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setWindowRect; id: string; x: number; y: number; w: number; h: number }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setWindowOpenArgs; windowKey: string; xRaw?: string; yRaw?: string; wRaw?: string; hRaw?: string; captionRaw?: string; flagsExpr?: string; parentRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setWindowProperties; windowKey: string; hiddenRaw?: string; disabledRaw?: string; colorRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.toggleWindowPbAny; windowKey: string; toPbAny: boolean; variableName: string; enumSymbol: string; enumValueRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setWindowEnumValue; enumSymbol: string; enumValueRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setWindowVariableName; variableName?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setWindowEventFile; windowKey: string; eventFile?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setWindowEventProc; windowKey: string; eventProc?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setWindowGenerateEventLoop; windowKey: string; enabled: boolean }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.insertGadgetItem; id: string; posRaw: string; textRaw: string; imageRaw?: string; flagsRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.updateGadgetItem; id: string; sourceLine: number; posRaw: string; textRaw: string; imageRaw?: string; flagsRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.deleteGadgetItem; id: string; sourceLine: number }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.insertGadgetColumn; id: string; colRaw: string; titleRaw: string; widthRaw: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.updateGadgetColumn; id: string; sourceLine: number; colRaw: string; titleRaw: string; widthRaw: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.deleteGadgetColumn; id: string; sourceLine: number }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.insertMenuEntry; menuId: string; kind: string; idRaw?: string; textRaw?: string; parentSourceLine?: number }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.moveMenuEntry; menuId: string; sourceLine: number; kind: string; targetSourceLine: number; placement: "before" | "after" | "appendChild" }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.updateMenuEntry; menuId: string; sourceLine: number; kind: string; idRaw?: string; textRaw?: string; shortcut?: string; iconRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.deleteMenuEntry; menuId: string; sourceLine: number; kind: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.deleteMenu; menuId: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setMenuEntryEvent; entryIdRaw: string; eventProc?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.insertToolBarEntry; toolBarId: string; kind: string; idRaw?: string; iconRaw?: string; textRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.updateToolBarEntry; toolBarId: string; sourceLine: number; kind: string; idRaw?: string; iconRaw?: string; textRaw?: string; toggle?: boolean }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.deleteToolBarEntry; toolBarId: string; sourceLine: number; kind: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.deleteToolBar; toolBarId: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setToolBarEntryEvent; entryIdRaw: string; eventProc?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.setToolBarEntryTooltip; toolBarId: string; sourceLine: number; entryIdRaw: string; textRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.insertStatusBarField; statusBarId: string; widthRaw: string; textRaw?: string; imageRaw?: string; flagsRaw?: string; progressBar?: boolean; progressRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.updateStatusBarField; statusBarId: string; sourceLine: number; widthRaw: string; textRaw?: string; imageRaw?: string; flagsRaw?: string; progressBar?: boolean; progressRaw?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.deleteStatusBarField; statusBarId: string; sourceLine: number }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.deleteStatusBar; statusBarId: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.insertImage; inline: boolean; idRaw: string; imageRaw: string; assignedVar?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.updateImage; sourceLine: number; inline: boolean; idRaw: string; imageRaw: string; assignedVar?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.deleteImage; sourceLine: number }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.relativizeImagePath; sourceLine: number; inline: boolean; idRaw: string; imageRaw: string; assignedVar?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.chooseImageFileForEntry; sourceLine: number; inline: boolean; idRaw: string; assignedVar?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.toggleImagePbAny; sourceLine: number; toPbAny: boolean }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.createAndAssignGadgetImage; id: string; newInline: boolean; newImageIdRaw: string; newImageRaw: string; newAssignedVar?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.chooseFileAndAssignGadgetImage; id: string; x: number; y: number; resizeToImage: boolean; newImageIdRaw: string; newAssignedVar?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.createAndAssignMenuEntryImage; menuId: string; sourceLine: number; kind: string; idRaw?: string; textRaw?: string; shortcut?: string; newInline: boolean; newImageIdRaw: string; newImageRaw: string; newAssignedVar?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.createAndAssignToolBarEntryImage; toolBarId: string; sourceLine: number; kind: string; idRaw?: string; toggle?: boolean; newInline: boolean; newImageIdRaw: string; newImageRaw: string; newAssignedVar?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.createAndAssignStatusBarFieldImage; statusBarId: string; sourceLine: number; widthRaw: string; newInline: boolean; newImageIdRaw: string; newImageRaw: string; newAssignedVar?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.chooseFileAndAssignMenuEntryImage; menuId: string; sourceLine: number; kind: string; idRaw?: string; textRaw?: string; shortcut?: string; newImageIdRaw: string; newAssignedVar?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.chooseFileAndAssignToolBarEntryImage; toolBarId: string; sourceLine: number; kind: string; idRaw?: string; toggle?: boolean; newImageIdRaw: string; newAssignedVar?: string }
  | { type: typeof WEBVIEW_TO_EXT_MSG_TYPE.chooseFileAndAssignStatusBarFieldImage; statusBarId: string; sourceLine: number; widthRaw: string; newImageIdRaw: string; newAssignedVar?: string };

type ExtensionToWebviewMessage =
  | { type: typeof EXT_TO_WEBVIEW_MSG_TYPE.init; model: any; settings: DesignerSettings }
  | { type: typeof EXT_TO_WEBVIEW_MSG_TYPE.settings; settings: DesignerSettings }
  | { type: typeof EXT_TO_WEBVIEW_MSG_TYPE.error; message: string };

export class PureBasicFormDesignerProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = "purebasic.formDesigner";

  constructor(private readonly context: vscode.ExtensionContext) {}

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri]
    };

    webviewPanel.webview.html = this.getWebviewHtml(webviewPanel.webview);

    const post = (msg: ExtensionToWebviewMessage) => webviewPanel.webview.postMessage(msg);

    let lastModel: FormDocument | undefined;
    let initTimer: ReturnType<typeof setTimeout> | undefined;

    function createErrorModel(textLen: number, message: string): FormDocument {
      return {
        window: undefined,
        fonts: [],
        gadgets: [],
        menus: [],
        toolbars: [],
        statusbars: [],
        images: [],
        meta: {
          scanRange: { start: 0, end: textLen },
          issues: [{ severity: "error", message }]
        }
      };
    }

    function safeParse(text: string): FormDocument {
      try {
        return parseFormDocument(text);
      } catch (e: any) {
        return createErrorModel(text.length, e?.message ?? String(e));
      }
    }

    const scheduleInit = () => {
      if (initTimer) clearTimeout(initTimer);
      initTimer = setTimeout(() => sendInit(), 200);
    };

    const sendInit = () => {
      const text = document.getText();

      try {
        const model = safeParse(text);
        lastModel = model;

        // Optional: warn if the header PB version differs from the configured expectation.
        const expectedPbVersion = vscode.workspace
          .getConfiguration(SETTINGS_SECTION)
          .get<string>(CONFIG_KEYS.expectedPbVersion, "")
          .trim();

        if (expectedPbVersion.length) {
          const actual = model.meta.header?.version;
          if (!actual) {
            model.meta.issues.push({
              severity: "warning",
              message: `Expected PureBasic version '${expectedPbVersion}', but the Form Designer header has no version.`
            });
          } else if (actual !== expectedPbVersion) {
            model.meta.issues.push({
              severity: "warning",
              message: `Form header version is '${actual}', but 'purebasicFormsDesigner.expectedPbVersion' is set to '${expectedPbVersion}'.`,
              line: model.meta.header?.line
            });
          }
        }

        const workspaceRoot = getWorkspaceRootForDocument(document.uri);
        model.procedureNames = collectProcedureNames(document.uri.fsPath, text, model, workspaceRoot);

        const settings = readDesignerSettings();
        post({ type: "init", model, settings });
      } catch (e: any) {
        // Keep the webview alive with a minimal model and a structured error.
        const model = createErrorModel(text.length, e?.message ?? String(e));
        lastModel = model;
        post({ type: "init", model, settings: readDesignerSettings() });
      }
    };

    sendInit();

    const cfgSub = vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent) => {
      if (e.affectsConfiguration(SETTINGS_SECTION)) {
        post({ type: "settings", settings: readDesignerSettings() });
      }
    });

    const docSub = vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
      const currentEventFilePath = resolveProcedureEventFilePath(document.uri.fsPath, lastModel?.window?.eventFile);
      if (shouldRefreshProcedureListFromDocumentChange(e.document, document.uri, currentEventFilePath)) {
        scheduleInit();
      }
    });

    const createSub = vscode.workspace.onDidCreateFiles((e: vscode.FileCreateEvent) => {
      const currentEventFilePath = resolveProcedureEventFilePath(document.uri.fsPath, lastModel?.window?.eventFile);
      if (shouldRefreshProcedureListFromFileChanges(e.files, document.uri, currentEventFilePath)) {
        scheduleInit();
      }
    });

    const deleteSub = vscode.workspace.onDidDeleteFiles((e: vscode.FileDeleteEvent) => {
      const currentEventFilePath = resolveProcedureEventFilePath(document.uri.fsPath, lastModel?.window?.eventFile);
      if (shouldRefreshProcedureListFromFileChanges(e.files, document.uri, currentEventFilePath)) {
        scheduleInit();
      }
    });

    const renameSub = vscode.workspace.onDidRenameFiles((e: vscode.FileRenameEvent) => {
      const currentEventFilePath = resolveProcedureEventFilePath(document.uri.fsPath, lastModel?.window?.eventFile);
      const renamedUris = e.files.flatMap(file => [file.oldUri, file.newUri]);
      if (shouldRefreshProcedureListFromFileChanges(renamedUris, document.uri, currentEventFilePath)) {
        scheduleInit();
      }
    });

    webviewPanel.onDidDispose(() => {
      cfgSub.dispose();
      docSub.dispose();
      createSub.dispose();
      deleteSub.dispose();
      renameSub.dispose();
      if (initTimer) clearTimeout(initTimer);
    });

    webviewPanel.webview.onDidReceiveMessage(async (msg: WebviewToExtensionMessage) => {
      const sr = lastModel?.meta.scanRange;
      const rangeInfo = sr ? ` (scanRange: ${sr.start}-${sr.end})` : "";
      const postError = (message: string) => post({ type: "error", message });

      const applyEditOrError = async (edit: vscode.WorkspaceEdit | undefined, errorMessage: string) => {
        if (!edit) {
          postError(errorMessage);
          return false;
        }
        const ok = await vscode.workspace.applyEdit(edit);
        if (!ok) {
          postError(errorMessage);
          return false;
        }
        return true;
      };

      // Merges two WorkspaceEdits into one so they can be applied atomically in a single
      // applyEdit() call. WorkspaceEdit has no built-in merge API; we accumulate via get/set.
      const mergeWorkspaceEdits = (a: vscode.WorkspaceEdit, b: vscode.WorkspaceEdit): vscode.WorkspaceEdit => {
        const merged = new vscode.WorkspaceEdit();
        for (const edit of [a, b]) {
          for (const [uri, textEdits] of edit.entries()) {
            merged.set(uri, [...merged.get(uri), ...textEdits]);
          }
        }
        return merged;
      };

      // Validates that both edits could be built, merges them into one WorkspaceEdit, and
      // applies it atomically. Returns false (with error) if either edit is undefined or
      // applyEdit() fails — without having partially modified the document.
      const applyPairedEditsOrError = async (
        assignEdit: vscode.WorkspaceEdit | undefined,
        assignErrorMessage: string,
        insertEdit: vscode.WorkspaceEdit | undefined,
        insertErrorMessage: string,
      ): Promise<boolean> => {
        if (!assignEdit) { postError(assignErrorMessage); return false; }
        if (!insertEdit) { postError(insertErrorMessage); return false; }
        const ok = await vscode.workspace.applyEdit(mergeWorkspaceEdits(assignEdit, insertEdit));
        if (!ok) { postError(assignErrorMessage); return false; }
        return true;
      };

      const pickImageFile = async (): Promise<{ fsPath: string; imageRaw: string } | undefined> => {
        const picked = await vscode.window.showOpenDialog({
          canSelectFiles: true,
          canSelectFolders: false,
          canSelectMany: false,
          openLabel: "Select Image"
        });

        const fileUri = picked?.[0];
        if (!fileUri) return undefined;

        return {
          fsPath: fileUri.fsPath,
          imageRaw: toPbFilePathLiteral(fileUri.fsPath)
        };
      };

      const pickImageFileRaw = async (): Promise<string | undefined> => {
        const picked = await pickImageFile();
        return picked?.imageRaw;
      };

      const buildCreatedImageReference = (idRaw: string, assignedVar?: string): string | undefined => {
        const trimmedId = idRaw.trim();
        if (!trimmedId.length) return undefined;

        if (trimmedId.toLowerCase() === "#pb_any") {
          const variableName = assignedVar?.trim();
          return variableName ? `ImageID(${variableName})` : undefined;
        }

        return `ImageID(${trimmedId})`;
      };

      const toPbAnyAssignedVar = (firstParam: string): string | undefined => {
        const trimmed = firstParam.trim();
        if (!trimmed.length) return undefined;
        return trimmed.startsWith("#") ? trimmed.slice(1).trim() || undefined : trimmed;
      };

      const toEnumImageId = (variableOrId: string): string | undefined => {
        const trimmed = variableOrId.trim();
        if (!trimmed.length) return undefined;
        return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
      };

      const ensureMenuEntryKind = (kind: string): boolean => {
        if (ALLOWED_MENU_ENTRY_KINDS.has(kind)) return true;
        postError(`Unsupported menu entry kind '${kind}'.`);
        return false;
      };

      const ensureToolBarEntryKind = (kind: string): boolean => {
        if (ALLOWED_TOOLBAR_ENTRY_KINDS.has(kind)) return true;
        postError(`Unsupported toolbar entry kind '${kind}'.`);
        return false;
      };

      const validateVariableRaw = (raw: string | undefined, fieldLabel: string): boolean => {
        if (!requiresPbVariableValidation(raw)) return true;
        if (isValidPbVariableReference(raw!.trim())) return true;
        postError(`${fieldLabel}: ${PB_WRONG_VARIABLE_NAME_MESSAGE}`);
        return false;
      };

      switch (msg.type) {
        case WEBVIEW_TO_EXT_MSG_TYPE.ready:
          sendInit();
          return;

        case WEBVIEW_TO_EXT_MSG_TYPE.moveGadget: {
          const edit = applyMovePatch(document, msg.id, msg.x, msg.y, sr);
          await applyEditOrError(edit, `Could not patch gadget '${msg.id}'. No matching call found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.setGadgetRect: {
          const edit = applyRectPatch(document, msg.id, msg.x, msg.y, msg.w, msg.h, sr);
          await applyEditOrError(edit, `Could not patch gadget '${msg.id}'. No matching call found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.setWindowRect: {
          const edit = applyWindowRectPatch(document, msg.id, msg.x, msg.y, msg.w, msg.h, sr);
          await applyEditOrError(edit, `Could not patch window '${msg.id}'. No matching OpenWindow call found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.setWindowOpenArgs: {
          if (Object.prototype.hasOwnProperty.call(msg, "captionRaw") && !validateVariableRaw(msg.captionRaw, "Caption")) {
            return;
          }
          const edit = applyWindowOpenArgsUpdate(document, msg.windowKey, {
            xRaw: msg.xRaw,
            yRaw: msg.yRaw,
            wRaw: msg.wRaw,
            hRaw: msg.hRaw,
            captionRaw: msg.captionRaw,
            flagsExpr: msg.flagsExpr,
            parentRaw: msg.parentRaw
          }, sr);
          await applyEditOrError(edit, `Could not patch OpenWindow arguments for window '${msg.windowKey}'. No matching OpenWindow call found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.setWindowProperties: {
          const edit = applyWindowPropertyUpdate(document, msg.windowKey, {
            hiddenRaw: msg.hiddenRaw,
            disabledRaw: msg.disabledRaw,
            colorRaw: msg.colorRaw
          }, sr);
          await applyEditOrError(edit, `Could not patch window property lines for '${msg.windowKey}'. No matching OpenWindow call found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.toggleWindowPbAny: {
          const edit = applyWindowPbAnyToggle(
            document,
            msg.windowKey,
            msg.toPbAny,
            msg.variableName,
            msg.enumSymbol,
            msg.enumValueRaw,
            sr
          );
          await applyEditOrError(edit, `Could not toggle window pbAny. No matching OpenWindow call found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.setWindowEnumValue: {
          const edit = applyWindowEnumValuePatch(document, msg.enumSymbol, msg.enumValueRaw, sr);
          await applyEditOrError(
            edit,
            `Could not patch FormWindow enumeration entry '${msg.enumSymbol}'. No Enumeration FormWindow block found${rangeInfo}.`
          );
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.setWindowVariableName: {
          if (msg.variableName === undefined || !msg.variableName.trim().length) {
            postError(`Could not patch FormWindow variable name. Empty variable name is not allowed${rangeInfo}.`);
            return;
          }
          const edit = applyWindowVariableNamePatch(document, msg.variableName);
          await applyEditOrError(
            edit,
            `Could not patch FormWindow variable name '${msg.variableName}'. No matching OpenWindow call found${rangeInfo}.`
          );
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.setGadgetOpenArgs: {
          if (Object.prototype.hasOwnProperty.call(msg, "textRaw") && !validateVariableRaw(msg.textRaw, "Caption")) {
            return;
          }
          const edit = applyGadgetOpenArgsUpdate(document, msg.id, {
            textRaw: msg.textRaw,
            minRaw: msg.minRaw,
            maxRaw: msg.maxRaw
          }, sr);
          await applyEditOrError(edit, `Could not patch constructor arguments for gadget '${msg.id}'. No matching gadget constructor found${rangeInfo}.`);
          return;
        }
        case WEBVIEW_TO_EXT_MSG_TYPE.setCustomGadgetCode: {
          const gadget = lastModel?.gadgets.find(entry => entry.id === msg.id);
          if (!gadget || gadget.kind !== "CustomGadget") {
            postError(`Could not patch custom gadget code for '${msg.id}'. The current selection is not a parsed CustomGadget${rangeInfo}.`);
            return;
          }
          if (msg.customCreateRaw !== undefined && !msg.customCreateRaw.trim().length) {
            postError(`Custom gadget CreateCode must not be empty.`);
            return;
          }
          const edit = applyCustomGadgetCodeUpdate(document, msg.id, {
            customInitRaw: msg.customInitRaw,
            customCreateRaw: msg.customCreateRaw
          }, sr);
          await applyEditOrError(edit, `Could not patch custom gadget code for '${msg.id}'. No matching custom gadget marker block found${rangeInfo}.`);
          return;
        }
        case WEBVIEW_TO_EXT_MSG_TYPE.setGadgetProperties: {
          if (Object.prototype.hasOwnProperty.call(msg, "tooltipRaw") && !validateVariableRaw(msg.tooltipRaw, "Tooltip")) {
            return;
          }
          const edit = applyGadgetPropertyUpdate(document, msg.id, {
            hiddenRaw: msg.hiddenRaw,
            disabledRaw: msg.disabledRaw,
            tooltipRaw: msg.tooltipRaw,
            frontColorRaw: msg.frontColorRaw,
            backColorRaw: msg.backColorRaw,
            gadgetFontRaw: msg.gadgetFontRaw
          }, sr);
          await applyEditOrError(edit, `Could not patch properties for gadget '${msg.id}'. No matching gadget property block found${rangeInfo}.`);
          return;
        }
        case WEBVIEW_TO_EXT_MSG_TYPE.setGadgetEventProc: {
          const edit = applyGadgetEventProcUpdate(document, msg.id, msg.eventProc, sr);
          await applyEditOrError(edit, `Could not patch event proc for gadget '${msg.id}'. No matching EventGadget block found${rangeInfo}.`);
          return;
        }
        case WEBVIEW_TO_EXT_MSG_TYPE.setGadgetImageRaw: {
          const edit = applyGadgetOpenArgsUpdate(document, msg.id, { imageRaw: msg.imageRaw }, sr);
          await applyEditOrError(edit, `Could not patch image argument for gadget '${msg.id}'. No matching image-capable gadget constructor found${rangeInfo}.`);
          return;
        }
        case WEBVIEW_TO_EXT_MSG_TYPE.setGadgetStateRaw: {
          const gadget = lastModel?.gadgets.find(entry => entry.id === msg.id);
          if (!gadget) {
            postError(`Could not find gadget '${msg.id}' for state update${rangeInfo}.`);
            return;
          }

          const trimmed = msg.stateRaw?.trim() ?? "";
          if (gadget.kind === "SplitterGadget") {
            const nextState = Number(trimmed);
            if (!trimmed.length || !Number.isFinite(nextState)) {
              postError(`Splitter position must be a finite number.`);
              return;
            }

            const vertical = (gadget.flagsExpr ?? "").split("|").map(part => part.trim()).includes("#PB_Splitter_Vertical");
            const limit = vertical ? gadget.w : gadget.h;
            const stateInt = Math.trunc(nextState);
            if (stateInt <= 0 || stateInt >= limit) {
              postError(`Splitter position must be greater than 0 and smaller than the splitter ${vertical ? "width" : "height"}.`);
              return;
            }

            const edit = applyGadgetPropertyUpdate(document, msg.id, { stateRaw: String(stateInt) }, sr);
            await applyEditOrError(edit, `Could not update splitter state for '${msg.id}'${rangeInfo}.`);
            return;
          }

          if (gadget.kind === "CheckBoxGadget" || gadget.kind === "OptionGadget") {
            const edit = applyGadgetPropertyUpdate(document, msg.id, { stateRaw: trimmed || undefined }, sr);
            await applyEditOrError(edit, `Could not update checked state for '${msg.id}'${rangeInfo}.`);
            return;
          }

          postError(`State editing is currently only enabled for SplitterGadget, CheckBoxGadget and OptionGadget entries.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.setGadgetResizeRaw: {
          const gadget = lastModel?.gadgets.find(entry => entry.id === msg.id);
          if (!gadget) {
            postError(`Could not find gadget '${msg.id}' for ResizeGadget update${rangeInfo}.`);
            return;
          }
          if (!gadget.resizeSource) {
            postError(`Could not update locks for '${msg.id}'. No existing ResizeGadget(...) line was parsed${rangeInfo}.`);
            return;
          }

          const edit = msg.deleteResize
            ? applyResizeGadgetDelete(document, msg.id, sr)
            : applyResizeGadgetRawUpdate(document, msg.id, {
                xRaw: msg.xRaw ?? "",
                yRaw: msg.yRaw ?? "",
                wRaw: msg.wRaw ?? "",
                hRaw: msg.hRaw ?? ""
              }, sr);
          await applyEditOrError(edit, `Could not patch ResizeGadget(...) for gadget '${msg.id}'${rangeInfo}.`);
          return;
        }
        case WEBVIEW_TO_EXT_MSG_TYPE.setMenuEntryEvent: {
          const edit = applyMenuEntryEventUpdate(document, msg.entryIdRaw, msg.eventProc, sr);
          await applyEditOrError(edit, `Could not patch event proc for menu entry '${msg.entryIdRaw}'. No matching EventMenu block found${rangeInfo}.`);
          return;
        }
        case WEBVIEW_TO_EXT_MSG_TYPE.setToolBarEntryEvent: {
          const edit = applyToolBarEntryEventUpdate(document, msg.entryIdRaw, msg.eventProc, sr);
          await applyEditOrError(edit, `Could not patch event proc for toolbar entry '${msg.entryIdRaw}'. No matching EventMenu block found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.setToolBarEntryTooltip: {
          const edit = applyToolBarEntryTooltipSet(document, msg.toolBarId, msg.sourceLine, msg.entryIdRaw, msg.textRaw, sr);
          await applyEditOrError(edit, `Could not patch toolbar tooltip for entry '${msg.entryIdRaw}'. No matching toolbar entry found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.setWindowEventFile: {
          const edit = applyWindowEventUpdate(document, msg.windowKey, { eventFileRaw: msg.eventFile }, sr);
          await applyEditOrError(edit, `Could not patch event include for window '${msg.windowKey}'. No matching procedure block found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.setWindowEventProc: {
          const edit = applyWindowEventProcUpdate(document, msg.windowKey, msg.eventProc, sr);
          await applyEditOrError(edit, `Could not patch event proc for window '${msg.windowKey}'. No matching EventGadget block found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.setWindowGenerateEventLoop: {
          const edit = applyWindowGenerateEventLoopUpdate(document, msg.windowKey, msg.enabled, sr);
          await applyEditOrError(edit, `Could not patch generate-event-loop flag for window '${msg.windowKey}'. No safe EventGadget patch path found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.insertGadgetItem: {
          const edit = applyGadgetItemInsert(
            document,
            msg.id,
            { posRaw: msg.posRaw, textRaw: msg.textRaw, imageRaw: msg.imageRaw, flagsRaw: msg.flagsRaw },
            sr
          );
          await applyEditOrError(edit, `Could not insert item for gadget '${msg.id}'. No suitable insertion point found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.updateGadgetItem: {
          const edit = applyGadgetItemUpdate(
            document,
            msg.id,
            msg.sourceLine,
            { posRaw: msg.posRaw, textRaw: msg.textRaw, imageRaw: msg.imageRaw, flagsRaw: msg.flagsRaw },
            sr
          );
          await applyEditOrError(edit, `Could not update item for gadget '${msg.id}'. No matching AddGadgetItem call found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.deleteGadgetItem: {
          const edit = applyGadgetItemDelete(document, msg.id, msg.sourceLine, sr);
          await applyEditOrError(edit, `Could not delete item for gadget '${msg.id}'. No matching AddGadgetItem call found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.insertGadgetColumn: {
          const edit = applyGadgetColumnInsert(document, msg.id, { colRaw: msg.colRaw, titleRaw: msg.titleRaw, widthRaw: msg.widthRaw }, sr);
          await applyEditOrError(edit, `Could not insert column for gadget '${msg.id}'. No suitable insertion point found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.updateGadgetColumn: {
          const edit = applyGadgetColumnUpdate(
            document,
            msg.id,
            msg.sourceLine,
            { colRaw: msg.colRaw, titleRaw: msg.titleRaw, widthRaw: msg.widthRaw },
            sr
          );
          await applyEditOrError(edit, `Could not update column for gadget '${msg.id}'. No matching AddGadgetColumn call found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.deleteGadgetColumn: {
          const edit = applyGadgetColumnDelete(document, msg.id, msg.sourceLine, sr);
          await applyEditOrError(edit, `Could not delete column for gadget '${msg.id}'. No matching AddGadgetColumn call found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.insertMenuEntry: {
          if (!ensureMenuEntryKind(msg.kind)) return;
          const edit = applyMenuEntryInsert(
            document,
            msg.menuId,
            { kind: msg.kind as any, idRaw: msg.idRaw, textRaw: msg.textRaw },
            sr,
            { parentSourceLine: msg.parentSourceLine }
          );
          await applyEditOrError(edit, `Could not insert menu entry for menu '${msg.menuId}'. No suitable insertion point found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.moveMenuEntry: {
          if (!ensureMenuEntryKind(msg.kind)) return;
          const edit = applyMenuEntryMove(
            document,
            msg.menuId,
            msg.sourceLine,
            msg.kind as any,
            { targetSourceLine: msg.targetSourceLine, placement: msg.placement },
            sr
          );
          await applyEditOrError(edit, `Could not move menu entry for menu '${msg.menuId}'. No matching structural move target found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.updateMenuEntry: {
          if (!ensureMenuEntryKind(msg.kind)) return;
          const edit = applyMenuEntryUpdate(
            document,
            msg.menuId,
            msg.sourceLine,
            { kind: msg.kind as any, idRaw: msg.idRaw, textRaw: msg.textRaw, shortcut: msg.shortcut, iconRaw: msg.iconRaw },
            sr
          );
          await applyEditOrError(edit, `Could not update menu entry for menu '${msg.menuId}'. No matching call found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.deleteMenuEntry: {
          if (!ensureMenuEntryKind(msg.kind)) return;
          const edit = applyMenuEntryDelete(document, msg.menuId, msg.sourceLine, msg.kind as any, sr);
          await applyEditOrError(edit, `Could not delete menu entry for menu '${msg.menuId}'. No matching call found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.deleteMenu: {
          const edit = applyMenuDelete(document, msg.menuId, sr);
          await applyEditOrError(edit, `Could not delete menu '${msg.menuId}'. No matching CreateMenu section found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.insertToolBarEntry: {
          if (!ensureToolBarEntryKind(msg.kind)) return;
          const edit = applyToolBarEntryInsert(
            document,
            msg.toolBarId,
            { kind: msg.kind as any, idRaw: msg.idRaw, iconRaw: msg.iconRaw, textRaw: msg.textRaw },
            sr
          );
          await applyEditOrError(edit, `Could not insert toolbar entry for toolbar '${msg.toolBarId}'. No suitable insertion point found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.updateToolBarEntry: {
          if (!ensureToolBarEntryKind(msg.kind)) return;
          const edit = applyToolBarEntryUpdate(
            document,
            msg.toolBarId,
            msg.sourceLine,
            { kind: msg.kind as any, idRaw: msg.idRaw, iconRaw: msg.iconRaw, textRaw: msg.textRaw, toggle: msg.toggle },
            sr
          );
          await applyEditOrError(edit, `Could not update toolbar entry for toolbar '${msg.toolBarId}'. No matching call found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.deleteToolBarEntry: {
          if (!ensureToolBarEntryKind(msg.kind)) return;
          const edit = applyToolBarEntryDelete(document, msg.toolBarId, msg.sourceLine, msg.kind as any, sr);
          await applyEditOrError(edit, `Could not delete toolbar entry for toolbar '${msg.toolBarId}'. No matching call found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.deleteToolBar: {
          const edit = applyToolBarDelete(document, msg.toolBarId, sr);
          await applyEditOrError(edit, `Could not delete toolbar '${msg.toolBarId}'. No matching CreateToolBar section found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.insertStatusBarField: {
          const edit = applyStatusBarFieldInsert(document, msg.statusBarId, {
            widthRaw: msg.widthRaw,
            textRaw: msg.textRaw,
            imageRaw: msg.imageRaw,
            flagsRaw: msg.flagsRaw,
            progressBar: msg.progressBar,
            progressRaw: msg.progressRaw,
          }, sr);
          await applyEditOrError(edit, `Could not insert statusbar field for statusbar '${msg.statusBarId}'. No suitable insertion point found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.updateStatusBarField: {
          const edit = applyStatusBarFieldUpdate(document, msg.statusBarId, msg.sourceLine, {
            widthRaw: msg.widthRaw,
            textRaw: msg.textRaw,
            imageRaw: msg.imageRaw,
            flagsRaw: msg.flagsRaw,
            progressBar: msg.progressBar,
            progressRaw: msg.progressRaw,
          }, sr);
          await applyEditOrError(
            edit,
            `Could not update statusbar field for statusbar '${msg.statusBarId}'. No matching AddStatusBarField call found${rangeInfo}.`
          );
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.deleteStatusBarField: {
          const edit = applyStatusBarFieldDelete(document, msg.statusBarId, msg.sourceLine, sr);
          await applyEditOrError(
            edit,
            `Could not delete statusbar field for statusbar '${msg.statusBarId}'. No matching AddStatusBarField call found${rangeInfo}.`
          );
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.deleteStatusBar: {
          const edit = applyStatusBarDelete(document, msg.statusBarId, sr);
          await applyEditOrError(
            edit,
            `Could not delete statusbar '${msg.statusBarId}'. No matching CreateStatusBar section found${rangeInfo}.`
          );
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.insertImage: {
          const edit = applyImageInsert(document, { inline: msg.inline, idRaw: msg.idRaw, imageRaw: msg.imageRaw, assignedVar: msg.assignedVar }, sr);
          await applyEditOrError(edit, `Could not insert image entry. No suitable insertion point found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.updateImage: {
          const edit = applyImageUpdate(document, msg.sourceLine, { inline: msg.inline, idRaw: msg.idRaw, imageRaw: msg.imageRaw, assignedVar: msg.assignedVar }, sr);
          await applyEditOrError(edit, `Could not update image entry. No matching LoadImage/CatchImage call found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.deleteImage: {
          const edit = applyImageDelete(document, msg.sourceLine, sr);
          await applyEditOrError(edit, `Could not delete image entry. No matching LoadImage/CatchImage call found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.relativizeImagePath: {
          if (msg.inline) {
            postError(`Could not make image path relative. CatchImage entries do not use a file path${rangeInfo}.`);
            return;
          }

          const relativeImageRaw = relativizeImagePath(document.uri.fsPath, msg.imageRaw);
          if (!relativeImageRaw) {
            postError(`Could not make image path relative. Save the form first and use a quoted LoadImage file path${rangeInfo}.`);
            return;
          }

          const edit = applyImageUpdate(document, msg.sourceLine, {
            inline: msg.inline,
            idRaw: msg.idRaw,
            imageRaw: relativeImageRaw,
            assignedVar: msg.assignedVar
          }, sr);
          await applyEditOrError(edit, `Could not update image entry. No matching LoadImage/CatchImage call found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.chooseImageFileForEntry: {
          if (msg.inline) {
            postError(`Could not choose a file for this image entry. CatchImage entries do not use a file path${rangeInfo}.`);
            return;
          }

          const pickedImageRaw = await pickImageFileRaw();
          if (!pickedImageRaw) {
            return;
          }

          const edit = applyImageUpdate(document, msg.sourceLine, {
            inline: false,
            idRaw: msg.idRaw,
            imageRaw: pickedImageRaw,
            assignedVar: msg.assignedVar
          }, sr);
          await applyEditOrError(edit, `Could not update image entry. No matching LoadImage/CatchImage call found${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.toggleImagePbAny: {
          const model = lastModel;
          const image = model?.images.find((entry) => entry.source?.line === msg.sourceLine);
          if (!image) {
            postError(`Could not toggle image pbAny. No matching image entry found${rangeInfo}.`);
            return;
          }

          const oldImageId = image.id;
          const toggledAssignedVar = msg.toPbAny
            ? toPbAnyAssignedVar(image.firstParam)
            : undefined;
          const toggledIdRaw = msg.toPbAny
            ? "#PB_Any"
            : toEnumImageId(image.variable ?? image.id ?? "");

          if (!toggledIdRaw || (msg.toPbAny && !toggledAssignedVar)) {
            postError(`Could not derive the target image identifier for '${image.id}'${rangeInfo}.`);
            return;
          }

          const nextImageRef = buildCreatedImageReference(toggledIdRaw, toggledAssignedVar);
          if (!nextImageRef) {
            postError(`Could not build the updated image reference for '${image.id}'${rangeInfo}.`);
            return;
          }

          const gadgetUsages = (model?.gadgets ?? []).filter((entry) => entry.imageId === oldImageId);
          const menuUsages = (model?.menus ?? []).flatMap((menu) =>
            menu.entries
              .filter((entry) => entry.iconId === oldImageId)
              .map((entry) => ({ menuId: menu.id, entry }))
          );
          const toolBarUsages = (model?.toolbars ?? []).flatMap((toolBar) =>
            toolBar.entries
              .filter((entry) => entry.iconId === oldImageId)
              .map((entry) => ({ toolBarId: toolBar.id, entry }))
          );
          const statusBarUsages = (model?.statusbars ?? []).flatMap((statusBar) =>
            statusBar.fields
              .filter((field) => field.imageId === oldImageId)
              .map((field) => ({ statusBarId: statusBar.id, field }))
          );

          const applyOrAbort = async (edit: vscode.WorkspaceEdit | undefined, errorMessage: string) => {
            if (!edit) {
              postError(errorMessage);
              return false;
            }
            const ok = await vscode.workspace.applyEdit(edit);
            if (!ok) {
              postError(errorMessage);
              return false;
            }
            return true;
          };

          for (const gadget of gadgetUsages) {
            const edit = applyGadgetOpenArgsUpdate(document, gadget.id, { imageRaw: nextImageRef }, sr);
            if (!await applyOrAbort(edit, `Could not update image reference in gadget '${gadget.id}'${rangeInfo}.`)) {
              return;
            }
          }

          for (const { menuId, entry } of menuUsages) {
            const sourceLine = entry.source?.line;
            if (typeof sourceLine !== "number") continue;
            const edit = applyMenuEntryUpdate(document, menuId, sourceLine, {
              kind: entry.kind as any,
              idRaw: entry.idRaw,
              textRaw: entry.textRaw,
              shortcut: entry.shortcut,
              iconRaw: nextImageRef,
            }, sr);
            if (!await applyOrAbort(edit, `Could not update image reference in menu '${menuId}'${rangeInfo}.`)) {
              return;
            }
          }

          for (const { toolBarId, entry } of toolBarUsages) {
            const sourceLine = entry.source?.line;
            if (typeof sourceLine !== "number") continue;
            const edit = applyToolBarEntryUpdate(document, toolBarId, sourceLine, {
              kind: entry.kind as any,
              idRaw: entry.idRaw,
              iconRaw: nextImageRef,
              toggle: entry.toggle,
            }, sr);
            if (!await applyOrAbort(edit, `Could not update image reference in toolbar '${toolBarId}'${rangeInfo}.`)) {
              return;
            }
          }

          for (const { statusBarId, field } of statusBarUsages) {
            const sourceLine = field.source?.line;
            if (typeof sourceLine !== "number") continue;
            const edit = applyStatusBarFieldUpdate(document, statusBarId, sourceLine, {
              widthRaw: field.widthRaw,
              imageRaw: nextImageRef,
            }, sr);
            if (!await applyOrAbort(edit, `Could not update image reference in statusbar '${statusBarId}'${rangeInfo}.`)) {
              return;
            }
          }

          const declarationEdit = applyImageUpdate(document, msg.sourceLine, {
            inline: image.inline,
            idRaw: toggledIdRaw,
            imageRaw: image.imageRaw,
            assignedVar: toggledAssignedVar,
          }, sr);
          await applyEditOrError(declarationEdit, `Could not toggle image entry '${image.id}'${rangeInfo}.`);
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.createAndAssignGadgetImage: {
          const imageRef = buildCreatedImageReference(msg.newImageIdRaw, msg.newAssignedVar);
          if (!imageRef) {
            postError(`Could not create image entry for gadget '${msg.id}'. #PB_Any requires an assigned variable name${rangeInfo}.`);
            return;
          }

          const assignEdit = applyGadgetOpenArgsUpdate(document, msg.id, { imageRaw: imageRef }, sr);
          const insertEdit = applyImageInsert(document, { inline: msg.newInline, idRaw: msg.newImageIdRaw, imageRaw: msg.newImageRaw, assignedVar: msg.newAssignedVar }, sr);
          await applyPairedEditsOrError(
            assignEdit, `Could not patch image argument for gadget '${msg.id}'. No matching image-capable gadget constructor found${rangeInfo}.`,
            insertEdit, `Could not insert image entry for gadget '${msg.id}'. No suitable insertion point found${rangeInfo}.`,
          );
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.chooseFileAndAssignGadgetImage: {
          const picked = await pickImageFile();
          if (!picked) {
            return;
          }

          const imageRef = buildCreatedImageReference(msg.newImageIdRaw, msg.newAssignedVar);
          if (!imageRef) {
            postError(`Could not create image entry for gadget '${msg.id}'. #PB_Any requires an assigned variable name${rangeInfo}.`);
            return;
          }

          const assignEdit = applyGadgetOpenArgsUpdate(document, msg.id, { imageRaw: imageRef }, sr);
          const insertEdit = applyImageInsert(document, { inline: false, idRaw: msg.newImageIdRaw, imageRaw: picked.imageRaw, assignedVar: msg.newAssignedVar }, sr);
          if (!await applyPairedEditsOrError(
            assignEdit, `Could not patch image argument for gadget '${msg.id}'. No matching image-capable gadget constructor found${rangeInfo}.`,
            insertEdit, `Could not insert image entry for gadget '${msg.id}'. No suitable insertion point found${rangeInfo}.`,
          )) {
            return;
          }

          // Resize is non-fatal and applied separately after the atomic assign+insert.
          if (msg.resizeToImage) {
            try {
              const dims = await readImageDimensions(picked.fsPath);
              if (dims) {
                const resizeEdit = applyRectPatch(document, msg.id, msg.x, msg.y, dims.width, dims.height, sr);
                await applyEditOrError(resizeEdit, `Could not resize gadget '${msg.id}' to the selected image size${rangeInfo}.`);
              } else {
                postError(`Assigned image to gadget '${msg.id}', but could not determine the selected image size for auto-resize${rangeInfo}.`);
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              postError(`Assigned image to gadget '${msg.id}', but could not read the selected image size: ${message}${rangeInfo}.`);
            }
          }
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.createAndAssignMenuEntryImage: {
          if (!ensureMenuEntryKind(msg.kind)) return;

          const imageRef = buildCreatedImageReference(msg.newImageIdRaw, msg.newAssignedVar);
          if (!imageRef) {
            postError(`Could not create image entry for menu '${msg.menuId}'. #PB_Any requires an assigned variable name${rangeInfo}.`);
            return;
          }

          const assignEdit = applyMenuEntryUpdate(
            document,
            msg.menuId,
            msg.sourceLine,
            { kind: msg.kind as any, idRaw: msg.idRaw, textRaw: msg.textRaw, shortcut: msg.shortcut, iconRaw: imageRef },
            sr
          );
          const insertEdit = applyImageInsert(document, { inline: msg.newInline, idRaw: msg.newImageIdRaw, imageRaw: msg.newImageRaw, assignedVar: msg.newAssignedVar }, sr);
          await applyPairedEditsOrError(
            assignEdit, `Could not patch image argument for menu entry in menu '${msg.menuId}'. No matching call found${rangeInfo}.`,
            insertEdit, `Could not insert image entry for menu '${msg.menuId}'. No suitable insertion point found${rangeInfo}.`,
          );
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.createAndAssignToolBarEntryImage: {
          if (!ensureToolBarEntryKind(msg.kind)) return;

          const imageRef = buildCreatedImageReference(msg.newImageIdRaw, msg.newAssignedVar);
          if (!imageRef) {
            postError(`Could not create image entry for toolbar '${msg.toolBarId}'. #PB_Any requires an assigned variable name${rangeInfo}.`);
            return;
          }

          const assignEdit = applyToolBarEntryUpdate(
            document,
            msg.toolBarId,
            msg.sourceLine,
            { kind: msg.kind as any, idRaw: msg.idRaw, iconRaw: imageRef, toggle: msg.toggle },
            sr
          );
          const insertEdit = applyImageInsert(document, { inline: msg.newInline, idRaw: msg.newImageIdRaw, imageRaw: msg.newImageRaw, assignedVar: msg.newAssignedVar }, sr);
          await applyPairedEditsOrError(
            assignEdit, `Could not patch image argument for toolbar entry in toolbar '${msg.toolBarId}'. No matching call found${rangeInfo}.`,
            insertEdit, `Could not insert image entry for toolbar '${msg.toolBarId}'. No suitable insertion point found${rangeInfo}.`,
          );
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.createAndAssignStatusBarFieldImage: {
          const imageRef = buildCreatedImageReference(msg.newImageIdRaw, msg.newAssignedVar);
          if (!imageRef) {
            postError(`Could not create image entry for statusbar '${msg.statusBarId}'. #PB_Any requires an assigned variable name${rangeInfo}.`);
            return;
          }

          const assignEdit = applyStatusBarFieldUpdate(document, msg.statusBarId, msg.sourceLine, { widthRaw: msg.widthRaw, textRaw: "", imageRaw: imageRef, progressBar: false, progressRaw: "" }, sr);
          const insertEdit = applyImageInsert(document, { inline: msg.newInline, idRaw: msg.newImageIdRaw, imageRaw: msg.newImageRaw, assignedVar: msg.newAssignedVar }, sr);
          await applyPairedEditsOrError(
            assignEdit, `Could not patch image argument for statusbar '${msg.statusBarId}'. No matching AddStatusBarField call found${rangeInfo}.`,
            insertEdit, `Could not insert image entry for statusbar '${msg.statusBarId}'. No suitable insertion point found${rangeInfo}.`,
          );
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.chooseFileAndAssignMenuEntryImage: {
          if (!ensureMenuEntryKind(msg.kind)) return;

          const pickedImageRaw = await pickImageFileRaw();
          if (!pickedImageRaw) {
            return;
          }

          const imageRef = buildCreatedImageReference(msg.newImageIdRaw, msg.newAssignedVar);
          if (!imageRef) {
            postError(`Could not create image entry for menu '${msg.menuId}'. #PB_Any requires an assigned variable name${rangeInfo}.`);
            return;
          }

          const assignEdit = applyMenuEntryUpdate(
            document,
            msg.menuId,
            msg.sourceLine,
            { kind: msg.kind as any, idRaw: msg.idRaw, textRaw: msg.textRaw, shortcut: msg.shortcut, iconRaw: imageRef },
            sr
          );
          const insertEdit = applyImageInsert(document, { inline: false, idRaw: msg.newImageIdRaw, imageRaw: pickedImageRaw, assignedVar: msg.newAssignedVar }, sr);
          await applyPairedEditsOrError(
            assignEdit, `Could not patch image argument for menu entry in menu '${msg.menuId}'. No matching call found${rangeInfo}.`,
            insertEdit, `Could not insert image entry for menu '${msg.menuId}'. No suitable insertion point found${rangeInfo}.`,
          );
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.chooseFileAndAssignToolBarEntryImage: {
          if (!ensureToolBarEntryKind(msg.kind)) return;

          const pickedImageRaw = await pickImageFileRaw();
          if (!pickedImageRaw) {
            return;
          }

          const imageRef = buildCreatedImageReference(msg.newImageIdRaw, msg.newAssignedVar);
          if (!imageRef) {
            postError(`Could not create image entry for toolbar '${msg.toolBarId}'. #PB_Any requires an assigned variable name${rangeInfo}.`);
            return;
          }

          const assignEdit = applyToolBarEntryUpdate(
            document,
            msg.toolBarId,
            msg.sourceLine,
            { kind: msg.kind as any, idRaw: msg.idRaw, iconRaw: imageRef, toggle: msg.toggle },
            sr
          );
          const insertEdit = applyImageInsert(document, { inline: false, idRaw: msg.newImageIdRaw, imageRaw: pickedImageRaw, assignedVar: msg.newAssignedVar }, sr);
          await applyPairedEditsOrError(
            assignEdit, `Could not patch image argument for toolbar entry in toolbar '${msg.toolBarId}'. No matching call found${rangeInfo}.`,
            insertEdit, `Could not insert image entry for toolbar '${msg.toolBarId}'. No suitable insertion point found${rangeInfo}.`,
          );
          return;
        }

        case WEBVIEW_TO_EXT_MSG_TYPE.chooseFileAndAssignStatusBarFieldImage: {
          const pickedImageRaw = await pickImageFileRaw();
          if (!pickedImageRaw) {
            return;
          }

          const imageRef = buildCreatedImageReference(msg.newImageIdRaw, msg.newAssignedVar);
          if (!imageRef) {
            postError(`Could not create image entry for statusbar '${msg.statusBarId}'. #PB_Any requires an assigned variable name${rangeInfo}.`);
            return;
          }

          const assignEdit = applyStatusBarFieldUpdate(document, msg.statusBarId, msg.sourceLine, { widthRaw: msg.widthRaw, textRaw: "", imageRaw: imageRef, progressBar: false, progressRaw: "" }, sr);
          const insertEdit = applyImageInsert(document, { inline: false, idRaw: msg.newImageIdRaw, imageRaw: pickedImageRaw, assignedVar: msg.newAssignedVar }, sr);
          await applyPairedEditsOrError(
            assignEdit, `Could not patch image argument for statusbar '${msg.statusBarId}'. No matching AddStatusBarField call found${rangeInfo}.`,
            insertEdit, `Could not insert image entry for statusbar '${msg.statusBarId}'. No suitable insertion point found${rangeInfo}.`,
          );
          return;
        }

        default:
          return;
      }
    });
  }

  private getWebviewHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "out", "webview", "main.js")
    );
    const nonce = getNonce();
    const symbolsJson = JSON.stringify(PBFD_SYMBOLS);

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy"
      content="default-src 'none';
               img-src ${webview.cspSource} data:;
               style-src ${webview.cspSource} 'unsafe-inline';
               script-src 'nonce-${nonce}' ${webview.cspSource};">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PureBasic Form Designer</title>
    <style>
      :root {
        color-scheme: light dark;
        --pbfd-canvas-bg: var(--vscode-editor-background);
        --pbfd-readonly-bg: var(--vscode-readonly-input-background);
      }

      body {
        margin: 0;
        padding: 0;
        font-family: system-ui, -apple-system, Segoe UI, sans-serif;
        background: var(--vscode-editor-background);
        color: var(--vscode-editor-foreground);
      }

      .root {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 6px minmax(300px, var(--pbfd-panel-width, 360px));
        height: 100vh;
      }

      .canvasWrap {
        position: relative;
        overflow: hidden;
        background: var(--pbfd-canvas-bg);
      }

      canvas {
        width: 100%;
        height: 100%;
        display: block;
      }

      .panelResizer {
        cursor: col-resize;
        background: var(--vscode-panel-border);
        opacity: 0.35;
        touch-action: none;
        user-select: none;
      }

      .panelResizer:hover,
      .panelResizer.dragging {
        opacity: 1;
        background: var(--vscode-focusBorder);
      }

      .panel {
        border-left: 1px solid var(--vscode-panel-border);
        background: var(--vscode-sideBar-background);
        color: var(--vscode-sideBar-foreground);
        padding: 10px;
        overflow: auto;
        min-width: 300px;
      }

      .row {
        display: grid;
        grid-template-columns: 110px 1fr;
        gap: 8px;
        margin-bottom: 8px;
        align-items: center;
      }

      input, select, button {
        width: 100%;
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-input-border);
        border-radius: 4px;
        padding: 2px 6px;
      }

      input[readonly] {
        background: var(--pbfd-readonly-bg);
      }        

      button {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: 1px solid var(--vscode-button-border);
        cursor: pointer;
        padding: 6px 8px;
      }

      button:hover {
        background: var(--vscode-button-hoverBackground);
      }

      .list { margin-top: 12px; }

      .treeItem {
        display: grid;
        grid-template-columns: 18px 1fr;
        align-items: center;
        padding: 6px 8px;
        border-radius: 8px;
        cursor: pointer;
        user-select: none;
      }

      .treeItem:hover {
        background: var(--vscode-list-hoverBackground);
      }

      .treeItem.sel {
        background: var(--vscode-list-activeSelectionBackground);
        color: var(--vscode-list-activeSelectionForeground);
      }

      .twisty {
        text-align: center;
        opacity: .9;
      }

      .muted { opacity: .75; font-size: 12px; }

      .diag {
        margin: 10px 0 8px;
        padding: 8px;
        border-radius: 8px;
        border: 1px solid var(--vscode-panel-border);
        background: var(--vscode-editorWidget-background);
        color: var(--vscode-editorWidget-foreground);
      }

      .diag .row { display: flex; gap: 8px; align-items: flex-start; margin: 4px 0; }
      .diag .sev { width: 18px; text-align: center; }
      .diag .msg { flex: 1; }

      .sev.warn { color: var(--vscode-notificationsWarningIcon-foreground); }
      .sev.err { color: var(--vscode-notificationsErrorIcon-foreground); }
      .sev.info { color: var(--vscode-notificationsInfoIcon-foreground); }

      .err {
        display: none;
        margin: 10px 0 8px;
        padding: 8px;
        border-radius: 8px;
        border: 1px solid var(--vscode-notificationsErrorIcon-foreground);
        background: var(--vscode-editorWidget-background);
        color: var(--vscode-editorWidget-foreground);
        font-size: 12px;
        white-space: pre-wrap;
      }

      .subHeader { margin-top: 14px; font-weight: 700; padding: 4px 6px; border: 1px solid var(--vscode-panel-border); background: var(--vscode-editorWidget-background); }

      .infoSubHeader {
        margin-top: 10px;
        font-weight: 600;
        font-size: 12px;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        opacity: .85;
      }

      .infoSubBody {
        margin: 6px 0 0;
      }

      .miniList {
        border: 1px solid var(--vscode-panel-border);
        border-radius: 8px;
        padding: 8px;
        margin: 8px 0;
        background: var(--vscode-editorWidget-background);
      }

      .miniRow {
        display: grid;
        grid-template-columns: 1fr 56px 56px;
        gap: 6px;
        align-items: center;
        margin: 4px 0;
        font-size: 12px;
        border-radius: 6px;
        padding: 4px 6px;
      }

      .miniRow.selected {
        background: var(--vscode-list-activeSelectionBackground);
        color: var(--vscode-list-activeSelectionForeground);
      }

      .miniRow button {
        width: 100%;
        padding: 2px 6px;
        font-size: 12px;
      }

      .miniActions {
        display: flex;
        gap: 6px;
        margin-top: 6px;
      }

      .miniActions button {
        flex: 1;
      }

      .row-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }

      .check {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .check input[type="checkbox"] {
        width: auto;
        margin: 0;
        vertical-align: middle;
      }
    </style>
  </head>
  <body>
    <div class="root">
      <div class="canvasWrap"><canvas id="designer"></canvas></div>
      <div id="panelResizer" class="panelResizer" aria-hidden="true"></div>
      <div class="panel">
        <div class="subHeader">Info</div>
        <div id="diag" class="diag" style="display:none"></div>
        <div id="err" class="err"></div>
        <div id="infoHint" class="muted" style="margin:8px 0 10px"></div>
        <div class="infoSubHeader">Selection</div>
        <div id="infoSelection" class="muted infoSubBody"></div>
        <div id="props"></div>

        <div class="list">
          <div class="subHeader">Hierarchy</div>
          <div class="muted" style="margin:8px 0 8px">Select Parent lets you quickly navigate to a container/root.</div>
          <div class="row" style="grid-template-columns: 110px 1fr;">
            <div>Select Parent</div>
            <select id="parentSel"></select>
          </div>
          <div id="list"></div>
        </div>
      </div>
    </div>

    <script nonce="${nonce}">window.__PBFD_SYMBOLS__ = ${symbolsJson};</script>
    <script nonce="${nonce}" src="${scriptUri}"></script>
  </body>
</html>`;
  }
}

function getNonce(): string {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}