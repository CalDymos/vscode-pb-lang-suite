/**
 * PureBasic: Run Active Target
 *
 * Host-side command that runs the active target executable (if available) or
 * runs the fallback executable. This uses a VS Code terminal to avoid
 * argument parsing in the extension host.
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { FallbackResolver } from '../fallback-resolver';
import { resolveUnifiedContext, type PbProjectFilesApi } from '../unified-context';

export interface RunActiveTargetDeps {
    projectFilesApi?: PbProjectFilesApi;
    outputChannel: vscode.OutputChannel;
}

export async function runActiveTarget(deps: RunActiveTargetDeps): Promise<boolean> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.scheme !== 'file') {
        void vscode.window.showWarningMessage('No file-backed editor is active.');
        return false;
    }

    const fallbackResolver = new FallbackResolver();
    const uctx = await resolveUnifiedContext({
        api: deps.projectFilesApi,
        fallbackResolver,
        activeDocument: editor.document,
    });

    if (!uctx) {
        void vscode.window.showWarningMessage('No active PureBasic file found.');
        return false;
    }

    const executablePath = (uctx.executable ?? '').trim() || (uctx.outputFile ?? '').trim();
    if (!executablePath) {
        void vscode.window.showErrorMessage('No executable configured for the active target.');
        return false;
    }

    const runCwd = (uctx.workingDir ?? '').trim() || path.dirname(executablePath);

    try {
        await fs.promises.access(executablePath);
    } catch {
        const hint = uctx.mode === 'pbp'
            ? 'Build the active target first (PureBasic: Build Active Target).'
            : 'Provide an executable in the selected fallback source.';
        void vscode.window.showErrorMessage(`Executable not found: ${executablePath}. ${hint}`);
        return false;
    }

    const commandLine = uctx.mode === 'pbp'
        ? String(uctx.target?.commandLine ?? '').trim()
        : '';

    const cmd = buildShellCommand(executablePath, commandLine);

    deps.outputChannel.clear();
    deps.outputChannel.show(true);
    deps.outputChannel.appendLine('--- Run ---');
    deps.outputChannel.appendLine(`cwd: ${runCwd}`);
    deps.outputChannel.appendLine(`cmd: ${cmd}`);

    const termName = uctx.mode === 'pbp'
        ? `PureBasic Run (${uctx.targetName ?? 'active'})`
        : `PureBasic Run (${uctx.fallbackSource ?? 'fallback'})`;

    const terminal = vscode.window.createTerminal({
        name: termName,
        cwd: runCwd,
    });

    terminal.show(true);
    terminal.sendText(cmd, true);

    return true;
}

function buildShellCommand(executablePath: string, commandLine: string): string {
    const exe = quoteExecutable(executablePath);
    if (!commandLine) return exe;
    return `${exe} ${commandLine}`;
}

function quoteExecutable(executablePath: string): string {
    // Always quote to support spaces in paths.
    // Escape double-quotes to keep the command valid in typical shells.
    const escaped = executablePath.replace(/"/g, '\"');
    return `"${escaped}"`;
}
