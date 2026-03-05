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

// スタイル
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '480px',
    margin: '0 auto',
    minHeight: '100vh',
    background: '#f8f9fa',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    padding: '20px',
    color: '#fff',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
  },
  headerTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
  },
  main: {
    flex: 1,
    padding: '16px',
    paddingBottom: '80px',
    overflowY: 'auto',
  },
  tabBar: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    background: '#fff',
    display: 'flex',
    boxShadow: '0 -2px 12px rgba(0,0,0,0.1)',
    zIndex: 100,
  },
  tabButton: {
    flex: 1,
    padding: '12px 0',
    border: 'none',
    background: 'none',
    fontSize: '0.75rem',
    color: '#999',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
  },
  tabButtonActive: {
    color: '#6366f1',
  },
  tabIcon: {
    fontSize: '1.4rem',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '16px',
    marginBottom: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  taskName: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  priorityBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '0.7rem',
    fontWeight: '600',
    marginLeft: '8px',
  },
  progressBar: {
    height: '8px',
    background: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  subTaskList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginBottom: '12px',
  },
  subTaskChip: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  deadlineText: {
    fontSize: '0.8rem',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  warningText: {
    color: '#f59e0b',
  },
  dangerText: {
    color: '#ef4444',
  },
  button: {
    padding: '12px 24px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
  },
  secondaryButton: {
    background: '#e5e7eb',
    color: '#374151',
  },
  dangerButton: {
    background: '#fee2e2',
    color: '#dc2626',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  label: {
    display: 'block',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  modal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalContent: {
    background: '#fff',
    borderRadius: '24px',
    padding: '24px',
    width: '100%',
    maxWidth: '400px',
    maxHeight: '80vh',
    overflowY: 'auto' as const,
    position: 'relative' as const,
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '20px',
    textAlign: 'center' as const,
  },
  closeButton: {
    position: 'absolute' as const,
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#9ca3af',
  },
  celebration: {
    textAlign: 'center' as const,
    padding: '40px 20px',
  },
  celebrationEmoji: {
    fontSize: '4rem',
    marginBottom: '20px',
  },
  celebrationText: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '12px',
  },
  celebrationSubText: {
    fontSize: '1rem',
    color: '#6b7280',
  },
  reminderCard: {
    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
  },
  reminderText: {
    fontSize: '0.9rem',
    color: '#92400e',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: '#9ca3af',
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '16px',
  },
  completeButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '2px solid #d1d5db',
    background: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    marginRight: '12px',
    flexShrink: 0,
  },
  completeButtonDone: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    border: 'none',
    color: '#fff',
  },
  taskActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
  },
  smallButton: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  confetti: {
    position: 'fixed' as const,
    pointerEvents: 'none' as const,
    zIndex: 2000,
  },
};

// 優先度の色
const getPriorityColor = (priority: number) => {
  switch (priority) {
    case 3: return { bg: '#fee2e2', color: '#dc2626' };
    case 2: return { bg: '#fef3c7', color: '#d97706' };
    default: return { bg: '#dbeafe', color: '#2563eb' };
  }
};

// 優先度テキスト
const getPriorityText = (priority: number) => {
  switch (priority) {
    case 3: return '高';
    case 2: return '中';
    default: return '低';
  }
};

// 期限の警告レベル
const getDeadlineWarning = (daysUntil: number) => {
  if (daysUntil < 0) return { level: 'overdue', text: '期限切れ', emoji: '😰' };
  if (daysUntil === 0) return { level: 'danger', text: '今日まで', emoji: '😱' };
  if (daysUntil <= 2) return { level: 'danger', text: `あと${daysUntil}日`, emoji: '😨' };
  if (daysUntil <= 5) return { level: 'warning', text: `あと${daysUntil}日`, emoji: '😅' };
  return { level: 'safe', text: `あと${daysUntil}日`, emoji: '😊' };
};

