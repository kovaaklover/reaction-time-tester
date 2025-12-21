export interface HistoryEntry {
  timestamp: string;
  initialColor: string;
  stimulusColor: string;
  trials: number;
  minDelay: number;
  maxDelay: number;
  results: number[];
}