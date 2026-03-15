import fs from "node:fs";

export interface ImageDimensions {
  width: number;
  height: number;
}

function readUInt16BE(data: Uint8Array, offset: number): number {
  return (data[offset] << 8) | data[offset + 1];
}

function readUInt16LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8);
}

function readUInt32BE(data: Uint8Array, offset: number): number {
  return ((data[offset] << 24) >>> 0) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
}

function readUInt32LE(data: Uint8Array, offset: number): number {
  return (data[offset]) | (data[offset + 1] << 8) | (data[offset + 2] << 16) | ((data[offset + 3] << 24) >>> 0);
}

function isPng(data: Uint8Array): boolean {
  return data.length >= 24
    && data[0] === 0x89
    && data[1] === 0x50
    && data[2] === 0x4e
    && data[3] === 0x47
    && data[4] === 0x0d
    && data[5] === 0x0a
    && data[6] === 0x1a
    && data[7] === 0x0a;
}

function isGif(data: Uint8Array): boolean {
  return data.length >= 10
    && data[0] === 0x47
    && data[1] === 0x49
    && data[2] === 0x46
    && data[3] === 0x38
    && (data[4] === 0x37 || data[4] === 0x39)
    && data[5] === 0x61;
}

function isBmp(data: Uint8Array): boolean {
  return data.length >= 26
    && data[0] === 0x42
    && data[1] === 0x4d;
}

function isJpeg(data: Uint8Array): boolean {
  return data.length >= 4
    && data[0] === 0xff
    && data[1] === 0xd8;
}

export function detectImageDimensions(data: Uint8Array): ImageDimensions | undefined {
  if (isPng(data)) {
    const width = readUInt32BE(data, 16);
    const height = readUInt32BE(data, 20);
    if (width > 0 && height > 0) {
      return { width, height };
    }
    return undefined;
  }

  if (isGif(data)) {
    const width = readUInt16LE(data, 6);
    const height = readUInt16LE(data, 8);
    if (width > 0 && height > 0) {
      return { width, height };
    }
    return undefined;
  }

  if (isBmp(data)) {
    const dibSize = readUInt32LE(data, 14);
    if (dibSize >= 12 && data.length >= 26) {
      let width = 0;
      let height = 0;

      if (dibSize === 12) {
        width = readUInt16LE(data, 18);
        height = readUInt16LE(data, 20);
      } else if (data.length >= 26) {
        width = readUInt32LE(data, 18);
        height = Math.abs(readUInt32LE(data, 22) | 0);
      }

      if (width > 0 && height > 0) {
        return { width, height };
      }
    }
    return undefined;
  }

  if (isJpeg(data)) {
    let offset = 2;

    while (offset + 9 < data.length) {
      if (data[offset] !== 0xff) {
        offset += 1;
        continue;
      }

      let markerOffset = offset + 1;
      while (markerOffset < data.length && data[markerOffset] === 0xff) {
        markerOffset += 1;
      }
      if (markerOffset >= data.length) return undefined;

      const marker = data[markerOffset];
      offset = markerOffset + 1;

      if (marker === 0xd8 || marker === 0xd9 || marker === 0x01) {
        continue;
      }

      if (offset + 1 >= data.length) return undefined;
      const segmentLength = readUInt16BE(data, offset);
      if (segmentLength < 2) return undefined;

      const isSof =
        marker >= 0xc0
        && marker <= 0xcf
        && marker !== 0xc4
        && marker !== 0xc8
        && marker !== 0xcc;

      if (isSof) {
        if (offset + 7 >= data.length) return undefined;
        const height = readUInt16BE(data, offset + 3);
        const width = readUInt16BE(data, offset + 5);
        if (width > 0 && height > 0) {
          return { width, height };
        }
        return undefined;
      }

      offset += segmentLength;
    }
  }

  return undefined;
}

export async function readImageDimensions(filePath: string): Promise<ImageDimensions | undefined> {
  const data = await fs.promises.readFile(filePath);
  return detectImageDimensions(data);
}
