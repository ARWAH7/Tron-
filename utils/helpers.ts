
import { BlockData, BlockType, GridCell } from '../types';

const TRON_GRID_BASE = "https://api.trongrid.io";

/**
 * Derives a result value (0-9) from the hash.
 */
export const deriveResultFromHash = (hash: string): number => {
  if (!hash) return 0;
  const digits = hash.match(/\d/g);
  if (digits && digits.length > 0) {
    return parseInt(digits[digits.length - 1], 10);
  }
  return 0;
};

/**
 * Formats a raw timestamp (ms) to YYYY-MM-DD HH:mm:ss
 */
export const formatTimestamp = (ts: number): string => {
  const date = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

/**
 * Fetches the latest block from TronGrid
 */
export const fetchLatestBlock = async (apiKey: string) => {
  try {
    const response = await fetch(`${TRON_GRID_BASE}/wallet/getnowblock`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
        'TRON-PRO-API-KEY': apiKey
      },
      body: '{}'
    });
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const data = await response.json();
    if (data.Error) throw new Error(data.Error);
    return data;
  } catch (error) {
    console.error("fetchLatestBlock error:", error);
    throw error;
  }
};

/**
 * Fetches a specific block by number
 */
export const fetchBlockByNum = async (num: number, apiKey: string) => {
  try {
    const response = await fetch(`${TRON_GRID_BASE}/wallet/getblockbynum`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
        'TRON-PRO-API-KEY': apiKey
      },
      body: JSON.stringify({ num })
    });
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const data = await response.json();
    if (!data.blockID) throw new Error(`Block ${num} not found or invalid`);
    return data;
  } catch (error) {
    console.error(`fetchBlockByNum(${num}) error:`, error);
    throw error;
  }
};

/**
 * Transforms TronGrid response to internal BlockData
 */
export const transformTronBlock = (raw: any): BlockData => {
  const hash = raw.blockID;
  const height = raw.block_header.raw_data.number;
  const timestampRaw = raw.block_header.raw_data.timestamp;
  const resultValue = deriveResultFromHash(hash);
  
  return {
    height,
    hash,
    resultValue,
    type: resultValue % 2 === 0 ? 'EVEN' : 'ODD',
    timestamp: formatTimestamp(timestampRaw)
  };
};

/**
 * Check if a height is aligned with the requested interval
 */
export const isAligned = (height: number, interval: number): boolean => {
  if (interval === 1) return true;
  return height % interval === 0;
};

export const calculateTrendGrid = (blocks: BlockData[], rows: number = 10): GridCell[][] => {
  if (blocks.length === 0) return [];
  
  const chronological = [...blocks].sort((a, b) => a.height - b.height);
  const columns: GridCell[][] = [];
  let currentColumn: GridCell[] = [];
  let lastType: BlockType | null = null;

  chronological.forEach((block) => {
    if (block.type !== lastType || currentColumn.length >= rows) {
      if (currentColumn.length > 0) {
        while (currentColumn.length < rows) {
          currentColumn.push({ type: null });
        }
        columns.push(currentColumn);
      }
      currentColumn = [];
      lastType = block.type;
    }
    currentColumn.push({ type: block.type, value: block.resultValue });
  });

  if (currentColumn.length > 0) {
    while (currentColumn.length < rows) {
      currentColumn.push({ type: null });
    }
    columns.push(currentColumn);
  }

  const minCols = 50;
  while (columns.length < minCols) {
    columns.push(Array(rows).fill({ type: null }));
  }

  return columns;
};
