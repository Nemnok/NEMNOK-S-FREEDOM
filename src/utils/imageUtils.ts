import { PDFDocument } from 'pdf-lib';
import type { ImageFileInfo, ImageToPdfSettings } from '../types';

const PAGE_SIZES = {
  A4: { width: 595.28, height: 841.89 },
  Letter: { width: 612, height: 792 },
};

export async function imagesToPdf(
  images: ImageFileInfo[],
  settings: ImageToPdfSettings,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const img of images) {
    const response = await fetch(img.data);
    const arrayBuf = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuf);

    let embedded;
    const lower = img.name.toLowerCase();
    if (lower.endsWith('.png')) {
      embedded = await pdfDoc.embedPng(bytes);
    } else {
      embedded = await pdfDoc.embedJpg(bytes);
    }

    const imgWidth = embedded.width;
    const imgHeight = embedded.height;

    let pageW: number;
    let pageH: number;

    if (settings.pageSize === 'fit-image') {
      pageW = imgWidth;
      pageH = imgHeight;
    } else {
      const size = PAGE_SIZES[settings.pageSize];
      pageW = size.width;
      pageH = size.height;
    }

    if (settings.orientation === 'landscape' || (settings.orientation === 'auto' && imgWidth > imgHeight)) {
      [pageW, pageH] = [Math.max(pageW, pageH), Math.min(pageW, pageH)];
    } else if (settings.orientation === 'portrait') {
      [pageW, pageH] = [Math.min(pageW, pageH), Math.max(pageW, pageH)];
    }

    let margin = 0;
    if (settings.marginType === 'small') margin = 20;
    else if (settings.marginType === 'custom') margin = settings.customMargin;

    const drawW = pageW - margin * 2;
    const drawH = pageH - margin * 2;

    const scale = Math.min(drawW / imgWidth, drawH / imgHeight);
    const finalW = imgWidth * scale;
    const finalH = imgHeight * scale;

    const page = pdfDoc.addPage([pageW, pageH]);
    page.drawImage(embedded, {
      x: margin + (drawW - finalW) / 2,
      y: margin + (drawH - finalH) / 2,
      width: finalW,
      height: finalH,
    });
  }

  return pdfDoc.save();
}
