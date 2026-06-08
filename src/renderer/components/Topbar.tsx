import React from 'react';
import { useAppStore } from '../store/appStore';
import { desktop } from '../desktop';
import type { Permission } from '@shared/types';

const Topbar: React.FC = () => {
  const { currentGroup, currentUser, exportAllData } = useAppStore();
  const [showInvite, setShowInvite] = React.useState(false);
  const [inviteName, setInviteName] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState<'player' | 'keeper' | 'guest'>('player');

  const hasPermission = (perm: Permission) => currentUser.permissions.includes(perm);

  const handleInvite = () => {
    if (!inviteName.trim()) return;
    useAppStore.getState().invitePlayer(inviteName.trim(), inviteRole);
    setInviteName('');
    setInviteRole('player');
    setShowInvite(false);
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
    }
  };

  if (!currentGroup) return null;

  return (
    <>
      <header className="topbar">
        <div className="group-info">
          <div className="group-avatar">
            {currentGroup.avatar ? (
              <img src={currentGroup.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span>🎲</span>
            )}
          </div>
          <div className="group-details">
            <div className="group-name">{currentGroup.name}</div>
            <div className="group-system">{currentGroup.system}</div>
          </div>
          {currentGroup.inviteCode && (
            <span className="badge badge-info">邀请码: {currentGroup.inviteCode}</span>
          )}
        </div>
        <div className="topbar-actions">
          <span className="badge badge-secondary">
            👥 {currentGroup.members.length} 名成员
          </span>
          {hasPermission('invite_player') && (
            <button className="btn btn-secondary" onClick={() => setShowInvite(true)}>
              + 邀请玩家
            </button>
          )}
          {hasPermission('edit_group') && (
            <button className="btn btn-primary" onClick={handleExport}>
              📤 导出整团回顾
            </button>
          )}
        </div>
      </header>

      {showInvite && (
        <div className="modal-overlay" onClick={() => setShowInvite(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">邀请玩家加入</div>
              <button className="modal-close" onClick={() => setShowInvite(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">玩家昵称</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="输入玩家昵称"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">身份</label>
                <select
                  className="form-select"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                >
                  <option value="player">玩家</option>
                  <option value="keeper">副主持</option>
                  <option value="guest">访客</option>
                </select>
              </div>
              <div className="card" style={{ background: 'var(--bg-primary)' }}>
                <div className="card-title" style={{ fontSize: 13, marginBottom: 8 }}>
                  团邀请码
                </div>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: 'var(--accent)', letterSpacing: 4 }}>
                  {currentGroup.inviteCode}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  分享此邀请码让玩家自行加入
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowInvite(false)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={handleInvite}
                disabled={!inviteName.trim()}
              >
                发送邀请
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Topbar;
