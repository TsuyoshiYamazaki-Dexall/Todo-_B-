// サブタスク
export interface SubTask {
  id: string;
  name: string;
  completed: boolean;
}

// メインタスク
export interface Task {
  id: string;
  name: string;
  priority: 1 | 2 | 3; // 1: 低, 2: 中, 3: 高
  deadline: string; // ISO date string
  subTasks: SubTask[];
  completed: boolean;
  createdAt: string;
  lastUpdatedAt: string;
}

// ユーザー設定
export interface UserSettings {
  name: string;
  notificationsEnabled: boolean;
}

// アプリ状態
export interface AppState {
  tasks: Task[];
  settings: UserSettings;
}

// 画面タブ
export type TabType = 'todo' | 'add' | 'mypage';

// モーダル種類
export type ModalType =
  | 'none'
  | 'addTask'
  | 'editTask'
  | 'celebration'
  | 'encouragement'
  | 'reminder';

// スコア計算用
export interface TaskScore {
  task: Task;
  score: number;
  daysUntilDeadline: number;
  progressPercent: number;
}
