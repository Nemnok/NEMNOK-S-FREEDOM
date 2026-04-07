interface ProgressBarProps {
  progress: number;
  label: string;
  sublabel?: string;
}

export default function ProgressBar({ progress, label, sublabel }: ProgressBarProps) {
  return (
    <div className="bg-dark-800 border border-dark-600 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-300">{label}</span>
        <span className="text-sm text-blue-400 font-mono">{progress}%</span>
      </div>
      <div className="w-full h-2 bg-dark-600 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
      {sublabel && <p className="text-xs text-gray-500 mt-1">{sublabel}</p>}
    </div>
  );
}
