export interface StatusBarCurrentImageEditCandidate {
  inline?: boolean;
  source?: { line: number };
}

export interface StatusBarCurrentImageEditState {
  canDirectEdit: boolean;
  reason?: string;
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
