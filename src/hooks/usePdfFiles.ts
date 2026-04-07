import { useCallback, useState } from 'react';
import type { PDFFileInfo, PDFPageInfo } from '../types';
import { loadPdfFile } from '../utils/pdfUtils';

export function usePdfFiles() {
  const [files, setFiles] = useState<PDFFileInfo[]>([]);
  const [allPages, setAllPages] = useState<PDFPageInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback(async (inputFiles: File[]) => {
    setLoading(true);
    setError(null);
    try {
      const pdfFiles = inputFiles.filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
      );
      if (pdfFiles.length === 0) {
        setError('Please select PDF files only.');
        setLoading(false);
        return;
      }

      const loaded: PDFFileInfo[] = [];
      for (const f of pdfFiles) {
        try {
          const info = await loadPdfFile(f);
          loaded.push(info);
        } catch (err) {
          setError((prev) => (prev ? prev + '\n' : '') + (err instanceof Error ? err.message : String(err)));
        }
      }

      setFiles((prev) => [...prev, ...loaded]);
      setAllPages((prev) => [...prev, ...loaded.flatMap((f) => f.pages)]);
    } finally {
      setLoading(false);
    }
  }, []);

  const reorderPages = useCallback((newPages: PDFPageInfo[]) => {
    setAllPages(newPages);
  }, []);

  const togglePageSelection = useCallback(
    (pageId: string, shiftKey: boolean, ctrlKey: boolean) => {
      setAllPages((prev) => {
        const idx = prev.findIndex((p) => p.id === pageId);
        if (idx < 0) return prev;

        if (shiftKey) {
          const lastSelected = prev.findLastIndex((p) => p.selected);
          if (lastSelected >= 0) {
            const start = Math.min(idx, lastSelected);
            const end = Math.max(idx, lastSelected);
            return prev.map((p, i) => ({
              ...p,
              selected: i >= start && i <= end ? true : p.selected,
            }));
          }
        }

        if (ctrlKey) {
          return prev.map((p) => (p.id === pageId ? { ...p, selected: !p.selected } : p));
        }

        // single click
        const allSelected = prev.filter((p) => p.selected);
        if (allSelected.length === 1 && allSelected[0].id === pageId) {
          return prev.map((p) => ({ ...p, selected: false }));
        }
        return prev.map((p) => ({ ...p, selected: p.id === pageId }));
      });
    },
    [],
  );

  const selectAll = useCallback(() => {
    setAllPages((prev) => prev.map((p) => ({ ...p, selected: true })));
  }, []);

  const deselectAll = useCallback(() => {
    setAllPages((prev) => prev.map((p) => ({ ...p, selected: false })));
  }, []);

  const invertSelection = useCallback(() => {
    setAllPages((prev) => prev.map((p) => ({ ...p, selected: !p.selected })));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setAllPages([]);
    setError(null);
  }, []);

  const removeSelectedPages = useCallback(() => {
    setAllPages((prev) => prev.filter((p) => !p.selected));
  }, []);

  return {
    files,
    allPages,
    loading,
    error,
    addFiles,
    reorderPages,
    togglePageSelection,
    selectAll,
    deselectAll,
    invertSelection,
    clearFiles,
    removeSelectedPages,
    setError,
  };
}