export default function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [activeTab, setActiveTab] = useState<TabType>('todo');
  const [modal, setModal] = useState<ModalType>('none');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // タスク追加フォーム
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<1 | 2 | 3>(2);
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [selectedSubTasks, setSelectedSubTasks] = useState<string[]>([]);
  const [customSubTask, setCustomSubTask] = useState('');

  // 状態保存
  useEffect(() => {
    saveState(state);
  }, [state]);

  // リマインダーチェック
  useEffect(() => {
    const highScoreTasks = state.tasks
      .filter((t) => !t.completed)
      .map((t) => ({ task: t, score: calculateTaskScore(t) }))
      .filter((ts) => ts.score >= 10)
      .sort((a, b) => b.score - a.score);

    if (highScoreTasks.length > 0 && modal === 'none') {
      // 高スコアタスクがある場合、リマインダー表示（初回のみ）
    }
  }, [state.tasks, modal]);

  // メッセージ表示
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
  };

  // フォームリセット
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

    // サブタスクを完了した場合
    if (completedCount > prevCompletedCount) {
      playCompleteSound();
      showMessage('えらい！🎉');

      if (completedCount === 3) {
        setTimeout(() => {
          playFanfare();
          showMessage('3つ完了！素晴らしい！✨');
        }, 500);
      }
    }

    const newState = updateTask(state, taskId, {
      subTasks: updatedSubTasks,
      completed: allCompleted,
    });

    // 全サブタスク完了
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

  // タスク削除
  const handleDeleteTask = (taskId: string) => {
    const newState = deleteTask(state, taskId);
    setState(newState);
    setModal('none');
    showMessage('タスクを削除しました');
  };

  // タスク編集開始
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTaskName(task.name);
    setNewTaskPriority(task.priority);
    setNewTaskDeadline(task.deadline);
    setSelectedSubTasks(task.subTasks.map((st) => st.name));
    setModal('editTask');
  };

  // タスク更新
  const handleUpdateTask = () => {
    if (!editingTask || !newTaskName.trim() || !newTaskDeadline) return;

    const existingSubTaskMap = new Map(
      editingTask.subTasks.map((st) => [st.name, st])
    );

    const subTasks: SubTask[] = selectedSubTasks.map((name) => {
      const existing = existingSubTaskMap.get(name);
      if (existing) return existing;
      return {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        name,
        completed: false,
      };
    });

    const newState = updateTask(state, editingTask.id, {
      name: newTaskName.trim(),
      priority: newTaskPriority,
      deadline: newTaskDeadline,
      subTasks,
    });

    setState(newState);
    setModal('none');
    resetForm();
    showMessage('タスクを更新しました！');
  };

  // カスタムサブタスク追加
  const handleAddCustomSubTask = () => {
    if (!customSubTask.trim()) return;
    if (!selectedSubTasks.includes(customSubTask.trim())) {
      setSelectedSubTasks([...selectedSubTasks, customSubTask.trim()]);
    }
    setCustomSubTask('');
  };

  // データリセット
  const handleReset = () => {
    if (confirm('すべてのデータをリセットしますか？')) {
      setState(resetState());
      showMessage('データをリセットしました');
    }
  };

  // 未完了タスク
  const incompleteTasks = state.tasks
    .filter((t) => !t.completed)
    .sort((a, b) => calculateTaskScore(b) - calculateTaskScore(a));

  // 完了タスク
  const completedTasks = state.tasks.filter((t) => t.completed);

  // 高スコアタスク（リマインダー対象）
  const reminderTasks = incompleteTasks.filter(
    (t) => calculateTaskScore(t) >= 12
  );

  return (
    <div style={styles.container}>
      {/* ヘッダー */}
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>📝 Todo App</h1>
      </header>

      {/* メイン */}
      <main style={styles.main}>
        {/* Todo画面 */}
        {activeTab === 'todo' && (
          <>
            {/* リマインダー */}
            {reminderTasks.length > 0 && (
              <div style={styles.reminderCard}>
                <div style={styles.reminderText}>
                  <span>⚠️</span>
                  <span>
                    {reminderTasks[0].name}、これどうなってる？
                  </span>
                </div>
              </div>
            )}

            {/* タスクリスト */}
            {incompleteTasks.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📋</div>
                <p>タスクがありません</p>
                <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>
                  下のボタンから追加しよう！
                </p>
              </div>
            ) : (
              incompleteTasks.map((task) => {
                const progress = getProgressPercent(task);
                const daysUntil = getDaysUntilDeadline(task.deadline);
                const warning = getDeadlineWarning(daysUntil);
                const priorityStyle = getPriorityColor(task.priority);

                return (
                  <div key={task.id} style={styles.card}>
                    <div style={styles.taskHeader}>
                      <span style={styles.taskName}>{task.name}</span>
                      <span
                        style={{
                          ...styles.priorityBadge,
                          background: priorityStyle.bg,
                          color: priorityStyle.color,
                        }}
                      >
                        {getPriorityText(task.priority)}
                      </span>
                    </div>

                    {/* 進捗バー */}
                    <div style={styles.progressBar}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${progress}%`,
                        }}
                      />
                    </div>

                    {/* サブタスク */}
                    <div style={styles.subTaskList}>
                      {task.subTasks.map((st) => (
                        <button
                          key={st.id}
                          onClick={() => handleSubTaskComplete(task.id, st.id)}
                          style={{
                            ...styles.subTaskChip,
                            background: st.completed
                              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                              : '#f3f4f6',
                            color: st.completed ? '#fff' : '#374151',
                          }}
                        >
                          {st.completed && '✓ '}
                          {st.name}
                        </button>
                      ))}
                    </div>

                    {/* 期限 */}
                    <div
                      style={{
                        ...styles.deadlineText,
                        color:
                          warning.level === 'danger' || warning.level === 'overdue'
                            ? '#ef4444'
                            : warning.level === 'warning'
                            ? '#f59e0b'
                            : '#6b7280',
                      }}
                    >
                      <span>{warning.emoji}</span>
                      <span>{warning.text}</span>
                    </div>

                    {/* アクション */}
                    <div style={styles.taskActions}>
                      <button
                        onClick={() => handleEditTask(task)}
                        style={{
                          ...styles.smallButton,
                          background: '#e5e7eb',
                          color: '#374151',
                        }}
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        style={{
                          ...styles.smallButton,
                          background: '#fee2e2',
                          color: '#dc2626',
                        }}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {/* 完了タスク */}
            {completedTasks.length > 0 && (
              <>
                <h3 style={{ margin: '24px 0 12px', color: '#6b7280', fontSize: '0.9rem' }}>
                  完了したタスク
                </h3>
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{ ...styles.card, opacity: 0.6 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ color: '#10b981', marginRight: '8px' }}>✓</span>
                      <span style={{ textDecoration: 'line-through', color: '#6b7280' }}>
                        {task.name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      style={{
                        ...styles.smallButton,
                        background: '#fee2e2',
                        color: '#dc2626',
                        marginTop: '8px',
                      }}
                    >
                      削除
                    </button>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* 追加画面 */}
        {activeTab === 'add' && (
          <div style={styles.card}>
            <h2 style={{ marginBottom: '20px', color: '#1f2937' }}>
              新しいタスクを追加
            </h2>

            <div style={styles.formGroup}>
              <label style={styles.label}>タスク名</label>
              <input
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="タスク名を入力"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>優先度</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3].map((p) => {
                  const pStyle = getPriorityColor(p);
                  return (
                    <button
                      key={p}
                      onClick={() => setNewTaskPriority(p as 1 | 2 | 3)}
                      style={{
                        ...styles.button,
                        flex: 1,
                        background:
                          newTaskPriority === p ? pStyle.bg : '#f3f4f6',
                        color: newTaskPriority === p ? pStyle.color : '#9ca3af',
                        border:
                          newTaskPriority === p
                            ? `2px solid ${pStyle.color}`
                            : '2px solid transparent',
                      }}
                    >
                      {getPriorityText(p)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>期限</label>
              <input
                type="date"
                value={newTaskDeadline}
                onChange={(e) => setNewTaskDeadline(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>サブタスク</label>
              <div style={{ ...styles.subTaskList, marginBottom: '12px' }}>
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
                      ...styles.subTaskChip,
                      background: selectedSubTasks.includes(st)
                        ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                        : '#f3f4f6',
                      color: selectedSubTasks.includes(st) ? '#fff' : '#374151',
                    }}
                  >
                    {selectedSubTasks.includes(st) && '✓ '}
                    {st}
                  </button>
                ))}
              </div>

              {/* カスタムサブタスク追加 */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={customSubTask}
                  onChange={(e) => setCustomSubTask(e.target.value)}
                  placeholder="カスタム追加"
                  style={{ ...styles.input, flex: 1 }}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomSubTask()}
                />
                <button
                  onClick={handleAddCustomSubTask}
                  style={{
                    ...styles.button,
                    ...styles.primaryButton,
                    padding: '12px 16px',
                  }}
                >
                  +
                </button>
              </div>

              {/* 選択中のカスタムサブタスク */}
              {selectedSubTasks.filter((st) => !DEFAULT_SUBTASKS.includes(st)).length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>追加したサブタスク:</span>
                  <div style={{ ...styles.subTaskList, marginTop: '8px' }}>
                    {selectedSubTasks
                      .filter((st) => !DEFAULT_SUBTASKS.includes(st))
                      .map((st) => (
                        <button
                          key={st}
                          onClick={() =>
                            setSelectedSubTasks(selectedSubTasks.filter((s) => s !== st))
                          }
                          style={{
                            ...styles.subTaskChip,
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            color: '#fff',
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
                ...styles.button,
                ...styles.primaryButton,
                width: '100%',
                opacity: !newTaskName.trim() || !newTaskDeadline ? 0.5 : 1,
              }}
            >
              タスクを追加
            </button>
          </div>
        )}

        {/* マイページ */}
        {activeTab === 'mypage' && (
          <>
            <div style={styles.card}>
              <h2 style={{ marginBottom: '20px', color: '#1f2937' }}>プロフィール</h2>

              <div style={styles.formGroup}>
                <label style={styles.label}>名前</label>
                <input
                  type="text"
                  value={state.settings.name}
                  onChange={(e) =>
                    setState(updateSettings(state, { name: e.target.value }))
                  }
                  placeholder="名前を入力"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>通知設定</label>
                <button
                  onClick={() =>
                    setState(
                      updateSettings(state, {
                        notificationsEnabled: !state.settings.notificationsEnabled,
                      })
                    )
                  }
                  style={{
                    ...styles.button,
                    width: '100%',
                    background: state.settings.notificationsEnabled
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : '#e5e7eb',
                    color: state.settings.notificationsEnabled ? '#fff' : '#6b7280',
                  }}
                >
                  {state.settings.notificationsEnabled ? '通知 ON' : '通知 OFF'}
                </button>
              </div>
            </div>

            <div style={styles.card}>
              <h2 style={{ marginBottom: '20px', color: '#1f2937' }}>デバッグ</h2>
              <button
                onClick={handleReset}
                style={{
                  ...styles.button,
                  ...styles.dangerButton,
                  width: '100%',
                }}
              >
                すべてのデータをリセット
              </button>
            </div>
          </>
        )}
      </main>

      {/* タブバー */}
      <nav style={styles.tabBar}>
        <button
          onClick={() => setActiveTab('todo')}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'todo' ? styles.tabButtonActive : {}),
          }}
        >
          <span style={styles.tabIcon}>📋</span>
          <span>Todo</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('add');
            resetForm();
          }}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'add' ? styles.tabButtonActive : {}),
          }}
        >
          <span style={styles.tabIcon}>➕</span>
          <span>追加</span>
        </button>
        <button
          onClick={() => setActiveTab('mypage')}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'mypage' ? styles.tabButtonActive : {}),
          }}
        >
          <span style={styles.tabIcon}>👤</span>
          <span>マイページ</span>
        </button>
      </nav>

      {/* モーダル：タスク編集 */}
      {modal === 'editTask' && editingTask && (
        <div style={styles.modal} onClick={() => setModal('none')}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeButton} onClick={() => setModal('none')}>
              ×
            </button>
            <h2 style={styles.modalTitle}>タスクを編集</h2>

            <div style={styles.formGroup}>
              <label style={styles.label}>タスク名</label>
              <input
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>優先度</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3].map((p) => {
                  const pStyle = getPriorityColor(p);
                  return (
                    <button
                      key={p}
                      onClick={() => setNewTaskPriority(p as 1 | 2 | 3)}
                      style={{
                        ...styles.button,
                        flex: 1,
                        background:
                          newTaskPriority === p ? pStyle.bg : '#f3f4f6',
                        color: newTaskPriority === p ? pStyle.color : '#9ca3af',
                        border:
                          newTaskPriority === p
                            ? `2px solid ${pStyle.color}`
                            : '2px solid transparent',
                      }}
                    >
                      {getPriorityText(p)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>期限</label>
              <input
                type="date"
                value={newTaskDeadline}
                onChange={(e) => setNewTaskDeadline(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>サブタスク</label>
              <div style={styles.subTaskList}>
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
                      ...styles.subTaskChip,
                      background: selectedSubTasks.includes(st)
                        ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                        : '#f3f4f6',
                      color: selectedSubTasks.includes(st) ? '#fff' : '#374151',
                    }}
                  >
                    {selectedSubTasks.includes(st) && '✓ '}
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setModal('none')}
                style={{
                  ...styles.button,
                  ...styles.secondaryButton,
                  flex: 1,
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleUpdateTask}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  flex: 1,
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* モーダル：祝福 */}
      {modal === 'celebration' && (
        <div style={styles.modal} onClick={() => setModal('none')}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.celebration}>
              <div style={styles.celebrationEmoji}>🎉🎊</div>
              <div style={styles.celebrationText}>おめでとう！</div>
              <div style={styles.celebrationSubText}>
                タスクを完了しました！
              </div>
              <button
                onClick={() => setModal('none')}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  marginTop: '24px',
                }}
              >
                やったね！
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 紙吹雪 */}
      {showConfetti && (
        <>
          <div
            style={{
              ...styles.confetti,
              left: '10%',
              bottom: '20%',
              fontSize: '3rem',
              animation: 'confetti-left 1s ease-out forwards',
            }}
          >
            🎊
          </div>
          <div
            style={{
              ...styles.confetti,
              right: '10%',
              bottom: '20%',
              fontSize: '3rem',
              animation: 'confetti-right 1s ease-out forwards',
            }}
          >
            🎉
          </div>
          <style>
            {`
              @keyframes confetti-left {
                0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
                100% { transform: translate(-50px, -200px) rotate(-45deg); opacity: 0; }
              }
              @keyframes confetti-right {
                0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
                100% { transform: translate(50px, -200px) rotate(45deg); opacity: 0; }
              }
            `}
          </style>
        </>
      )}

      {/* メッセージ */}
      {message && (
        <div
          style={{
            position: 'fixed',
            top: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '24px',
            fontSize: '0.9rem',
            zIndex: 3000,
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
