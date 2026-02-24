import * as vscode from 'vscode';
import * as path from 'path';

import {
    parsePbpProjectText,
    pickTarget,
    type PbpProject,
    type PbpTarget,
} from '@caldymos/pb-project-core';

import type { PbProjectContext, PbProjectContextPayload, PbProjectFilesApi } from '../api';

const DEFAULT_PBP_GLOB = '**/*.pbp';
const DEFAULT_EXCLUDE_GLOB = '**/{node_modules,.git}/**';

function normalizeFsPath(fsPath: string): string {
    const p = path.normalize(fsPath);
    return process.platform === 'win32' ? p.toLowerCase() : p;
}

function formatStatusBarText(ctx: PbProjectContextPayload): string {
    const proj = ctx.projectFile ? path.basename(ctx.projectFile) : 'No Project';
    const tgt = ctx.targetName ? `  [${ctx.targetName}]` : '';
    return `PB: ${proj}${tgt}`;
}

export class ProjectService implements vscode.Disposable {
    private readonly projects = new Map<string, PbpProject>();
    private readonly fileToProject = new Map<string, string>();

    private activeProjectFile?: string;
    private activeTargetName?: string;

    private readonly onDidChangeActiveContextEmitter = new vscode.EventEmitter<PbProjectContextPayload>();
    public readonly onDidChangeActiveContext = this.onDidChangeActiveContextEmitter.event;

    private readonly statusBar: vscode.StatusBarItem;
    private readonly disposables: vscode.Disposable[] = [];

    private pbpWatcher?: vscode.FileSystemWatcher;

