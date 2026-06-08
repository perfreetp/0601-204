import React from 'react';
import { useAppStore } from '../store/appStore';
import type { ModuleType } from '@shared/types';

interface NavItem {
  key: ModuleType;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { key: 'home', label: '团务主页', icon: '🏠' },
  { key: 'character', label: '角色卡', icon: '👤' },
  { key: 'story', label: '剧情日志', icon: '📖' },
  { key: 'map', label: '地图白板', icon: '🗺️' },
  { key: 'chat', label: '语音文字房', icon: '💬' },
  { key: 'dice', label: '投骰工具', icon: '🎲' },
  { key: 'library', label: '资料库', icon: '📚' },
];

const Sidebar: React.FC = () => {
  const { activeModule, setActiveModule, currentUser, currentGroup, switchUser } = useAppStore();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const roleLabels: Record<string, string> = {
    keeper: '主持人',
    player: '玩家',
    guest: '访客',
  };

  const members = currentGroup?.members || [];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">🎲 TRPG Studio</div>
        <div className="sidebar-subtitle">跑团互动平台</div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <div
            key={item.key}
            className={`nav-item ${activeModule === item.key ? 'active' : ''}`}
            onClick={() => setActiveModule(item.key)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
      <div className="sidebar-footer" style={{ position: 'relative' }}>
        <div
          className="user-info"
          style={{ cursor: members.length > 1 ? 'pointer' : 'default' }}
          onClick={() => members.length > 1 && setShowUserMenu(!showUserMenu)}
          title={members.length > 1 ? '点击切换身份（多人消息测试）' : undefined}
        >
          <div className="user-avatar">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt="" />
            ) : (
              <span>{currentUser.name.charAt(0)}</span>
            )}
          </div>
          <div className="user-details">
            <div className="user-name">
              {currentUser.name}
              {members.length > 1 && <span style={{ marginLeft: 4, fontSize: 10 }}>▼</span>}
            </div>
            <div className="user-role">{roleLabels[currentUser.role]}</div>
          </div>
        </div>

        {showUserMenu && members.length > 1 && (
          <>
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99,
              }}
              onClick={() => setShowUserMenu(false)}
            />
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: 8,
              right: 8,
              marginBottom: 4,
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 4,
              zIndex: 100,
              maxHeight: 240,
              overflowY: 'auto',
            }}>
              <div style={{ padding: '4px 8px', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                切换身份（多人消息测试）
              </div>
              {members.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    switchUser(m.id);
                    setShowUserMenu(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    background: m.id === currentUser.id ? 'var(--accent)' : 'transparent',
                  }}
                >
                  <div className="user-avatar" style={{ width: 24, height: 24, fontSize: 11 }}>
                    {m.avatar ? <img src={m.avatar} alt="" /> : m.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {roleLabels[m.role]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
