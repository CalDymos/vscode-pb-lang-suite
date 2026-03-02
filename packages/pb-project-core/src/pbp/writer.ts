/*
 * @caldymos/pb-project-core
 *
 * PureBasic Project (.pbp) XML writer.
 *
 * This module focuses on reliable and consistent output.
 * Generated files are structured in a stable way and can be
 * parsed again using parsePbpProjectText.
 *
 * The implementation is dependency-free.
 */

import type {
    PbpData,
    PbpFileEntry,
    PbpProject,
    PbpTarget,
} from './model';

export interface WritePbpOptions {
    /** Line break used in the output (default: "\n"). */
    newline?: '\n' | '\r\n';
    /** Indentation used per nesting level (default: two spaces). */
    indent?: string;
    /** If false, omits the XML declaration header (default: true). */
    includeXmlDeclaration?: boolean;
}

/**
 * Serialize a parsed/edited .pbp project back into XML.
 *
 * The output is intentionally minimal and focuses on the sections currently
 * modeled by this library: config, data, files, targets, libraries.
 */
export function writePbpProjectText(
    project: Pick<PbpProject, 'config' | 'data' | 'files' | 'targets' | 'libraries'>,
    options: WritePbpOptions = {}
): string {
    const newline = options.newline ?? '\n';
    const indent = options.indent ?? '  ';
    const includeXmlDeclaration = options.includeXmlDeclaration !== false;

    const lines: string[] = [];
    if (includeXmlDeclaration) {
        lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    }

    lines.push('<project>');
    writeConfigSection(lines, indent, project.config);
    writeDataSection(lines, indent, project.data);
    writeFilesSection(lines, indent, project.files ?? []);
    writeTargetsSection(lines, indent, project.targets ?? []);
    writeLibrariesSection(lines, indent, project.libraries ?? []);
    lines.push('</project>');

    return lines.join(newline) + newline;
}

// --------------------------------------------------------------------------------------
// Sections
// --------------------------------------------------------------------------------------

function writeConfigSection(lines: string[], indent: string, cfg: PbpProject['config']): void {
    lines.push(`${indent}<section name="config">`);

    const optionAttrs: Array<[string, string]> = [
        ['name', cfg?.name ?? ''],
        ['closefiles', bool01(cfg?.closefiles)],
        ['openmode', bool01(!!(cfg && (cfg.openmode ?? 0) !== 0))],
    ];
    lines.push(`${indent}${indent}<options${renderAttrs(optionAttrs)}/>`);

    const comment = cfg?.comment ?? '';
    lines.push(`${indent}${indent}<comment>${escapeXmlText(comment)}</comment>`);
    lines.push(`${indent}</section>`);
}

function writeDataSection(lines: string[], indent: string, data: PbpData | undefined): void {
    lines.push(`${indent}<section name="data">`);

    const d = data ?? {};
    if (d.explorer) {
        const attrs: Array<[string, string]> = [];
        if (d.explorer.view !== undefined) attrs.push(['view', d.explorer.view]);
        if (d.explorer.pattern !== undefined) attrs.push(['pattern', String(d.explorer.pattern)]);
        lines.push(`${indent}${indent}<explorer${renderAttrs(attrs)}/>`);
    }

    if (d.log) {
        const attrs: Array<[string, string]> = [];
        if (d.log.show !== undefined) attrs.push(['show', bool01(d.log.show)]);
        lines.push(`${indent}${indent}<log${renderAttrs(attrs)}/>`);
    }

    if (d.lastopen) {
        const attrs: Array<[string, string]> = [];
        if (d.lastopen.date !== undefined) attrs.push(['date', d.lastopen.date]);
        if (d.lastopen.user !== undefined) attrs.push(['user', d.lastopen.user]);
        if (d.lastopen.host !== undefined) attrs.push(['host', d.lastopen.host]);
        lines.push(`${indent}${indent}<lastopen${renderAttrs(attrs)}/>`);
    }

    lines.push(`${indent}</section>`);
}

function writeFilesSection(lines: string[], indent: string, files: PbpFileEntry[]): void {
    lines.push(`${indent}<section name="files">`);

    for (const f of files) {
        const rawPath = f?.rawPath ?? '';
        const fileNameAttr = escapeXmlAttr(rawPath);

        const cfg = f?.config;
        const cfgKeys = cfg ? Object.keys(cfg).filter(k => (cfg as any)[k] !== undefined) : [];
        if (!cfg || cfgKeys.length === 0) {
            lines.push(`${indent}${indent}<file name="${fileNameAttr}"/>`);
            continue;
        }

        lines.push(`${indent}${indent}<file name="${fileNameAttr}">`);
        lines.push(`${indent}${indent}${indent}<config${renderBooleanAttrs(cfg as Record<string, boolean>)}/>`);
        lines.push(`${indent}${indent}</file>`);
    }

    lines.push(`${indent}</section>`);
}

function writeTargetsSection(lines: string[], indent: string, targets: PbpTarget[]): void {
    lines.push(`${indent}<section name="targets">`);

    for (const t of targets) {
        writeTarget(lines, indent, t);
    }

    lines.push(`${indent}</section>`);
}

