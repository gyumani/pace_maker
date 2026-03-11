import React, { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { LatLngExpression, Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as XLSX from 'sheetjs-style';
import type { RoutePoint, OSRMRoute, RouteCalculationResult, PaceStrategy, ElevationPoint } from '../types/route';
import { osrmService } from '../services/osrmService';
import { elevationService } from '../services/elevationService';
import { paceStrategyService, type UserProfile } from '../services/paceStrategyService';
import ElevationProfile from './ElevationProfile';

// Leaflet 아이콘 설정
const startIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const endIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const waypointIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const currentLocationIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface RouteCalculationProps {
  userProfile: UserProfile;
}

/**
 * 지도 뷰를 자동으로 조정하는 컴포넌트
 * 경로가 계산된 후에만 동작
 */
function MapViewController({ positions, shouldFit }: { positions: LatLngExpression[]; shouldFit: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (shouldFit && positions.length > 0) {
      map.fitBounds(positions as any, { padding: [50, 50] });
    }
  }, [positions, map, shouldFit]);

  return null;
}

/**
 * 현재 위치로 지도 이동 컴포넌트
 */
function CurrentLocationButton({ onLocationUpdate }: { onLocationUpdate: (lat: number, lng: number) => void }) {
  const map = useMap();
  const [loading, setLoading] = useState(false);

  const moveToCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('이 브라우저는 위치 서비스를 지원하지 않습니다.');
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // 지도 중심을 현재 위치로 이동
        map.setView([lat, lng], 15, {
          animate: true,
          duration: 1
        });

        onLocationUpdate(lat, lng);
        setLoading(false);
      },
      (error) => {
        console.error('위치 가져오기 실패:', error);
        alert('위치를 가져올 수 없습니다. 위치 서비스를 활성화해주세요.');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <button
      onClick={moveToCurrentLocation}
      disabled={loading}
      style={{
        position: 'absolute',
        top: '80px',
        right: '10px',
        zIndex: 1000,
        background: 'white',
        border: '2px solid rgba(0,0,0,0.2)',
        borderRadius: '4px',
        padding: '8px 12px',
        cursor: loading ? 'wait' : 'pointer',
        fontSize: '1.2em',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
      }}
      title="내 위치로 이동"
    >
      <span>{loading ? '⏳' : '📍'}</span>
      <span style={{ fontSize: '0.7em', fontWeight: 'bold' }}>
        {loading ? '로딩중' : '내위치'}
      </span>
    </button>
  );
}

/**
 * 경로 기반 페이스 계산 컴포넌트
 */
