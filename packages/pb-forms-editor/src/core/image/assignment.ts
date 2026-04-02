import { PB_ANY } from "../model";
import { normalizePbPath, parsePbStringLiteral } from "./path";

export interface ParsedImageEntryLike {
  id?: string;
  variable?: string;
  firstParam?: string;
  inline?: boolean;
  image?: string;
  imageRaw?: string;
}

export function resolveExistingLoadImageByFilePath(
  images: readonly ParsedImageEntryLike[] | undefined,
  filePath: string
): ParsedImageEntryLike | undefined {
  const normalizedTarget = normalizePbPath(filePath).trim();
  if (!normalizedTarget.length) return undefined;

  for (const image of images ?? []) {
    if (image.inline) continue;
    const candidate = (image.image?.trim().length ? image.image : parsePbStringLiteral(image.imageRaw))?.trim();
    if (!candidate?.length) continue;
    if (normalizePbPath(candidate) === normalizedTarget) {
      return image;
    }
  }

  return undefined;
}

export function buildImageReferenceFromEntry(image: ParsedImageEntryLike | undefined): string | undefined {
  if (!image) return undefined;

  const directId = image.id?.trim();
  if (directId?.length) {
    return `ImageID(${directId})`;
  }

  const variableName = image.variable?.trim();
  if (variableName?.length) {
    return `ImageID(${variableName})`;
  }

  const firstParam = image.firstParam?.trim();
  if (firstParam?.length && firstParam !== PB_ANY) {
    return `ImageID(${firstParam})`;
  }

  return undefined;
}
