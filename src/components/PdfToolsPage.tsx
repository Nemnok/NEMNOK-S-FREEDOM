import { useState, useCallback } from 'react';
import { usePdfFiles } from '../hooks/usePdfFiles';
import DropZone from '../components/DropZone';
import PageGrid from '../components/PageGrid';
import PreviewModal from '../components/PreviewModal';
import ProgressBar from '../components/ProgressBar';
import type { PDFPageInfo, SplitRange, OcrProgress, OcrResult } from '../types';
import { mergePdfPages, extractPages, splitEachPage, splitByRanges } from '../utils/pdfUtils';
import { runOcr } from '../utils/ocrUtils';
import { downloadBlob, downloadAsZip, downloadText } from '../utils/downloadUtils';

type ActiveTool = 'merge' | 'split' | 'extract' | 'delete' | 'ocr' | null;
type SplitMode = 'each-page' | 'by-ranges';

let rangeIdCounter = 0;

export default function PdfToolsPage() {
  const {
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
  } = usePdfFiles();

  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [previewPage, setPreviewPage] = useState<PDFPageInfo | null>(null);
  const [processing, setProcessing] = useState(false);
  const [splitMode, setSplitMode] = useState<SplitMode>('each-page');
  const [splitRanges, setSplitRanges] = useState<SplitRange[]>([
    { id: `r_${++rangeIdCounter}`, from: 1, to: 1 },
  ]);

  // OCR state
  const [ocrLanguages, setOcrLanguages] = useState<string[]>(['eng']);
  const [ocrScope, setOcrScope] = useState<'selected' | 'all'>('all');
  const [ocrProgress, setOcrProgress] = useState<OcrProgress | null>(null);
  const [ocrResults, setOcrResults] = useState<OcrResult[] | null>(null);

  const selectedPages = allPages.filter((p) => p.selected);
  const selectedCount = selectedPages.length;

  const handleSelectTool = useCallback((tool: ActiveTool) => {
    setActiveTool((prev) => (prev === tool ? null : tool));
    setOcrResults(null);
    setOcrProgress(null);
  }, []);

  // --- MERGE ---
  const handleMerge = useCallback(async () => {
    if (allPages.length === 0) return;
    setProcessing(true);
    try {
      const data = await mergePdfPages(files, allPages);
      downloadBlob(data, 'merged.pdf');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setProcessing(false);
    }
  }, [files, allPages, setError]);

  // --- EXTRACT ---
  const handleExtract = useCallback(async () => {
    if (selectedCount === 0) return;
    setProcessing(true);
    try {
      // Group by file
      const byFile = new Map<string, number[]>();
      for (const p of selectedPages) {
        const arr = byFile.get(p.fileId) || [];
        arr.push(p.pageIndex);
        byFile.set(p.fileId, arr);
      }
      // If single file, extract directly
      if (byFile.size === 1) {
        const [fileId, indices] = [...byFile.entries()][0];
        const file = files.find((f) => f.id === fileId);
        if (file) {
          const data = await extractPages(file.data, indices);
          downloadBlob(data, 'extracted.pdf');
        }
      } else {
        // Multi-file: merge selected pages maintaining order
        const data = await mergePdfPages(files, selectedPages);
        downloadBlob(data, 'extracted.pdf');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setProcessing(false);
    }
  }, [selectedPages, selectedCount, files, setError]);

  // --- DELETE ---
  const handleDelete = useCallback(async () => {
    if (selectedCount === 0) return;
    if (!window.confirm(`Delete ${selectedCount} selected page(s)?`)) return;
    setProcessing(true);
    try {
      // Keep only non-selected pages -> merge them
      const remaining = allPages.filter((p) => !p.selected);
      if (remaining.length === 0) {
        setError('Cannot delete all pages.');
        setProcessing(false);
        return;
      }
      const data = await mergePdfPages(files, remaining);
      downloadBlob(data, 'modified.pdf');
      removeSelectedPages();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setProcessing(false);
    }
  }, [allPages, selectedCount, files, removeSelectedPages, setError]);

  // --- SPLIT ---
  const handleSplit = useCallback(async () => {
    if (files.length === 0) return;
    setProcessing(true);
    try {
      const file = files[0]; // Split operates on first file
      if (splitMode === 'each-page') {
        const results = await splitEachPage(file.data, file.pageCount);
        await downloadAsZip(results, `${file.name}_split.zip`);
      } else {
        const ranges = splitRanges.map((r) => ({
          from: Math.max(0, r.from - 1),
          to: Math.min(file.pageCount - 1, r.to - 1),
        }));
        const results = await splitByRanges(file.data, ranges);
        await downloadAsZip(results, `${file.name}_split.zip`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setProcessing(false);
    }
  }, [files, splitMode, splitRanges, setError]);

  // --- OCR ---
  const handleOcr = useCallback(async () => {
    setProcessing(true);
    setOcrResults(null);
    try {
      const pages = ocrScope === 'selected' ? selectedPages : allPages;
      if (pages.length === 0) {
        setError('No pages to process.');
        setProcessing(false);
        return;
      }

      // Use first file for OCR (all pages should be from the same loaded set)
      const file = files.find((f) => f.id === pages[0].fileId);
      if (!file) {
        setError('File not found.');
        setProcessing(false);
        return;
      }

      const indices = pages.map((p) => p.pageIndex);
      const results = await runOcr(file.data, indices, ocrLanguages, setOcrProgress);
      setOcrResults(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setProcessing(false);
      setOcrProgress(null);
    }
  }, [ocrScope, ocrLanguages, selectedPages, allPages, files, setError]);

  const handleDownloadOcrText = useCallback(() => {
    if (!ocrResults) return;
    const text = ocrResults
      .map((r) => `--- Page ${r.pageIndex + 1} (confidence: ${r.confidence.toFixed(1)}%) ---\n${r.text}`)
      .join('\n\n');
    downloadText(text, 'ocr_result.txt');
  }, [ocrResults]);

  const addSplitRange = () => {
    setSplitRanges((prev) => [...prev, { id: `r_${++rangeIdCounter}`, from: 1, to: 1 }]);
  };

  const removeSplitRange = (id: string) => {
    setSplitRanges((prev) => prev.filter((r) => r.id !== id));
  };

  const updateSplitRange = (id: string, field: 'from' | 'to', value: number) => {
    setSplitRanges((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  const toggleOcrLang = (lang: string) => {
    setOcrLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  };

  const tools = [
    { id: 'merge' as const, label: 'Merge', icon: '🔗', desc: 'Combine pages into one PDF' },
    { id: 'split' as const, label: 'Split', icon: '✂️', desc: 'Split PDF into parts' },
    { id: 'extract' as const, label: 'Extract', icon: '📤', desc: 'Extract selected pages' },
    { id: 'delete' as const, label: 'Delete', icon: '🗑️', desc: 'Remove selected pages' },
    { id: 'ocr' as const, label: 'OCR', icon: '🔍', desc: 'Recognize text (OCR)' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Upload area */}
      {allPages.length === 0 && (
        <div className="p-6">
          <DropZone accept=".pdf" onFiles={addFiles} label="Drop PDF files here">
            {loading && <p className="text-blue-400 text-sm mt-2">Loading PDF...</p>}
          </DropZone>
        </div>
      )}

      {error && (
        <div className="mx-6 mt-2 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-3 text-red-400 hover:text-white">✕</button>
        </div>
      )}

      {allPages.length > 0 && (
        <>
          {/* Toolbar */}
          <div className="bg-dark-800 border-b border-dark-600 px-4 py-3 flex flex-wrap items-center gap-2 shrink-0">
            {/* Add more files */}
            <label className="px-3 py-1.5 bg-dark-600 hover:bg-dark-500 rounded-lg text-sm text-gray-300 cursor-pointer transition-colors">
              + Add PDF
              <input
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  addFiles(Array.from(e.target.files || []));
                  e.target.value = '';
                }}
              />
            </label>

            <div className="w-px h-6 bg-dark-600" />

            {/* Selection */}
            <div className="flex items-center gap-1 text-xs">
              <button onClick={selectAll} className="px-2 py-1 bg-dark-600 hover:bg-dark-500 rounded text-gray-300">
                All
              </button>
              <button onClick={deselectAll} className="px-2 py-1 bg-dark-600 hover:bg-dark-500 rounded text-gray-300">
                None
              </button>
              <button onClick={invertSelection} className="px-2 py-1 bg-dark-600 hover:bg-dark-500 rounded text-gray-300">
                Invert
              </button>
              <span className="ml-2 text-gray-400">
                {selectedCount} of {allPages.length} selected
              </span>
            </div>

            <div className="w-px h-6 bg-dark-600" />

            {/* Tool buttons */}
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => handleSelectTool(tool.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTool === tool.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-dark-600 hover:bg-dark-500 text-gray-300'
                }`}
                title={tool.desc}
              >
                {tool.icon} {tool.label}
              </button>
            ))}

            <div className="flex-1" />

            <button
              onClick={clearFiles}
              className="px-3 py-1.5 bg-dark-600 hover:bg-red-600/80 rounded-lg text-sm text-gray-300 transition-colors"
            >
              Clear All
            </button>
          </div>

          {/* Active tool panel */}
          {activeTool && (
            <div className="bg-dark-800/80 border-b border-dark-600 px-6 py-4">
              {activeTool === 'merge' && (
                <div className="flex items-center gap-4">
                  <p className="text-gray-300 text-sm">
                    Merge all {allPages.length} pages into one PDF. Drag pages to reorder.
                  </p>
                  <button
                    onClick={handleMerge}
                    disabled={processing}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors"
                  >
                    {processing ? 'Processing...' : '🔗 Merge & Download'}
                  </button>
                </div>
              )}

              {activeTool === 'split' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="radio"
                        checked={splitMode === 'each-page'}
                        onChange={() => setSplitMode('each-page')}
                        className="accent-blue-500"
                      />
                      Each page → separate PDF
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="radio"
                        checked={splitMode === 'by-ranges'}
                        onChange={() => setSplitMode('by-ranges')}
                        className="accent-blue-500"
                      />
                      By ranges
                    </label>
                  </div>

                  {splitMode === 'by-ranges' && (
                    <div className="space-y-2">
                      {splitRanges.map((r) => (
                        <div key={r.id} className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">From:</span>
                          <input
                            type="number"
                            min={1}
                            max={files[0]?.pageCount || 1}
                            value={r.from}
                            onChange={(e) => updateSplitRange(r.id, 'from', Number(e.target.value))}
                            className="w-20 px-2 py-1 bg-dark-700 border border-dark-500 rounded text-white text-sm"
                          />
                          <span className="text-xs text-gray-400">To:</span>
                          <input
                            type="number"
                            min={1}
                            max={files[0]?.pageCount || 1}
                            value={r.to}
                            onChange={(e) => updateSplitRange(r.id, 'to', Number(e.target.value))}
                            className="w-20 px-2 py-1 bg-dark-700 border border-dark-500 rounded text-white text-sm"
                          />
                          {splitRanges.length > 1 && (
                            <button onClick={() => removeSplitRange(r.id)} className="text-red-400 hover:text-red-300 text-sm">✕</button>
                          )}
                        </div>
                      ))}
                      <button onClick={addSplitRange} className="text-blue-400 hover:text-blue-300 text-sm">
                        + Add Range
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleSplit}
                    disabled={processing}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors"
                  >
                    {processing ? 'Processing...' : '✂️ Split & Download ZIP'}
                  </button>
                </div>
              )}

              {activeTool === 'extract' && (
                <div className="flex items-center gap-4">
                  <p className="text-gray-300 text-sm">
                    Select pages, then extract. {selectedCount > 0 && `(${selectedCount} selected)`}
                  </p>
                  <button
                    onClick={handleExtract}
                    disabled={processing || selectedCount === 0}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors"
                  >
                    {processing ? 'Processing...' : '📤 Extract & Download'}
                  </button>
                </div>
              )}

              {activeTool === 'delete' && (
                <div className="flex items-center gap-4">
                  <p className="text-gray-300 text-sm">
                    Select pages to delete. {selectedCount > 0 && `(${selectedCount} selected)`}
                  </p>
                  <button
                    onClick={handleDelete}
                    disabled={processing || selectedCount === 0}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors"
                  >
                    {processing ? 'Processing...' : '🗑️ Delete & Download'}
                  </button>
                </div>
              )}

              {activeTool === 'ocr' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Scope:</span>
                      <label className="flex items-center gap-1 text-sm text-gray-300">
                        <input
                          type="radio"
                          checked={ocrScope === 'all'}
                          onChange={() => setOcrScope('all')}
                          className="accent-blue-500"
                        />
                        All pages
                      </label>
                      <label className="flex items-center gap-1 text-sm text-gray-300">
                        <input
                          type="radio"
                          checked={ocrScope === 'selected'}
                          onChange={() => setOcrScope('selected')}
                          className="accent-blue-500"
                        />
                        Selected ({selectedCount})
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Languages:</span>
                      {['eng', 'rus', 'deu', 'fra', 'spa'].map((lang) => (
                        <label key={lang} className="flex items-center gap-1 text-sm text-gray-300">
                          <input
                            type="checkbox"
                            checked={ocrLanguages.includes(lang)}
                            onChange={() => toggleOcrLang(lang)}
                            className="accent-blue-500"
                          />
                          {lang.toUpperCase()}
                        </label>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-yellow-400/80">
                    ⚠ OCR can be slow on large PDFs. Processing happens entirely in your browser.
                  </p>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleOcr}
                      disabled={processing || ocrLanguages.length === 0}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors"
                    >
                      {processing ? 'Processing...' : '🔍 Run OCR'}
                    </button>
                    {ocrResults && (
                      <button
                        onClick={handleDownloadOcrText}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-medium transition-colors"
                      >
                        📥 Download TXT
                      </button>
                    )}
                  </div>

                  {ocrProgress && (
                    <ProgressBar
                      progress={Math.round(
                        ((ocrProgress.currentPage - 1) / ocrProgress.totalPages) * 100 +
                          ocrProgress.pageProgress / ocrProgress.totalPages,
                      )}
                      label={ocrProgress.status}
                      sublabel={`Page ${ocrProgress.currentPage} of ${ocrProgress.totalPages} — ${ocrProgress.pageProgress}%`}
                    />
                  )}

                  {ocrResults && (
                    <div className="max-h-60 overflow-auto bg-dark-700 rounded-lg p-3 text-sm">
                      {ocrResults.map((r) => (
                        <div key={r.pageIndex} className="mb-3">
                          <div className="text-blue-400 text-xs font-medium mb-1">
                            Page {r.pageIndex + 1} (confidence: {r.confidence.toFixed(1)}%)
                          </div>
                          <pre className="text-gray-300 whitespace-pre-wrap text-xs leading-relaxed">
                            {r.text || '(no text detected)'}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Page grid */}
          <div className="flex-1 overflow-auto">
            <PageGrid
              pages={allPages}
              onReorder={reorderPages}
              onToggleSelect={togglePageSelection}
              onPreview={setPreviewPage}
            />
          </div>
        </>
      )}

      {/* Preview modal */}
      <PreviewModal page={previewPage} files={files} onClose={() => setPreviewPage(null)} />

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-dark-800 rounded-xl p-6 text-center border border-dark-600">
            <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-300">Loading PDF...</p>
          </div>
        </div>
      )}
    </div>
  );
}
