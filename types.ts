
export type BlockType = 'ODD' | 'EVEN';
export type SizeType = 'BIG' | 'SMALL';

export interface BlockData {
  height: number;
  hash: string;
  resultValue: number;
  type: BlockType;
  sizeType: SizeType;
  timestamp: string;
}

export type IntervalType = 1 | 20 | 60 | 100;

export interface GridCell {
  type: BlockType | SizeType | null;
  value?: number;
}

export interface AppConfig {
  apiKey: string;
}
