import React from 'react';
import { useAppStore } from '../store/appStore';
import { desktop } from '../desktop';
import type { LibraryItem, Permission, GroupExport } from '@shared/types';

const defaultCategories = ['规则', '世界观', 'NPC资料', '道具', '地点', '其他'];

const formatTime = (t: number) =>
  new Date(t).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

function buildReviewContent(snap: GroupExport): string {
  const lines: string[] = [];
  lines.push(`团名：${snap.group.name}`);
  lines.push(`系统：${snap.group.system}`);
  lines.push(`创建时间：${formatTime(snap.group.createdAt)}`);
  lines.push(`成员数：${snap.group.members.length}`);
  lines.push('');
  lines.push('【成员】');
  snap.group.members.forEach((m) => {
    lines.push(`  - ${m.name}（${m.role}）`);
  });
  lines.push('');
  lines.push(`【角色】共 ${snap.characters.length} 个`);
  snap.characters.forEach((c) => {
    lines.push(`  - ${c.name}${c.isNPC ? '（NPC）' : ''}${c.class ? ' · ' + c.class : ''}`);
  });
  lines.push('');
  lines.push(`【剧情摘要】共 ${snap.storyLogs.length} 条`);
  snap.storyLogs.forEach((log) => {
    lines.push(`  · ${log.title} — ${formatTime(log.createdAt)}`);
  });
  lines.push('');
  lines.push(`【地图标记】共 ${snap.mapState.markers.length} 个，线索卡 ${snap.mapState.clueCards.length} 张`);
  snap.mapState.markers.forEach((m) => {
    lines.push(`  📍 ${m.label}（${m.type}）`);
  });
  lines.push('');
  lines.push(`【投骰记录】共 ${snap.diceHistory.length} 次`);
  lines.push('');
  lines.push(`导出时间：${formatTime(snap.exportedAt)}`);
  return lines.join('\n');
}

