import React from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import GroupHome from './modules/GroupHome';
import CharacterModule from './modules/CharacterModule';
import StoryModule from './modules/StoryModule';
import MapModule from './modules/MapModule';
import ChatModule from './modules/ChatModule';
import DiceModule from './modules/DiceModule';
import LibraryModule from './modules/LibraryModule';
import { useAppStore } from './store/appStore';

const App: React.FC = () => {
  const { activeModule, currentGroup, createGroup, loadPersistedData } = useAppStore();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadPersistedData().finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎲</div>
          <div style={{ color: '#a0a0b0', fontSize: 14 }}>正在加载团数据...</div>
        </div>
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            maxWidth: 500,
            padding: 40,
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 24 }}>🎲</div>
          <h1 style={{ fontSize: 32, marginBottom: 12, color: '#e94560' }}>TRPG Studio</h1>
          <p style={{ color: '#a0a0b0', marginBottom: 32, fontSize: 14, lineHeight: 1.6 }}>
            面向桌游和跑团玩家的社交互动平台
            <br />
            管理你的跑团，创建角色，记录冒险，与朋友们一起开启奇幻旅程
          </p>
          <WelcomeWizard />
        </div>
      </div>
    );
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'home':
        return <GroupHome />;
      case 'character':
        return <CharacterModule />;
      case 'story':
        return <StoryModule />;
      case 'map':
        return <MapModule />;
      case 'chat':
        return <ChatModule />;
      case 'dice':
        return <DiceModule />;
      case 'library':
        return <LibraryModule />;
      default:
        return <GroupHome />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <div className="content-area">{renderModule()}</div>
      </div>
    </div>
  );
};

const WelcomeWizard: React.FC = () => {
  const { createGroup } = useAppStore();
  const [name, setName] = React.useState('');
  const [system, setSystem] = React.useState('COC 7th');
  const [description, setDescription] = React.useState('');

  const handleCreate = () => {
    if (name.trim()) {
      createGroup(name.trim(), system, description.trim() || undefined);
    }
  };

  return (
    <div className="card" style={{ textAlign: 'left' }}>
      <div className="card-header">
        <div className="card-title">创建新团</div>
      </div>
      <div className="form-group">
        <label className="form-label">团名称</label>
        <input
          type="text"
          className="form-input"
          placeholder="例如：迷雾之城"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label className="form-label">规则系统</label>
        <select
          className="form-select"
          value={system}
          onChange={(e) => setSystem(e.target.value)}
        >
          <option value="COC 7th">COC 7th（克苏鲁的呼唤）</option>
          <option value="DND 5e">DND 5e（龙与地下城）</option>
          <option value="Pathfinder">Pathfinder</option>
          <option value="WOD">WOD（黑暗世界）</option>
          <option value="自定义">自定义系统</option>
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">团简介（可选）</label>
        <textarea
          className="form-textarea"
          placeholder="简单描述一下你的团..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <button
        className="btn btn-primary btn-lg"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={handleCreate}
        disabled={!name.trim()}
      >
        🚀 创建并开始冒险
      </button>
    </div>
  );
};

export default App;
