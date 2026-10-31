/**
 * Utility to safely scale and compress high-resolution mobile photos
 * with EXIF orientation auto-correction.
 * Prevents "Devido à insuficiência de memória, não foi possível concluir a operação anterior" (Out Of Memory / LMK)
 * in mobile browsers like Android Chrome and iOS Safari, while keeping orientation upright.
 */

export async function compressImageIfNeeded(file: File, maxDimension = 1920, quality = 0.85): Promise<File> {
  // If not an image or animated/vector format, return as is
  if (!file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
    return file;
  }

  // 1. Prefer modern createImageBitmap with imageOrientation: 'from-image'
  // This automatically reads EXIF orientation tags from smartphone cameras and rotates pixels upright.
  if (typeof createImageBitmap !== 'undefined') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      let width = bitmap.width;
      let height = bitmap.height;

      // If dimensions are within limit and file isn't huge, return original
      if (width <= maxDimension && height <= maxDimension && file.size < 1.5 * 1024 * 1024) {
        bitmap.close();
        return file;
      }

      // Calculate aspect-ratio preserved scaling
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        bitmap.close();
        return file;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();

      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', quality));
      if (!blob || blob.size >= file.size) {
        return file;
      }

      return new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
    } catch (e) {
      console.warn('[ImageCompressor] createImageBitmap error, falling back to Image:', e);
    }
  }

  // 2. Fallback for older browsers
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);
        
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width <= maxDimension && height <= maxDimension && file.size < 1.5 * 1024 * 1024) {
          resolve(file);
          return;
        }

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              resolve(file);
            } else {
              const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(newFile);
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };

      img.src = url;
    } catch (e) {
      console.warn('[ImageCompressor] Fallback to original image:', e);
      resolve(file);
    }
  });
}

/**
 * Format bytes to readable string (e.g. 1.2 MB, 450 KB)
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
