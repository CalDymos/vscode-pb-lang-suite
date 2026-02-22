/* 
 * PureBasic Project (.pbp) File Parser (shared)
 *
 * Parses .pbp project files to extract file references and configuration information
 * Supports XML format for PureBasic 6.21 and later
 * dependency-free module (no VS Code / LSP imports) to use it in
 * the extension host and in the language server.
 */

import * as path from 'path';

export interface PbpProject {
    /** Absolute filesystem path to the .pbp file */
    projectFile: string;
    /** Absolute filesystem path to the project directory */
    projectDir: string;
    /** Project name (from <section name="config"><options name="..."/>) */
    name: string;
    /** Project comment (from <section name="config"><comment>...</comment>) */
    comment: string;
    files: PbpFileEntry[];
    targets: PbpTarget[];
}

export interface PbpFileEntry {
    /** File name/path as stored in the .pbp (usually relative to the project file) */
    rawPath: string;
    /** Resolved absolute filesystem path */
    fsPath: string;
    /** Optional file flags as stored in the project */
    config?: {
        load?: boolean;
        scan?: boolean;
        panel?: boolean;
        warn?: boolean;
    };
}

export interface PbpTarget {
    name: string;
    enabled: boolean;
    isDefault: boolean;
    inputFile: PbpTargetValue;
    outputFile: PbpTargetValue;
    executable: PbpTargetValue;
    options: Record<string, boolean>;
    format?: Record<string, string>;
    icon?: {
        enabled: boolean;
        rawPath: string;
        fsPath: string;
    };
    constants: Array<{
        enabled: boolean;
        value: string;
    }>;
}

export interface PbpTargetValue {
    rawPath: string;
    fsPath: string;
}

export interface ParsePbpOptions {
    /** If true, attempt to parse legacy INI format as fallback. Default: true */
    allowIniFallback?: boolean;
}

const DEFAULT_PARSE_OPTIONS: Required<ParsePbpOptions> = {
    allowIniFallback: true,
};

/**
 * Parse a PureBasic project file (.pbp).
 *
 * The .pbp format is an XML document with sections like "config", "files", and "targets".
 * All paths inside the project are stored relative to the project file.
 */
export function parsePbpProjectText(content: string, projectFileFsPath: string, options: ParsePbpOptions = {}): PbpProject | null {
    const opt = { ...DEFAULT_PARSE_OPTIONS, ...options };
    const normalized = normalizeNewlines(content);
    const projectDir = path.dirname(projectFileFsPath);

    // Fast path: XML format
    if (/<\?xml\b[\s\S]*?<project\b/i.test(normalized)) {
        return parseXmlProject(normalized, projectFileFsPath, projectDir);
    }

    if (opt.allowIniFallback) {
        return parseIniProject(normalized, projectFileFsPath, projectDir);
    }

    return null;
}

export function selectDefaultTarget(project: PbpProject): PbpTarget | null {
    const explicitDefault = project.targets.find(t => t.enabled && t.isDefault);
    if (explicitDefault) return explicitDefault;
    const firstEnabled = project.targets.find(t => t.enabled);
    return firstEnabled ?? null;
}

export function getProjectSourceFiles(project: PbpProject): string[] {
    return project.files
        .map(f => f.fsPath)
        .filter(p => p.toLowerCase().endsWith('.pb'));
}

export function getProjectIncludeFiles(project: PbpProject): string[] {
    return project.files
        .map(f => f.fsPath)
        .filter(p => p.toLowerCase().endsWith('.pbi'));
}

export function getProjectIncludeDirectories(project: PbpProject): string[] {
    const dirs = new Set<string>();
    dirs.add(project.projectDir);

    for (const inc of getProjectIncludeFiles(project)) {
        dirs.add(path.dirname(inc));
    }

    return Array.from(dirs);
}

/**
 * Parses .pbp project files (XML format)
 */
function parseXmlProject(content: string, projectFileFsPath: string, projectDir: string): PbpProject | null {
    const name = parseProjectName(content);
    const comment = parseProjectComment(content);
    const files = parseProjectFiles(content, projectDir);
    const targets = parseProjectTargets(content, projectDir);

    return {
        projectFile: projectFileFsPath,
        projectDir,
        name,
        comment,
        files,
        targets,
    };
}

