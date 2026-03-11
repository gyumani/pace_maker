/**
 * Garmin 대시보드 컴포넌트
 * Facade Pattern: 복잡한 Garmin 정보를 단순한 인터페이스로 제공
 */

import { useState, useEffect } from 'react';
import type { GarminProfile, GarminActivity } from '../services/garminApiService';
import { garminSessionService } from '../services/garminSessionService';

interface GarminDashboardProps {
  profile: GarminProfile;
  activities?: GarminActivity[];
  onLogout: () => void;
}

export default function GarminDashboard({ profile, activities, onLogout }: GarminDashboardProps) {
  const [remainingTime, setRemainingTime] = useState(garminSessionService.getRemainingTimeString());

  // 1분마다 남은 시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = garminSessionService.getRemainingTimeString();
      setRemainingTime(remaining);

      // 세션 만료 시 자동 로그아웃
      if (remaining === '만료됨') {
        onLogout();
      }
    }, 60000); // 1분마다

    return () => clearInterval(interval);
  }, [onLogout]);

  const handleLogout = () => {
    if (window.confirm('Garmin 계정에서 로그아웃하시겠습니까?')) {
      garminSessionService.clearSession();
      onLogout();
    }
  };

  return (
    <div>
      {/* 세션 정보 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px',
        background: '#e8f5e9',
        borderRadius: '5px',
        marginBottom: '15px',
        fontSize: '0.85em',
        color: '#2e7d32'
      }}>
        <span>✅ Garmin 로그인됨 (남은 시간: {remainingTime})</span>
        <button
          onClick={handleLogout}
          className="btn btn-danger"
          style={{
            padding: '5px 10px',
            fontSize: '0.85em'
          }}
        >
          로그아웃
        </button>
      </div>

      {/* 프로필 정보 카드 */}
      <div style={{
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '15px',
        background: '#fafafa'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          marginBottom: '15px'
        }}>
          {/* 프로필 이미지 */}
          {profile.profileImageUrl && (
            <img
              src={profile.profileImageUrl}
              alt="Profile"
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          )}

          {/* 이름 */}
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2em', color: '#333' }}>
              {profile.displayName || 'Garmin User'}
            </h3>
            <p style={{ margin: '5px 0 0 0', fontSize: '0.85em', color: '#666' }}>
              Garmin Connect
            </p>
          </div>
        </div>

        {/* 프로필 상세 정보 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '10px'
        }}>
          <div className="profile-stat">
            <div style={{ fontSize: '0.85em', color: '#666' }}>나이</div>
            <div style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#333' }}>{profile.age}세</div>
          </div>
          <div className="profile-stat">
            <div style={{ fontSize: '0.85em', color: '#666' }}>키</div>
            <div style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#333' }}>{profile.height}cm</div>
          </div>
          <div className="profile-stat">
            <div style={{ fontSize: '0.85em', color: '#666' }}>체중</div>
            <div style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#333' }}>{profile.weight}kg</div>
          </div>
          <div className="profile-stat">
            <div style={{ fontSize: '0.85em', color: '#666' }}>VO2Max</div>
            <div style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#1976d2' }}>
              {profile.vo2max || 'N/A'}
            </div>
          </div>
          <div className="profile-stat">
            <div style={{ fontSize: '0.85em', color: '#666' }}>안정시 심박수</div>
            <div style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#333' }}>{profile.restingHR}bpm</div>
          </div>
          <div className="profile-stat">
            <div style={{ fontSize: '0.85em', color: '#666' }}>최대 심박수</div>
            <div style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#333' }}>{profile.maxHR}bpm</div>
          </div>
        </div>
      </div>

      {/* 최근 활동 내역 */}
      {activities && activities.length > 0 && (
        <div style={{
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '15px',
          background: '#fafafa'
        }}>
          <h4 style={{ margin: '0 0 15px 0', fontSize: '1em', color: '#333' }}>🏃 최근 러닝 활동</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activities.map((activity, index) => (
              <div
                key={index}
                style={{
                  padding: '10px',
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '5px',
                  fontSize: '0.9em'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '5px'
                }}>
                  <strong style={{ color: '#333' }}>{activity.activityName || `러닝 #${index + 1}`}</strong>
                  <span style={{ fontSize: '0.85em', color: '#666' }}>
                    {new Date(activity.startTimeLocal).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                  gap: '8px',
                  fontSize: '0.85em',
                  color: '#555'
                }}>
                  <div>
                    <span style={{ color: '#888' }}>거리:</span> <strong style={{ color: '#333' }}>{activity.distance}km</strong>
                  </div>
                  <div>
                    <span style={{ color: '#888' }}>시간:</span> <strong style={{ color: '#333' }}>{activity.duration}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#888' }}>평균 페이스:</span> <strong style={{ color: '#333' }}>{activity.averagePace}/km</strong>
                  </div>
                  <div>
                    <span style={{ color: '#888' }}>평균 심박수:</span> <strong style={{ color: '#333' }}>{activity.averageHR}bpm</strong>
                  </div>
                  {activity.elevationGain > 0 && (
                    <div>
                      <span style={{ color: '#888' }}>고도 상승:</span> <strong style={{ color: '#333' }}>{activity.elevationGain}m</strong>
                    </div>
                  )}
                  <div>
                    <span style={{ color: '#888' }}>칼로리:</span> <strong style={{ color: '#333' }}>{activity.calories}kcal</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 활동 내역이 없는 경우 */}
      {(!activities || activities.length === 0) && (
        <div style={{
          padding: '15px',
          background: '#f5f5f5',
          borderRadius: '5px',
          textAlign: 'center',
          fontSize: '0.9em',
          color: '#666'
        }}>
          최근 러닝 활동이 없습니다
        </div>
      )}
    </div>
  );
}
