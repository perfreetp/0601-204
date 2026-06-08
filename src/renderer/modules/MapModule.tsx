import React from 'react';
import { useAppStore } from '../store/appStore';
import { desktop } from '../desktop';
import type { MapMarker, ClueCard, Permission } from '@shared/types';

const markerTypeConfig: Record<string, { label: string; icon: string; color: string }> = {
  location: { label: '地点', icon: '📍', color: '#60a5fa' },
  npc: { label: 'NPC', icon: '👤', color: '#4ade80' },
  clue: { label: '线索', icon: '🔍', color: '#fbbf24' },
  danger: { label: '危险', icon: '⚠️', color: '#ef4444' },
  custom: { label: '自定义', icon: '⭐', color: '#a78bfa' },
};

const MapModule: React.FC = () => {
  const {
    mapState,
    currentUser,
    addMapMarker,
    updateMapMarker,
    removeMapMarker,
    addClueCard,
    updateClueCard,
    removeClueCard,
    setMapBackground,
    setMapScale,
    setMapOffset,
  } = useAppStore();

  const hasPermission = (perm: Permission) => currentUser.permissions.includes(perm);
  const canEdit = hasPermission('edit_map');

  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [showAddMarker, setShowAddMarker] = React.useState(false);
  const [showAddClue, setShowAddClue] = React.useState(false);
  const [selectedMarker, setSelectedMarker] = React.useState<MapMarker | null>(null);
  const [selectedClue, setSelectedClue] = React.useState<ClueCard | null>(null);

  const [panning, setPanning] = React.useState(false);
  const [panStart, setPanStart] = React.useState({ x: 0, y: 0 });
  const [offsetStart, setOffsetStart] = React.useState({ x: 0, y: 0 });
  const [draggedClue, setDraggedClue] = React.useState<string | null>(null);
  const [dragClueOffset, setDragClueOffset] = React.useState({ x: 0, y: 0 });

  const [pendingPos, setPendingPos] = React.useState<{ x: number; y: number } | null>(null);
  const [markerType, setMarkerType] = React.useState<MapMarker['type']>('location');
  const [markerLabel, setMarkerLabel] = React.useState('');
  const [markerDesc, setMarkerDesc] = React.useState('');

  const [clueTitle, setClueTitle] = React.useState('');
  const [clueContent, setClueContent] = React.useState('');

  const screenToWorld = (clientX: number, clientY: number) => {
    if (!viewportRef.current) return { x: 0, y: 0 };
    const rect = viewportRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - mapState.offsetX) / mapState.scale,
      y: (clientY - rect.top - mapState.offsetY) / mapState.scale,
    };
  };

  const handleMapClick = (e: React.MouseEvent) => {
    if (!canEdit || !viewportRef.current) return;
    if (panning || draggedClue) return;
    const { x, y } = screenToWorld(e.clientX, e.clientY);
    setPendingPos({ x, y });
    setShowAddMarker(true);
    setMarkerLabel('');
    setMarkerDesc('');
  };

  const handleAddMarker = () => {
    if (!pendingPos || !markerLabel.trim()) return;
    const config = markerTypeConfig[markerType];
    addMapMarker({
      x: pendingPos.x,
      y: pendingPos.y,
      type: markerType,
      label: markerLabel.trim(),
      description: markerDesc.trim() || undefined,
      color: config.color,
      icon: config.icon,
    });
    setShowAddMarker(false);
    setPendingPos(null);
  };

  const handleAddClueCard = () => {
    if (!clueTitle.trim() || !viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const { x, y } = screenToWorld(rect.left + cx, rect.top + cy);
    addClueCard({
      title: clueTitle.trim(),
      content: clueContent.trim(),
      x: x - 90,
      y: y - 50,
      discovered: false,
    });
    setClueTitle('');
    setClueContent('');
    setShowAddClue(false);
  };

  const handleMapMouseDown = (e: React.MouseEvent) => {
    if (!canEdit) return;
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setOffsetStart({ x: mapState.offsetX, y: mapState.offsetY });
    }
  };

  const handleMapMouseMove = (e: React.MouseEvent) => {
    if (panning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setMapOffset(offsetStart.x + dx, offsetStart.y + dy);
    }
    if (draggedClue) {
      const { x, y } = screenToWorld(e.clientX, e.clientY);
      updateClueCard(draggedClue, {
        x: x - dragClueOffset.x,
        y: y - dragClueOffset.y,
      });
    }
  };

  const handleMapMouseUp = () => {
    setPanning(false);
    setDraggedClue(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setMapScale(mapState.scale * delta);
  };

  const handleResetView = () => {
    setMapScale(1);
    setMapOffset(0, 0);
  };

  const handleBackgroundUpload = async () => {
    const img = await desktop.selectImage();
    if (img) setMapBackground(img);
  };

  const handleClueMouseDown = (e: React.MouseEvent, clue: ClueCard) => {
    if (!canEdit) return;
    e.stopPropagation();
    const { x, y } = screenToWorld(e.clientX, e.clientY);
    setDragClueOffset({
      x: x - clue.x,
      y: y - clue.y,
    });
    setDraggedClue(clue.id);
  };

  const worldStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    transform: `translate(${mapState.offsetX}px, ${mapState.offsetY}px) scale(${mapState.scale})`,
    transformOrigin: '0 0',
    backgroundImage: mapState.backgroundImage ? `url(${mapState.backgroundImage})` : undefined,
    backgroundSize: mapState.backgroundImage ? '100% 100%' : undefined,
    backgroundRepeat: 'no-repeat',
  };

  if (!mapState.backgroundImage) {
    (worldStyle as any).backgroundImage = `
      linear-gradient(rgba(100, 100, 120, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(100, 100, 120, 0.1) 1px, transparent 1px)
    `;
    (worldStyle as any).backgroundSize = '40px 40px';
    (worldStyle as any).backgroundRepeat = 'repeat';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
      <div className="page-header" style={{ marginBottom: 12 }}>
        <h1 className="page-title">地图白板</h1>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={handleResetView}>🔄 重置视图</button>
          <button className="btn btn-outline" onClick={() => setMapScale(mapState.scale * 0.9)}>➖</button>
          <span style={{ alignSelf: 'center', fontSize: 12, color: 'var(--text-muted)', minWidth: 50, textAlign: 'center' }}>
            {Math.round(mapState.scale * 100)}%
          </span>
          <button className="btn btn-outline" onClick={() => setMapScale(mapState.scale * 1.1)}>➕</button>
          {canEdit && (
            <>
              <button className="btn btn-secondary" onClick={handleBackgroundUpload}>🖼️ 设置底图</button>
              <button className="btn btn-secondary" onClick={() => setShowAddClue(true)}>📋 添加线索卡</button>
            </>
          )}
        </div>
      </div>

      <div
        ref={viewportRef}
        onClick={handleMapClick}
        onMouseDown={handleMapMouseDown}
        onMouseMove={handleMapMouseMove}
        onMouseUp={handleMapMouseUp}
        onMouseLeave={handleMapMouseUp}
        onWheel={handleWheel}
        style={{
          flex: 1,
          background: 'var(--bg-secondary)',
          borderRadius: 8,
          border: '1px solid var(--border)',
          position: 'relative',
          overflow: 'hidden',
          cursor: canEdit ? (panning ? 'grabbing' : 'crosshair') : 'default',
          userSelect: 'none',
        }}
      >
        {!mapState.backgroundImage && canEdit && mapState.scale === 1 && mapState.offsetX === 0 && mapState.offsetY === 0 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'var(--text-muted)',
            textAlign: 'center',
            pointerEvents: 'none',
            zIndex: 1,
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗺️</div>
            <div>点击地图添加标记 · Alt+拖动平移 · 滚轮缩放</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>点击右上角"设置底图"上传地图</div>
          </div>
        )}

        <div style={worldStyle}>
          {mapState.markers.map((marker) => (
            <div
              key={marker.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMarker(marker);
              }}
              style={{
                position: 'absolute',
                left: marker.x,
                top: marker.y,
                transform: 'translate(-50%, -100%)',
                cursor: 'pointer',
                zIndex: 10,
              }}
              title={marker.label}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
              }}>
                <div style={{
                  background: marker.color || markerTypeConfig[marker.type].color,
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <span>{marker.icon || markerTypeConfig[marker.type].icon}</span>
                  <span>{marker.label}</span>
                </div>
                <div style={{
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: `8px solid ${marker.color || markerTypeConfig[marker.type].color}`,
                }} />
              </div>
            </div>
          ))}

          {mapState.clueCards.map((clue) => (
            <div
              key={clue.id}
              onMouseDown={(e) => handleClueMouseDown(e, clue)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedClue(clue);
              }}
              style={{
                position: 'absolute',
                left: clue.x,
                top: clue.y,
                width: 180,
                background: clue.discovered ? '#fffbe6' : '#fff7ed',
                color: '#1a1a2e',
                padding: 12,
                borderRadius: 4,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                cursor: canEdit ? 'move' : 'pointer',
                zIndex: 5,
                border: clue.discovered ? '1px solid #fbbf24' : '1px solid #fb923c',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                📋 {clue.title}
                {!clue.discovered && <span className="badge badge-warning" style={{ fontSize: 9 }}>未发现</span>}
              </div>
              <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {clue.content}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAddMarker && pendingPos && (
        <div className="modal-overlay" onClick={() => { setShowAddMarker(false); setPendingPos(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">添加地图标记</div>
              <button className="modal-close" onClick={() => { setShowAddMarker(false); setPendingPos(null); }}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">标记类型</label>
                <select
                  className="form-select"
                  value={markerType}
                  onChange={(e) => setMarkerType(e.target.value as any)}
                >
                  {Object.entries(markerTypeConfig).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">名称</label>
                <input
                  type="text"
                  className="form-input"
                  value={markerLabel}
                  onChange={(e) => setMarkerLabel(e.target.value)}
                  placeholder="标记名称"
                />
              </div>
              <div className="form-group">
                <label className="form-label">描述（可选）</label>
                <textarea
                  className="form-textarea"
                  value={markerDesc}
                  onChange={(e) => setMarkerDesc(e.target.value)}
                  placeholder="标记说明..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => { setShowAddMarker(false); setPendingPos(null); }}>取消</button>
              <button className="btn btn-primary" onClick={handleAddMarker} disabled={!markerLabel.trim()}>
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddClue && (
        <div className="modal-overlay" onClick={() => setShowAddClue(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">添加线索卡</div>
              <button className="modal-close" onClick={() => setShowAddClue(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">线索标题</label>
                <input
                  type="text"
                  className="form-input"
                  value={clueTitle}
                  onChange={(e) => setClueTitle(e.target.value)}
                  placeholder="例如：神秘信件"
                />
              </div>
              <div className="form-group">
                <label className="form-label">线索内容</label>
                <textarea
                  className="form-textarea"
                  value={clueContent}
                  onChange={(e) => setClueContent(e.target.value)}
                  placeholder="线索详细内容..."
                  style={{ minHeight: 120 }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowAddClue(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleAddClueCard} disabled={!clueTitle.trim()}>
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMarker && (
        <div className="modal-overlay" onClick={() => setSelectedMarker(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {markerTypeConfig[selectedMarker.type].icon} {selectedMarker.label}
              </div>
              <button className="modal-close" onClick={() => setSelectedMarker(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 12 }}>
                <span className={`badge ${
                  selectedMarker.type === 'danger' ? 'badge-danger' :
                  selectedMarker.type === 'clue' ? 'badge-warning' :
                  selectedMarker.type === 'npc' ? 'badge-success' :
                  selectedMarker.type === 'location' ? 'badge-info' : 'badge-secondary'
                }`}>
                  {markerTypeConfig[selectedMarker.type].label}
                </span>
              </div>
              {selectedMarker.description ? (
                <div style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {selectedMarker.description}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>暂无描述</div>
              )}
            </div>
            {canEdit && (
              <div className="modal-footer">
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    removeMapMarker(selectedMarker.id);
                    setSelectedMarker(null);
                  }}
                >
                  删除标记
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedClue && (
        <div className="modal-overlay" onClick={() => setSelectedClue(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">📋 {selectedClue.title}</div>
              <button className="modal-close" onClick={() => setSelectedClue(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 12 }}>
                <span className={`badge ${selectedClue.discovered ? 'badge-success' : 'badge-warning'}`}>
                  {selectedClue.discovered ? '已发现' : '未发现'}
                </span>
              </div>
              <div style={{
                background: 'var(--bg-primary)',
                padding: 16,
                borderRadius: 6,
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
              }}>
                {selectedClue.content}
              </div>
            </div>
            {canEdit && (
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => updateClueCard(selectedClue.id, { discovered: !selectedClue.discovered })}
                >
                  {selectedClue.discovered ? '标记为未发现' : '标记为已发现'}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    removeClueCard(selectedClue.id);
                    setSelectedClue(null);
                  }}
                >
                  删除
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapModule;