    public constructor(private readonly context: vscode.ExtensionContext) {
        this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusBar.command = 'pbProjectFiles.pickProject';
        this.statusBar.tooltip = 'Select active PureBasic project/target';
        this.statusBar.show();
        this.disposables.push(this.statusBar);

        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor(() => {
                void this.syncActiveContextFromEditor();
            })
        );
    }

    public getApi(): PbProjectFilesApi {
        return {
            version: 1,
            getActiveContext: () => this.getActiveContext(),
            getActiveContextPayload: () => this.getActiveContextPayload(),
            getProjectForFile: (fileUri: vscode.Uri) => this.getProjectForFile(fileUri),
            refresh: () => this.refresh(),
            pickActiveProject: () => this.pickActiveProject(),
            pickActiveTarget: () => this.pickActiveTarget(),
            onDidChangeActiveContext: this.onDidChangeActiveContext,
        };
    }

    public async initialize(): Promise<void> {
        await this.refresh();
        await this.syncActiveContextFromEditor();
        this.installWatchers();
        this.updateStatusBar();
        this.emitActiveContextChanged();
    }

    public dispose(): void {
        for (const d of this.disposables.splice(0)) d.dispose();
        this.pbpWatcher?.dispose();
        this.onDidChangeActiveContextEmitter.dispose();
    }

    public getActiveContext(): PbProjectContext {
        const project = this.activeProjectFile ? this.projects.get(this.activeProjectFile) : undefined;
        const target = project ? this.getActiveTarget(project) : undefined;
        return { project, target };
    }

    public getActiveContextPayload(): PbProjectContextPayload {
        return {
            projectFile: this.activeProjectFile,
            targetName: this.activeTargetName,
        };
    }

    public getProjectForFile(fileUri: vscode.Uri): PbpProject | undefined {
        const fsPath = normalizeFsPath(fileUri.fsPath);
        const projFile = this.fileToProject.get(fsPath);
        return projFile ? this.projects.get(projFile) : undefined;
    }

    public async refresh(): Promise<void> {
        const pbpUris = await vscode.workspace.findFiles(DEFAULT_PBP_GLOB, DEFAULT_EXCLUDE_GLOB);

        this.projects.clear();
        this.fileToProject.clear();

        for (const uri of pbpUris) {
            const parsed = await this.tryParseProject(uri);
            if (!parsed) continue;
            const key = normalizeFsPath(parsed.projectFile);
            this.projects.set(key, parsed);
        }

        this.rebuildFileToProjectMap();

        // Keep the previously active project if it still exists; otherwise pick first.
        if (this.activeProjectFile && !this.projects.has(this.activeProjectFile)) {
            this.activeProjectFile = undefined;
            this.activeTargetName = undefined;
        }

        if (!this.activeProjectFile) {
            const first = this.projects.keys().next();
            if (!first.done) {
                this.activeProjectFile = first.value;
                const proj = this.projects.get(first.value);
                this.activeTargetName = proj ? this.getActiveTarget(proj)?.name : undefined;
            }
        }

        this.updateStatusBar();
        this.emitActiveContextChanged();
    }

    public async pickActiveProject(): Promise<void> {
        const items = [...this.projects.values()].map(p => ({
            label: p.config?.name?.trim() ? p.config.name : path.basename(p.projectFile),
            description: p.projectFile,
            projectFile: normalizeFsPath(p.projectFile),
        }));

        if (items.length === 0) {
            void vscode.window.showInformationMessage('No .pbp projects found in the workspace.');
            return;
        }

        const picked = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select active PureBasic project',
            matchOnDescription: true,
        });
        if (!picked) return;

        await this.setActiveProject(picked.projectFile);
    }

    public async pickActiveTarget(): Promise<void> {
        const proj = this.activeProjectFile ? this.projects.get(this.activeProjectFile) : undefined;
        if (!proj) {
            void vscode.window.showInformationMessage('No active project.');
            return;
        }

        const targets = proj.targets ?? [];
        if (targets.length === 0) {
            void vscode.window.showInformationMessage('Active project has no targets.');
            return;
        }

        const items = targets.map(t => ({
            label: t.name,
            description: `${t.enabled ? 'enabled' : 'disabled'}${t.isDefault ? ', default' : ''}`,
            targetName: t.name,
        }));

        const picked = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select active PureBasic target',
            matchOnDescription: true,
        });
        if (!picked) return;

        this.activeTargetName = picked.targetName;
        this.updateStatusBar();
        this.emitActiveContextChanged();
    }

    private async setActiveProject(projectFile: string): Promise<void> {
        const key = normalizeFsPath(projectFile);
        const proj = this.projects.get(key);
        if (!proj) return;

        this.activeProjectFile = key;
        this.activeTargetName = this.getActiveTarget(proj)?.name;

        this.updateStatusBar();
        this.emitActiveContextChanged();
    }

    private getActiveTarget(project: PbpProject): PbpTarget | undefined {
        if (this.activeTargetName) {
            const byName = (project.targets ?? []).find(t => t.name === this.activeTargetName);
            if (byName) return byName;
        }

        const t = pickTarget(project);
        return t ?? project.targets?.[0];
    }

    private rebuildFileToProjectMap(): void {
        for (const proj of this.projects.values()) {
            const projKey = normalizeFsPath(proj.projectFile);
            for (const f of proj.files ?? []) {
                if (!f?.fsPath) continue;
                this.fileToProject.set(normalizeFsPath(f.fsPath), projKey);
            }
        }
    }

    private async syncActiveContextFromEditor(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const uri = editor.document.uri;
        if (uri.scheme !== 'file') return;

        // If the file is the project file itself.
        if (uri.fsPath.toLowerCase().endsWith('.pbp')) {
            await this.setActiveProject(uri.fsPath);
            return;
        }

        // If the file is known to be part of a project.
        const proj = this.getProjectForFile(uri);
        if (proj) {
            await this.setActiveProject(proj.projectFile);
        }
    }

    private installWatchers(): void {
        if (this.pbpWatcher) return;

        this.pbpWatcher = vscode.workspace.createFileSystemWatcher(DEFAULT_PBP_GLOB);
        this.disposables.push(this.pbpWatcher);

        this.pbpWatcher.onDidCreate(uri => void this.onPbpFileChanged(uri), this, this.disposables);
        this.pbpWatcher.onDidChange(uri => void this.onPbpFileChanged(uri), this, this.disposables);
        this.pbpWatcher.onDidDelete(uri => this.onPbpFileDeleted(uri), this, this.disposables);
    }

    private async onPbpFileChanged(uri: vscode.Uri): Promise<void> {
        const parsed = await this.tryParseProject(uri);
        const key = normalizeFsPath(uri.fsPath);

        if (!parsed) {
            // Keep an old cached project if parsing fails, but still refresh mapping.
            this.rebuildFileToProjectMap();
            this.updateStatusBar();
            return;
        }

        this.projects.set(key, parsed);
        this.rebuildFileToProjectMap();

        if (this.activeProjectFile === key) {
            this.activeTargetName = this.getActiveTarget(parsed)?.name;
        }

        this.updateStatusBar();
        this.emitActiveContextChanged();
    }

    private onPbpFileDeleted(uri: vscode.Uri): void {
        const key = normalizeFsPath(uri.fsPath);
        this.projects.delete(key);
        this.rebuildFileToProjectMap();

        if (this.activeProjectFile === key) {
            this.activeProjectFile = undefined;
            this.activeTargetName = undefined;
        }

        this.updateStatusBar();
        this.emitActiveContextChanged();
    }

    private async tryParseProject(uri: vscode.Uri): Promise<PbpProject | null> {
        try {
            const bytes = await vscode.workspace.fs.readFile(uri);
            const content = Buffer.from(bytes).toString('utf8');
            return parsePbpProjectText(content, uri.fsPath);
        } catch {
            return null;
        }
    }

    private updateStatusBar(): void {
        const payload = this.getActiveContextPayload();
        this.statusBar.text = formatStatusBarText(payload);
    }

    private emitActiveContextChanged(): void {
        this.onDidChangeActiveContextEmitter.fire(this.getActiveContextPayload());
    }
}
