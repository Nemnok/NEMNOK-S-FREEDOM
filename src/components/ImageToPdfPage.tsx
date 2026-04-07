import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useImageFiles } from '../hooks/useImageFiles';
import DropZone from '../components/DropZone';
import type { ImageFileInfo, ImageToPdfSettings, PageSize, Orientation, MarginType } from '../types';
import { imagesToPdf } from '../utils/imageUtils';
import { downloadBlob } from '../utils/downloadUtils';

function SortableImage({
  image,
  onRemove,
}: {
  image: ImageFileInfo;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
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
      className="relative group bg-dark-700 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing"
    >
      <div className="aspect-[3/4] flex items-center justify-center p-2">
        <img
          src={image.data}
          alt={image.name}
          className="max-w-full max-h-full object-contain rounded"
          draggable={false}
        />
      </div>
      <div className="px-2 py-1.5 text-center border-t border-dark-600">
        <span className="text-xs text-gray-400 truncate block">{image.name}</span>
        <span className="text-xs text-gray-600">
          {image.width}×{image.height}
        </span>
      </div>
      <button
        className="absolute top-2 right-2 w-6 h-6 bg-dark-800/80 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs text-white"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(image.id);
        }}
      >
        ✕
      </button>
    </div>
  );
}

export default function ImageToPdfPage() {
  const { images, loading, error, addImages, reorderImages, removeImage, clearImages, setError } =
    useImageFiles();

  const [settings, setSettings] = useState<ImageToPdfSettings>({
    pageSize: 'A4',
    orientation: 'auto',
    marginType: 'small',
    customMargin: 20,
  });
  const [processing, setProcessing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderImages(arrayMove(images, oldIndex, newIndex));
      }
    }
  };

  const handleConvert = useCallback(async () => {
    if (images.length === 0) return;
    setProcessing(true);
    try {
      const data = await imagesToPdf(images, settings);
      downloadBlob(data, 'images.pdf');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setProcessing(false);
    }
  }, [images, settings, setError]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 space-y-6">
        {/* Upload area */}
        <DropZone accept="image/png,image/jpeg,image/webp" onFiles={addImages} label="Drop images here (PNG, JPG, WEBP)">
          {loading && <p className="text-blue-400 text-sm mt-2">Loading images...</p>}
        </DropZone>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-3 text-red-400 hover:text-white">✕</button>
          </div>
        )}

        {images.length > 0 && (
          <>
            {/* Settings */}
            <div className="bg-dark-800 border border-dark-600 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Page Size</label>
                <select
                  value={settings.pageSize}
                  onChange={(e) => setSettings((s) => ({ ...s, pageSize: e.target.value as PageSize }))}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-500 rounded-lg text-white text-sm"
                >
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                  <option value="fit-image">Fit to Image</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Orientation</label>
                <select
                  value={settings.orientation}
                  onChange={(e) => setSettings((s) => ({ ...s, orientation: e.target.value as Orientation }))}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-500 rounded-lg text-white text-sm"
                >
                  <option value="auto">Auto</option>
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Margins</label>
                <select
                  value={settings.marginType}
                  onChange={(e) => setSettings((s) => ({ ...s, marginType: e.target.value as MarginType }))}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-500 rounded-lg text-white text-sm"
                >
                  <option value="none">None</option>
                  <option value="small">Small</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {settings.marginType === 'custom' && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Margin (pt)</label>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={settings.customMargin}
                    onChange={(e) => setSettings((s) => ({ ...s, customMargin: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-500 rounded-lg text-white text-sm"
                  />
                </div>
              )}
            </div>

            {/* Action bar */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">{images.length} image(s) — drag to reorder</span>
              <div className="flex-1" />
              <button
                onClick={clearImages}
                className="px-3 py-2 bg-dark-600 hover:bg-red-600/80 rounded-lg text-sm text-gray-300 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={handleConvert}
                disabled={processing}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors"
              >
                {processing ? 'Converting...' : '📄 Create PDF'}
              </button>
            </div>

            {/* Image grid */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {images.map((img) => (
                    <SortableImage key={img.id} image={img} onRemove={removeImage} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        )}
      </div>
    </div>
  );
}
