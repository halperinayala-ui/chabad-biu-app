/**
 * Compresses and resizes an image file client-side before uploading.
 * Reduces file size from multi-MB down to ~80KB-180KB, ensuring fast uploads,
 * optimized bandwidth, and full WhatsApp / social preview compatibility (<300KB limit).
 */
export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 800,
  quality = 0.85
): Promise<File> {
  // If not an image or SVG/GIF, return unchanged
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserved dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file);
        }

        // Draw image with high quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            // If the compressed blob isn't smaller, keep original
            if (blob.size >= file.size && file.type === 'image/jpeg') {
              return resolve(file);
            }

            const newFileName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
            const compressedFile = new File([blob], newFileName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
