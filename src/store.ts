import { AppState, Task, UserSettings } from './types';

const STORAGE_KEY = 'todo-app-data';

// デフォルト状態
const defaultState: AppState = {
  tasks: [],
  settings: {
    name: '',
    notificationsEnabled: true,
  },
};

// 状態を読み込み
export function loadState(): AppState {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  return defaultState;
}

// 状態を保存
export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

// タスク追加
export function addTask(state: AppState, task: Omit<Task, 'id' | 'createdAt' | 'lastUpdatedAt' | 'completed'>): AppState {
  const newTask: Task = {
    ...task,
    id: generateId(),
    completed: false,
    createdAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  };
  return {
    ...state,
    tasks: [...state.tasks, newTask],
  };
}

// タスク更新
export function updateTask(state: AppState, taskId: string, updates: Partial<Task>): AppState {
  return {
    ...state,
    tasks: state.tasks.map((task) =>
      task.id === taskId
        ? { ...task, ...updates, lastUpdatedAt: new Date().toISOString() }
        : task
    ),
  };
}

// タスク削除
export function deleteTask(state: AppState, taskId: string): AppState {
  return {
    ...state,
    tasks: state.tasks.filter((task) => task.id !== taskId),
  };
}

// 設定更新
export function updateSettings(state: AppState, settings: Partial<UserSettings>): AppState {
  return {
    ...state,
    settings: { ...state.settings, ...settings },
  };
}

// 全データリセット
export function resetState(): AppState {
  localStorage.removeItem(STORAGE_KEY);
  return defaultState;
}

// ID生成
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// スコア計算
export function calculateTaskScore(task: Task): number {
  const now = new Date();
  const deadline = new Date(task.deadline);
  const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // 期限までの日数が少ないほどスコアが高い
  const urgencyScore = Math.max(0, 10 - daysUntil);

  // 優先度スコア
  const priorityScore = task.priority * 3;

  // 進捗がないタスクはスコアアップ
  const completedSubTasks = task.subTasks.filter((st) => st.completed).length;
  const progressScore = completedSubTasks === 0 ? 5 : 0;

  return urgencyScore + priorityScore + progressScore;
}

// 期限までの日数を取得
export function getDaysUntilDeadline(deadline: string): number {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  return Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// 進捗率を計算
export function getProgressPercent(task: Task): number {
  if (task.subTasks.length === 0) return task.completed ? 100 : 0;
  const completed = task.subTasks.filter((st) => st.completed).length;
  return Math.round((completed / task.subTasks.length) * 100);
}
