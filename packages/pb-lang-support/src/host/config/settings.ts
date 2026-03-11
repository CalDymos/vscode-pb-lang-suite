/**
 * host settings configuration
 */

import * as vscode from 'vscode';
import type { FallbackSource } from '../fallback-resolver';

const SETTINGS_SECTION = 'purebasic';

const VALID_FALLBACK_SOURCES: FallbackSource[] =
    ['sourceMetadata', 'launchJson', 'fileCfg', 'projectCfg'];

export type RunMode = 'spawn' | 'terminal';

export interface PureBasicHostSettings {
    build: {
        compiler:       string;
        fallbackSource: FallbackSource;
    };
    run: {
        mode: RunMode;
    };
}

const defaults: PureBasicHostSettings = {
    build: {
        compiler:       '',
        fallbackSource: 'launchJson',
    },
    run: {
        mode: 'spawn',
    },
};

export function readHostSettings(): PureBasicHostSettings {
    const cfg = vscode.workspace.getConfiguration(SETTINGS_SECTION);

    const rawFallback = cfg.get<string>('build.fallbackSource', 'launchJson');
    const fallbackSource: FallbackSource = VALID_FALLBACK_SOURCES.includes(rawFallback as FallbackSource)
        ? (rawFallback as FallbackSource)
        : defaults.build.fallbackSource;

    return {
        build: {
            compiler:       (cfg.get<string>('build.compiler') ?? defaults.build.compiler).trim(),
            fallbackSource,
        },
        run: {
            mode: cfg.get<string>('run.mode') === 'terminal' ? 'terminal' : 'spawn',
        },
    };
}