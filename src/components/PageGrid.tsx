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
} from '@dnd-kit/sortable';
import type { PDFPageInfo } from '../types';
import PageThumbnail from './PageThumbnail';

interface PageGridProps {
  pages: PDFPageInfo[];
  onReorder: (pages: PDFPageInfo[]) => void;
  onToggleSelect: (id: string, shift: boolean, ctrl: boolean) => void;
  onPreview?: (page: PDFPageInfo) => void;
}

export default function PageGrid({ pages, onReorder, onToggleSelect, onPreview }: PageGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = pages.findIndex((p) => p.id === active.id);
      const newIndex = pages.findIndex((p) => p.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(arrayMove(pages, oldIndex, newIndex));
      }
    }
  };

  if (pages.length === 0) return null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 p-4">
          {pages.map((page, i) => (
            <PageThumbnail
              key={page.id}
              page={page}
              index={i}
              onClick={onToggleSelect}
              onPreview={onPreview}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
