
import React, { useMemo, useRef, useEffect, memo } from 'react';
import { BlockData } from '../types';
import { calculateTrendGrid } from '../utils/helpers';

interface TrendChartProps {
  blocks: BlockData[];
  mode: 'parity' | 'size';
}

const TrendChart: React.FC<TrendChartProps> = memo(({ blocks, mode }) => {
  const rows = 10;
  
  // Only recalculate the grid when blocks data or mode changes
  const grid = useMemo(() => {
    return calculateTrendGrid(blocks, mode === 'parity' ? 'type' : 'sizeType', rows);
  }, [blocks, mode]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Smooth scroll to end
      containerRef.current.scrollTo({
        left: containerRef.current.scrollWidth,
        behavior: 'auto'
      });
    }
  }, [grid]);

  const stats = useMemo(() => {
    if (mode === 'parity') {
      const odd = blocks.filter(b => b.type === 'ODD').length;
      return {
        labelA: '单', countA: odd, colorA: 'bg-red-500',
        labelB: '双', countB: blocks.length - odd, colorB: 'bg-teal-500'
      };
    } else {
      const big = blocks.filter(b => b.sizeType === 'BIG').length;
      return {
        labelA: '大', countA: big, colorA: 'bg-orange-500',
        labelB: '小', countB: blocks.length - big, colorB: 'bg-indigo-500'
      };
    }
  }, [blocks, mode]);

  // Render individual cell with minimal logic inside the map
  const renderCell = (type: any, colIdx: number, rowIdx: number) => {
    if (!type) return <div key={`${colIdx}-${rowIdx}`} className="w-10 h-10 border-r border-b border-gray-100/50" />;
    
    const isParity = mode === 'parity';
    const label = isParity ? (type === 'ODD' ? '单' : '双') : (type === 'BIG' ? '大' : '小');
    const bgColor = isParity 
      ? (type === 'ODD' ? 'bg-red-500' : 'bg-teal-500')
      : (type === 'BIG' ? 'bg-orange-500' : 'bg-indigo-500');

    return (
      <div 
        key={`${colIdx}-${rowIdx}`} 
        className="w-10 h-10 border-r border-b border-gray-100/50 flex items-center justify-center"
      >
        <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center text-white text-xs font-bold shadow-sm transition-transform hover:scale-110`}>
          {label}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 border border-gray-100 overflow-hidden">
      <div className="flex justify-between items-center mb-5 px-2">
        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">
          {mode === 'parity' ? '单双走势' : '大小走势'}
        </h3>
        <div className="flex items-center space-x-6 text-xs font-black">
          <div className="flex items-center space-x-2">
            <span className={`w-5 h-5 rounded-md ${stats.colorA} flex items-center justify-center text-white text-[10px]`}>{stats.labelA}</span>
            <span className="text-gray-500 tabular-nums">{stats.countA}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-5 h-5 rounded-md ${stats.colorB} flex items-center justify-center text-white text-[10px]`}>{stats.labelB}</span>
            <span className="text-gray-500 tabular-nums">{stats.countB}</span>
          </div>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="overflow-x-auto custom-scrollbar rounded-xl border border-gray-100"
      >
        <div className="flex bg-gray-50/30 w-max">
          {grid.map((column, colIdx) => (
            <div key={colIdx} className="flex flex-col">
              {column.map((cell, rowIdx) => renderCell(cell.type, colIdx, rowIdx))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

TrendChart.displayName = 'TrendChart';

export default TrendChart;
