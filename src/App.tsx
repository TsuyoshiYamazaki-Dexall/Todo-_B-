import React, { useState, useEffect, useCallback } from 'react';
import { Task, SubTask, TabType, ModalType, AppState } from './types';
import {
  loadState,
  saveState,
  addTask,
  updateTask,
  deleteTask,
  updateSettings,
  resetState,
  calculateTaskScore,
  getDaysUntilDeadline,
  getProgressPercent,
} from './store';
import {
  playCompleteSound,
  playFanfare,
  playBigFanfare,
  playEncouragementSound,
} from './sounds';
import ClockCharacter from './ClockCharacter';

// デフォルトサブタスクリスト
const DEFAULT_SUBTASKS = [
  '情報収集',
  '構成作成',
  '執筆',
  '提出',
  'レビュー',
  '修正',
  '確認',
  '完了報告',
];

// キャラクターのセリフ
const CHARACTER_MESSAGES = {
  taskAdded: [
    'よしっ、今日のミッション登録だね！📝✨',
    'いいねいいね！準備オッケー！👍',
    'ナイス！これからやっていこう！🚀',
    'よーし、スタートだ！💡',
  ],
  firstComplete: [
    'ナイス！いいスタートだね！👏',
    'いいね！その調子！😊',
    'よしよし、1つクリア！✨',
    'いい感じ！まずは1歩！🚶',
    'おっ、やるじゃん！👍✨',
    'いいねいいね！その調子！😆',
  ],
  secondComplete: [
    'いいペース！あと1つ！🔥',
    'ナイス！もうすぐコンプリート！✨',
    '順調だね！ラスト1つ！💪',
    'いい感じ！ここまで来たね！😆',
    'おぉ！あと1つだよ！🎯',
    'いいねいいね！ラストスパート！🚀',
  ],
  allComplete: [
    'パーフェクト！全部クリア！🎉🎉',
    'すごい！今日のミッション完了！✨',
    'やったー！全部終わったね！🥳',
    'ナイスワーク！今日もいい1日！🌟',
    'すごーい！コンプリート！🎊',
    '最高！ミッション成功！🎉',
  ],
};

const getRandomMessage = (messages: string[]): string => {
  return messages[Math.floor(Math.random() * messages.length)];
};

// パイプラインステージの色
const PIPELINE_COLORS = [
  '#F59E0B', // 黄色
  '#F97316', // オレンジ
  '#EF4444', // 赤
  '#8B5CF6', // 紫
  '#3B82F6', // 青
  '#10B981', // 緑
  '#06B6D4', // シアン
  '#EC4899', // ピンク
];

// 優先度の色
const getPriorityColor = (priority: number) => {
  switch (priority) {
    case 3: return { bg: '#FEE2E2', color: '#DC2626', text: '高' };
    case 2: return { bg: '#FEF3C7', color: '#D97706', text: '中' };
    default: return { bg: '#DBEAFE', color: '#2563EB', text: '低' };
  }
};

// 期限の警告レベル
const getDeadlineWarning = (deadline: string) => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const timeStr = deadlineDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  const dateStr = deadlineDate.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });

  if (diffMs < 0) return { level: 'overdue', text: '期限切れ', color: '#DC2626' };
  if (diffHours <= 24) return { level: 'danger', text: `${dateStr} ${timeStr}`, color: '#DC2626' };
  if (diffDays <= 3) return { level: 'warning', text: `${dateStr} ${timeStr}`, color: '#F59E0B' };
  return { level: 'safe', text: `${dateStr}`, color: '#6B7280' };
};

