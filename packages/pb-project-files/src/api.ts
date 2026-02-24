import * as vscode from 'vscode';
import type { PbpProject, PbpTarget } from '@caldymos/pb-project-core';

export interface PbProjectContext {
    project?: PbpProject;
    target?: PbpTarget;
}

export interface PbProjectContextPayload {
    /** Absolute path to the .pbp file */
    projectFile?: string;
    /** Target name as stored in the .pbp */
    targetName?: string;
}

export interface PbProjectFilesApi {
    readonly version: 1;

    getActiveContext(): PbProjectContext;
    getActiveContextPayload(): PbProjectContextPayload;

    getProjectForFile(fileUri: vscode.Uri): PbpProject | undefined;

    refresh(): Promise<void>;
    pickActiveProject(): Promise<void>;
    pickActiveTarget(): Promise<void>;

    readonly onDidChangeActiveContext: vscode.Event<PbProjectContextPayload>;
}
