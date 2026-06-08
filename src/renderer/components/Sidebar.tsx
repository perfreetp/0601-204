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
  const { activeModule, setActiveModule, currentUser } = useAppStore();

  const roleLabels: Record<string, string> = {
    keeper: '主持人',
    player: '玩家',
    guest: '访客',
  };

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
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt="" />
            ) : (
              <span>{currentUser.name.charAt(0)}</span>
            )}
          </div>
          <div className="user-details">
            <div className="user-name">{currentUser.name}</div>
            <div className="user-role">{roleLabels[currentUser.role]}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
