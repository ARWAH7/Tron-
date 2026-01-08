
import React, { useMemo, useRef, useEffect } from 'react';
import { BlockData, BlockType } from '../types';
import { calculateTrendGrid } from '../utils/helpers';

interface TrendChartProps {
  blocks: BlockData[];
}

const TrendChart: React.FC<TrendChartProps> = ({ blocks }) => {
  const rows = 10;
  const grid = useMemo(() => calculateTrendGrid(blocks, rows), [blocks]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the right on update
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [grid]);

  const oddCount = blocks.filter(b => b.type === 'ODD').length;
  const evenCount = blocks.filter(b => b.type === 'EVEN').length;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-gray-100 overflow-hidden">
      <div className="flex justify-center items-center space-x-8 mb-4 text-sm font-semibold">
        <div className="flex items-center space-x-2">
          <span className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">单</span>
          <span className="text-gray-700">{oddCount}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs">双</span>
          <span className="text-gray-700">{evenCount}</span>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="overflow-x-auto custom-scrollbar border-l border-t border-gray-200"
      >
        <div className="flex" style={{ width: 'fit-content' }}>
          {grid.map((column, colIdx) => (
            <div key={colIdx} className="flex flex-col">
              {column.map((cell, rowIdx) => (
                <div 
                  key={`${colIdx}-${rowIdx}`}
                  className="w-10 h-10 border-r border-b border-gray-200 flex items-center justify-center bg-white"
                >
                  {cell.type === 'ODD' && (
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold animate-in zoom-in duration-300">
                      单
                    </div>
                  )}
                  {cell.type === 'EVEN' && (
                    <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold animate-in zoom-in duration-300">
                      双
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendChart;
