import React from 'react';
import { useAppStore } from '../store/appStore';
import type { UserRole, Permission, User } from '@shared/types';

const allPermissions: { key: Permission; label: string; category: string }[] = [
  { key: 'edit_group', label: '编辑团信息', category: '团管理' },
  { key: 'invite_player', label: '邀请玩家', category: '团管理' },
  { key: 'manage_permissions', label: '管理权限', category: '团管理' },
  { key: 'edit_character', label: '编辑角色卡', category: '内容编辑' },
  { key: 'edit_story', label: '编辑剧情日志', category: '内容编辑' },
  { key: 'edit_map', label: '编辑地图', category: '内容编辑' },
  { key: 'roll_dice', label: '投骰', category: '互动' },
  { key: 'send_message', label: '发送消息', category: '互动' },
  { key: 'use_voice', label: '使用语音', category: '互动' },
  { key: 'send_note', label: '发送私密纸条', category: '互动' },
  { key: 'view_library', label: '查看资料库', category: '其他' },
];

const GroupHome: React.FC = () => {
  const {
    currentGroup,
    currentUser,
    characters,
    storyLogs,
    addSchedule,
    signupSchedule,
    checkinSchedule,
    deleteSchedule,
    removeMember,
    setMemberPermissions,
  } = useAppStore();

  const [showScheduleModal, setShowScheduleModal] = React.useState(false);
  const [scheduleTitle, setScheduleTitle] = React.useState('');
  const [scheduleTime, setScheduleTime] = React.useState('');
  const [scheduleDesc, setScheduleDesc] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'overview' | 'schedule' | 'members' | 'permissions'>('overview');
  const [editingMember, setEditingMember] = React.useState<User | null>(null);

  if (!currentGroup) return null;

  const hasPermission = (perm: Permission) => currentUser.permissions.includes(perm);
  const playerChars = characters.filter((c) => !c.isNPC);
  const npcChars = characters.filter((c) => c.isNPC);

  const handleAddSchedule = () => {
    if (!scheduleTitle.trim() || !scheduleTime) return;
    addSchedule({
      title: scheduleTitle.trim(),
      startTime: new Date(scheduleTime).getTime(),
      description: scheduleDesc.trim() || undefined,
    });
    setScheduleTitle('');
    setScheduleTime('');
    setScheduleDesc('');
    setShowScheduleModal(false);
  };

  const roleLabels: Record<UserRole, string> = {
    keeper: '主持人',
    player: '玩家',
    guest: '访客',
  };

  const toggleMemberPermission = (member: User, perm: Permission) => {
    const newPerms = member.permissions.includes(perm)
      ? member.permissions.filter((p) => p !== perm)
      : [...member.permissions, perm];
    setMemberPermissions(member.id, newPerms);
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">团务主页</h1>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>总览</div>
        <div className={`tab ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>开团时间</div>
        <div className={`tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>成员列表</div>
        {hasPermission('manage_permissions') && (
          <div className={`tab ${activeTab === 'permissions' ? 'active' : ''}`} onClick={() => setActiveTab('permissions')}>权限设置</div>
        )}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-4">
          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>成员数</div>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--accent)' }}>
              {currentGroup.members.length}
            </div>
          </div>
          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>玩家角色</div>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--info)' }}>{playerChars.length}</div>
          </div>
          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>NPC 数量</div>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--success)' }}>{npcChars.length}</div>
          </div>
          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>剧情记录</div>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: 'var(--warning)' }}>{storyLogs.length}</div>
          </div>

          {currentGroup.description && (
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <div className="card-title" style={{ marginBottom: 8 }}>团简介</div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {currentGroup.description}
              </div>
            </div>
          )}

          {currentGroup.schedules.length > 0 && (
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <div className="card-header">
                <div className="card-title">即将开团</div>
              </div>
              {currentGroup.schedules.slice(0, 3).map((s) => (
                <div key={s.id} className="list-item">
                  <div style={{ fontSize: 24 }}>📅</div>
                  <div className="list-item-content">
                    <div className="list-item-title">{s.title}</div>
                    <div className="list-item-desc">
                      {formatTime(s.startTime)} · 已报名 {s.signups.length} 人 · 已签到 {s.checkIns.length} 人
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div>
          <div className="page-header" style={{ marginTop: -10 }}>
            <div />
            <button className="btn btn-primary" onClick={() => setShowScheduleModal(true)}>+ 发布开团时间</button>
          </div>

          {currentGroup.schedules.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <div className="empty-text">还没有安排开团时间</div>
              <button className="btn btn-primary" onClick={() => setShowScheduleModal(true)}>发布第一个开团时间</button>
            </div>
          ) : (
            currentGroup.schedules.map((s) => (
              <div key={s.id} className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">{s.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      🕐 {formatTime(s.startTime)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => signupSchedule(s.id, currentUser.id)}
                    >
                      {s.signups.includes(currentUser.id) ? '✓ 已报名' : '报名'}
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => checkinSchedule(s.id, currentUser.id)}
                    >
                      {s.checkIns.includes(currentUser.id) ? '✓ 已签到' : '签到'}
                    </button>
                    {hasPermission('edit_group') && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteSchedule(s.id)}
                      >
                        删除
                      </button>
                    )}
                  </div>
                </div>
                {s.description && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    {s.description}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 20, fontSize: 12 }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>已报名 ({s.signups.length}):</span>{' '}
                    {s.signups.map((uid) => {
                      const m = currentGroup.members.find((x) => x.id === uid);
                      return m ? (
                        <span key={uid} className="badge badge-info" style={{ marginRight: 4 }}>
                          {m.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>已签到 ({s.checkIns.length}):</span>{' '}
                    {s.checkIns.map((uid) => {
                      const m = currentGroup.members.find((x) => x.id === uid);
                      return m ? (
                        <span key={uid} className="badge badge-success" style={{ marginRight: 4 }}>
                          {m.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div>
          {currentGroup.members.map((member) => (
            <div key={member.id} className="list-item">
              <div className="user-avatar" style={{ width: 44, height: 44, fontSize: 18 }}>
                {member.avatar ? (
                  <img src={member.avatar} alt="" />
                ) : (
                  <span>{member.name.charAt(0)}</span>
                )}
              </div>
              <div className="list-item-content">
                <div className="list-item-title">
                  {member.name}
                  {member.id === currentUser.id && (
                    <span className="badge badge-primary" style={{ marginLeft: 8 }}>我</span>
                  )}
                </div>
                <div className="list-item-desc">
                  <span className={`badge ${member.role === 'keeper' ? 'badge-warning' : member.role === 'player' ? 'badge-info' : 'badge-secondary'}`}>
                    {roleLabels[member.role]}
                  </span>
                </div>
              </div>
              {hasPermission('manage_permissions') && member.id !== currentUser.id && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-outline" onClick={() => setEditingMember(member)}>
                    权限
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => removeMember(member.id)}>
                    移除
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'permissions' && hasPermission('manage_permissions') && (
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            点击成员卡片设置其权限
          </div>
          {currentGroup.members.map((member) => (
            <div
              key={member.id}
              className="card"
              style={{ cursor: 'pointer', borderColor: editingMember?.id === member.id ? 'var(--accent)' : undefined }}
              onClick={() => setEditingMember(member)}
            >
              <div className="card-header">
                <div className="card-title">
                  {member.name}
                  {member.id === currentUser.id && (
                    <span className="badge badge-primary" style={{ marginLeft: 8 }}>我</span>
                  )}
                  <span className={`badge ${member.role === 'keeper' ? 'badge-warning' : 'badge-info'}`} style={{ marginLeft: 8 }}>
                    {roleLabels[member.role]}
                  </span>
                </div>
              </div>
              {editingMember?.id === member.id && (
                <div>
                  {Object.entries(
                    allPermissions.reduce((acc, p) => {
                      if (!acc[p.category]) acc[p.category] = [];
                      acc[p.category].push(p);
                      return acc;
                    }, {} as Record<string, typeof allPermissions>)
                  ).map(([category, perms]) => (
                    <div key={category} style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
                        {category}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {perms.map((p) => (
                          <label key={p.key} className="checkbox">
                            <input
                              type="checkbox"
                              checked={member.permissions.includes(p.key)}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleMemberPermission(member, p.key);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              disabled={member.id === currentUser.id && p.key === 'manage_permissions'}
                            />
                            {p.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">发布开团时间</div>
              <button className="modal-close" onClick={() => setShowScheduleModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">场次标题</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="例如：第一章 - 迷雾初现"
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">开始时间</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">场次描述（可选）</label>
                <textarea
                  className="form-textarea"
                  placeholder="本场次的简单介绍..."
                  value={scheduleDesc}
                  onChange={(e) => setScheduleDesc(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowScheduleModal(false)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={handleAddSchedule}
                disabled={!scheduleTitle.trim() || !scheduleTime}
              >
                发布
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupHome;
