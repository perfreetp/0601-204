import React from 'react';
import { useAppStore } from '../store/appStore';
import type { DiceType, Permission, Character } from '@shared/types';

const diceTypes: { type: DiceType; sides: number; label: string }[] = [
  { type: 'd4', sides: 4, label: 'D4' },
  { type: 'd6', sides: 6, label: 'D6' },
  { type: 'd8', sides: 8, label: 'D8' },
  { type: 'd10', sides: 10, label: 'D10' },
  { type: 'd12', sides: 12, label: 'D12' },
  { type: 'd20', sides: 20, label: 'D20' },
  { type: 'd100', sides: 100, label: 'D100' },
];

const DiceModule: React.FC = () => {
  const {
    currentUser,
    characters,
    diceHistory,
    rollDice,
    addChatMessage,
  } = useAppStore();

  const hasPermission = (perm: Permission) => currentUser.permissions.includes(perm);

  const [selectedDice, setSelectedDice] = React.useState<DiceType>('d20');
  const [diceCount, setDiceCount] = React.useState(1);
  const [modifier, setModifier] = React.useState(0);
  const [note, setNote] = React.useState('');
  const [selectedCharacterId, setSelectedCharacterId] = React.useState('');
  const [selectedSkillName, setSelectedSkillName] = React.useState('');
  const [lastRoll, setLastRoll] = React.useState<any>(null);
  const [isRolling, setIsRolling] = React.useState(false);

  const playerChars = characters.filter((c) => !c.isNPC);
  const selectedChar = characters.find((c) => c.id === selectedCharacterId);

  const handleRoll = () => {
    if (!hasPermission('roll_dice') || isRolling) return;
    setIsRolling(true);

    setTimeout(() => {
      const roll = rollDice(
        selectedDice,
        diceCount,
        modifier,
        note.trim() || undefined,
        selectedSkillName || undefined,
        selectedCharacterId || undefined
      );
      setLastRoll(roll);

      let msg = `${currentUser.name} 投掷了 ${diceCount}${selectedDice}`;
      if (modifier !== 0) msg += modifier > 0 ? `+${modifier}` : `${modifier}`;
      if (selectedSkillName) msg += `【${selectedSkillName}检定】`;
      msg += `\n结果: [${roll.results.join(', ')}]`;
      if (modifier !== 0) msg += ` ${modifier > 0 ? '+' : ''}${modifier}`;
      msg += ` = ${roll.total}`;
      if (note.trim()) msg += `\n备注: ${note.trim()}`;

      addChatMessage({
        type: 'dice',
        content: msg,
        senderId: currentUser.id,
        diceRoll: roll,
      });

      setIsRolling(false);
    }, 500);
  };

  const formatTime = (t: number) =>
    new Date(t).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  const maxDice = selectedDice === 'd100' ? 10 : 20;

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 140px)' }}>
      <div style={{ width: 360, flexShrink: 0 }}>
        <div className="page-header">
          <h1 className="page-title">投骰工具</h1>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>选择骰子类型</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {diceTypes.map((d) => (
              <button
                key={d.type}
                className={`btn ${selectedDice === d.type ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSelectedDice(d.type)}
                style={{
                  padding: '16px 0',
                  fontSize: 16,
                  fontWeight: 'bold',
                  flexDirection: 'column',
                }}
              >
                🎲
                <div style={{ fontSize: 12, marginTop: 4 }}>{d.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>投骰设置</div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">骰子数量</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setDiceCount(Math.max(1, diceCount - 1))}
                >
                  −
                </button>
                <input
                  type="number"
                  className="form-input"
                  value={diceCount}
                  onChange={(e) => setDiceCount(Math.max(1, Math.min(maxDice, parseInt(e.target.value) || 1)))}
                  style={{ textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}
                />
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setDiceCount(Math.min(maxDice, diceCount + 1))}
                >
                  +
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">修正值</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setModifier(modifier - 1)}
                >
                  −
                </button>
                <input
                  type="number"
                  className="form-input"
                  value={modifier}
                  onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
                  style={{ textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: modifier >= 0 ? 'var(--success)' : 'var(--danger)' }}
                />
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setModifier(modifier + 1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">角色（可选）</label>
            <select
              className="form-select"
              value={selectedCharacterId}
              onChange={(e) => {
                setSelectedCharacterId(e.target.value);
                setSelectedSkillName('');
              }}
            >
              <option value="">不关联角色</option>
              {playerChars.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {selectedChar && selectedChar.skills.length > 0 && (
            <div className="form-group">
              <label className="form-label">技能检定（可选）</label>
              <select
                className="form-select"
                value={selectedSkillName}
                onChange={(e) => setSelectedSkillName(e.target.value)}
              >
                <option value="">不指定技能</option>
                {selectedChar.skills.map((s) => (
                  <option key={s.name} value={s.name}>{s.name} ({s.value})</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">备注（可选）</label>
            <input
              type="text"
              className="form-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例如：侦查检定"
            />
          </div>

          <div style={{
            padding: 12,
            background: 'var(--bg-primary)',
            borderRadius: 6,
            marginBottom: 16,
            textAlign: 'center',
            fontSize: 14,
          }}>
            <span style={{ color: 'var(--text-muted)' }}>公式：</span>
            <span style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: 18 }}>
              {diceCount}{selectedDice}
              {modifier > 0 ? `+${modifier}` : modifier < 0 ? `${modifier}` : ''}
            </span>
            {selectedSkillName && (
              <>
                <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>检定：</span>
                <span className="badge badge-info">{selectedSkillName}</span>
              </>
            )}
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center', fontSize: 16 }}
            onClick={handleRoll}
            disabled={isRolling || !hasPermission('roll_dice')}
          >
            {isRolling ? '🎲 投掷中...' : '🎲 投掷骰子'}
          </button>
        </div>

        {lastRoll && (
          <div className="card" style={{
            borderColor: 'var(--accent)',
            background: 'linear-gradient(135deg, rgba(233, 69, 96, 0.1), transparent)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                上次投骰结果
              </div>
              <div style={{
                fontSize: 56,
                fontWeight: 'bold',
                color: 'var(--accent)',
                lineHeight: 1,
                marginBottom: 8,
              }}>
                {lastRoll.total}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                [{lastRoll.results.join(', ')}]
                {lastRoll.modifier !== 0 && ` ${lastRoll.modifier > 0 ? '+' : ''}${lastRoll.modifier}`}
              </div>
              {lastRoll.skillName && (
                <div style={{ marginTop: 8 }}>
                  <span className="badge badge-info">{lastRoll.skillName}</span>
                  {selectedChar && selectedChar.skills.find((s) => s.name === lastRoll.skillName) && (
                    <>
                      {(() => {
                        const skill = selectedChar.skills.find((s) => s.name === lastRoll.skillName);
                        const success = lastRoll.total <= (skill?.value || 0);
                        return (
                          <span className={`badge ${success ? 'badge-success' : 'badge-danger'}`} style={{ marginLeft: 8 }}>
                            {success ? '✅ 成功' : '❌ 失败'}
                          </span>
                        );
                      })()}
                    </>
                  )}
                </div>
              )}
              {lastRoll.note && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  备注：{lastRoll.note}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="page-header">
          <h1 className="page-title" style={{ fontSize: 18 }}>投骰历史</h1>
          <div className="page-actions">
            <span className="badge badge-secondary">共 {diceHistory.length} 条记录</span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
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
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, var(--accent), #ff6b81)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    fontWeight: 'bold',
                    color: 'white',
                    flexShrink: 0,
                  }}>
                    {roll.total}
                  </div>
                  <div className="list-item-content">
                    <div className="list-item-title">
                      <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
                        {roll.count}{roll.dice}
                        {roll.modifier > 0 ? `+${roll.modifier}` : roll.modifier < 0 ? `${roll.modifier}` : ''}
                      </span>
                      {roll.skillName && (
                        <span className="badge badge-info" style={{ marginLeft: 8 }}>{roll.skillName}</span>
                      )}
                      {char && (
                        <span className="badge badge-secondary" style={{ marginLeft: 8 }}>{char.name}</span>
                      )}
                    </div>
                    <div className="list-item-desc">
                      结果：[{roll.results.join(', ')}]
                      {roll.modifier !== 0 && ` ${roll.modifier > 0 ? '+' : ''}${roll.modifier}`}
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
      </div>
    </div>
  );
};

export default DiceModule;
