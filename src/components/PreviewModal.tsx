import { useEffect, useState } from 'react';
import type { PDFPageInfo, PDFFileInfo } from '../types';
import { renderPagePreview } from '../utils/pdfUtils';

interface PreviewModalProps {
  page: PDFPageInfo | null;
  files: PDFFileInfo[];
  onClose: () => void;
}

export default function PreviewModal({ page, files, onClose }: PreviewModalProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!page) {
      setPreview(null);
      return;
    }
    const file = files.find((f) => f.id === page.fileId);
    if (!file) return;

    setLoading(true);
    renderPagePreview(file.data, page.pageIndex)
      .then(setPreview)
      .catch(() => setPreview(null))
      .finally(() => setLoading(false));
  }, [page, files]);

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
