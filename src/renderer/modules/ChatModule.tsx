import React from 'react';
import { useAppStore } from '../store/appStore';
import type { ChatMessage, Permission, DiceType, User } from '@shared/types';

const ChatModule: React.FC = () => {
  const {
    currentUser,
    currentGroup,
    chatMessages,
    addChatMessage,
    rollDice,
    isMuted,
    isDeafened,
    toggleMute,
    toggleDeafen,
    voiceParticipants,
    setVoiceParticipants,
    characters,
  } = useAppStore();

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [message, setMessage] = React.useState('');
  const [isPrivate, setIsPrivate] = React.useState(false);
  const [recipientId, setRecipientId] = React.useState('');
  const [showQuickDice, setShowQuickDice] = React.useState(false);

  const hasPermission = (perm: Permission) => currentUser.permissions.includes(perm);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = () => {
    if (!message.trim() || !hasPermission('send_message')) return;
    if (isPrivate && !recipientId) return;

    const recipient = isPrivate ? currentGroup?.members.find((m) => m.id === recipientId) : undefined;

    addChatMessage({
      type: 'text',
      content: message.trim(),
      senderId: currentUser.id,
      isPrivate,
      recipientId: isPrivate ? recipientId : undefined,
    });
    setMessage('');
  };

  const handleQuickRoll = (dice: DiceType) => {
    const roll = rollDice(dice, 1, 0);
    addChatMessage({
      type: 'dice',
      content: `${currentUser.name} 投掷了 1${dice} = ${roll.total}`,
      senderId: currentUser.id,
      diceRoll: roll,
    });
    setShowQuickDice(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (t: number) =>
    new Date(t).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  const visibleMessages = chatMessages.filter(
    (m) => !m.isPrivate || m.senderId === currentUser.id || m.recipientId === currentUser.id
  );

  const otherMembers = currentGroup?.members.filter((m) => m.id !== currentUser.id) || [];

  const toggleVoice = () => {
    if (voiceParticipants.includes(currentUser.id)) {
      setVoiceParticipants(voiceParticipants.filter((id) => id !== currentUser.id));
    } else {
      setVoiceParticipants([...voiceParticipants, currentUser.id]);
    }
  };

  const inVoice = voiceParticipants.includes(currentUser.id);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 140px)', gap: 16 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div className="page-header" style={{ marginBottom: 12 }}>
          <h1 className="page-title">语音文字房</h1>
          <div className="page-actions">
            {hasPermission('use_voice') && (
              <>
                <button
                  className={`btn ${inVoice ? 'btn-primary' : 'btn-outline'}`}
                  onClick={toggleVoice}
                >
                  {inVoice ? '🔴 语音中' : '🎤 加入语音'}
                </button>
                {inVoice && (
                  <>
                    <button
                      className={`btn ${isMuted ? 'btn-danger' : 'btn-outline'}`}
                      onClick={toggleMute}
                    >
                      {isMuted ? '🔇 已静音' : '🎤 麦克风'}
                    </button>
                    <button
                      className={`btn ${isDeafened ? 'btn-danger' : 'btn-outline'}`}
                      onClick={toggleDeafen}
                    >
                      {isDeafened ? '🔈 已静音耳机' : '🎧 耳机'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {inVoice && voiceParticipants.length > 0 && (
          <div className="card" style={{ padding: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {voiceParticipants.map((uid) => {
                const member = currentGroup?.members.find((m) => m.id === uid);
                if (!member) return null;
                return (
                  <div key={uid} style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: 'var(--bg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      margin: '0 auto 4px',
                      overflow: 'hidden',
                      border: uid === currentUser.id ? '2px solid var(--accent)' : '2px solid transparent',
                    }}>
                      {member.avatar ? (
                        <img src={member.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        member.name.charAt(0)
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {member.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div
          style={{
            flex: 1,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 16,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginBottom: 12,
          }}
        >
          {visibleMessages.length === 0 ? (
            <div className="empty-state" style={{ flex: 1 }}>
              <div className="empty-icon">💬</div>
              <div className="empty-text">还没有消息，开始聊天吧</div>
            </div>
          ) : (
            visibleMessages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMine={msg.senderId === currentUser.id}
                characters={characters}
                formatTime={formatTime}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {hasPermission('send_message') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <label className="checkbox" style={{ fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => {
                    setIsPrivate(e.target.checked);
                    if (!e.target.checked) setRecipientId('');
                  }}
                />
                🕵️ 私密纸条
              </label>
              {isPrivate && hasPermission('send_note') && (
                <select
                  className="form-select"
                  style={{ width: 160, padding: '4px 8px', fontSize: 12 }}
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                >
                  <option value="">选择接收人</option>
                  {otherMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              )}
              {hasPermission('roll_dice') && (
                <div style={{ position: 'relative' }}>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => setShowQuickDice(!showQuickDice)}
                  >
                    🎲 快捷投骰
                  </button>
                  {showQuickDice && (
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: 0,
                      marginBottom: 4,
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: 8,
                      display: 'flex',
                      gap: 6,
                      zIndex: 100,
                    }}>
                      {(['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] as DiceType[]).map((d) => (
                        <button
                          key={d}
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleQuickRoll(d)}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <textarea
                className="form-textarea"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isPrivate
                    ? recipientId
                      ? '发送私密消息...'
                      : '请选择接收人'
                    : '输入消息，Enter发送，Shift+Enter换行...'
                }
                style={{ resize: 'none', minHeight: 60, maxHeight: 120 }}
                disabled={isPrivate && !recipientId}
              />
              <button
                className="btn btn-primary"
                onClick={handleSend}
                disabled={
                  !message.trim() ||
                  !hasPermission('send_message') ||
                  (isPrivate && !recipientId)
                }
                style={{ alignSelf: 'flex-end' }}
              >
                发送
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ width: 240, flexShrink: 0 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">在线成员</div>
          </div>
          {currentGroup?.members.map((member: User) => (
            <div key={member.id} className="list-item" style={{ padding: '8px 12px', marginBottom: 4 }}>
              <div style={{ position: 'relative' }}>
                <div className="user-avatar" style={{ width: 32, height: 32 }}>
                  {member.avatar ? (
                    <img src={member.avatar} alt="" />
                  ) : (
                    <span>{member.name.charAt(0)}</span>
                  )}
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: voiceParticipants.includes(member.id) ? 'var(--accent)' : 'var(--success)',
                  border: '2px solid var(--bg-secondary)',
                }} />
              </div>
              <div className="list-item-content">
                <div className="list-item-title" style={{ fontSize: 12 }}>
                  {member.name}
                  {member.id === currentUser.id && (
                    <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>(我)</span>
                  )}
                </div>
                <div className="list-item-desc" style={{ fontSize: 10 }}>
                  {voiceParticipants.includes(member.id) ? '🎤 语音中' : '在线'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MessageBubble: React.FC<{
  message: ChatMessage;
  isMine: boolean;
  characters: any[];
  formatTime: (t: number) => string;
}> = ({ message, isMine, characters, formatTime }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: isMine ? 'row-reverse' : 'row',
      gap: 10,
      maxWidth: '80%',
      alignSelf: isMine ? 'flex-end' : 'flex-start',
    }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'var(--bg-tertiary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        fontSize: 14,
      }}>
        {message.senderAvatar ? (
          <img src={message.senderAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          message.senderName.charAt(0)
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', gap: 6, alignItems: 'flex-end' }}>
        <div>
          <div style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            marginBottom: 4,
            display: 'flex',
            gap: 8,
            flexDirection: isMine ? 'row-reverse' : 'row',
          }}>
            <span>{message.senderName}</span>
            <span>{formatTime(message.timestamp)}</span>
            {message.isPrivate && <span className="badge badge-warning">🕵️ 私密</span>}
          </div>
          <div style={{
            background: message.type === 'dice'
              ? 'rgba(233, 69, 96, 0.2)'
              : message.isPrivate
                ? 'rgba(251, 191, 36, 0.15)'
                : isMine
                  ? 'var(--accent)'
                  : 'var(--bg-tertiary)',
            color: message.type === 'dice' || message.isPrivate ? 'var(--text-primary)' : undefined,
            padding: '8px 14px',
            borderRadius: 12,
            borderTopLeftRadius: isMine ? 12 : 2,
            borderTopRightRadius: isMine ? 2 : 12,
            fontSize: 13,
            lineHeight: 1.5,
            wordBreak: 'break-word',
          }}>
            {message.diceRoll && (
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {message.diceRoll.count}{message.diceRoll.dice}
                  {message.diceRoll.modifier > 0 ? `+${message.diceRoll.modifier}` : message.diceRoll.modifier < 0 ? message.diceRoll.modifier : ''}
                  {' → '}
                  [{message.diceRoll.results.join(', ')}]
                </span>
              </div>
            )}
            <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
            {message.diceRoll && (
              <div style={{ marginTop: 4, fontSize: 20, fontWeight: 'bold', color: 'var(--accent)' }}>
                🎲 {message.diceRoll.total}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModule;
