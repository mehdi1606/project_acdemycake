/**
 * Profile photo preparation, in the browser.
 *
 * The server accepts JPEG, PNG or WebP up to 1 MB (1,048,576 bytes). So that
 * members are almost never blocked, a photo that is too heavy (over 1 MB), too
 * big (over 1024 px) or in another image format is redrawn on a canvas at most
 * 800 x 800 (aspect kept) and saved as JPEG around quality 0.86, stepping the
 * quality (then the size) down until it fits under 1 MB.
 */

export const AVATAR_MAX_BYTES = 1024 * 1024;
const RESIZE_TRIGGER_PX = 1024;
const TARGET_PX = 800;
const QUALITIES = [0.86, 0.8, 0.72, 0.64, 0.55];
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** i18n keys under avatarRequired.errors */
export type AvatarErrorKey = 'required' | 'tooLarge' | 'notImage' | 'unreadable' | 'uploadFailed';

export class AvatarPrepareError extends Error {
  constructor(public readonly key: AvatarErrorKey) {
    super(key);
    this.name = 'AvatarPrepareError';
  }
}

/** Backend error codes (ApiResponse.errorCode) → the translated message key. */
export function avatarErrorKeyFromCode(code: string | null | undefined): AvatarErrorKey | null {
  switch (code) {
    case 'AVATAR_001': return 'required';
    case 'AVATAR_002': return 'tooLarge';
    case 'AVATAR_003': return 'notImage';
    default: return null;
  }
}

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif|tiff?)$/i;

function looksLikeImage(file: File): boolean {
  if (file.type) return file.type.startsWith('image/');
  return IMAGE_EXT.test(file.name || '');
}

interface Decoded {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}

async function decode(file: Blob): Promise<Decoded> {
  if (typeof createImageBitmap === 'function') {
    try {
      // Current browsers apply the photo's EXIF orientation by default.
      const bmp = await createImageBitmap(file);
      return { source: bmp, width: bmp.width, height: bmp.height, release: () => bmp.close() };
    } catch {
      /* fall back to <img> below */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('decode'));
      el.src = url;
    });
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch {
    URL.revokeObjectURL(url);
    throw new AvatarPrepareError('unreadable');
  }
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', quality));
}

/**
 * Returns a file ready to upload (JPEG/PNG/WebP, 1 MB or less), or throws an
 * AvatarPrepareError whose key names the message to show.
 */
export async function prepareAvatar(file: File): Promise<File> {
  if (!file || !looksLikeImage(file)) throw new AvatarPrepareError('notImage');

  const decoded = await decode(file);
  try {
    const { width, height } = decoded;
    if (!width || !height) throw new AvatarPrepareError('unreadable');

    const acceptedAsIs =
      ACCEPTED_TYPES.includes(file.type) &&
      file.size <= AVATAR_MAX_BYTES &&
      Math.max(width, height) <= RESIZE_TRIGGER_PX;
    if (acceptedAsIs) return file;

    let scale = Math.min(1, TARGET_PX / Math.max(width, height));
    for (let attempt = 0; attempt < 4; attempt++) {
      const w = Math.max(1, Math.round(width * scale));
      const h = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new AvatarPrepareError('unreadable');
      ctx.fillStyle = '#ffffff'; // JPEG has no transparency
      ctx.fillRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(decoded.source, 0, 0, w, h);

      for (const q of QUALITIES) {
        const blob = await toBlob(canvas, q);
        if (blob && blob.size > 0 && blob.size <= AVATAR_MAX_BYTES) {
          const base = (file.name || 'avatar').replace(/\.[^.]+$/, '') || 'avatar';
          return new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
        }
      }
      scale *= 0.75;
    }
    throw new AvatarPrepareError('tooLarge');
  } finally {
    decoded.release();
  }
}
