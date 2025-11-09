import React from 'react';

interface DrawingControlsProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  onClear: () => void;
}

const penColors = [
  { name: 'Black', value: '#1a1a1a' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#eab308' },
];

const DrawingControls: React.FC<DrawingControlsProps> = ({ currentColor, onColorChange, onClear }) => {
  return (
    <div className="absolute top-1/2 left-4 -translate-y-1/2 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-2 rounded-lg shadow-lg flex items-center gap-2">
      {penColors.map(color => (
        <button
          key={color.name}
          onClick={() => onColorChange(color.value)}
          className={`w-8 h-8 rounded-full border-2 transition-transform transform hover:scale-110 ${currentColor === color.value ? 'ring-2 ring-offset-2 dark:ring-offset-slate-800 ring-orange-500 border-white dark:border-slate-600' : 'border-transparent'}`}
          style={{ backgroundColor: color.value }}
          aria-label={`Set pen color to ${color.name}`}
        />
      ))}
      <div className="border-l border-gray-300 dark:border-gray-600 h-8 mx-1"></div>
      <button
        onClick={onClear}
        className="p-2 rounded-full text-gray-600 hover:bg-gray-200 hover:text-red-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-red-400 transition-colors"
        aria-label="Clear drawings"
        title="Clear drawings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
        </svg>
      </button>
    </div>
  );
};

export default DrawingControls;