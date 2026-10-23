/**
 * Utility to safely scale and compress high-resolution mobile photos
 * Prevents "Devido à insuficiência de memória, não foi possível concluir a operação anterior" (Out Of Memory / LMK)
 * in mobile browsers like Android Chrome and iOS Safari.
 */

export async function compressImageIfNeeded(file: File, maxDimension = 1920, quality = 0.85): Promise<File> {
  // If not an image or animated/vector format, return as is
  if (!file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
    return file;
  }

  // If already under 1MB and not an ultra-high resolution image, return as is
  if (file.size < 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);
        
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // If dimensions are within limit and file isn't huge, return original
        if (width <= maxDimension && height <= maxDimension && file.size < 2 * 1024 * 1024) {
          resolve(file);
          return;
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
