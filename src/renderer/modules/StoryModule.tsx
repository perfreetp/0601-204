import React from 'react';
import { useAppStore } from '../store/appStore';
import type { StoryLog, NPCArchive, Permission, Character } from '@shared/types';

const StoryModule: React.FC = () => {
  const {
    storyLogs,
    npcArchives,
    characters,
    diceHistory,
    currentUser,
    addStoryLog,
    updateStoryLog,
    deleteStoryLog,
    addNPCArchive,
    updateNPCArchive,
    deleteNPCArchive,
  } = useAppStore();

  const [activeTab, setActiveTab] = React.useState<'logs' | 'rolls' | 'npcs'>('logs');
  const [showCreateLog, setShowCreateLog] = React.useState(false);
  const [showCreateNPC, setShowCreateNPC] = React.useState(false);
  const [selectedLog, setSelectedLog] = React.useState<StoryLog | null>(null);
  const [selectedNPC, setSelectedNPC] = React.useState<NPCArchive | null>(null);

  const hasPermission = (perm: Permission) => currentUser.permissions.includes(perm);

  const [newLogTitle, setNewLogTitle] = React.useState('');
  const [newLogContent, setNewLogContent] = React.useState('');
  const [newLogTags, setNewLogTags] = React.useState('');

  const [editLogTitle, setEditLogTitle] = React.useState('');
  const [editLogContent, setEditLogContent] = React.useState('');
  const [editLogTags, setEditLogTags] = React.useState('');

  const handleCreateLog = () => {
    if (!newLogTitle.trim()) return;
    addStoryLog({
      title: newLogTitle.trim(),
      content: newLogContent.trim(),
      tags: newLogTags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
      characterIds: [],
    });
    setNewLogTitle('');
    setNewLogContent('');
    setNewLogTags('');
    setShowCreateLog(false);
  };

  React.useEffect(() => {
    if (selectedLog) {
      setEditLogTitle(selectedLog.title);
      setEditLogContent(selectedLog.content);
      setEditLogTags(selectedLog.tags.join(', '));
    }
  }, [selectedLog]);

  const handleSaveLog = () => {
    if (!selectedLog || !editLogTitle.trim()) return;
    updateStoryLog(selectedLog.id, {
      title: editLogTitle.trim(),
      content: editLogContent.trim(),
      tags: editLogTags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
    });
  };

  const npcs = characters.filter((c) => c.isNPC);

  const [newNPCCharId, setNewNPCCharId] = React.useState('');
  const [newNPCStatus, setNewNPCStatus] = React.useState<'active' | 'deceased' | 'missing' | 'archived'>('active');
  const [newNPCFirstApp, setNewNPCFirstApp] = React.useState('');
  const [newNPCNotes, setNewNPCNotes] = React.useState('');

  const handleCreateNPC = () => {
    if (!newNPCCharId) return;
    addNPCArchive({
      characterId: newNPCCharId,
      status: newNPCStatus,
      firstAppearance: newNPCFirstApp.trim() || undefined,
      notes: newNPCNotes.trim(),
      importantEvents: [],
    });
    setNewNPCCharId('');
    setNewNPCStatus('active');
    setNewNPCFirstApp('');
    setNewNPCNotes('');
    setShowCreateNPC(false);
  };

  const statusLabels: Record<string, { label: string; className: string }> = {
    active: { label: '活跃', className: 'badge-success' },
    deceased: { label: '已死亡', className: 'badge-danger' },
    missing: { label: '失踪', className: 'badge-warning' },
    archived: { label: '已归档', className: 'badge-secondary' },
  };

  const [newEvent, setNewEvent] = React.useState('');

  const addImportantEvent = () => {
    if (!selectedNPC || !newEvent.trim()) return;
    updateNPCArchive(selectedNPC.id, {
      importantEvents: [...selectedNPC.importantEvents, newEvent.trim()],
    });
    setNewEvent('');
  };

  const removeImportantEvent = (index: number) => {
    if (!selectedNPC) return;
    const events = [...selectedNPC.importantEvents];
    events.splice(index, 1);
    updateNPCArchive(selectedNPC.id, { importantEvents: events });
  };

  const formatTime = (t: number) =>
    new Date(t).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">剧情日志</h1>
        <div className="page-actions">
          {activeTab === 'logs' && hasPermission('edit_story') && (
            <button className="btn btn-primary" onClick={() => setShowCreateLog(true)}>+ 新建日志</button>
          )}
          {activeTab === 'npcs' && hasPermission('edit_story') && (
            <button className="btn btn-primary" onClick={() => setShowCreateNPC(true)}>+ NPC归档</button>
          )}
        </div>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
          剧情摘要 ({storyLogs.length})
        </div>
        <div className={`tab ${activeTab === 'rolls' ? 'active' : ''}`} onClick={() => setActiveTab('rolls')}>
          检定记录 ({diceHistory.length})
        </div>
        <div className={`tab ${activeTab === 'npcs' ? 'active' : ''}`} onClick={() => setActiveTab('npcs')}>
          NPC 归档 ({npcArchives.length})
        </div>
      </div>

      {activeTab === 'logs' && (
        <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 240px)' }}>
          <div style={{ width: 300, overflowY: 'auto', flexShrink: 0 }}>
            {storyLogs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📖</div>
                <div className="empty-text">还没有剧情日志</div>
              </div>
            ) : (
              storyLogs.map((log) => (
                <div
                  key={log.id}
                  className="list-item"
                  style={{
                    cursor: 'pointer',
                    border: selectedLog?.id === log.id ? '1px solid var(--accent)' : '1px solid transparent',
                  }}
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="list-item-content">
                    <div className="list-item-title">{log.title}</div>
                    <div className="list-item-desc">{formatTime(log.updatedAt)}</div>
                    {log.tags.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        {log.tags.slice(0, 3).map((t) => (
                          <span key={t} className="tag">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {!selectedLog ? (
              <div className="empty-state">
                <div className="empty-icon">✍️</div>
                <div className="empty-text">选择或创建剧情日志</div>
              </div>
            ) : (
              <div className="card">
                {hasPermission('edit_story') ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">标题</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editLogTitle}
                        onChange={(e) => setEditLogTitle(e.target.value)}
                        onBlur={handleSaveLog}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">标签（逗号分隔）</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editLogTags}
                        onChange={(e) => setEditLogTags(e.target.value)}
                        onBlur={handleSaveLog}
                        placeholder="例如：第一章, 战斗, 重要NPC"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">内容</label>
                      <textarea
                        className="form-textarea"
                        value={editLogContent}
                        onChange={(e) => setEditLogContent(e.target.value)}
                        onBlur={handleSaveLog}
                        style={{ minHeight: 300 }}
                        placeholder="记录本场剧情的摘要..."
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        创建于 {formatTime(selectedLog.createdAt)} · 最后更新 {formatTime(selectedLog.updatedAt)}
                      </div>
                      <button className="btn btn-sm btn-danger" onClick={() => {
                        deleteStoryLog(selectedLog.id);
                        setSelectedLog(null);
                      }}>
                        删除
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 style={{ fontSize: 20, marginBottom: 8 }}>{selectedLog.title}</h2>
                    <div style={{ marginBottom: 16 }}>
                      {selectedLog.tags.map((t) => (
                        <span key={t} className="tag">{t}</span>
                      ))}
                    </div>
                    <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                      {selectedLog.content}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 20 }}>
                      创建于 {formatTime(selectedLog.createdAt)} · 最后更新 {formatTime(selectedLog.updatedAt)}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'rolls' && (
        <div>
          {diceHistory.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎲</div>
              <div className="empty-text">还没有投骰记录</div>
            </div>
          ) : (
            diceHistory.map((roll) => {
              const char = characters.find((c) => c.id === roll.characterId);
              return (
                <div key={roll.id} className="list-item">
                  <div style={{ fontSize: 24 }}>🎲</div>
                  <div className="list-item-content">
                    <div className="list-item-title">
                      <span style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: 18 }}>
                        {roll.total}
                      </span>
                      <span style={{ marginLeft: 12, color: 'var(--text-secondary)' }}>
                        {roll.count}{roll.dice}{roll.modifier > 0 ? `+${roll.modifier}` : roll.modifier < 0 ? roll.modifier : ''}
                      </span>
                      {roll.skillName && (
                        <span className="badge badge-info" style={{ marginLeft: 8 }}>{roll.skillName}</span>
                      )}
                      {char && (
                        <span className="badge badge-secondary" style={{ marginLeft: 8 }}>{char.name}</span>
                      )}
                    </div>
                    <div className="list-item-desc">
                      投掷结果: [{roll.results.join(', ')}]
                      {roll.note && <span style={{ marginLeft: 12 }}>· {roll.note}</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {formatTime(roll.timestamp)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'npcs' && (
        <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 240px)' }}>
          <div style={{ width: 280, overflowY: 'auto', flexShrink: 0 }}>
            {npcArchives.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <div className="empty-text">还没有归档的 NPC</div>
              </div>
            ) : (
              npcArchives.map((archive) => {
                const char = characters.find((c) => c.id === archive.characterId);
                if (!char) return null;
                return (
                  <div
                    key={archive.id}
                    className="list-item"
                    style={{
                      cursor: 'pointer',
                      border: selectedNPC?.id === archive.id ? '1px solid var(--accent)' : '1px solid transparent',
                    }}
                    onClick={() => setSelectedNPC(archive)}
                  >
                    <div className="user-avatar" style={{ width: 36, height: 36 }}>
                      {char.avatar ? <img src={char.avatar} alt="" /> : <span>{char.name.charAt(0)}</span>}
                    </div>
                    <div className="list-item-content">
                      <div className="list-item-title">
                        {char.name}
                        <span className={`badge ${statusLabels[archive.status].className}`} style={{ marginLeft: 6 }}>
                          {statusLabels[archive.status].label}
                        </span>
                      </div>
                      <div className="list-item-desc">
                        {archive.firstAppearance || '首次登场未记录'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {!selectedNPC ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <div className="empty-text">选择一个 NPC 查看归档</div>
              </div>
            ) : (
              <NPCArchiveDetail
                archive={selectedNPC}
                char={characters.find((c) => c.id === selectedNPC.characterId)!}
                canEdit={hasPermission('edit_story')}
                onUpdate={(updates) => updateNPCArchive(selectedNPC.id, updates)}
                onDelete={() => {
                  deleteNPCArchive(selectedNPC.id);
                  setSelectedNPC(null);
                }}
                newEvent={newEvent}
                setNewEvent={setNewEvent}
                addImportantEvent={addImportantEvent}
                removeImportantEvent={removeImportantEvent}
              />
            )}
          </div>
        </div>
      )}

      {showCreateLog && (
        <div className="modal-overlay" onClick={() => setShowCreateLog(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ minWidth: 500 }}>
            <div className="modal-header">
              <div className="modal-title">新建剧情日志</div>
              <button className="modal-close" onClick={() => setShowCreateLog(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">标题</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="例如：第一章 - 神秘的来信"
                  value={newLogTitle}
                  onChange={(e) => setNewLogTitle(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">标签（逗号分隔，可选）</label>
                <input
                  type="text"
                  className="form-input"
                  value={newLogTags}
                  onChange={(e) => setNewLogTags(e.target.value)}
                  placeholder="例如：第一章, 探索"
                />
              </div>
              <div className="form-group">
                <label className="form-label">内容</label>
                <textarea
                  className="form-textarea"
                  value={newLogContent}
                  onChange={(e) => setNewLogContent(e.target.value)}
                  placeholder="记录本场剧情..."
                  style={{ minHeight: 200 }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowCreateLog(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreateLog} disabled={!newLogTitle.trim()}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateNPC && (
        <div className="modal-overlay" onClick={() => setShowCreateNPC(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">归档 NPC</div>
              <button className="modal-close" onClick={() => setShowCreateNPC(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">选择 NPC 角色</label>
                <select
                  className="form-select"
                  value={newNPCCharId}
                  onChange={(e) => setNewNPCCharId(e.target.value)}
                >
                  <option value="">选择角色</option>
                  {npcs.filter((c) => !npcArchives.some((a) => a.characterId === c.id)).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">状态</label>
                <select
                  className="form-select"
                  value={newNPCStatus}
                  onChange={(e) => setNewNPCStatus(e.target.value as any)}
                >
                  <option value="active">活跃</option>
                  <option value="deceased">已死亡</option>
                  <option value="missing">失踪</option>
                  <option value="archived">已归档</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">首次登场（可选）</label>
                <input
                  type="text"
                  className="form-input"
                  value={newNPCFirstApp}
                  onChange={(e) => setNewNPCFirstApp(e.target.value)}
                  placeholder="例如：第一章"
                />
              </div>
              <div className="form-group">
                <label className="form-label">备注</label>
                <textarea
                  className="form-textarea"
                  value={newNPCNotes}
                  onChange={(e) => setNewNPCNotes(e.target.value)}
                  placeholder="关于这个 NPC 的备注..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowCreateNPC(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreateNPC} disabled={!newNPCCharId}>
                归档
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface NPCDetailProps {
  archive: NPCArchive;
  char: Character;
  canEdit: boolean;
  onUpdate: (updates: Partial<NPCArchive>) => void;
  onDelete: () => void;
  newEvent: string;
  setNewEvent: (v: string) => void;
  addImportantEvent: () => void;
  removeImportantEvent: (idx: number) => void;
}

const NPCArchiveDetail: React.FC<NPCDetailProps> = ({
  archive,
  char,
  canEdit,
  onUpdate,
  onDelete,
  newEvent,
  setNewEvent,
  addImportantEvent,
  removeImportantEvent,
}) => {
  const statusLabels: Record<string, { label: string; className: string }> = {
    active: { label: '活跃', className: 'badge-success' },
    deceased: { label: '已死亡', className: 'badge-danger' },
    missing: { label: '失踪', className: 'badge-warning' },
    archived: { label: '已归档', className: 'badge-secondary' },
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
        <div style={{ width: 80, height: 80, borderRadius: 8, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: 32, flexShrink: 0 }}>
          {char.avatar ? <img src={char.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : char.name.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <h2 style={{ fontSize: 22 }}>{char.name}</h2>
            <span className={`badge ${statusLabels[archive.status].className}`}>
              {statusLabels[archive.status].label}
            </span>
          </div>
          {[char.race, char.class].filter(Boolean).length > 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {[char.race, char.class].filter(Boolean).join(' · ')}
            </div>
          )}
          {char.description && (
            <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 13 }}>{char.description}</div>
          )}
        </div>
      </div>

      <div className="divider" />

      <div className="form-group">
        <label className="form-label">状态</label>
        <select
          className="form-select"
          value={archive.status}
          onChange={(e) => canEdit && onUpdate({ status: e.target.value as any })}
          disabled={!canEdit}
        >
          <option value="active">活跃</option>
          <option value="deceased">已死亡</option>
          <option value="missing">失踪</option>
          <option value="archived">已归档</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">首次登场</label>
        <input
          type="text"
          className="form-input"
          value={archive.firstAppearance || ''}
          onChange={(e) => canEdit && onUpdate({ firstAppearance: e.target.value })}
          disabled={!canEdit}
          placeholder="例如：第一章"
        />
      </div>

      <div className="form-group">
        <label className="form-label">备注</label>
        <textarea
          className="form-textarea"
          value={archive.notes}
          onChange={(e) => canEdit && onUpdate({ notes: e.target.value })}
          disabled={!canEdit}
          placeholder="关于这个 NPC 的备注..."
          style={{ minHeight: 100 }}
        />
      </div>

      <div className="form-group">
        <label className="form-label">重要事件记录</label>
        {archive.importantEvents.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 8 }}>暂无重要事件</div>
        ) : (
          archive.importantEvents.map((ev, idx) => (
            <div key={idx} className="list-item" style={{ padding: '8px 12px' }}>
              <div style={{ flex: 1, fontSize: 13 }}>• {ev}</div>
              {canEdit && (
                <button className="btn btn-sm btn-danger" onClick={() => removeImportantEvent(idx)}>
                  删除
                </button>
              )}
            </div>
          ))
        )}
        {canEdit && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              type="text"
              className="form-input"
              value={newEvent}
              onChange={(e) => setNewEvent(e.target.value)}
              placeholder="记录一个重要事件..."
            />
            <button className="btn btn-primary" onClick={addImportantEvent} disabled={!newEvent.trim()}>
              添加
            </button>
          </div>
        )}
      </div>

      {canEdit && (
        <div style={{ marginTop: 16 }}>
          <button className="btn btn-sm btn-danger" onClick={onDelete}>移除此归档</button>
        </div>
      )}
    </div>
  );
};

export default StoryModule;