const ReviewPreview: React.FC<{ snapshot: GroupExport; onClose: () => void }> = ({ snapshot, onClose }) => {
  const snap = snapshot;
  const keyMessages = React.useMemo(() => {
    // 截取非私密的最新 20 条消息作为"聊天重点"
    if (!('chatMessages' in (snap as any))) return [];
    const msgs = (snap as any).chatMessages || [];
    return msgs
      .filter((m: any) => !m.isPrivate)
      .slice(-20)
      .reverse();
  }, [snap]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ minWidth: 640, maxWidth: 780, maxHeight: '80vh' }}>
        <div className="modal-header">
          <div className="modal-title">📋 整团回顾预览</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ overflowY: 'auto', maxHeight: '65vh' }}>
          <div className="card" style={{ background: 'var(--bg-primary)', marginBottom: 12 }}>
            <div className="card-title" style={{ fontSize: 13 }}>🏰 团信息</div>
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>
              <div>团名：<b>{snap.group.name}</b></div>
              <div>系统：{snap.group.system}</div>
              <div>创建：{formatTime(snap.group.createdAt)}</div>
              {snap.group.description && <div>简介：{snap.group.description}</div>}
            </div>
          </div>

          <div className="card" style={{ background: 'var(--bg-primary)', marginBottom: 12 }}>
            <div className="card-title" style={{ fontSize: 13 }}>👥 成员（{snap.group.members.length}）</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 12 }}>
              {snap.group.members.map((m) => (
                <span key={m.id} className="badge badge-info">{m.name} · {m.role}</span>
              ))}
            </div>
          </div>

          <div className="card" style={{ background: 'var(--bg-primary)', marginBottom: 12 }}>
            <div className="card-title" style={{ fontSize: 13 }}>👤 角色（{snap.characters.length}）</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, fontSize: 12 }}>
              {snap.characters.map((c) => (
                <div key={c.id} style={{ padding: 6, border: '1px solid var(--border)', borderRadius: 6 }}>
                  <b>{c.name}</b> {c.isNPC && <span className="tag" style={{ marginLeft: 4 }}>NPC</span>}
                  {c.class && <div style={{ color: 'var(--text-muted)' }}>{c.class}</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ background: 'var(--bg-primary)', marginBottom: 12 }}>
            <div className="card-title" style={{ fontSize: 13 }}>📖 剧情摘要（{snap.storyLogs.length}）</div>
            {snap.storyLogs.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>暂无剧情日志</div>
            ) : (
              snap.storyLogs.map((log) => (
                <div key={log.id} style={{ fontSize: 12, padding: 6, borderBottom: '1px dashed var(--border)' }}>
                  <b>{log.title}</b> <span style={{ color: 'var(--text-muted)' }}>— {formatTime(log.createdAt)}</span>
                  <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>{log.content.slice(0, 80)}{log.content.length > 80 ? '...' : ''}</div>
                </div>
              ))
            )}
          </div>

          <div className="card" style={{ background: 'var(--bg-primary)', marginBottom: 12 }}>
            <div className="card-title" style={{ fontSize: 13 }}>📍 地图标记（{snap.mapState.markers.length}） · 线索卡（{snap.mapState.clueCards.length}）</div>
            {snap.mapState.markers.length === 0 && snap.mapState.clueCards.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>暂无地图内容</div>
            ) : (
              <>
                {snap.mapState.markers.map((m) => (
                  <div key={m.id} style={{ fontSize: 12 }}>📍 <b>{m.label}</b> <span className="tag">{m.type}</span></div>
                ))}
                {snap.mapState.clueCards.map((c) => (
                  <div key={c.id} style={{ fontSize: 12 }}>📋 <b>{c.title}</b> — {c.content.slice(0, 40)}</div>
                ))}
              </>
            )}
          </div>

          {keyMessages.length > 0 && (
            <div className="card" style={{ background: 'var(--bg-primary)', marginBottom: 12 }}>
              <div className="card-title" style={{ fontSize: 13 }}>💬 聊天重点（{keyMessages.length}）</div>
              {keyMessages.slice(0, 10).map((m: any) => (
                <div key={m.id} style={{ fontSize: 12, padding: 4, borderBottom: '1px dashed var(--border)' }}>
                  <b style={{ color: 'var(--accent)' }}>{m.senderName}</b>：{m.content.slice(0, 80)}
                </div>
              ))}
            </div>
          )}

          <div className="card" style={{ background: 'var(--bg-primary)' }}>
            <div className="card-title" style={{ fontSize: 13 }}>🎲 投骰记录（{snap.diceHistory.length}）</div>
            {snap.diceHistory.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>暂无投骰</div>
            ) : (
              snap.diceHistory.slice(-10).reverse().map((r) => (
                <div key={r.id} style={{ fontSize: 12 }}>
                  🎲 <b>{r.count}{r.dice}</b> = {r.total} <span style={{ color: 'var(--text-muted)' }}>[{r.results.join(',')}]</span>
                  {r.skillName && <span className="tag" style={{ marginLeft: 4 }}>{r.skillName}</span>}
                </div>
              ))
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
};

const ReviewArchiveDetail: React.FC<{ item: LibraryItem; onBack: () => void; onDelete: () => void }> = ({ item, onBack, onDelete }) => {
  const snap = item.reviewSnapshot;
  if (!snap) return <div>无数据</div>;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button className="btn btn-sm btn-outline" onClick={onBack}>← 返回列表</button>
        <button className="btn btn-sm btn-danger" onClick={onDelete}>删除归档</button>
      </div>
      <ReviewPreview snapshot={snap} onClose={onBack} />
    </div>
  );
};