function parseProjectName(content: string): string {
    const configSection = extractSection(content, 'config');
    if (!configSection) return '';

    const optTag = configSection.match(/<options\b[^>]*\bname="([^"]*)"[^>]*\/>/i);
    return (optTag?.[1] ?? '').trim();
}

function parseProjectComment(content: string): string {
    const configSection = extractSection(content, 'config');
    if (!configSection) return '';

    const commentTag = configSection.match(/<comment\b[^>]*>([\s\S]*?)<\/comment>/i);
    return decodeXmlEntities((commentTag?.[1] ?? '').trim());
}

function parseProjectFiles(content: string, projectDir: string): PbpFileEntry[] {
    const filesSection = extractSection(content, 'files');
    if (!filesSection) return [];

    const result: PbpFileEntry[] = [];

    // Normal <file name="..."><...></file>
    const fileRe = /<file\b[^>]*\bname="([^"]+)"[^>]*>([\s\S]*?)<\/file>/gi;
    let m: RegExpExecArray | null;
    while ((m = fileRe.exec(filesSection)) !== null) {
        const rawPath = (m[1] ?? '').trim();
        const body = m[2] ?? '';

        const configMatch = body.match(/<config\b([^>]*)\/>/i);
        const cfg = configMatch ? parseBooleanAttributes(configMatch[1] ?? '') : undefined;

        result.push({
            rawPath,
            fsPath: resolveProjectPath(projectDir, rawPath),
            config: cfg,
        });
    }

    // Self-closed <file name="..."/>
    const fileSelfRe = /<file\b[^>]*\bname="([^"]+)"[^>]*\/>/gi;
    while ((m = fileSelfRe.exec(filesSection)) !== null) {
        const rawPath = (m[1] ?? '').trim();
        // Avoid duplicates when both regex hit the same entry (shouldn't happen, but be defensive)
        if (result.some(r => r.rawPath === rawPath)) continue;
        result.push({
            rawPath,
            fsPath: resolveProjectPath(projectDir, rawPath),
        });
    }

    return result;
}

function parseProjectTargets(content: string, projectDir: string): PbpTarget[] {
    const targetsSection = extractSection(content, 'targets');
    if (!targetsSection) return [];

    const result: PbpTarget[] = [];

    const targetRe = /<target\b([^>]*)>([\s\S]*?)<\/target>/gi;
    let m: RegExpExecArray | null;
    while ((m = targetRe.exec(targetsSection)) !== null) {
        const attrs = parseAttributes(m[1] ?? '');
        const body = m[2] ?? '';

        const name = (attrs['name'] ?? '').trim();
        const enabled = parseBool(attrs['enabled']);
        const isDefault = parseBool(attrs['default']);

        const inputRaw = extractValueAttr(body, 'inputfile');
        const outputRaw = extractValueAttr(body, 'outputfile');
        const exeRaw = extractValueAttr(body, 'executable');

        const optMatch = body.match(/<options\b([^>]*)\/>/i);
        const options = optMatch ? parseBooleanAttributes(optMatch[1] ?? '') : {};

        const fmtMatch = body.match(/<format\b([^>]*)\/>/i);
        const format = fmtMatch ? parseAttributes(fmtMatch[1] ?? '') : undefined;

        const iconMatch = body.match(/<icon\b([^>]*)>([\s\S]*?)<\/icon>/i);
        const iconAttrs = iconMatch ? parseAttributes(iconMatch[1] ?? '') : undefined;
        const iconText = iconMatch ? decodeXmlEntities((iconMatch[2] ?? '').trim()) : '';

        const constants = parseTargetConstants(body);

        result.push({
            name,
            enabled,
            isDefault,
            inputFile: {
                rawPath: inputRaw,
                fsPath: resolveProjectPath(projectDir, inputRaw),
            },
            outputFile: {
                rawPath: outputRaw,
                fsPath: resolveProjectPath(projectDir, outputRaw),
            },
            executable: {
                rawPath: exeRaw,
                fsPath: resolveProjectPath(projectDir, exeRaw),
            },
            options,
            format,
            icon: iconText
                ? {
                    enabled: parseBool(iconAttrs?.['enable']),
                    rawPath: iconText,
                    fsPath: resolveProjectPath(projectDir, iconText),
                }
                : undefined,
            constants,
        });
    }

    return result;
}

