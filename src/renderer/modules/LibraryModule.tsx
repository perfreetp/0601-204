import React from 'react';
import { useAppStore } from '../store/appStore';
import type { LibraryItem, Permission } from '@shared/types';

declare global {
  interface Window {
    electronAPI?: {
      exportGroup: (data: string) => Promise<{ success: boolean; path?: string }>;
    };
  }
}

const defaultCategories = ['规则', '世界观', 'NPC资料', '道具', '地点', '其他'];

const LibraryModule: React.FC = () => {
  const {
    library,
    currentUser,
    addLibraryItem,
    updateLibraryItem,
    deleteLibraryItem,
    exportAllData,
    characters,
    storyLogs,
    npcArchives,
    mapState,
    diceHistory,
    currentGroup,
  } = useAppStore();

  const hasPermission = (perm: Permission) => currentUser.permissions.includes(perm);

  const [selectedCategory, setSelectedCategory] = React.useState<string>('全部');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showCreate, setShowCreate] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<LibraryItem | null>(null);
  const [showExport, setShowExport] = React.useState(false);

  const [newTitle, setNewTitle] = React.useState('');
  const [newCategory, setNewCategory] = React.useState(defaultCategories[0]);
  const [newContent, setNewContent] = React.useState('');
  const [newTags, setNewTags] = React.useState('');

  const [editTitle, setEditTitle] = React.useState('');
  const [editCategory, setEditCategory] = React.useState('');
  const [editContent, setEditContent] = React.useState('');
  const [editTags, setEditTags] = React.useState('');

  React.useEffect(() => {
    if (selectedItem) {
      setEditTitle(selectedItem.title);
      setEditCategory(selectedItem.category);
      setEditContent(selectedItem.content);
      setEditTags(selectedItem.tags.join(', '));
    }
  }, [selectedItem]);

  const categories = ['全部', ...defaultCategories];
  const allUsedCategories = new Set(library.map((l) => l.category));
  allUsedCategories.forEach((c) => {
    if (!categories.includes(c)) categories.push(c);
  });

  const filteredItems = library.filter((item) => {
    const matchCategory = selectedCategory === '全部' || item.category === selectedCategory;
    const matchSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    addLibraryItem({
      title: newTitle.trim(),
      category: newCategory,
      content: newContent.trim(),
      tags: newTags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
    });
    setNewTitle('');
    setNewCategory(defaultCategories[0]);
    setNewContent('');
    setNewTags('');
    setShowCreate(false);
  };

  const handleSaveEdit = () => {
    if (!selectedItem || !editTitle.trim()) return;
    updateLibraryItem(selectedItem.id, {
      title: editTitle.trim(),
      category: editCategory,
      content: editContent.trim(),
      tags: editTags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
    });
  };

  const handleExport = async () => {
    const data = exportAllData();
    if (window.electronAPI) {
      const result = await window.electronAPI.exportGroup(data);
      if (result.success) {
        alert(`已导出到: ${result.path}`);
      }
    } else {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trpg-group-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setShowExport(false);
  };

  const formatTime = (t: number) =>
    new Date(t).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  const exportSummary = React.useMemo(() => ({
    members: currentGroup?.members.length || 0,
    characters: characters.length,
    playerChars: characters.filter((c) => !c.isNPC).length,
    npcs: characters.filter((c) => c.isNPC).length,
    storyLogs: storyLogs.length,
    npcArchives: npcArchives.length,
    libraryItems: library.length,
    diceRolls: diceHistory.length,
    mapMarkers: mapState.markers.length,
    clueCards: mapState.clueCards.length,
  }), [currentGroup, characters, storyLogs, npcArchives, library, diceHistory, mapState]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
      <div className="page-header">
        <h1 className="page-title">资料库</h1>
        <div className="page-actions">
          {hasPermission('edit_group') && (
            <button className="btn btn-primary" onClick={() => setShowExport(true)}>
              📤 导出整团回顾
            </button>
          )}
          {hasPermission('edit_story') && (
            <button className="btn btn-secondary" onClick={() => setShowCreate(true)}>
              + 新建条目
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          className="form-input"
          style={{ width: 280 }}
          placeholder="🔍 搜索标题、内容或标签..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {categories.map((cat) => (
          <button
            key={cat}
            className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
            {cat !== '全部' && (
              <span style={{ marginLeft: 4, opacity: 0.7 }}>
                ({library.filter((l) => l.category === cat).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flex: 1, overflow: 'hidden' }}>
        <div style={{ width: 300, overflowY: 'auto', flexShrink: 0 }}>
          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <div className="empty-text">暂无资料条目</div>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="list-item"
                style={{
                  cursor: 'pointer',
                  border: selectedItem?.id === item.id ? '1px solid var(--accent)' : '1px solid transparent',
                }}
                onClick={() => setSelectedItem(item)}
              >
                <div className="list-item-content">
                  <div className="list-item-title">{item.title}</div>
                  <div className="list-item-desc">
                    <span className="badge badge-info">{item.category}</span>
                    <span style={{ marginLeft: 8 }}>{formatTime(item.updatedAt)}</span>
                  </div>
                  {item.tags.length > 0 && (
                    <div style={{ marginTop: 4 }}>
                      {item.tags.slice(0, 3).map((t) => (
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
          {!selectedItem ? (
            <div className="empty-state">
              <div className="empty-icon">📖</div>
              <div className="empty-text">选择或创建一个资料条目</div>
            </div>
          ) : hasPermission('edit_story') ? (
            <div className="card">
              <div className="form-group">
                <label className="form-label">标题</label>
                <input
                  type="text"
                  className="form-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleSaveEdit}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">分类</label>
                  <select
                    className="form-select"
                    value={editCategory}
                    onChange={(e) => {
                      setEditCategory(e.target.value);
                      setTimeout(handleSaveEdit, 0);
                    }}
                  >
                    {defaultCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">标签（逗号分隔）</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    onBlur={handleSaveEdit}
                    placeholder="规则, COC"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">内容</label>
                <textarea
                  className="form-textarea"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onBlur={handleSaveEdit}
                  style={{ minHeight: 350, fontFamily: 'monospace' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  创建于 {formatTime(selectedItem.createdAt)} · 最后更新 {formatTime(selectedItem.updatedAt)}
                </div>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => {
                    deleteLibraryItem(selectedItem.id);
                    setSelectedItem(null);
                  }}
                >
                  删除
                </button>
              </div>
            </div>
          ) : (
            <div className="card">
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>{selectedItem.title}</h2>
              <div style={{ marginBottom: 12 }}>
                <span className="badge badge-info">{selectedItem.category}</span>
                {selectedItem.tags.map((t) => (
                  <span key={t} className="tag" style={{ marginLeft: 4 }}>{t}</span>
                ))}
              </div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                {selectedItem.content}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 20 }}>
                创建于 {formatTime(selectedItem.createdAt)} · 最后更新 {formatTime(selectedItem.updatedAt)}
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ minWidth: 500 }}>
            <div className="modal-header">
              <div className="modal-title">新建资料条目</div>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">标题</label>
                <input
                  type="text"
                  className="form-input"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="条目标题"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">分类</label>
                  <select
                    className="form-select"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    {defaultCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">标签（可选）</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="标签1, 标签2"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">内容</label>
                <textarea
                  className="form-textarea"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="资料内容..."
                  style={{ minHeight: 200 }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowCreate(false)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={!newTitle.trim()}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {showExport && (
        <div className="modal-overlay" onClick={() => setShowExport(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ minWidth: 480 }}>
            <div className="modal-header">
              <div className="modal-title">导出整团回顾</div>
              <button className="modal-close" onClick={() => setShowExport(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
                将导出当前团的所有数据为 JSON 文件，包括角色、剧情、地图、投骰记录等所有内容，方便存档和分享。
              </p>
              <div className="card" style={{ background: 'var(--bg-primary)' }}>
                <div className="card-title" style={{ fontSize: 13, marginBottom: 12 }}>📊 数据概览</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 12 }}>
                  <div>👥 成员数：<b>{exportSummary.members}</b></div>
                  <div>👤 玩家角色：<b>{exportSummary.playerChars}</b></div>
                  <div>🧟 NPC：<b>{exportSummary.npcs}</b></div>
                  <div>📖 剧情日志：<b>{exportSummary.storyLogs}</b></div>
                  <div>🗂️ NPC归档：<b>{exportSummary.npcArchives}</b></div>
                  <div>📚 资料条目：<b>{exportSummary.libraryItems}</b></div>
                  <div>🎲 投骰记录：<b>{exportSummary.diceRolls}</b></div>
                  <div>📍 地图标记：<b>{exportSummary.mapMarkers}</b></div>
                  <div>📋 线索卡：<b>{exportSummary.clueCards}</b></div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowExport(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleExport}>
                📤 确认导出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryModule;
