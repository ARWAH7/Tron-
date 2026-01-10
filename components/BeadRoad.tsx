
import React, { useMemo, useRef, useEffect, memo } from 'react';
import { BlockData } from '../types';
import { calculateBeadGrid } from '../utils/helpers';

interface BeadRoadProps {
  blocks: BlockData[];
  mode: 'parity' | 'size';
  title?: string;
}

const BeadRoad: React.FC<BeadRoadProps> = memo(({ blocks, mode, title }) => {
  const rows = 6;
  
  const grid = useMemo(() => {
    return calculateBeadGrid(blocks, mode === 'parity' ? 'type' : 'sizeType', rows);
  }, [blocks, mode]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        left: containerRef.current.scrollWidth,
        behavior: 'auto'
      });
    }
  }, [grid]);

  const renderCell = (type: any, value: number | undefined, colIdx: number, rowIdx: number) => {
    if (!type) return <div key={`${colIdx}-${rowIdx}`} className="w-8 h-8 border-r border-b border-gray-100/30" />;
    
    const isParity = mode === 'parity';
    const label = isParity ? (type === 'ODD' ? '单' : '双') : (type === 'BIG' ? '大' : '小');
    const bgColor = isParity 
      ? (type === 'ODD' ? 'bg-red-500' : 'bg-teal-500')
      : (type === 'BIG' ? 'bg-orange-500' : 'bg-indigo-500');

    return (
      <div 
        key={`${colIdx}-${rowIdx}`} 
        className="w-8 h-8 border-r border-b border-gray-100/30 flex items-center justify-center relative group"
      >
        <div className={`w-7 h-7 rounded-full ${bgColor} flex items-center justify-center text-white text-[10px] font-black shadow-sm transition-transform group-hover:scale-110`}>
          {label}
        </div>
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none font-bold">
          {value}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 flex flex-col h-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
          {title || '单双珠盘路'}
        </h3>
      </div>

      <div 
        ref={containerRef}
        className="overflow-x-auto custom-scrollbar rounded-lg border border-gray-100 bg-gray-50/20"
      >
        <div className="flex w-max">
          {grid.map((column, colIdx) => (
            <div key={colIdx} className="flex flex-col">
              {column.map((cell, rowIdx) => renderCell(cell.type, cell.value, colIdx, rowIdx))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

BeadRoad.displayName = 'BeadRoad';

export default BeadRoad;
