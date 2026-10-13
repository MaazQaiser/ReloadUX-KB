/** Image types the library accepts, identified by their first bytes, never by file name or browser claims. */
export const IMAGE_TYPES = {
  png: { mime: "image/png", extension: "png" },
  jpeg: { mime: "image/jpeg", extension: "jpg" },
  webp: { mime: "image/webp", extension: "webp" },
} as const;

export type ImageKind = keyof typeof IMAGE_TYPES;

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((byte, index) => bytes[offset + index] === byte);

export function detectImageKind(bytes: Uint8Array): ImageKind | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
  // RIFF....WEBP
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return "webp";
  return null;
}

export function mimeForKey(key: string): string | null {
  const extension = key.split(".").pop()?.toLowerCase();
  const match = Object.values(IMAGE_TYPES).find((type) => type.extension === extension);
  return match?.mime ?? null;
}