function parseTargetConstants(targetBody: string): Array<{ enabled: boolean; value: string }> {
    const constantsSectionMatch = targetBody.match(/<constants\b[^>]*>([\s\S]*?)<\/constants>/i);
    if (!constantsSectionMatch) return [];

    const constantsBody = constantsSectionMatch[1] ?? '';
    const result: Array<{ enabled: boolean; value: string }> = [];

    const constRe = /<constant\b([^>]*)\/>/gi;
    let m: RegExpExecArray | null;
    while ((m = constRe.exec(constantsBody)) !== null) {
        const attrs = parseAttributes(m[1] ?? '');
        const enabled = parseBool(attrs['enable']);
        const value = decodeXmlEntities((attrs['value'] ?? '').trim());
        if (value) {
            result.push({ enabled, value });
        }
    }

    return result;
}

function extractValueAttr(targetBody: string, tagName: string): string {
    const re = new RegExp(`<${tagName}\\b[^>]*\\bvalue="([^"]*)"[^>]*\\/>`, 'i');
    const m = targetBody.match(re);
    return decodeXmlEntities((m?.[1] ?? '').trim());
}

function extractSection(content: string, sectionName: string): string | null {
    const re = new RegExp(`<section\\b[^>]*\\bname="${escapeRegExp(sectionName)}"[^>]*>([\\s\\S]*?)<\\/section>`, 'i');
    const m = content.match(re);
    return m ? (m[1] ?? '') : null;
}

function parseIniProject(content: string, projectFileFsPath: string, projectDir: string): PbpProject | null {
    // Minimal fallback for very old projects; keeps behavior compatible with the existing implementation.
    const lines = content.split('\n');
    let currentSection = '';
    let name = '';
    let comment = '';
    const files: PbpFileEntry[] = [];
    const targets: PbpTarget[] = [];

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith(';')) continue;

        if (line.startsWith('[') && line.endsWith(']')) {
            currentSection = line.slice(1, -1);
            continue;
        }

        const eq = line.indexOf('=');
        if (eq < 0) continue;
        const key = line.slice(0, eq).trim();
        const value = line.slice(eq + 1).trim();

        if (currentSection === 'Project') {
            if (key === 'Name') name = value;
            if (key === 'Comment') comment = value;
        }

        if (currentSection === 'Files') {
            // Legacy: Source0=Main.pb
            if (key.toLowerCase().startsWith('source')) {
                files.push({ rawPath: value, fsPath: resolveProjectPath(projectDir, value) });
            }
        }
    }

    // INI projects do not define targets in the legacy format in a consistent way.
    return {
        projectFile: projectFileFsPath,
        projectDir,
        name,
        comment,
        files,
        targets,
    };
}

function normalizeNewlines(content: string): string {
    return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function resolveProjectPath(projectDir: string, rawPath: string): string {
    const p = normalizeRawProjectPath(rawPath);
    if (!p) return '';

    if (isAbsoluteCrossPlatform(p)) {
        return p;
    }

    return path.normalize(path.join(projectDir, p));
}

function normalizeRawProjectPath(rawPath: string): string {
    let p = rawPath.trim();
    if (!p) return '';

    // Strip leading ./ or .\\
    p = p.replace(/^\.\/[\\/]/, '');
    p = p.replace(/^\.\\/, '');

    // Keep the original separator style but normalize for path.join()
    p = p.replace(/[\\/]+/g, path.sep);
    return p;
}

function isAbsoluteCrossPlatform(p: string): boolean {
    // POSIX absolute
    if (p.startsWith('/')) return true;
    // UNC path
    if (p.startsWith('\\\\')) return true;
    // Windows drive path
    if (/^[a-zA-Z]:[\\/]/.test(p)) return true;
    return path.isAbsolute(p);
}

function parseBool(v: string | undefined): boolean {
    if (!v) return false;
    const t = v.trim().toLowerCase();
    return t === '1' || t === 'true' || t === 'yes';
}

function parseAttributes(attrText: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const re = /(\w+)\s*=\s*"([^"]*)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(attrText)) !== null) {
        attrs[m[1]] = decodeXmlEntities(m[2]);
    }
    return attrs;
}

function parseBooleanAttributes(attrText: string): Record<string, boolean> {
    const raw = parseAttributes(attrText);
    const out: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(raw)) {
        out[k] = parseBool(v);
    }
    return out;
}

function decodeXmlEntities(s: string): string {
    // Keep it small and dependency-free; .pbp usually doesn't encode much beyond these.
    return s
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
