import Tesseract from 'tesseract.js';
import type { OcrProgress, OcrResult } from '../types';
import { renderPageToCanvas } from './pdfUtils';

export async function runOcr(
  fileData: ArrayBuffer,
  pageIndices: number[],
  languages: string[],
  onProgress: (progress: OcrProgress) => void,
): Promise<OcrResult[]> {
  const langStr = languages.join('+');
  const results: OcrResult[] = [];
  const total = pageIndices.length;

  const worker = await Tesseract.createWorker(langStr, undefined, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress({
          currentPage: results.length + 1,
          totalPages: total,
          pageProgress: Math.round((m.progress || 0) * 100),
          status: `Recognizing page ${results.length + 1} of ${total}`,
        });
      }
    },
  });

  try {
    for (let i = 0; i < pageIndices.length; i++) {
      onProgress({
        currentPage: i + 1,
        totalPages: total,
        pageProgress: 0,
        status: `Rendering page ${i + 1} of ${total}...`,
      });

      const canvas = await renderPageToCanvas(fileData, pageIndices[i], 2);
      const imageData = canvas.toDataURL('image/png');

      const { data } = await worker.recognize(imageData);
      results.push({
        pageIndex: pageIndices[i],
        text: data.text,
        confidence: data.confidence,
      });
    }
  } finally {
    await worker.terminate();
  }

  return results;
}
