import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { CONFIG, type PDFFileInfo, type PDFPageInfo } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = import.meta.env.BASE_URL + 'pdf.worker.min.js';

let idCounter = 0;
function uid(): string {
  return `p_${Date.now()}_${++idCounter}`;
}

export async function loadPdfFile(file: File): Promise<PDFFileInfo> {
  if (file.size > CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`File "${file.name}" exceeds ${CONFIG.MAX_FILE_SIZE_MB}MB limit.`);
  }

  const buffer = await file.arrayBuffer();
  const fileId = uid();

  let pdfDoc: PDFDocumentProxy;
  try {
    pdfDoc = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('password')) {
      throw new Error(`File "${file.name}" is password-protected. Please remove the password first.`);
    }
    throw new Error(`Failed to load "${file.name}": ${msg}`);
  }

  try {
    if (pdfDoc.numPages > CONFIG.MAX_PAGES) {
      throw new Error(`File "${file.name}" has ${pdfDoc.numPages} pages (max ${CONFIG.MAX_PAGES}).`);
    }

    const pages: PDFPageInfo[] = [];

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: CONFIG.THUMBNAIL_SCALE });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;

      pages.push({
        pageIndex: i - 1,
        fileId,
        fileName: file.name,
        thumbnail: canvas.toDataURL('image/jpeg', 0.7),
        width: viewport.width,
        height: viewport.height,
        selected: false,
        id: uid(),
      });
    }

    return {
      id: fileId,
      name: file.name,
      size: file.size,
      data: buffer,
      pageCount: pdfDoc.numPages,
      pages,
    };
  } finally {
    pdfDoc.destroy();
  }
}

export async function renderPagePreview(
  data: ArrayBuffer,
  pageIndex: number,
  scale: number = CONFIG.PREVIEW_SCALE,
): Promise<string> {
  const pdfDoc = await pdfjsLib.getDocument({ data: data.slice(0) }).promise;
  try {
    const page = await pdfDoc.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    return canvas.toDataURL('image/png');
  } finally {
    pdfDoc.destroy();
  }
}

export async function renderPageToCanvas(
  data: ArrayBuffer,
  pageIndex: number,
  scale: number = 2,
): Promise<HTMLCanvasElement> {
  const pdfDoc = await pdfjsLib.getDocument({ data: data.slice(0) }).promise;
  try {
    const page = await pdfDoc.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    return canvas;
  } finally {
    pdfDoc.destroy();
  }
}

export async function mergePdfPages(
  files: PDFFileInfo[],
  orderedPages: PDFPageInfo[],
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  const fileMap = new Map(files.map((f) => [f.id, f]));

  for (const p of orderedPages) {
    const file = fileMap.get(p.fileId);
    if (!file) continue;
    const srcDoc = await PDFDocument.load(file.data);
    const [copied] = await mergedPdf.copyPages(srcDoc, [p.pageIndex]);
    mergedPdf.addPage(copied);
  }

  return mergedPdf.save();
}

export async function extractPages(
  fileData: ArrayBuffer,
  pageIndices: number[],
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(fileData);
  const newDoc = await PDFDocument.create();
  const copied = await newDoc.copyPages(srcDoc, pageIndices);
  copied.forEach((p) => newDoc.addPage(p));
  return newDoc.save();
}

export async function deletePages(
  fileData: ArrayBuffer,
  pageIndicesToDelete: number[],
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(fileData);
  const totalPages = srcDoc.getPageCount();
  const keep = [];
  for (let i = 0; i < totalPages; i++) {
    if (!pageIndicesToDelete.includes(i)) keep.push(i);
  }
  if (keep.length === 0) throw new Error('Cannot delete all pages.');
  return extractPages(fileData, keep);
}

export async function splitByRanges(
  fileData: ArrayBuffer,
  ranges: { from: number; to: number }[],
): Promise<{ name: string; data: Uint8Array }[]> {
  const results: { name: string; data: Uint8Array }[] = [];
  for (let i = 0; i < ranges.length; i++) {
    const { from, to } = ranges[i];
    const indices = [];
    for (let p = from; p <= to; p++) indices.push(p);
    const data = await extractPages(fileData, indices);
    results.push({ name: `pages_${from + 1}-${to + 1}.pdf`, data });
  }
  return results;
}

export async function splitEachPage(
  fileData: ArrayBuffer,
  totalPages: number,
): Promise<{ name: string; data: Uint8Array }[]> {
  const results: { name: string; data: Uint8Array }[] = [];
  for (let i = 0; i < totalPages; i++) {
    const data = await extractPages(fileData, [i]);
    results.push({ name: `page_${i + 1}.pdf`, data });
  }
  return results;
}
