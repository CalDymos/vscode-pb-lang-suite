/**
 * pb-lang-support – FallbackResolver
 *
 * Stellt Build-Kontext bereit wenn kein .pbp-Projekt aktiv ist.
 * Konfigurierbar über purebasic.build.fallbackSource.
 */
import * as vscode from 'vscode';
import * as path   from 'path';

export type FallbackSource =
    | 'sourceMetadata'   // PureBasic-IDE-Kommentare am Dateiende
    | 'launchJson'       // .vscode/launch.json
    | 'fileCfg'          // <dateiname>.pb.cfg neben der Quelldatei
    | 'projectCfg';      // project.cfg – Verzeichnisbaum aufwärts

export interface FallbackBuildContext {
    source:       FallbackSource;
    includeDirs:  string[];
    projectFiles: string[];
    /** Pfad zur Ausgabedatei (Compiler-Output), falls verfügbar. */
    outputFile?:  string;
}

// ---------------------------------------------------------------------------

export class FallbackResolver {

    public async resolve(documentUri: vscode.Uri): Promise<FallbackBuildContext | null> {
        const src = this.configuredSource();
        switch (src) {
            case 'sourceMetadata': return this.fromSourceMetadata(documentUri);
            case 'launchJson':     return this.fromLaunchJson(documentUri);
            case 'fileCfg':        return this.fromFileCfg(documentUri);
            case 'projectCfg':     return this.fromProjectCfg(documentUri);
        }
    }

    // -----------------------------------------------------------------------
    // sourceMetadata
    // PureBasic-IDE schreibt Build-Parameter als Kommentare ans Dateiende:
    //   ; Executable = output\MyApp.exe
    //   ; IncludeDirectory = lib
    // -----------------------------------------------------------------------
    private async fromSourceMetadata(uri: vscode.Uri): Promise<FallbackBuildContext | null> {
        try {
            const bytes = await vscode.workspace.fs.readFile(uri);
            const lines = Buffer.from(bytes).toString('utf8').split(/\r?\n/);
            const fileDir = path.dirname(uri.fsPath);

            const includeDirs: string[] = [];
            let outputFile: string | undefined;

            // Metadaten stehen in den letzten ~50 Zeilen, Präfix "; "
            for (const line of lines.slice(-50)) {
                if (!line.startsWith('; ')) continue;
                const entry = line.slice(2);
                if (entry.startsWith('IncludeDirectory = ')) {
                    includeDirs.push(this.abs(fileDir, entry.slice('IncludeDirectory = '.length).trim()));
                } else if (entry.startsWith('Executable = ')) {
                    outputFile = this.abs(fileDir, entry.slice('Executable = '.length).trim());
                }
            }

            return { source: 'sourceMetadata', includeDirs, projectFiles: [], outputFile };
        } catch {
            return null;
        }
    }

    // -----------------------------------------------------------------------
    // launchJson  (.vscode/launch.json)
    // Erwartet optionale Felder in der purebasic-Konfiguration:
    //   "includeDirs": ["./includes"],  "projectFiles": [],  "executable": ""
    // -----------------------------------------------------------------------
    private async fromLaunchJson(uri: vscode.Uri): Promise<FallbackBuildContext | null> {
        const wsFolder = vscode.workspace.getWorkspaceFolder(uri)
            ?? vscode.workspace.workspaceFolders?.[0];
        if (!wsFolder) return null;

        const launchUri = vscode.Uri.joinPath(wsFolder.uri, '.vscode', 'launch.json');
        try {
            const bytes = await vscode.workspace.fs.readFile(launchUri);
            // launch.json darf Kommentare enthalten (jsonc)
            const text = Buffer.from(bytes).toString('utf8').replace(/\/\/[^\n]*/g, '');
            const json = JSON.parse(text) as { configurations?: unknown[] };
            const cfgs  = json.configurations ?? [];

            // Erste purebasic-Konfiguration bevorzugen
            const cfg = (cfgs.find((c: any) => c.type === 'purebasic') ?? cfgs[0]) as any;
            if (!cfg) return null;

            const base = wsFolder.uri.fsPath;
            const includeDirs  = ((cfg.includeDirs  ?? []) as string[]).map(d => this.abs(base, d));
            const projectFiles = ((cfg.projectFiles ?? []) as string[]).map(f => this.abs(base, f));
            const outputFile   = cfg.executable ? this.abs(base, cfg.executable as string) : undefined;

            return { source: 'launchJson', includeDirs, projectFiles, outputFile };
        } catch {
            return null;
        }
    }

    // -----------------------------------------------------------------------
    // fileCfg  (<datei>.pb.cfg)
    // -----------------------------------------------------------------------
    private async fromFileCfg(uri: vscode.Uri): Promise<FallbackBuildContext | null> {
        return this.parseCfgFile(uri.fsPath + '.cfg', 'fileCfg');
    }

    // -----------------------------------------------------------------------
    // projectCfg  (project.cfg – Verzeichnisbaum aufwärts bis Workspace-Root)
    // -----------------------------------------------------------------------
    private async fromProjectCfg(uri: vscode.Uri): Promise<FallbackBuildContext | null> {
        const wsFolder = vscode.workspace.getWorkspaceFolder(uri);
        const stopAt   = wsFolder?.uri.fsPath ?? path.parse(uri.fsPath).root;

        let dir = path.dirname(uri.fsPath);
        while (true) {
            const result = await this.parseCfgFile(path.join(dir, 'project.cfg'), 'projectCfg');
            if (result) return result;
            if (dir === stopAt || dir === path.dirname(dir)) break;
            dir = path.dirname(dir);
        }
        return null;
    }

    // -----------------------------------------------------------------------
    // Gemeinsamer .cfg-Parser (key=value, wiederholbare Schlüssel)
    //
    //   executable=./out/myapp.exe
    //   includedir=./includes
    //   includedir=../shared
    //   file=./module.pb
    //   # Kommentare mit # oder ;
    // -----------------------------------------------------------------------
    private async parseCfgFile(
        filePath: string,
        source:   FallbackSource,
    ): Promise<FallbackBuildContext | null> {
        try {
            const bytes = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
            const dir   = path.dirname(filePath);

            const includeDirs:  string[] = [];
            const projectFiles: string[] = [];
            let   outputFile:   string | undefined;

            for (const raw of Buffer.from(bytes).toString('utf8').split(/\r?\n/)) {
                const line = raw.trim();
                if (!line || line.startsWith('#') || line.startsWith(';')) continue;
                const eq = line.indexOf('=');
                if (eq < 0) continue;
                const key = line.slice(0, eq).trim().toLowerCase();
                const val = line.slice(eq + 1).trim();
                if (!val) continue;

                if (key === 'includedir')  { includeDirs.push(this.abs(dir, val));  }
                else if (key === 'file')   { projectFiles.push(this.abs(dir, val)); }
                else if (key === 'executable') { outputFile = this.abs(dir, val);   }
            }

            return { source, includeDirs, projectFiles, outputFile };
        } catch {
            return null;
        }
    }

    // -----------------------------------------------------------------------

    private configuredSource(): FallbackSource {
        const val   = vscode.workspace.getConfiguration('purebasic.build')
            .get<string>('fallbackSource', 'launchJson');
        const valid: FallbackSource[] =
            ['sourceMetadata', 'launchJson', 'fileCfg', 'projectCfg'];
        return valid.includes(val as FallbackSource) ? (val as FallbackSource) : 'launchJson';
    }

    private abs(base: string, p: string): string {
        return path.isAbsolute(p) ? p : path.resolve(base, p);
    }
}