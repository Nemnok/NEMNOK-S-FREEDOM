import { useEffect, useMemo, useRef, useState } from 'react';
import type { PDFPageInfo, PDFFileInfo } from '../types';
import { renderPagePreview } from '../utils/pdfUtils';

interface PreviewModalProps {
  page: PDFPageInfo | null;
  files: PDFFileInfo[];
  onClose: () => void;
}

export default function PreviewModal({ page, files, onClose }: PreviewModalProps) {
  const [state, setState] = useState<{ preview: string | null; loading: boolean }>({
    preview: null,
    loading: false,
  });
  const requestRef = useRef(0);

  const file = useMemo(
    () => (page ? files.find((f) => f.id === page.fileId) : undefined),
    [page, files],
  );

  useEffect(() => {
    if (!page || !file) return;

    const requestId = ++requestRef.current;

    renderPagePreview(file.data, page.pageIndex)
      .then((url) => {
        if (requestRef.current === requestId) {
          setState({ preview: url, loading: false });
        }
      })
      .catch(() => {
        if (requestRef.current === requestId) {
          setState({ preview: null, loading: false });
        }
      });
  }, [page, file]);

  // Reset state when page changes via derived state
  const loading = page && file ? (state.loading || (!state.preview && !state.loading)) : false;
  const preview = page ? state.preview : null;

  if (!page) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-dark-800 rounded-xl max-w-4xl max-h-[90vh] overflow-auto p-4 border border-dark-600 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-medium">
            Page {page.pageIndex + 1} — {page.fileName}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-dark-600 hover:bg-red-600 rounded-lg flex items-center justify-center text-white transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="flex items-center justify-center min-h-[300px]">
          {loading ? (
            <div className="text-gray-400">Loading preview...</div>
          ) : preview ? (
            <img src={preview} alt="Page preview" className="max-w-full max-h-[80vh] rounded shadow-lg" />
          ) : (
            <div className="text-gray-500">Preview not available</div>
          )}
        </div>
      </div>
    </div>
  );
}
