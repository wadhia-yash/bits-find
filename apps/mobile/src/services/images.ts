/**
 * Item photo handling.
 *
 * Firebase Storage needs a paid plan on projects created after October 2024, so
 * the app can't rely on it. Instead a photo is downscaled to a thumbnail and
 * stored as a data URI on the item document itself, which costs nothing and
 * still travels between devices.
 *
 * A Firestore document is capped at 1 MiB, so the encoder steps the quality
 * down until the encoded string is comfortably under budget, and gives up
 * rather than writing a document that would be rejected.
 */

import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/** Well under Firestore's 1 MiB document ceiling, leaving room for the text fields. */
const MAX_ENCODED_BYTES = 320 * 1024;

const MAX_WIDTH = 620;
const QUALITY_STEPS = [0.5, 0.35, 0.2];

export interface Thumbnail {
  /** `data:image/jpeg;base64,…` — renderable directly by <Image>. */
  dataUri: string;
  bytes: number;
}

/**
 * Resizes and compresses a picked image. Returns null when even the most
 * aggressive setting stays too large — the caller then publishes without a photo
 * rather than failing the whole request.
 */
export async function makeThumbnail(localUri: string): Promise<Thumbnail | null> {
  for (const compress of QUALITY_STEPS) {
    try {
      const context = ImageManipulator.manipulate(localUri).resize({ width: MAX_WIDTH });
      const image = await context.renderAsync();
      const saved = await image.saveAsync({
        compress,
        format: SaveFormat.JPEG,
        base64: true,
      });

      if (!saved.base64) continue;

      // 4 base64 chars encode 3 bytes; padding makes this an upper bound.
      const bytes = Math.ceil((saved.base64.length * 3) / 4);
      if (bytes <= MAX_ENCODED_BYTES) {
        return { dataUri: `data:image/jpeg;base64,${saved.base64}`, bytes };
      }
    } catch {
      // Try the next, more aggressive step.
    }
  }
  return null;
}

export function isDataUri(value: string | undefined): boolean {
  return !!value && value.startsWith('data:');
}