export default function RouteCalculation({ userProfile }: RouteCalculationProps) {
  const [startPoint, setStartPoint] = useState<RoutePoint | null>(null);
  const [endPoint, setEndPoint] = useState<RoutePoint | null>(null);
  const [waypoints, setWaypoints] = useState<RoutePoint[]>([]);
  const [route, setRoute] = useState<OSRMRoute | null>(null);
  const [elevationProfile, setElevationProfile] = useState<ElevationPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<PaceStrategy>('average');
  const [strategies, setStrategies] = useState<RouteCalculationResult[]>([]);
  const [clickMode, setClickMode] = useState<'start' | 'waypoint' | 'end'>('start');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [currentLocation, setCurrentLocation] = useState<RoutePoint | null>(null);

  // 화면 크기 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 현재 위치 업데이트 콜백
  const handleLocationUpdate = useCallback((lat: number, lng: number) => {
    setCurrentLocation({
      lat,
      lng,
      name: '현재 위치'
    });
  }, []);

  // 지도 클릭 핸들러
  const MapClickHandler = () => {
    const map = useMap();

    useEffect(() => {
      const handleClick = (e: any) => {
        const point: RoutePoint = {
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          name: clickMode === 'start' ? '출발지' : clickMode === 'end' ? '도착지' : `경유지 ${waypoints.length + 1}`
        };

        if (clickMode === 'start') {
          setStartPoint(point);
          setClickMode('waypoint');
        } else if (clickMode === 'waypoint') {
          setWaypoints([...waypoints, point]);
        } else {
          setEndPoint(point);
          setClickMode('waypoint');
        }
      };

      map.on('click', handleClick);

      return () => {
        map.off('click', handleClick);
      };
    }, [map]);

    return null;
  };

  // 경로 계산
  const calculateRoute = useCallback(async () => {
    if (!startPoint || !endPoint) return;

    setLoading(true);
    setError(null);

    try {
      // OSRM으로 경로 계산 (경유지 포함)
      let response;
      if (waypoints.length > 0) {
        const allPoints = [startPoint, ...waypoints, endPoint];
        response = await osrmService.getRouteWithWaypoints(allPoints, 'walking');
      } else {
        response = await osrmService.getRoute(startPoint, endPoint, 'walking');
      }

      if (response.code === 'Ok' && response.routes.length > 0) {
        const calculatedRoute = response.routes[0];
        setRoute(calculatedRoute);

        // 고도 프로필 가져오기
        const elevations = await elevationService.getRouteElevationProfile(
          calculatedRoute.geometry.coordinates
        );
        setElevationProfile(elevations);

        // 3가지 전략 계산
        const strategies: RouteCalculationResult[] = [];
        const strategyTypes: PaceStrategy[] = ['best', 'average', 'worst'];

        for (const strategyType of strategyTypes) {
          const result = paceStrategyService.calculateRouteStrategy(
            calculatedRoute.distance,
            elevations,
            userProfile,
            strategyType
          );
          strategies.push(result);
        }

        setStrategies(strategies);
      } else {
        setError('경로를 찾을 수 없습니다');
      }
    } catch (err) {
      setError('경로 계산 중 오류가 발생했습니다');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [startPoint, endPoint, waypoints, userProfile]);

  // 경로 좌표 변환
  const routeCoordinates: LatLngExpression[] = route
    ? route.geometry.coordinates.map(coord => [coord[1], coord[0]] as LatLngExpression)
    : [];

  // 지도 중심 계산
  const allPositions: LatLngExpression[] = [
    ...(startPoint ? [[startPoint.lat, startPoint.lng] as LatLngExpression] : []),
    ...(endPoint ? [[endPoint.lat, endPoint.lng] as LatLngExpression] : []),
    ...routeCoordinates
  ];

  const center: LatLngExpression = startPoint
    ? [startPoint.lat, startPoint.lng]
    : [37.5665, 126.9780]; // 기본값: 서울

  // 선택된 전략 데이터
  const currentStrategy = strategies.find(s => s.strategy === selectedStrategy);

  // 엑셀 다운로드
  const exportToExcel = useCallback(() => {
    if (!currentStrategy || !route) return;

    const data = [];

    // 제목 및 경로 정보
    data.push(['📍 경로 계산 결과']);
    data.push([]);
    data.push(['경로 정보']);
    if (startPoint) data.push(['출발지', `위도 ${startPoint.lat.toFixed(6)}, 경도 ${startPoint.lng.toFixed(6)}`]);
    if (waypoints.length > 0) {
      waypoints.forEach((wp, idx) => {
        data.push([`경유지 ${idx + 1}`, `위도 ${wp.lat.toFixed(6)}, 경도 ${wp.lng.toFixed(6)}`]);
      });
    }
    if (endPoint) data.push(['도착지', `위도 ${endPoint.lat.toFixed(6)}, 경도 ${endPoint.lng.toFixed(6)}`]);
    data.push(['총 거리', `${currentStrategy.totalDistance.toFixed(2)} km`]);
    data.push(['총 고도 상승', `+${currentStrategy.totalElevationGain.toFixed(0)}m`]);
    data.push(['총 고도 하강', `-${currentStrategy.totalElevationLoss.toFixed(0)}m`]);
    data.push([]);

    // 전략 정보
    data.push(['페이스 전략']);
    const strategyName = currentStrategy.strategy === 'best' ? '🏆 최상 전략' :
                        currentStrategy.strategy === 'average' ? '⚖️ 평균 전략' : '🐢 안전 전략';
    data.push(['전략', strategyName]);
    data.push(['총 시간', currentStrategy.totalTime]);
    data.push(['평균 페이스', `${currentStrategy.avgPace}/km`]);
    data.push(['평균 심박수', `${currentStrategy.avgHeartRate}bpm`]);
    data.push([]);

    // 구간별 데이터 헤더
    data.push(['구간(km)', '고도(m)', '상승↗', '하강↘', '페이스', '구간시간', '누적시간', '심박수', '강도구간']);

    // 구간별 데이터
    currentStrategy.segments.forEach((segment) => {
      data.push([
        segment.km,
        `${segment.elevation}m`,
        segment.elevationGain > 0 ? `+${segment.elevationGain}m` : '-',
        segment.elevationLoss > 0 ? `-${segment.elevationLoss}m` : '-',
        `${segment.pace}/km`,
        segment.pace,
        segment.cumulativeTime,
        `${segment.heartRate}bpm`,
        segment.intensity
      ]);
    });

    // 사용자 프로필 정보
    data.push([]);
    data.push(['사용자 프로필']);
    data.push(['나이', `${userProfile.age}세`]);
    if (userProfile.height > 0) data.push(['키', `${userProfile.height}cm`]);
    if (userProfile.weight > 0) data.push(['체중', `${userProfile.weight}kg`]);
    if (userProfile.vo2max > 0) data.push(['VO2Max', userProfile.vo2max]);
    if (userProfile.restingHR) data.push(['안정시 심박수', `${userProfile.restingHR}bpm`]);
    if (userProfile.maxHR) data.push(['최대 심박수', `${userProfile.maxHR}bpm`]);

    // Excel 파일 생성
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // 컬럼 너비 설정
    ws['!cols'] = [
      {wch: 12}, // 구간(km)
      {wch: 10}, // 고도
      {wch: 10}, // 상승
      {wch: 10}, // 하강
      {wch: 12}, // 페이스
      {wch: 12}, // 구간시간
      {wch: 12}, // 누적시간
      {wch: 12}, // 심박수
      {wch: 12}  // 강도구간
    ];

    XLSX.utils.book_append_sheet(wb, ws, '경로 계산');

    // 파일명 생성 (날짜 포함)
    const date = new Date().toISOString().split('T')[0];
    const filename = `경로계산_${strategyName.replace(/[🏆⚖️🐢 ]/g, '')}_${date}.xlsx`;

    XLSX.writeFile(wb, filename);
  }, [currentStrategy, route, startPoint, endPoint, waypoints, userProfile]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: isMobile ? '15px' : '20px' }}>
      {/* 지도 및 컨트롤 */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '15px' : '20px',
        minHeight: isMobile ? 'auto' : '500px'
      }}>
        {/* 지도 */}
        <div style={{
          flex: isMobile ? 'none' : '1',
          height: isMobile ? '400px' : '500px',
          position: 'relative',
          border: '2px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <MapContainer
            center={center}
            zoom={13}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {startPoint && (
              <Marker position={[startPoint.lat, startPoint.lng]} icon={startIcon}>
                <Popup>
                  <strong>출발지</strong>
                  <br />
                  {startPoint.name || '선택된 위치'}
                </Popup>
              </Marker>
            )}

            {endPoint && (
              <Marker position={[endPoint.lat, endPoint.lng]} icon={endIcon}>
                <Popup>
                  <strong>도착지</strong>
                  <br />
                  {endPoint.name || '선택된 위치'}
                </Popup>
              </Marker>
            )}

            {waypoints.map((waypoint, index) => (
              <Marker key={index} position={[waypoint.lat, waypoint.lng]} icon={waypointIcon}>
                <Popup>
                  <strong>경유지 {index + 1}</strong>
                  <br />
                  {waypoint.name || '선택된 위치'}
                  <br />
                  <button
                    onClick={() => {
                      const newWaypoints = waypoints.filter((_, i) => i !== index);
                      setWaypoints(newWaypoints);
                    }}
                    style={{
                      marginTop: '5px',
                      padding: '4px 8px',
                      background: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    삭제
                  </button>
                </Popup>
              </Marker>
            ))}

            {currentLocation && (
              <Marker position={[currentLocation.lat, currentLocation.lng]} icon={currentLocationIcon}>
                <Popup>
                  <strong>📍 현재 위치</strong>
                  <br />
                  위도: {currentLocation.lat.toFixed(6)}
                  <br />
                  경도: {currentLocation.lng.toFixed(6)}
                </Popup>
              </Marker>
            )}

            {routeCoordinates.length > 0 && (
              <Polyline
                positions={routeCoordinates}
                color="#2196F3"
                weight={5}
                opacity={0.7}
              />
            )}

            <MapViewController positions={allPositions} shouldFit={route !== null} />
            <MapClickHandler />
            <CurrentLocationButton onLocationUpdate={handleLocationUpdate} />
          </MapContainer>

          {loading && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'white',
              padding: '10px 20px',
              borderRadius: '5px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              zIndex: 1000
            }}>
              경로 계산 중...
            </div>
          )}

          {error && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#f44336',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '5px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              zIndex: 1000
            }}>
              {error}
            </div>
          )}
        </div>

        {/* 컨트롤 패널 */}
        <div style={{
          width: isMobile ? '100%' : '320px',
          padding: isMobile ? '15px' : '20px',
          background: '#f8f9fa',
          borderRadius: '8px',
          maxHeight: isMobile ? 'none' : '500px',
          overflowY: isMobile ? 'visible' : 'auto'
        }}>
          <h3 style={{ marginTop: 0 }}>경로 설정</h3>

          <div style={{ marginBottom: '15px' }}>
            <div style={{
              padding: '10px',
              background: clickMode === 'start' ? '#4CAF50' : clickMode === 'waypoint' ? '#FFC107' : '#2196F3',
              color: clickMode === 'waypoint' ? '#000' : 'white',
              borderRadius: '5px',
              marginBottom: '10px',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              {clickMode === 'start' && '🟢 출발지 선택 중'}
              {clickMode === 'waypoint' && '🟡 경유지 선택 중'}
              {clickMode === 'end' && '🔴 도착지 선택 중'}
            </div>

            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
              <button
                onClick={() => setClickMode('start')}
                className={`btn ${clickMode === 'start' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: isMobile ? '12px' : '8px', fontSize: isMobile ? '1em' : '0.9em', minHeight: isMobile ? '44px' : 'auto' }}
              >
                출발지
              </button>
              <button
                onClick={() => setClickMode('waypoint')}
                className={`btn ${clickMode === 'waypoint' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: isMobile ? '12px' : '8px', fontSize: isMobile ? '1em' : '0.9em', minHeight: isMobile ? '44px' : 'auto' }}
              >
                경유지
              </button>
              <button
                onClick={() => setClickMode('end')}
                className={`btn ${clickMode === 'end' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: isMobile ? '12px' : '8px', fontSize: isMobile ? '1em' : '0.9em', minHeight: isMobile ? '44px' : 'auto' }}
              >
                도착지
              </button>
            </div>

            {startPoint && (
              <div style={{ fontSize: '0.85em', marginBottom: '5px', padding: '5px', background: '#e8f5e9', borderRadius: '4px', color: '#333' }}>
                ✅ <strong>출발지:</strong> {startPoint.lat.toFixed(4)}, {startPoint.lng.toFixed(4)}
              </div>
            )}

            {waypoints.length > 0 && (
              <div style={{ marginBottom: '5px' }}>
                {waypoints.map((wp, idx) => (
                  <div key={idx} style={{
                    fontSize: '0.85em',
                    marginBottom: '3px',
                    padding: '5px',
                    background: '#fff8e1',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: '#333'
                  }}>
                    <span>🟡 경유지 {idx + 1}: {wp.lat.toFixed(4)}, {wp.lng.toFixed(4)}</span>
                    <button
                      onClick={() => setWaypoints(waypoints.filter((_, i) => i !== idx))}
                      style={{
                        padding: '2px 6px',
                        fontSize: '0.8em',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {endPoint && (
              <div style={{ fontSize: '0.85em', marginBottom: '5px', padding: '5px', background: '#ffebee', borderRadius: '4px', color: '#333' }}>
                ✅ <strong>도착지:</strong> {endPoint.lat.toFixed(4)}, {endPoint.lng.toFixed(4)}
              </div>
            )}
          </div>

          <button
            onClick={calculateRoute}
            disabled={!startPoint || !endPoint || loading}
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '15px' }}
          >
            {loading ? '계산 중...' : '경로 계산하기'}
          </button>

          <button
            onClick={() => {
              setStartPoint(null);
              setEndPoint(null);
              setWaypoints([]);
              setRoute(null);
              setElevationProfile([]);
              setStrategies([]);
              setError(null);
              setClickMode('start');
              setCurrentLocation(null);
            }}
            className="btn btn-danger"
            style={{ width: '100%' }}
          >
            초기화
          </button>

          {route && (
            <div style={{ marginTop: '20px', padding: '15px', background: 'white', borderRadius: '5px' }}>
              <h4 style={{ marginTop: 0 }}>경로 정보</h4>
              <div style={{ fontSize: '0.9em' }}>
                <div><strong>거리:</strong> {(route.distance / 1000).toFixed(2)} km</div>
                <div><strong>고도 변화:</strong> {currentStrategy ? `+${currentStrategy.totalElevationGain.toFixed(0)}m / -${currentStrategy.totalElevationLoss.toFixed(0)}m` : '-'}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 고도 프로필 */}
      {elevationProfile.length > 0 && route && (
        <ElevationProfile
          elevations={elevationProfile}
          distanceKm={route.distance / 1000}
        />
      )}

      {/* 전략 선택 */}
      {strategies.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>페이스 전략 선택</h3>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '10px',
            marginBottom: '20px'
          }}>
            {strategies.map((strategy) => (
              <button
                key={strategy.strategy}
                onClick={() => setSelectedStrategy(strategy.strategy)}
                className={`btn ${selectedStrategy === strategy.strategy ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  flex: isMobile ? 'none' : 1,
                  minHeight: isMobile ? '80px' : 'auto',
                  padding: isMobile ? '15px' : '12px'
                }}
              >
                {strategy.strategy === 'best' && '🏆 최상 전략'}
                {strategy.strategy === 'average' && '⚖️ 평균 전략'}
                {strategy.strategy === 'worst' && '🐢 안전 전략'}
                <div style={{ fontSize: isMobile ? '0.9em' : '0.8em', marginTop: '5px' }}>
                  평균 페이스: {strategy.avgPace}/km
                </div>
                <div style={{ fontSize: isMobile ? '0.9em' : '0.8em' }}>
                  총 시간: {strategy.totalTime}
                </div>
              </button>
            ))}
          </div>

          {/* 전략 상세 정보 */}
          {currentStrategy && (
            <>
              <div className="summary-cards" style={{ marginBottom: '20px' }}>
                <div className="card">
                  <div className="card-title">총 거리</div>
                  <div className="card-value">{currentStrategy.totalDistance.toFixed(2)} km</div>
                </div>
                <div className="card">
                  <div className="card-title">총 시간</div>
                  <div className="card-value">{currentStrategy.totalTime}</div>
                </div>
                <div className="card">
                  <div className="card-title">평균 페이스</div>
                  <div className="card-value">{currentStrategy.avgPace}/km</div>
                </div>
                <div className="card">
                  <div className="card-title">평균 심박수</div>
                  <div className="card-value">{currentStrategy.avgHeartRate} bpm</div>
                </div>
              </div>

              {/* 엑셀 다운로드 버튼 */}
              <div style={{ marginBottom: '20px' }}>
                <button
                  onClick={exportToExcel}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  📊 엑셀로 내보내기
                </button>
              </div>

              {/* 구간별 상세 정보 */}
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>km</th>
                      <th>고도(m)</th>
                      <th>상승↗</th>
                      <th>하강↘</th>
                      <th>페이스</th>
                      <th>구간시간</th>
                      <th>누적시간</th>
                      <th>심박수</th>
                      <th>강도구간</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentStrategy.segments.map((segment) => (
                      <tr key={segment.km}>
                        <td className="km-display">{segment.km}</td>
                        <td>{segment.elevation}m</td>
                        <td style={{ color: segment.elevationGain > 10 ? '#e74c3c' : '#666' }}>
                          {segment.elevationGain > 0 ? `+${segment.elevationGain}m` : '-'}
                        </td>
                        <td style={{ color: segment.elevationLoss > 10 ? '#27ae60' : '#666' }}>
                          {segment.elevationLoss > 0 ? `-${segment.elevationLoss}m` : '-'}
                        </td>
                        <td className="section-time">{segment.pace}/km</td>
                        <td className="section-time">{segment.pace}</td>
                        <td className="cumulative-time">{segment.cumulativeTime}</td>
                        <td className="heart-rate">{segment.heartRate}bpm</td>
                        <td className="intensity-zone">{segment.intensity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {!route && (
        <div className="instructions">
          <h3>📍 경로 계산 사용법</h3>
          <ul>
            <li><strong>📍 내 위치:</strong> 지도 오른쪽 상단의 "📍 내위치" 버튼을 눌러 현재 GPS 위치로 지도를 이동할 수 있습니다 (파란색 마커)</li>
            <li><strong>1단계:</strong> 출발지, 경유지, 도착지 버튼을 눌러 모드를 선택하세요</li>
            <li><strong>2단계:</strong> 지도를 클릭하여 지점을 추가하세요</li>
            <li><strong>경유지:</strong> 필요한 만큼 경유지를 추가할 수 있습니다 (노란색 마커)</li>
            <li><strong>3단계:</strong> 출발지와 도착지를 모두 설정한 후 "경로 계산하기" 클릭</li>
            <li><strong>4단계:</strong> 고도 그래프와 3가지 전략 (최상/평균/안전)을 확인하세요</li>
            <li><strong>고도 반영:</strong> 오르막과 내리막에 따라 페이스가 자동 조정됩니다</li>
            <li><strong>심박수:</strong> 사용자 프로필을 기반으로 예상 심박수가 계산됩니다</li>
            <li><strong>삭제:</strong> 경유지는 마커나 목록에서 개별 삭제 가능합니다</li>
          </ul>
        </div>
      )}
    </div>
  );
}