const ImportPreview: React.FC<{
  snapshot: GroupExport;
  raw: string;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ snapshot, onCancel, onConfirm }) => {
  const snap = snapshot;
  const stats = React.useMemo(() => ({
    groupName: snap.group.name,
    system: snap.group.system,
    members: snap.group.members.length,
    characters: snap.characters.length,
    playerChars: snap.characters.filter((c) => !c.isNPC).length,
    npcs: snap.characters.filter((c) => c.isNPC).length,
    logs: snap.storyLogs.length,
    npcArchives: snap.npcArchives.length,
    markers: snap.mapState.markers.length,
    clues: snap.mapState.clueCards.length,
    diceRolls: snap.diceHistory.length,
    library: snap.library.length,
    exportedAt: snap.exportedAt,
  }), [snap]);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ minWidth: 480 }}>
        <div className="modal-header">
          <div className="modal-title">📥 导入预览</div>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--warning)', marginBottom: 16, lineHeight: 1.6 }}>
            ⚠️ 确认导入将 <b>覆盖当前团的所有数据</b>，包括角色、剧情、地图、聊天、投骰等。建议先导出一份当前数据做备份。
          </p>
          <div className="card" style={{ background: 'var(--bg-primary)' }}>
            <div className="card-title" style={{ fontSize: 13, marginBottom: 12 }}>📦 文件内容概览</div>
            <div style={{ fontSize: 13, lineHeight: 2 }}>
              <div>🏰 团名：<b>{stats.groupName}</b>（{stats.system}）</div>
              <div>👥 成员数：<b>{stats.members}</b></div>
              <div>👤 角色：<b>{stats.characters}</b>（PC {stats.playerChars} / NPC {stats.npcs}）</div>
              <div>📖 剧情日志：<b>{stats.logs}</b> · NPC归档：<b>{stats.npcArchives}</b></div>
              <div>📍 地图标记：<b>{stats.markers}</b> · 线索卡：<b>{stats.clues}</b></div>
              <div>🎲 投骰记录：<b>{stats.diceRolls}</b> · 资料条目：<b>{stats.library}</b></div>
              <div style={{ color: 'var(--text-muted)', marginTop: 8 }}>导出时间：{formatTime(stats.exportedAt)}</div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onCancel}>取消</button>
          <button className="btn btn-primary" onClick={onConfirm}>
            ✅ 确认覆盖当前数据
          </button>
        </div>
      </div>
    </div>
  );
};

