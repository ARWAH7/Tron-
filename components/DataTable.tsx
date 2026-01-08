
import React from 'react';
import { BlockData } from '../types';

interface DataTableProps {
  blocks: BlockData[];
}

const DataTable: React.FC<DataTableProps> = ({ blocks }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
      <table className="w-full text-left border-collapse table-fixed">
        <thead className="bg-[#7888a5] text-white text-xs md:text-sm font-bold">
          <tr>
            <th className="py-4 px-3 md:px-6 w-[20%]">区块高度</th>
            <th className="py-4 px-3 md:px-6 w-[45%]">区块hash</th>
            <th className="py-4 px-3 md:px-6 w-[15%]">区块结果</th>
            <th className="py-4 px-3 md:px-6 w-[20%]">时间</th>
          </tr>
        </thead>
        <tbody className="text-xs md:text-sm">
          {blocks.map((block, idx) => (
            <tr 
              key={block.height} 
              className={`${idx % 2 === 0 ? 'bg-white' : 'bg-[#f8faff]'} hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0`}
            >
              <td className="py-4 px-3 md:px-6 text-blue-600 font-bold tabular-nums">
                {block.height}
              </td>
              <td className="py-4 px-3 md:px-6 text-gray-400 font-mono truncate text-[10px] md:text-xs">
                {block.hash}
              </td>
              <td className="py-4 px-3 md:px-6">
                <div className="flex items-center space-x-2">
                  <span className={`font-bold ${block.type === 'ODD' ? 'text-red-500' : 'text-teal-500'}`}>
                    {block.resultValue}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] text-white font-bold ${block.type === 'ODD' ? 'bg-red-400' : 'bg-teal-400'}`}>
                    {block.type === 'ODD' ? '单' : '双'}
                  </span>
                </div>
              </td>
              <td className="py-4 px-3 md:px-6 text-gray-500 tabular-nums leading-tight whitespace-pre-wrap">
                {block.timestamp.split(' ').join('\n')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {blocks.length === 0 && (
        <div className="py-20 text-center text-gray-400 font-medium">
          暂无区块数据
        </div>
      )}
    </div>
  );
};

export default DataTable;
