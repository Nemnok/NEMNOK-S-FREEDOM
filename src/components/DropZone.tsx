import { useCallback, type ReactNode } from 'react';

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  accept: string;
  children: ReactNode;
  label: string;
}

export default function DropZone({ onFiles, accept, children, label }: DropZoneProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) onFiles(files);
    },
    [onFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) onFiles(files);
      e.target.value = '';
    },
    [onFiles],
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-dark-500 hover:border-blue-500 rounded-xl p-8 text-center transition-colors cursor-pointer bg-dark-800/50"
    >
      <label className="cursor-pointer flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-dark-600 flex items-center justify-center text-3xl">
          📁
        </div>
        <p className="text-gray-300 font-medium">{label}</p>
        <p className="text-gray-500 text-sm">Drag &amp; drop or click to browse</p>
        <input
          type="file"
          accept={accept}
          multiple
          onChange={handleChange}
          className="hidden"
        />
        {children}
      </label>
    </div>
  );
}