export default function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [activeTab, setActiveTab] = useState<TabType>('todo');
  const [modal, setModal] = useState<ModalType>('none');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [characterMessage, setCharacterMessage] = useState<string | null>(null);
  const [characterExpression, setCharacterExpression] = useState<'normal' | 'happy' | 'worried'>('normal');

  // タスク追加フォーム
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<1 | 2 | 3>(2);
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [selectedSubTasks, setSelectedSubTasks] = useState<string[]>([]);
  const [customSubTask, setCustomSubTask] = useState('');

  // キャラクターがランダムに話す
  useEffect(() => {
    const messages = ['がんばってね！', '今日もお疲れさま！', 'タスク確認した？', '応援してるよ！', '休憩も大事だよ〜'];
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        setCharacterMessage(messages[Math.floor(Math.random() * messages.length)]);
        setCharacterExpression('happy');
        setTimeout(() => {
          setCharacterMessage(null);
          setCharacterExpression('normal');
        }, 3000);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // 状態保存
  useEffect(() => {
    saveState(state);
  }, [state]);

  const showMessage = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2000);
  }, []);

  // タスク追加
  const handleAddTask = () => {
    if (!newTaskName.trim() || !newTaskDeadline) return;
    const subTasks: SubTask[] = selectedSubTasks.map((name) => ({
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name,
      completed: false,
    }));
    const newState = addTask(state, {
      name: newTaskName.trim(),
      priority: newTaskPriority,
      deadline: newTaskDeadline,
      subTasks,
    });
    setState(newState);
    setModal('none');
    resetForm();
    showMessage('タスクを追加しました！');
    setCharacterMessage(getRandomMessage(CHARACTER_MESSAGES.taskAdded));
    setCharacterExpression('happy');
    setTimeout(() => {
      setCharacterMessage(null);
      setCharacterExpression('normal');
    }, 3000);
  };

  const resetForm = () => {
    setNewTaskName('');
    setNewTaskPriority(2);
    setNewTaskDeadline('');
    setSelectedSubTasks([]);
    setCustomSubTask('');
    setEditingTask(null);
  };

  // サブタスク完了
  const handleSubTaskComplete = (taskId: string, subTaskId: string) => {
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedSubTasks = task.subTasks.map((st) =>
      st.id === subTaskId ? { ...st, completed: !st.completed } : st
    );
    const allCompleted = updatedSubTasks.every((st) => st.completed);
    const completedCount = updatedSubTasks.filter((st) => st.completed).length;
    const prevCompletedCount = task.subTasks.filter((st) => st.completed).length;

    if (completedCount > prevCompletedCount) {
      playCompleteSound();
      let characterMsg: string;
      if (allCompleted || completedCount >= 3) {
        characterMsg = getRandomMessage(CHARACTER_MESSAGES.allComplete);
      } else if (completedCount === 2) {
        characterMsg = getRandomMessage(CHARACTER_MESSAGES.secondComplete);
      } else {
        characterMsg = getRandomMessage(CHARACTER_MESSAGES.firstComplete);
      }
      setCharacterMessage(characterMsg);
      setCharacterExpression('happy');
      showMessage(characterMsg);
      if (!allCompleted) {
        setTimeout(() => {
          setCharacterMessage(null);
          setCharacterExpression('normal');
        }, 3000);
      }
      if (completedCount === 3 && !allCompleted) {
        setTimeout(() => playFanfare(), 500);
      }
    }

    const newState = updateTask(state, taskId, {
      subTasks: updatedSubTasks,
      completed: allCompleted,
    });

    if (allCompleted && !task.completed) {
      setTimeout(() => {
        playBigFanfare();
        setShowConfetti(true);
        setModal('celebration');
        setTimeout(() => setShowConfetti(false), 3000);
      }, 300);
    }
    setState(newState);
  };

  const handleDeleteTask = (taskId: string) => {
    setState(deleteTask(state, taskId));
    setModal('none');
    showMessage('タスクを削除しました');
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTaskName(task.name);
    setNewTaskPriority(task.priority);
    setNewTaskDeadline(task.deadline);
    setSelectedSubTasks(task.subTasks.map((st) => st.name));
    setModal('editTask');
  };

  const handleUpdateTask = () => {
    if (!editingTask || !newTaskName.trim() || !newTaskDeadline) return;
    const existingSubTaskMap = new Map(editingTask.subTasks.map((st) => [st.name, st]));
    const subTasks: SubTask[] = selectedSubTasks.map((name) => {
      const existing = existingSubTaskMap.get(name);
      if (existing) return existing;
      return {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        name,
        completed: false,
      };
    });
    setState(updateTask(state, editingTask.id, {
      name: newTaskName.trim(),
      priority: newTaskPriority,
      deadline: newTaskDeadline,
      subTasks,
    }));
    setModal('none');
    resetForm();
    showMessage('タスクを更新しました！');
  };

  const handleAddCustomSubTask = () => {
    if (!customSubTask.trim()) return;
    if (!selectedSubTasks.includes(customSubTask.trim())) {
      setSelectedSubTasks([...selectedSubTasks, customSubTask.trim()]);
    }
    setCustomSubTask('');
  };

  const handleReset = () => {
    if (confirm('すべてのデータをリセットしますか？')) {
      setState(resetState());
      showMessage('データをリセットしました');
    }
  };

  // タスク集計
  const incompleteTasks = state.tasks.filter((t) => !t.completed).sort((a, b) => calculateTaskScore(b) - calculateTaskScore(a));
  const completedTasks = state.tasks.filter((t) => t.completed);
  const totalSubTasks = state.tasks.reduce((sum, t) => sum + t.subTasks.length, 0);
  const completedSubTasks = state.tasks.reduce((sum, t) => sum + t.subTasks.filter((st) => st.completed).length, 0);
  const overallProgress = totalSubTasks > 0 ? Math.round((completedSubTasks / totalSubTasks) * 100) : 0;

  // 今日の日付
  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F3F4F6', fontFamily: "'Noto Sans JP', sans-serif" }}>
      {/* サイドバー */}
      <aside style={{
        width: '72px',
        background: '#1F2937',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 0',
        gap: '8px',
      }}>
        {/* ロゴ */}
        <div style={{
          width: '44px',
          height: '44px',
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.4rem',
          marginBottom: '20px',
        }}>
          📝
        </div>

        {/* ナビゲーション */}
        {[
          { id: 'todo', icon: '📋', label: 'Todo' },
          { id: 'add', icon: '➕', label: '追加' },
          { id: 'mypage', icon: '👤', label: 'マイページ' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id as TabType);
              if (item.id === 'add') resetForm();
            }}
            style={{
              width: '52px',
              height: '52px',
              background: activeTab === item.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              transition: 'all 0.2s',
            }}
            title={item.label}
          >
            <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
            <span style={{ fontSize: '0.6rem', color: activeTab === item.id ? '#A5B4FC' : '#9CA3AF' }}>{item.label}</span>
          </button>
        ))}

        <div style={{ flex: 1 }} />

        {/* 設定 */}
        <button
          onClick={handleReset}
          style={{
            width: '44px',
            height: '44px',
            background: 'transparent',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '1.2rem',
          }}
          title="リセット"
        >
          ⚙️
        </button>
      </aside>

      {/* メインコンテンツ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* ヘッダー */}
        <header style={{
          height: '64px',
          background: '#FFF',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1F2937', margin: 0 }}>
              Task Dashboard
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: 0 }}>{today}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => { setActiveTab('add'); resetForm(); }}
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                color: '#FFF',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>+</span> 新規タスク
            </button>
          </div>
        </header>

        {/* コンテンツエリア */}
        <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* 左側：メインコンテンツ */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            {activeTab === 'todo' && (
              <>
                {/* 統計カード */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ background: '#FFF', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                    <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '8px' }}>総タスク</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1F2937' }}>{state.tasks.length}</div>
                  </div>
                  <div style={{ background: '#FFF', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                    <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '8px' }}>進行中</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#F59E0B' }}>{incompleteTasks.length}</div>
                  </div>
                  <div style={{ background: '#FFF', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                    <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '8px' }}>完了</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10B981' }}>{completedTasks.length}</div>
                  </div>
                  <div style={{ background: '#FFF', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                    <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '8px' }}>全体進捗</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#6366F1' }}>{overallProgress}%</div>
                  </div>
                </div>

                {/* タスクパイプライン */}
                <div style={{ background: '#FFF', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1F2937', margin: 0 }}>Task Pipeline</h2>
                  </div>

                  {incompleteTasks.length === 0 && completedTasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                      <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📋</div>
                      <p>タスクがありません</p>
                      <p style={{ fontSize: '0.9rem' }}>「新規タスク」ボタンから追加しよう！</p>
                    </div>
                  ) : (
                    <div>
                      {/* ヘッダー */}
                      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 100px 80px', gap: '12px', marginBottom: '12px', padding: '0 12px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6B7280' }}>タスク名</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6B7280' }}>サブタスク（クリックで完了）</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textAlign: 'center' }}>期限</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textAlign: 'center' }}>操作</div>
                      </div>

                      {/* タスク行 */}
                      {[...incompleteTasks, ...completedTasks].map((task) => {
                        const warning = getDeadlineWarning(task.deadline);
                        const priority = getPriorityColor(task.priority);

                        return (
                          <div
                            key={task.id}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '180px 1fr 100px 80px',
                              gap: '12px',
                              padding: '12px',
                              background: task.completed ? '#F9FAFB' : '#FFF',
                              borderRadius: '10px',
                              marginBottom: '8px',
                              border: '1px solid #E5E7EB',
                              opacity: task.completed ? 0.6 : 1,
                              alignItems: 'center',
                            }}
                          >
                            {/* タスク名 */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.65rem',
                                  fontWeight: '600',
                                  background: priority.bg,
                                  color: priority.color,
                                }}
                              >
                                {priority.text}
                              </span>
                              <span style={{
                                fontSize: '0.9rem',
                                fontWeight: '500',
                                color: '#1F2937',
                                textDecoration: task.completed ? 'line-through' : 'none',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}>
                                {task.name}
                              </span>
                            </div>

                            {/* サブタスクリスト */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                              {task.subTasks.map((st, index) => (
                                <button
                                  key={st.id}
                                  onClick={() => !task.completed && handleSubTaskComplete(task.id, st.id)}
                                  disabled={task.completed}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    background: st.completed
                                      ? PIPELINE_COLORS[index % PIPELINE_COLORS.length]
                                      : '#F9FAFB',
                                    border: st.completed ? 'none' : '2px solid #E5E7EB',
                                    borderRadius: '20px',
                                    cursor: task.completed ? 'default' : 'pointer',
                                    transition: 'all 0.2s',
                                    fontSize: '0.8rem',
                                    fontWeight: '500',
                                    color: st.completed ? '#FFF' : '#4B5563',
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!task.completed && !st.completed) {
                                      e.currentTarget.style.background = '#E5E7EB';
                                      e.currentTarget.style.borderColor = '#9CA3AF';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!task.completed && !st.completed) {
                                      e.currentTarget.style.background = '#F9FAFB';
                                      e.currentTarget.style.borderColor = '#E5E7EB';
                                    }
                                  }}
                                >
                                  {/* チェックボックス */}
                                  <span style={{
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '4px',
                                    background: st.completed ? 'rgba(255,255,255,0.3)' : '#FFF',
                                    border: st.completed ? 'none' : '2px solid #D1D5DB',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    flexShrink: 0,
                                  }}>
                                    {st.completed && '✓'}
                                  </span>
                                  {st.name}
                                </button>
                              ))}
                              {task.subTasks.length === 0 && (
                                <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>サブタスクなし</span>
                              )}
                            </div>

                            {/* 期限 */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: '0.75rem', color: warning.color, fontWeight: '500' }}>
                                {warning.text}
                              </span>
                            </div>

                            {/* 操作 */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                              <button
                                onClick={() => handleEditTask(task)}
                                style={{
                                  padding: '6px 10px',
                                  background: '#F3F4F6',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                }}
                              >
                                編集
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                style={{
                                  padding: '6px 10px',
                                  background: '#FEE2E2',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  color: '#DC2626',
                                }}
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 追加画面 */}
            {activeTab === 'add' && (
              <div style={{ background: '#FFF', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', maxWidth: '600px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1F2937', marginBottom: '24px' }}>新しいタスクを追加</h2>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>タスク名</label>
                  <input
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="タスク名を入力"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '10px',
                      border: '2px solid #E5E7EB',
                      fontSize: '1rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>優先度</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3].map((p) => {
                      const pStyle = getPriorityColor(p);
                      return (
                        <button
                          key={p}
                          onClick={() => setNewTaskPriority(p as 1 | 2 | 3)}
                          style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '10px',
                            border: newTaskPriority === p ? `2px solid ${pStyle.color}` : '2px solid transparent',
                            background: newTaskPriority === p ? pStyle.bg : '#F3F4F6',
                            color: newTaskPriority === p ? pStyle.color : '#9CA3AF',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          {pStyle.text}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>期限</label>
                  <input
                    type="datetime-local"
                    value={newTaskDeadline}
                    onChange={(e) => setNewTaskDeadline(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '10px',
                      border: '2px solid #E5E7EB',
                      fontSize: '1rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>サブタスク</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    {DEFAULT_SUBTASKS.map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          if (selectedSubTasks.includes(st)) {
                            setSelectedSubTasks(selectedSubTasks.filter((s) => s !== st));
                          } else {
                            setSelectedSubTasks([...selectedSubTasks, st]);
                          }
                        }}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '20px',
                          border: 'none',
                          background: selectedSubTasks.includes(st)
                            ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                            : '#F3F4F6',
                          color: selectedSubTasks.includes(st) ? '#FFF' : '#374151',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                        }}
                      >
                        {selectedSubTasks.includes(st) && '✓ '}
                        {st}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={customSubTask}
                      onChange={(e) => setCustomSubTask(e.target.value)}
                      placeholder="カスタム追加"
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '2px solid #E5E7EB',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCustomSubTask()}
                    />
                    <button
                      onClick={handleAddCustomSubTask}
                      style={{
                        padding: '12px 20px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        color: '#FFF',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      +
                    </button>
                  </div>

                  {selectedSubTasks.filter((st) => !DEFAULT_SUBTASKS.includes(st)).length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>追加したサブタスク:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                        {selectedSubTasks.filter((st) => !DEFAULT_SUBTASKS.includes(st)).map((st) => (
                          <button
                            key={st}
                            onClick={() => setSelectedSubTasks(selectedSubTasks.filter((s) => s !== st))}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '20px',
                              border: 'none',
                              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                              color: '#FFF',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                            }}
                          >
                            ✓ {st} ×
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleAddTask}
                  disabled={!newTaskName.trim() || !newTaskDeadline}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    color: '#FFF',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    opacity: !newTaskName.trim() || !newTaskDeadline ? 0.5 : 1,
                  }}
                >
                  タスクを追加
                </button>
              </div>
            )}

            {/* マイページ */}
            {activeTab === 'mypage' && (
              <div style={{ maxWidth: '600px' }}>
                <div style={{ background: '#FFF', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1F2937', marginBottom: '20px' }}>プロフィール</h2>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>名前</label>
                    <input
                      type="text"
                      value={state.settings.name}
                      onChange={(e) => setState(updateSettings(state, { name: e.target.value }))}
                      placeholder="名前を入力"
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: '10px',
                        border: '2px solid #E5E7EB',
                        fontSize: '1rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <button
                    onClick={() => setState(updateSettings(state, { notificationsEnabled: !state.settings.notificationsEnabled }))}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '10px',
                      border: 'none',
                      background: state.settings.notificationsEnabled
                        ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                        : '#E5E7EB',
                      color: state.settings.notificationsEnabled ? '#FFF' : '#6B7280',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    {state.settings.notificationsEnabled ? '🔔 通知 ON' : '🔕 通知 OFF'}
                  </button>
                </div>

                <div style={{ background: '#FFF', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1F2937', marginBottom: '20px' }}>デバッグ</h2>
                  <button
                    onClick={handleReset}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#FEE2E2',
                      color: '#DC2626',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    すべてのデータをリセット
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 右側：サイドパネル */}
          <aside style={{
            width: '320px',
            background: '#FFF',
            borderLeft: '1px solid #E5E7EB',
            padding: '24px',
            overflowY: 'auto',
            display: activeTab === 'todo' ? 'block' : 'none',
          }}>
            {/* 進捗ドーナツチャート */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1F2937', marginBottom: '16px' }}>全体進捗</h3>
              <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto' }}>
                <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="12" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${overallProgress * 2.51} 251`}
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1F2937' }}>{overallProgress}%</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>完了率</div>
                </div>
              </div>
            </div>

            {/* 期限が近いタスク */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1F2937', marginBottom: '16px' }}>期限が近いタスク</h3>
              {incompleteTasks.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#9CA3AF', textAlign: 'center' }}>タスクなし</p>
              ) : (
                incompleteTasks.slice(0, 5).map((task, index) => {
                  const warning = getDeadlineWarning(task.deadline);
                  const progress = getProgressPercent(task);
                  return (
                    <div
                      key={task.id}
                      style={{
                        padding: '12px',
                        background: '#F9FAFB',
                        borderRadius: '10px',
                        marginBottom: '8px',
                        borderLeft: `4px solid ${warning.color}`,
                      }}
                    >
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1F2937', marginBottom: '4px' }}>
                        {task.name}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: warning.color }}>{warning.text}</span>
                        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>{progress}%</span>
                      </div>
                      <div style={{ height: '4px', background: '#E5E7EB', borderRadius: '2px', marginTop: '6px' }}>
                        <div style={{
                          height: '100%',
                          width: `${progress}%`,
                          background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
                          borderRadius: '2px',
                        }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        </main>
      </div>

      {/* モーダル：タスク編集 */}
      {modal === 'editTask' && editingTask && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setModal('none')}>
          <div style={{
            background: '#FFF',
            borderRadius: '20px',
            padding: '24px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1F2937', margin: 0 }}>タスクを編集</h2>
              <button onClick={() => setModal('none')} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#9CA3AF' }}>×</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>タスク名</label>
              <input
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #E5E7EB', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>優先度</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3].map((p) => {
                  const pStyle = getPriorityColor(p);
                  return (
                    <button
                      key={p}
                      onClick={() => setNewTaskPriority(p as 1 | 2 | 3)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: newTaskPriority === p ? `2px solid ${pStyle.color}` : '2px solid transparent',
                        background: newTaskPriority === p ? pStyle.bg : '#F3F4F6',
                        color: newTaskPriority === p ? pStyle.color : '#9CA3AF',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      {pStyle.text}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>期限</label>
              <input
                type="datetime-local"
                value={newTaskDeadline}
                onChange={(e) => setNewTaskDeadline(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #E5E7EB', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>サブタスク</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {DEFAULT_SUBTASKS.map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      if (selectedSubTasks.includes(st)) {
                        setSelectedSubTasks(selectedSubTasks.filter((s) => s !== st));
                      } else {
                        setSelectedSubTasks([...selectedSubTasks, st]);
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '16px',
                      border: 'none',
                      background: selectedSubTasks.includes(st) ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' : '#F3F4F6',
                      color: selectedSubTasks.includes(st) ? '#FFF' : '#374151',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    {selectedSubTasks.includes(st) && '✓ '}{st}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setModal('none')}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#E5E7EB', color: '#374151', fontWeight: '600', cursor: 'pointer' }}
              >
                キャンセル
              </button>
              <button
                onClick={handleUpdateTask}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', color: '#FFF', fontWeight: '600', cursor: 'pointer' }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* モーダル：祝福 */}
      {modal === 'celebration' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setModal('none')}>
          <div style={{
            background: '#FFF',
            borderRadius: '24px',
            padding: '40px',
            textAlign: 'center',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉🎊</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1F2937', marginBottom: '8px' }}>おめでとう！</div>
            <div style={{ fontSize: '1rem', color: '#6B7280', marginBottom: '24px' }}>タスクを完了しました！</div>
            <button
              onClick={() => setModal('none')}
              style={{
                padding: '12px 32px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                color: '#FFF',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              やったね！
            </button>
          </div>
        </div>
      )}

      {/* 紙吹雪 */}
      {showConfetti && (
        <>
          <div style={{ position: 'fixed', left: '10%', bottom: '20%', fontSize: '3rem', pointerEvents: 'none', zIndex: 2000, animation: 'confetti-left 1s ease-out forwards' }}>🎊</div>
          <div style={{ position: 'fixed', right: '10%', bottom: '20%', fontSize: '3rem', pointerEvents: 'none', zIndex: 2000, animation: 'confetti-right 1s ease-out forwards' }}>🎉</div>
          <style>{`
            @keyframes confetti-left {
              0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
              100% { transform: translate(-50px, -200px) rotate(-45deg); opacity: 0; }
            }
            @keyframes confetti-right {
              0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
              100% { transform: translate(50px, -200px) rotate(45deg); opacity: 0; }
            }
          `}</style>
        </>
      )}

      {/* キャラクター */}
      <ClockCharacter
        message={characterMessage}
        expression={characterExpression}
        modalOpen={modal !== 'none'}
        onClick={() => {
          const responses = ['なあに？', 'どうしたの？', 'がんばろう！', '✨', '一緒にがんばろ！'];
          setCharacterMessage(responses[Math.floor(Math.random() * responses.length)]);
          setCharacterExpression('happy');
          setTimeout(() => {
            setCharacterMessage(null);
            setCharacterExpression('normal');
          }, 2000);
        }}
      />

      {/* メッセージ */}
      {message && (
        <div style={{
          position: 'fixed',
          top: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.8)',
          color: '#FFF',
          padding: '12px 24px',
          borderRadius: '24px',
          fontSize: '0.9rem',
          zIndex: 3000,
        }}>
          {message}
        </div>
      )}
    </div>
  );
}
