export interface PDFPageInfo {
  pageIndex: number;
  fileId: string;
  fileName: string;
  thumbnail: string | null;
  width: number;
  height: number;
  selected: boolean;
  id: string;
}

export interface PDFFileInfo {
  id: string;
  name: string;
  size: number;
  data: ArrayBuffer;
  pageCount: number;
  pages: PDFPageInfo[];
}

export interface ImageFileInfo {
  id: string;
  name: string;
  size: number;
  data: string; // data URL
  width: number;
  height: number;
  file: File;
}

export type SplitMode = 'each-page' | 'by-ranges';

export interface SplitRange {
  id: string;
  from: number;
  to: number;
}

export type PageSize = 'A4' | 'Letter' | 'fit-image';
export type Orientation = 'auto' | 'portrait' | 'landscape';
export type MarginType = 'none' | 'small' | 'custom';

export interface ImageToPdfSettings {
  pageSize: PageSize;
  orientation: Orientation;
  marginType: MarginType;
  customMargin: number;
}

export interface OcrProgress {
  currentPage: number;
  totalPages: number;
  pageProgress: number;
  status: string;
}

export interface OcrResult {
  pageIndex: number;
  text: string;
  confidence: number;
}

export const CONFIG = {
  MAX_FILE_SIZE_MB: 100,
  MAX_PAGES: 500,
  MAX_IMAGES: 100,
  THUMBNAIL_SCALE: 0.3,
  PREVIEW_SCALE: 1.5,
} as const;