const LibraryModule: React.FC = () => {
  const {
    library,
    currentUser,
    addLibraryItem,
    updateLibraryItem,
    deleteLibraryItem,
    exportAllData,
    getExportSnapshot,
    importAllData,
    chatMessages,
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
  const [showPreview, setShowPreview] = React.useState(false);
  const [importSnapshot, setImportSnapshot] = React.useState<{ snap: GroupExport; raw: string } | null>(null);

  const [newTitle, setNewTitle] = React.useState('');
  const [newCategory, setNewCategory] = React.useState(defaultCategories[0]);
  const [newContent, setNewContent] = React.useState('');
  const [newTags, setNewTags] = React.useState('');

  const [editTitle, setEditTitle] = React.useState('');
  const [editCategory, setEditCategory] = React.useState('');
  const [editContent, setEditContent] = React.useState('');
  const [editTags, setEditTags] = React.useState('');

  React.useEffect(() => {
    if (selectedItem && selectedItem.itemType !== 'review_archive') {
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
    if (!selectedItem || !editTitle.trim() || selectedItem.itemType === 'review_archive') return;
    updateLibraryItem(selectedItem.id, {
      title: editTitle.trim(),
      category: editCategory,
      content: editContent.trim(),
      tags: editTags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
    });
  };

  const handleExport = async () => {
    const data = exportAllData();
    const result = await desktop.exportGroup(data);
    if (result.success) {
      if (result.path) {
        alert(`已导出到: ${result.path}`);
      } else {
        alert('导出成功');
      }
      setShowExport(false);
    }
    // 取消或失败：不关闭弹窗，不提示，让用户继续操作
  };

  const handleSaveAsArchive = () => {
    const snap = getExportSnapshot();
    const title = `${snap.group.name} - 整团回顾（${formatTime(snap.exportedAt)}）`;
    const content = buildReviewContent(snap);
    addLibraryItem({
      title,
      category: '整团回顾',
      content,
      tags: ['归档', '回顾'],
      itemType: 'review_archive',
      reviewSnapshot: snap,
    });
    alert('已保存到资料库归档列表');
    setShowExport(false);
  };

  const handlePickImportFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as GroupExport;
        if (!parsed.group || !parsed.exportedAt) {
          alert('文件格式不正确，请选择正确的整团回顾 JSON 文件');
          return;
        }
        setImportSnapshot({ snap: parsed, raw: text });
      } catch (e) {
        alert('解析失败：' + (e as Error).message);
      }
    };
    input.click();
  };

  const handleConfirmImport = () => {
    if (!importSnapshot) return;
    try {
      importAllData(importSnapshot.raw);
      alert('导入成功！当前数据已被覆盖。');
      setImportSnapshot(null);
      setSelectedItem(null);
    } catch (e) {
      alert('导入失败：' + (e as Error).message);
    }
  };

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

  const currentSnapshot = React.useMemo(() => getExportSnapshot(), [currentGroup, characters, storyLogs, npcArchives, library, diceHistory, mapState, chatMessages]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
      <div className="page-header">
        <h1 className="page-title">资料库</h1>
        <div className="page-actions">
          {hasPermission('edit_group') && (
            <button className="btn btn-outline" onClick={handlePickImportFile}>
              📥 导入回顾
            </button>
          )}
          {hasPermission('edit_group') && (
            <button className="btn btn-primary" onClick={() => setShowExport(true)}>
              📤 导出/归档整团回顾
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
                  <div className="list-item-title">
                    {item.itemType === 'review_archive' && '📋 '}
                    {item.title}
                  </div>
                  <div className="list-item-desc">
                    <span className="badge badge-info">{item.category}</span>
                    {item.itemType === 'review_archive' && (
                      <span className="badge" style={{ marginLeft: 6, background: 'var(--accent)', color: '#fff' }}>回顾归档</span>
                    )}
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
          ) : selectedItem.itemType === 'review_archive' ? (
            <ReviewArchiveDetail
              item={selectedItem}
              onBack={() => setSelectedItem(null)}
              onDelete={() => {
                deleteLibraryItem(selectedItem.id);
                setSelectedItem(null);
              }}
            />
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
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ minWidth: 500 }}>
            <div className="modal-header">
              <div className="modal-title">导出 / 归档整团回顾</div>
              <button className="modal-close" onClick={() => setShowExport(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
                可以先预览内容确认无误，再选择导出为 JSON 文件或保存为资料库归档条目。
              </p>
              <div className="card" style={{ background: 'var(--bg-primary)', marginBottom: 12 }}>
                <div className="card-title" style={{ fontSize: 13, marginBottom: 12 }}>📊 当前数据概览</div>
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
              <button className="btn btn-outline btn-sm" onClick={() => setShowPreview(true)}>
                👁️ 预览整团回顾
              </button>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowExport(false)}>取消</button>
              <button className="btn btn-secondary" onClick={handleSaveAsArchive}>
                📚 保存为资料库归档
              </button>
              <button className="btn btn-primary" onClick={handleExport}>
                📤 导出 JSON 文件
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <ReviewPreview
          snapshot={currentSnapshot}
          onClose={() => setShowPreview(false)}
        />
      )}

      {importSnapshot && (
        <ImportPreview
          snapshot={importSnapshot.snap}
          raw={importSnapshot.raw}
          onCancel={() => setImportSnapshot(null)}
          onConfirm={handleConfirmImport}
        />
      )}
    </div>
  );
};

export default LibraryModule;
