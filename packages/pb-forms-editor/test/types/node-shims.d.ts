declare module "node:test" {
  const test: any;
  export = test;
}

declare module "node:assert/strict" {
  const assert: any;
  export = assert;
}

declare module "node:fs" {
  export interface Dirent {
    name: string;
    isDirectory(): boolean;
    isFile(): boolean;
  }

  type OpenHandle = {
    read(buffer: Uint8Array, offset?: number, length?: number, position?: number): Promise<{ bytesRead: number }>;
    close(): Promise<void>;
  };

  const fs: {
    promises: {
      open(path: string, flags: string): Promise<OpenHandle>;
    };
    readdirSync(path: string, options?: unknown): Dirent[];
    existsSync(path: string): boolean;
    readFileSync(path: string, encoding?: string): string;
    mkdtempSync(prefix: string): string;
    mkdirSync(path: string, options?: unknown): void;
    writeFileSync(path: string, data: string, encoding?: string): void;
    rmSync(path: string, options?: unknown): void;
  };

  export = fs;
}

declare module "node:path" {
  const path: {
    join(...paths: string[]): string;
    dirname(path: string): string;
    extname(path: string): string;
    isAbsolute(path: string): boolean;
    normalize(path: string): string;
    resolve(...paths: string[]): string;
  };

  export = path;
}

declare module "node:os" {
  const os: {
    tmpdir(): string;
  };

  export = os;
}

declare class Buffer extends Uint8Array {
  static allocUnsafe(size: number): Buffer;
  static from(data: Uint8Array): Buffer;
  static concat(list: readonly Uint8Array[]): Buffer;
}

declare const Buffer: typeof Buffer;

declare const process: {
  cwd(): string;
};
