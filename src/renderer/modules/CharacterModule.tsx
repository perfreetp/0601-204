import React from 'react';
import { useAppStore } from '../store/appStore';
import type { Character, Permission } from '@shared/types';

declare global {
  interface Window {
    electronAPI?: {
      selectImage: () => Promise<string | null>;
    };
  }
}

const CharacterModule: React.FC = () => {
  const {
    characters,
    currentUser,
    currentGroup,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    addCharacterAttribute,
    updateCharacterAttribute,
    removeCharacterAttribute,
    addCharacterSkill,
    updateCharacterSkill,
    removeCharacterSkill,
  } = useAppStore();

  const [activeTab, setActiveTab] = React.useState<'pc' | 'npc'>('pc');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [showCreate, setShowCreate] = React.useState(false);
  const [newCharName, setNewCharName] = React.useState('');
  const [newCharType, setNewCharType] = React.useState<'pc' | 'npc'>('pc');

  const hasPermission = (perm: Permission) => currentUser.permissions.includes(perm);

  const filteredChars = characters.filter((c) =>
    activeTab === 'pc' ? !c.isNPC : c.isNPC
  );
  const selectedChar = characters.find((c) => c.id === selectedId);

  const handleCreate = () => {
    if (!newCharName.trim()) return;
    const newChar = addCharacter({
      name: newCharName.trim(),
      isNPC: newCharType === 'npc',
      playerId: newCharType === 'pc' ? currentUser.id : undefined,
    });
    setSelectedId(newChar.id);
    setNewCharName('');
    setShowCreate(false);
  };

  const handleAvatarUpload = async () => {
    if (!selectedChar || !hasPermission('edit_character')) return;
    if (window.electronAPI) {
      const img = await window.electronAPI.selectImage();
      if (img) updateCharacter(selectedChar.id, { avatar: img });
    }
  };

  const [newAttrName, setNewAttrName] = React.useState('');
  const [newAttrValue, setNewAttrValue] = React.useState(50);
  const [newSkillName, setNewSkillName] = React.useState('');
  const [newSkillValue, setNewSkillValue] = React.useState(30);

  const addAttr = () => {
    if (!selectedChar || !newAttrName.trim()) return;
    addCharacterAttribute(selectedChar.id, {
      name: newAttrName.trim(),
      value: newAttrValue,
    });
    setNewAttrName('');
    setNewAttrValue(50);
  };

  const addSkill = () => {
    if (!selectedChar || !newSkillName.trim()) return;
    addCharacterSkill(selectedChar.id, {
      name: newSkillName.trim(),
      value: newSkillValue,
    });
    setNewSkillName('');
    setNewSkillValue(30);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">角色卡</h1>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + 新建角色
          </button>
        </div>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'pc' ? 'active' : ''}`} onClick={() => setActiveTab('pc')}>
          玩家角色 ({characters.filter((c) => !c.isNPC).length})
        </div>
        <div className={`tab ${activeTab === 'npc' ? 'active' : ''}`} onClick={() => setActiveTab('npc')}>
          NPC ({characters.filter((c) => c.isNPC).length})
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 220px)' }}>
        <div style={{ width: 260, flexShrink: 0, overflowY: 'auto' }}>
          {filteredChars.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-icon">👤</div>
              <div className="empty-text">
                暂无{activeTab === 'pc' ? '玩家角色' : 'NPC'}
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => {
                setNewCharType(activeTab);
                setShowCreate(true);
              }}>
                创建
              </button>
            </div>
          ) : (
            filteredChars.map((c) => (
              <div
                key={c.id}
                className="list-item"
                style={{
                  cursor: 'pointer',
                  border: selectedId === c.id ? '1px solid var(--accent)' : '1px solid transparent',
                }}
                onClick={() => setSelectedId(c.id)}
              >
                <div className="user-avatar" style={{ width: 36, height: 36 }}>
                  {c.avatar ? <img src={c.avatar} alt="" /> : <span>{c.name.charAt(0)}</span>}
                </div>
                <div className="list-item-content">
                  <div className="list-item-title">{c.name}</div>
                  <div className="list-item-desc">
                    {[c.race, c.class].filter(Boolean).join(' · ') || (c.isNPC ? 'NPC' : '玩家角色')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!selectedChar ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-text">选择左侧角色查看详情</div>
            </div>
          ) : (
            <CharacterDetail
              char={selectedChar}
              canEdit={hasPermission('edit_character')}
              onAvatarUpload={handleAvatarUpload}
              onUpdate={(updates) => updateCharacter(selectedChar.id, updates)}
              onDelete={() => {
                deleteCharacter(selectedChar.id);
                setSelectedId(null);
              }}
              newAttrName={newAttrName}
              setNewAttrName={setNewAttrName}
              newAttrValue={newAttrValue}
              setNewAttrValue={setNewAttrValue}
              addAttr={addAttr}
              updateAttr={(name, value) => updateCharacterAttribute(selectedChar.id, name, value)}
              removeAttr={(name) => removeCharacterAttribute(selectedChar.id, name)}
              newSkillName={newSkillName}
              setNewSkillName={setNewSkillName}
              newSkillValue={newSkillValue}
              setNewSkillValue={setNewSkillValue}
              addSkill={addSkill}
              updateSkill={(name, value) => updateCharacterSkill(selectedChar.id, name, value)}
              removeSkill={(name) => removeCharacterSkill(selectedChar.id, name)}
              allCharacters={characters}
              currentGroup={currentGroup}
            />
          )}
        </div>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">新建角色</div>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">角色名称</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="输入角色名称"
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">角色类型</label>
                <select
                  className="form-select"
                  value={newCharType}
                  onChange={(e) => setNewCharType(e.target.value as any)}
                >
                  <option value="pc">玩家角色 (PC)</option>
                  <option value="npc">非玩家角色 (NPC)</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowCreate(false)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={!newCharName.trim()}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface DetailProps {
  char: Character;
  canEdit: boolean;
  onAvatarUpload: () => void;
  onUpdate: (updates: Partial<Character>) => void;
  onDelete: () => void;
  newAttrName: string;
  setNewAttrName: (v: string) => void;
  newAttrValue: number;
  setNewAttrValue: (v: number) => void;
  addAttr: () => void;
  updateAttr: (name: string, value: number) => void;
  removeAttr: (name: string) => void;
  newSkillName: string;
  setNewSkillName: (v: string) => void;
  newSkillValue: number;
  setNewSkillValue: (v: number) => void;
  addSkill: () => void;
  updateSkill: (name: string, value: number) => void;
  removeSkill: (name: string) => void;
  allCharacters: Character[];
  currentGroup: any;
}

const CharacterDetail: React.FC<DetailProps> = ({
  char,
  canEdit,
  onAvatarUpload,
  onUpdate,
  onDelete,
  newAttrName, setNewAttrName, newAttrValue, setNewAttrValue,
  addAttr, updateAttr, removeAttr,
  newSkillName, setNewSkillName, newSkillValue, setNewSkillValue,
  addSkill, updateSkill, removeSkill,
  allCharacters,
  currentGroup,
}) => {
  const [detailTab, setDetailTab] = React.useState<'basic' | 'attrs' | 'skills' | 'relations'>('basic');

  const player = currentGroup?.members.find((m: any) => m.id === char.playerId);

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div
            onClick={canEdit ? onAvatarUpload : undefined}
            style={{
              width: 120,
              height: 120,
              borderRadius: 8,
              background: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              cursor: canEdit ? 'pointer' : 'default',
              flexShrink: 0,
              fontSize: 48,
            }}
            title={canEdit ? '点击上传头像' : undefined}
          >
            {char.avatar ? (
              <img src={char.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span>{char.name.charAt(0)}</span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <h2 style={{ fontSize: 22 }}>{char.name}</h2>
              <span className={`badge ${char.isNPC ? 'badge-warning' : 'badge-info'}`}>
                {char.isNPC ? 'NPC' : 'PC'}
              </span>
              {player && <span className="badge badge-secondary">玩家: {player.name}</span>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">种族</label>
                <input
                  type="text"
                  className="form-input"
                  value={char.race || ''}
                  onChange={(e) => onUpdate({ race: e.target.value })}
                  disabled={!canEdit}
                  placeholder="例如：人类"
                />
              </div>
              <div className="form-group">
                <label className="form-label">职业</label>
                <input
                  type="text"
                  className="form-input"
                  value={char.class || ''}
                  onChange={(e) => onUpdate({ class: e.target.value })}
                  disabled={!canEdit}
                  placeholder="例如：侦探"
                />
              </div>
              <div className="form-group">
                <label className="form-label">年龄</label>
                <input
                  type="number"
                  className="form-input"
                  value={char.age || ''}
                  onChange={(e) => onUpdate({ age: parseInt(e.target.value) || undefined })}
                  disabled={!canEdit}
                  placeholder="年龄"
                />
              </div>
              <div className="form-group">
                <label className="form-label">性别</label>
                <input
                  type="text"
                  className="form-input"
                  value={char.gender || ''}
                  onChange={(e) => onUpdate({ gender: e.target.value })}
                  disabled={!canEdit}
                  placeholder="性别"
                />
              </div>
            </div>
            {canEdit && (
              <button className="btn btn-sm btn-danger" onClick={onDelete}>删除角色</button>
            )}
          </div>
        </div>
      </div>

      <div className="tabs">
        <div className={`tab ${detailTab === 'basic' ? 'active' : ''}`} onClick={() => setDetailTab('basic')}>基本信息</div>
        <div className={`tab ${detailTab === 'attrs' ? 'active' : ''}`} onClick={() => setDetailTab('attrs')}>属性</div>
        <div className={`tab ${detailTab === 'skills' ? 'active' : ''}`} onClick={() => setDetailTab('skills')}>技能</div>
        <div className={`tab ${detailTab === 'relations' ? 'active' : ''}`} onClick={() => setDetailTab('relations')}>关系网</div>
      </div>

      {detailTab === 'basic' && (
        <div className="card">
          <div className="form-group">
            <label className="form-label">外貌描述</label>
            <textarea
              className="form-textarea"
              value={char.description || ''}
              onChange={(e) => onUpdate({ description: e.target.value })}
              disabled={!canEdit}
              placeholder="描述角色的外貌特征..."
              style={{ minHeight: 100 }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">背景故事</label>
            <textarea
              className="form-textarea"
              value={char.background || ''}
              onChange={(e) => onUpdate({ background: e.target.value })}
              disabled={!canEdit}
              placeholder="角色的背景故事和经历..."
              style={{ minHeight: 150 }}
            />
          </div>
        </div>
      )}

      {detailTab === 'attrs' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">角色属性</div>
          </div>
          {char.attributes.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              暂无属性，添加一些属性吧（例如：力量、体质、敏捷等）
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
              {char.attributes.map((attr) => (
                <div
                  key={attr.name}
                  style={{
                    background: 'var(--bg-primary)',
                    padding: 12,
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{attr.name}</span>
                    {canEdit && (
                      <button
                        className="btn btn-sm btn-outline"
                        style={{ padding: '2px 6px', fontSize: 10 }}
                        onClick={() => removeAttr(attr.name)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    className="form-input"
                    value={attr.value}
                    onChange={(e) => updateAttr(attr.name, parseInt(e.target.value) || 0)}
                    disabled={!canEdit}
                    style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}
                  />
                </div>
              ))}
            </div>
          )}
          {canEdit && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">属性名</label>
                <input
                  type="text"
                  className="form-input"
                  value={newAttrName}
                  onChange={(e) => setNewAttrName(e.target.value)}
                  placeholder="例如：力量"
                />
              </div>
              <div style={{ width: 120 }}>
                <label className="form-label">数值</label>
                <input
                  type="number"
                  className="form-input"
                  value={newAttrValue}
                  onChange={(e) => setNewAttrValue(parseInt(e.target.value) || 0)}
                />
              </div>
              <button className="btn btn-primary" onClick={addAttr}>+ 添加</button>
            </div>
          )}
        </div>
      )}

      {detailTab === 'skills' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">技能列表</div>
          </div>
          {char.skills.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              暂无技能
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, marginBottom: 16 }}>
              {char.skills.map((skill) => (
                <div
                  key={skill.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: 'var(--bg-primary)',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                  }}
                >
                  <span style={{ flex: 1, fontSize: 13 }}>{skill.name}</span>
                  <input
                    type="number"
                    value={skill.value}
                    onChange={(e) => updateSkill(skill.name, parseInt(e.target.value) || 0)}
                    disabled={!canEdit}
                    style={{
                      width: 50,
                      padding: '4px 8px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 4,
                      color: 'var(--accent)',
                      fontWeight: 'bold',
                      fontSize: 12,
                      textAlign: 'center',
                    }}
                  />
                  {canEdit && (
                    <button
                      className="btn btn-sm btn-outline"
                      style={{ padding: '2px 6px', fontSize: 10 }}
                      onClick={() => removeSkill(skill.name)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {canEdit && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">技能名</label>
                <input
                  type="text"
                  className="form-input"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="例如：图书馆使用"
                />
              </div>
              <div style={{ width: 120 }}>
                <label className="form-label">数值</label>
                <input
                  type="number"
                  className="form-input"
                  value={newSkillValue}
                  onChange={(e) => setNewSkillValue(parseInt(e.target.value) || 0)}
                />
              </div>
              <button className="btn btn-primary" onClick={addSkill}>+ 添加</button>
            </div>
          )}
        </div>
      )}

      {detailTab === 'relations' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">角色关系网</div>
          </div>
          {char.relations.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              暂无关系记录
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {char.relations.map((rel) => {
                const target = allCharacters.find((c) => c.id === rel.targetId);
                return (
                  <div
                    key={rel.targetId}
                    className="list-item"
                  >
                    <div className="user-avatar" style={{ width: 32, height: 32 }}>
                      {target?.avatar ? <img src={target.avatar} alt="" /> : <span>{target?.name.charAt(0) || '?'}</span>}
                    </div>
                    <div className="list-item-content">
                      <div className="list-item-title">
                        {target?.name || '未知角色'}
                      </div>
                      <div className="list-item-desc">
                        <span className="badge badge-info">{rel.relationType}</span>
                        {rel.description && <span style={{ marginLeft: 8 }}>{rel.description}</span>}
                      </div>
                    </div>
                    {canEdit && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => {
                          onUpdate({
                            relations: char.relations.filter((r) => r.targetId !== rel.targetId),
                          });
                        }}
                      >
                        移除
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {canEdit && allCharacters.filter((c) => c.id !== char.id).length > 0 && (
            <AddRelationForm
              char={char}
              allCharacters={allCharacters}
              onAdd={(targetId, relationType, description) => {
                onUpdate({
                  relations: [
                    ...char.relations,
                    { targetId, relationType, description },
                  ],
                });
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

const AddRelationForm: React.FC<{
  char: Character;
  allCharacters: Character[];
  onAdd: (targetId: string, relationType: string, description?: string) => void;
}> = ({ char, allCharacters, onAdd }) => {
  const [targetId, setTargetId] = React.useState('');
  const [relationType, setRelationType] = React.useState('');
  const [description, setDescription] = React.useState('');

  const availableChars = allCharacters.filter(
    (c) => c.id !== char.id && !char.relations.some((r) => r.targetId === c.id)
  );

  const handleAdd = () => {
    if (!targetId || !relationType.trim()) return;
    onAdd(targetId, relationType.trim(), description.trim() || undefined);
    setTargetId('');
    setRelationType('');
    setDescription('');
  };

  if (availableChars.length === 0) return null;

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>添加关系</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label className="form-label">目标角色</label>
          <select
            className="form-select"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
          >
            <option value="">选择角色</option>
            {availableChars.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.isNPC ? 'NPC' : 'PC'})</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label className="form-label">关系类型</label>
          <input
            type="text"
            className="form-input"
            value={relationType}
            onChange={(e) => setRelationType(e.target.value)}
            placeholder="例如：朋友、敌人、师徒"
            list="relation-types"
          />
          <datalist id="relation-types">
            <option value="朋友" />
            <option value="敌人" />
            <option value="家人" />
            <option value="恋人" />
            <option value="师徒" />
            <option value="同事" />
            <option value="上司" />
            <option value="下属" />
          </datalist>
        </div>
        <div style={{ flex: 1 }}>
          <label className="form-label">描述（可选）</label>
          <input
            type="text"
            className="form-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="关系说明"
          />
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>添加</button>
      </div>
    </div>
  );
};

export default CharacterModule;
