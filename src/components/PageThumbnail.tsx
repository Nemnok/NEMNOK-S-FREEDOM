import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { PDFPageInfo } from '../types';

interface PageThumbnailProps {
  page: PDFPageInfo;
  index: number;
  onClick: (id: string, shiftKey: boolean, ctrlKey: boolean) => void;
  onPreview?: (page: PDFPageInfo) => void;
}

export default function PageThumbnail({ page, index, onClick, onPreview }: PageThumbnailProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: page.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative group rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-all ${
        page.selected
          ? 'ring-2 ring-blue-500 bg-blue-600/20'
          : 'bg-dark-700 hover:bg-dark-600'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onClick(page.id, e.shiftKey, e.ctrlKey || e.metaKey);
      }}
    >
      {/* Thumbnail */}
      <div className="aspect-[3/4] flex items-center justify-center p-2">
        {page.thumbnail ? (
          <img
            src={page.thumbnail}
            alt={`Page ${index + 1}`}
            className="max-w-full max-h-full object-contain rounded shadow-lg"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-dark-600 rounded flex items-center justify-center text-gray-500">
            Loading...
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-2 py-1.5 text-center border-t border-dark-600">
        <span className="text-xs text-gray-400">Page {index + 1}</span>
        <span className="text-xs text-gray-600 block truncate">{page.fileName}</span>
      </div>

      {/* Checkbox */}
      <div className="absolute top-2 left-2">
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            page.selected
              ? 'bg-blue-500 border-blue-500'
              : 'border-gray-500 bg-dark-800/70 group-hover:border-blue-400'
          }`}
        >
          {page.selected && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      {/* Preview button */}
      {onPreview && (
        <button
          className="absolute top-2 right-2 w-6 h-6 bg-dark-800/80 hover:bg-blue-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onPreview(page);
          }}
        >
          🔍
        </button>
      )}
    </div>
  );
}
