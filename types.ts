
export type BlockType = 'ODD' | 'EVEN';

export interface BlockData {
  height: number;
  hash: string;
  resultValue: number;
  type: BlockType;
  timestamp: string;
}

export type IntervalType = 1 | 20 | 60 | 100;

export interface GridCell {
  type: BlockType | null;
  value?: number;
}

export interface AppConfig {
  apiKey: string;
}
