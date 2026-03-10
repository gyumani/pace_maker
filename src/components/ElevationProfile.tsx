import type { ElevationPoint } from '../types/route';

interface ElevationProfileProps {
  elevations: ElevationPoint[];
  distanceKm: number;
}

/**
 * 고도 프로필 차트 컴포넌트
 * Decorator Pattern: 경로 정보에 고도 정보를 추가로 장식
 */
export default function ElevationProfile({ elevations, distanceKm }: ElevationProfileProps) {
  if (elevations.length === 0) {
    return null;
  }

  const elevs = elevations.map(e => e.elevation);
  const minElevation = Math.min(...elevs);
  const maxElevation = Math.max(...elevs);
  const elevationGain = maxElevation - minElevation;

  // 고도 상승/하강 계산
  let totalGain = 0;
  let totalLoss = 0;
  for (let i = 1; i < elevations.length; i++) {
    const diff = elevations[i].elevation - elevations[i - 1].elevation;
    if (diff > 0) {
      totalGain += diff;
    } else {
      totalLoss += Math.abs(diff);
    }
  }

  return (
    <div style={{
      background: 'white',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#333' }}>
        📈 고도 프로필
      </h3>

      {/* 고도 통계 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
        <div>
          <div style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>
            최저 고도
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2196F3' }}>
            {Math.round(minElevation)} m
          </div>
        </div>

        <div>
          <div style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>
            최고 고도
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4CAF50' }}>
            {Math.round(maxElevation)} m
          </div>
        </div>

        <div>
          <div style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>
            총 상승 ↗
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e74c3c' }}>
            +{Math.round(totalGain)} m
          </div>
        </div>

        <div>
          <div style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>
            총 하강 ↘
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#27ae60' }}>
            -{Math.round(totalLoss)} m
          </div>
        </div>
      </div>

      {/* 고도 그래프 */}
      <div style={{ marginTop: '20px' }}>
        <div style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
          고도 변화 ({distanceKm.toFixed(2)} km)
        </div>
        <div style={{
          width: '100%',
          height: '150px',
          background: '#f5f5f5',
          borderRadius: '5px',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #e0e0e0'
        }}>
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* 배경 그리드 */}
            <line x1="0" y1="25" x2="100" y2="25" stroke="#e0e0e0" strokeWidth="0.2" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="#e0e0e0" strokeWidth="0.2" />
            <line x1="0" y1="75" x2="100" y2="75" stroke="#e0e0e0" strokeWidth="0.2" />

            <line x1="25" y1="0" x2="25" y2="100" stroke="#e0e0e0" strokeWidth="0.2" />
            <line x1="50" y1="0" x2="50" y2="100" stroke="#e0e0e0" strokeWidth="0.2" />
            <line x1="75" y1="0" x2="75" y2="100" stroke="#e0e0e0" strokeWidth="0.2" />

            {/* 고도 선 */}
            <polyline
              points={elevations.map((e, i) => {
                const x = (i / (elevations.length - 1)) * 100;
                const y = 90 - ((e.elevation - minElevation) / (elevationGain || 1)) * 80;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#2196F3"
              strokeWidth="1.5"
            />

            {/* 고도 영역 */}
            <polygon
              points={
                elevations.map((e, i) => {
                  const x = (i / (elevations.length - 1)) * 100;
                  const y = 90 - ((e.elevation - minElevation) / (elevationGain || 1)) * 80;
                  return `${x},${y}`;
                }).join(' ') + ' 100,100 0,100'
              }
              fill="rgba(33, 150, 243, 0.2)"
              stroke="none"
            />
          </svg>

          {/* 고도 레이블 */}
          <div style={{
            position: 'absolute',
            top: '5px',
            left: '5px',
            fontSize: '12px',
            color: '#666',
            background: 'rgba(255,255,255,0.8)',
            padding: '2px 5px',
            borderRadius: '3px'
          }}>
            {Math.round(maxElevation)}m
          </div>
          <div style={{
            position: 'absolute',
            bottom: '5px',
            left: '5px',
            fontSize: '12px',
            color: '#666',
            background: 'rgba(255,255,255,0.8)',
            padding: '2px 5px',
            borderRadius: '3px'
          }}>
            {Math.round(minElevation)}m
          </div>
        </div>
      </div>
    </div>
  );
}
