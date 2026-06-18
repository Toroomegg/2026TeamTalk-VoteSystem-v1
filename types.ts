export interface Candidate {
  id: string;
  name: string;        // 產品名稱
  song: string;        // 產品類別 (相容舊屬性)
  image?: string;      // 產品照 URL
  videoLink?: string;  // 保留相容性
  
  // Scores
  scoreSinging: number;    // A類別得票: 印象最深刻產品
  scorePopularity: number; // B類別得票: 最佳人氣產品
  scoreCostume: number;    // C類別得票: 最有前瞻性產品
  
  // Helpers
  totalScore: number;  // 總得票數
  voteCount: number;   
  color: string;
}

export interface Souvenir {
  id: string;
  name: string;
  quantity: number;
  image?: string;
}

export interface VoteDetail {
  id: string;
  staffId: string;
  name: string;
  singing: string;      // 選擇的「印象最深刻產品」ID
  popularity: string;   // 選擇的「最佳人氣產品」ID
  costume: string;      // 選擇的「最有前瞻性產品」ID
  souvenirId: string;   // 選擇的紀念品 ID
  souvenirName: string; // 選擇的紀念品名稱
  ip: string;           // 投票者 IP
  timestamp: number;    // 投票時間
}

export interface StaffMember {
  id: string;
  name: string;
  used: boolean;
}

export enum VoteCategory {
  SINGING = 'SINGING',       // 印象最深刻產品 (原歌唱)
  POPULARITY = 'POPULARITY', // 最佳人氣產品 (原人氣)
  COSTUME = 'COSTUME'        // 最有前瞻性產品 (原造型)
}

export interface VoteState {
  hasVoted: boolean;
}

export enum PageView {
  VOTE = 'VOTE',
  RESULTS = 'RESULTS',
  ADMIN = 'ADMIN'
}

// 2026 TeamTalk 主題色系
export const COLORS = [
  '#73c8ce', // 淺藍色
  '#202d98', // 深藍色
  '#3b82f6', // 經典藍
  '#06b6d4', // 青色
  '#14b8a6', // 湖水綠
  '#6366f1', // 靛青
  '#a855f7', // 紫色
  '#f43f5e', // 瑰紅
];