function writeTarget(lines: string[], indent: string, t: PbpTarget): void {
    const tAttrs: Array<[string, string]> = [
        ['name', t?.name ?? ''],
        ['enabled', bool01(!!t?.enabled)],
        ['default', bool01(!!t?.isDefault)],
        ['directory', t?.directory ?? ''],
    ];

    lines.push(`${indent}${indent}<target${renderAttrs(tAttrs)}>`);

    const inner = `${indent}${indent}${indent}`;
    lines.push(`${inner}<inputfile${renderAttrs([['value', t?.inputFile?.rawPath ?? '']])}/>`);
    lines.push(`${inner}<outputfile${renderAttrs([['value', t?.outputFile?.rawPath ?? '']])}/>`);
    lines.push(`${inner}<executable${renderAttrs([['value', t?.executable?.rawPath ?? '']])}/>`);

    if (t.compilerVersion) {
        lines.push(`${inner}<compiler${renderAttrs([['version', t.compilerVersion]])}/>`);
    }
    if (t.commandLine) {
        lines.push(`${inner}<commandline${renderAttrs([['value', t.commandLine]])}/>`);
    }
    if (t.subsystem) {
        lines.push(`${inner}<subsystem${renderAttrs([['value', t.subsystem]])}/>`);
    }
    if (t.purifier) {
        const attrs: Array<[string, string]> = [['enable', bool01(!!t.purifier.enabled)]];
        if (t.purifier.granularity) attrs.push(['granularity', t.purifier.granularity]);
        lines.push(`${inner}<purifier${renderAttrs(attrs)}/>`);
    }

    if (t.options && Object.keys(t.options).length > 0) {
        lines.push(`${inner}<options${renderBooleanAttrs(t.options)}/>`);
    }

    if (t.format && Object.keys(t.format).length > 0) {
        const attrs: Array<[string, string]> = sortKeyedAttrs(t.format);
        lines.push(`${inner}<format${renderAttrs(attrs)}/>`);
    }

    if (t.icon && t.icon.rawPath) {
        const attrs: Array<[string, string]> = [['enable', bool01(!!t.icon.enabled)]];
        lines.push(`${inner}<icon${renderAttrs(attrs)}>${escapeXmlText(t.icon.rawPath)}</icon>`);
    }

    if (t.constants && t.constants.length > 0) {
        lines.push(`${inner}<constants>`);
        for (const c of t.constants) {
            const cAttrs: Array<[string, string]> = [
                ['enable', bool01(!!c.enabled)],
                ['value', c.value ?? ''],
            ];
            lines.push(`${inner}${indent}<constant${renderAttrs(cAttrs)}/>`);
        }
        lines.push(`${inner}</constants>`);
    }

    lines.push(`${indent}${indent}</target>`);
}

function writeLibrariesSection(lines: string[], indent: string, libs: string[]): void {
    lines.push(`${indent}<section name="libraries">`);

    for (const lib of stableUnique(libs)) {
        lines.push(`${indent}${indent}<library${renderAttrs([['value', lib]])}/>`);
    }

    lines.push(`${indent}</section>`);
}

// --------------------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------------------

function bool01(v: boolean | undefined): string {
    return v ? '1' : '0';
}

function stableUnique(values: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const v of values) {
        const s = (v ?? '').trim();
        if (!s) continue;
        if (seen.has(s)) continue;
        seen.add(s);
        out.push(s);
    }
    return out;
}

function escapeXmlText(text: string): string {
    // Keep in sync with the decoder in parser.ts (decodeXmlEntities)
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function escapeXmlAttr(text: string): string {
    return escapeXmlText(text);
}

function renderAttrs(attrs: Array<[string, string]>): string {
    let out = '';
    for (const [k, v] of attrs) {
        // Always include the attribute (even if empty) to preserve semantics where possible.
        out += ` ${k}="${escapeXmlAttr(v ?? '')}"`;
    }
    return out;
}

function renderBooleanAttrs(obj: Record<string, boolean>): string {
    const fixedOrder = ['load', 'scan', 'panel', 'warn', 'enable', 'enabled', 'default', 'show'];
    const keys = Object.keys(obj)
        .filter(k => (obj as any)[k] !== undefined)
        .sort((a, b) => compareStableKeys(a, b, fixedOrder));

    let out = '';
    for (const k of keys) {
        out += ` ${k}="${bool01(!!obj[k])}"`;
    }
    return out;
}

function sortKeyedAttrs(obj: Record<string, string>): Array<[string, string]> {
    const keys = Object.keys(obj).sort(compareAscii);
    return keys.map(k => [k, obj[k] ?? '']);
}

function compareAscii(a: string, b: string): number {
    if (a === b) return 0;
    return a < b ? -1 : 1;
}

function compareStableKeys(a: string, b: string, fixedOrder: string[]): number {
    const ai = fixedOrder.indexOf(a);
    const bi = fixedOrder.indexOf(b);
    if (ai >= 0 || bi >= 0) {
        if (ai < 0) return 1;
        if (bi < 0) return -1;
        if (ai !== bi) return ai - bi;
        return 0;
    }
    return compareAscii(a, b);
}