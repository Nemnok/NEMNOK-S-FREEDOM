import { useCallback, useState } from 'react';
import type { ImageFileInfo } from '../types';
import { CONFIG } from '../types';

let imgIdCounter = 0;

export function useImageFiles() {
  const [images, setImages] = useState<ImageFileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addImages = useCallback(async (inputFiles: File[]) => {
    setLoading(true);
    setError(null);
    try {
      const imageFiles = inputFiles.filter((f) =>
        ['image/png', 'image/jpeg', 'image/webp'].includes(f.type),
      );
      if (imageFiles.length === 0) {
        setError('Please select image files (PNG, JPG, WEBP) only.');
        setLoading(false);
        return;
      }

      const newImages: ImageFileInfo[] = [];
      for (const file of imageFiles) {
        if (newImages.length + images.length >= CONFIG.MAX_IMAGES) {
          setError(`Maximum ${CONFIG.MAX_IMAGES} images allowed.`);
          break;
        }
        const dataUrl = await readAsDataUrl(file);
        const dims = await getImageDimensions(dataUrl);
        newImages.push({
          id: `img_${Date.now()}_${++imgIdCounter}`,
          name: file.name,
          size: file.size,
          data: dataUrl,
          width: dims.width,
          height: dims.height,
          file,
        });
      }

      setImages((prev) => [...prev, ...newImages]);
    } finally {
      setLoading(false);
    }
  }, [images.length]);

  const reorderImages = useCallback((newImages: ImageFileInfo[]) => {
    setImages(newImages);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const clearImages = useCallback(() => {
    setImages([]);
    setError(null);
  }, []);

  return { images, loading, error, addImages, reorderImages, removeImage, clearImages, setError };
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve({ width: 100, height: 100 });
    img.src = dataUrl;
  });
}
