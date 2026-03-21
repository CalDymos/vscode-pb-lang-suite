export interface StatusBarCurrentImageEditCandidate {
  id?: string;
  imageRaw?: string;
  image?: string;
  inline?: boolean;
  source?: { line: number };
}

export interface StatusBarCurrentImageEditState {
  canDirectEdit: boolean;
  reason?: string;
}

export interface StatusBarCurrentImageRebindCandidate {
  id: string;
  imageRaw: string;
  image?: string;
  inline?: boolean;
  source?: { line: number };
}

export interface StatusBarCurrentImageRebindResolution {
  matchedImage?: StatusBarCurrentImageRebindCandidate;
  reason?: string;
}

function normalizeCurrentImageInput(raw: string, inline: boolean): string {
  const trimmed = raw.trim();
  if (!trimmed.length) return "";

  if (inline) {
    return trimmed.replace(/^\?+/, "").trim();
  }

  const quoted = /^"([\s\S]*)"$/.exec(trimmed);
  return quoted?.[1] ?? trimmed;
}

export function getStatusBarCurrentImageEditState(
  image: StatusBarCurrentImageEditCandidate | undefined,
  usageCount: number
): StatusBarCurrentImageEditState {
  if (!image) {
    return {
      canDirectEdit: false,
      reason: "This field has no parsed image entry. Use the image actions to assign one first."
    };
  }

  if (image.inline) {
    return {
      canDirectEdit: false,
      reason: "CurrentImage stays readonly for CatchImage entries. Use the image actions to rebind the field instead."
    };
  }

  if (typeof image.source?.line !== "number") {
    return {
      canDirectEdit: false,
      reason: "CurrentImage can only patch parsed LoadImage entries with a source line."
    };
  }

  if (usageCount > 1) {
    return {
      canDirectEdit: false,
      reason: "CurrentImage stays readonly while the referenced image is shared. Use the image actions to rebind only this field."
    };
  }

  return {
    canDirectEdit: true,
    reason: "Patch the referenced LoadImage path directly for this statusbar field."
  };
}

export function resolveStatusBarCurrentImageRebind(
  images: StatusBarCurrentImageRebindCandidate[],
  nextValue: string,
  currentImageId?: string
): StatusBarCurrentImageRebindResolution {
  const trimmed = nextValue.trim();
  if (!trimmed.length) {
    return {
      reason: "CurrentImage rebind requires a non-empty value."
    };
  }

  const matches = images.filter((candidate) => {
    const normalizedImage = normalizeCurrentImageInput(candidate.image ?? candidate.imageRaw, Boolean(candidate.inline));
    const normalizedRaw = normalizeCurrentImageInput(candidate.imageRaw, Boolean(candidate.inline));
    const normalizedInput = normalizeCurrentImageInput(trimmed, Boolean(candidate.inline));
    return normalizedInput === normalizedImage || normalizedInput === normalizedRaw;
  });

  if (!matches.length) {
    return {
      reason: "CurrentImage can only rebind to an existing parsed image entry here. Use Choose File or Create New for a new image path."
    };
  }

  const distinctIds = new Set(matches.map((candidate) => candidate.id));
  if (distinctIds.size > 1) {
    return {
      reason: "CurrentImage matches multiple parsed image entries. Use Use Existing to pick the intended target explicitly."
    };
  }

  const matchedImage = matches[0];
  if (matchedImage.id === currentImageId) {
    return {
      matchedImage,
      reason: "CurrentImage already points to this parsed image entry."
    };
  }

  return { matchedImage };
}

export function shouldCleanupStatusBarReboundImage(
  oldImageId: string | undefined,
  oldUsageCount: number,
  oldSourceLine: number | undefined,
  nextImageId: string | undefined,
): boolean {
  if (!oldImageId || !nextImageId) return false;
  if (oldImageId === nextImageId) return false;
  if (oldUsageCount !== 1) return false;
  return typeof oldSourceLine === "number";
}
