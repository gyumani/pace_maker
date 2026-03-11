/**
 * 프로필 입력 컴포넌트
 * Strategy Pattern: 프로필 입력 전략 (직접 입력 / Garmin 연동)
 */

import { useState, useCallback, useEffect } from 'react';
import GarminLogin from './GarminLogin';
import GarminDashboard from './GarminDashboard';
import { profileStorageService } from '../services/profileStorageService';
import { garminSessionService, type GarminSession } from '../services/garminSessionService';
import type { GarminProfile, GarminActivity } from '../services/garminApiService';
import type { UserProfile } from '../types/profile';

interface ProfileInputProps {
  userProfile: UserProfile;
  onProfileChange: (field: keyof UserProfile, value: number) => void;
  onProfileLoad: (profile: UserProfile) => void;
  calculateBMI: (height: number, weight: number) => number;
}

type InputMode = 'manual' | 'garmin';

export default function ProfileInput({
  userProfile,
  onProfileChange,
  onProfileLoad,
  calculateBMI
}: ProfileInputProps) {
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [sessionInfo, setSessionInfo] = useState(profileStorageService.getSessionInfo());
  const [garminSession, setGarminSession] = useState<GarminSession | null>(
    garminSessionService.loadSession()
  );

  // 컴포넌트 마운트 시 쿠키에서 프로필 복원
  useEffect(() => {
    const savedProfile = profileStorageService.loadProfile();
    if (savedProfile) {
      onProfileLoad(savedProfile);
      console.log('✅ 저장된 프로필을 복원했습니다');
    }
  }, [onProfileLoad]);

  // 프로필 변경 시 자동 저장
  useEffect(() => {
    if (userProfile.age > 0 || userProfile.height > 0 || userProfile.weight > 0 || userProfile.vo2max > 0) {
      profileStorageService.saveProfile(userProfile);
      setSessionInfo(profileStorageService.getSessionInfo());
    }
  }, [userProfile]);

  // Garmin 로그인 성공 핸들러
  const handleGarminLoginSuccess = useCallback((garminProfile: GarminProfile, activities?: GarminActivity[]) => {
    // UserProfile 형식으로 변환하여 부모 컴포넌트에 전달
    const updatedProfile: UserProfile = {
      age: garminProfile.age,
      weight: garminProfile.weight,
      height: garminProfile.height,
      vo2max: garminProfile.vo2max,
      restingHR: garminProfile.restingHR,
      maxHeartRate: garminProfile.maxHR,
      bmi: calculateBMI(garminProfile.height, garminProfile.weight)
    };

    onProfileLoad(updatedProfile);
    profileStorageService.saveProfile(updatedProfile);
    setSessionInfo(profileStorageService.getSessionInfo());

    // Garmin 세션 로드
    setGarminSession(garminSessionService.loadSession());

    console.log('✅ Garmin 로그인 성공 및 프로필 저장됨');
  }, [onProfileLoad, calculateBMI]);

  // Garmin 로그아웃 핸들러
  const handleGarminLogout = useCallback(() => {
    garminSessionService.clearSession();
    setGarminSession(null);
    console.log('✅ Garmin 로그아웃 완료');
  }, []);

  // 프로필 초기화
  const handleClearProfile = () => {
    if (window.confirm('프로필 정보를 삭제하시겠습니까?')) {
      profileStorageService.clearProfile();
      onProfileLoad({
        height: 0,
        weight: 0,
        age: 0,
        vo2max: 0,
        restingHR: 60
      });
      setSessionInfo(profileStorageService.getSessionInfo());
      console.log('✅ 프로필이 초기화되었습니다');
    }
  };

  return (
    <div className="profile-section">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h3 style={{ margin: 0 }}>🏃‍♂️ 사용자 프로필</h3>
        {sessionInfo.hasSession && (
          <button
            onClick={handleClearProfile}
            className="btn btn-danger"
            style={{
              padding: '5px 10px',
              fontSize: '0.85em'
            }}
          >
            🗑️ 초기화
          </button>
        )}
      </div>

      {/* 세션 정보 표시 */}
      {sessionInfo.hasSession && (
        <div style={{
          padding: '10px',
          background: '#e8f5e9',
          borderRadius: '5px',
          marginBottom: '15px',
          fontSize: '0.85em',
          color: '#2e7d32'
        }}>
          ✅ {sessionInfo.message}
        </div>
      )}

      {/* 입력 모드 선택 탭 - Garmin 로그인 상태가 아닐 때만 표시 */}
      {!garminSession && (
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '15px',
          borderBottom: '2px solid #e9ecef',
          paddingBottom: '10px'
        }}>
          <button
            onClick={() => setInputMode('manual')}
            className={`btn ${inputMode === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '0.95em'
            }}
          >
            ✏️ 직접 입력
          </button>
          <button
            onClick={() => setInputMode('garmin')}
            className={`btn ${inputMode === 'garmin' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '0.95em'
            }}
          >
            ⌚ Garmin 연동
          </button>
        </div>
      )}

      {/* Garmin 세션이 있으면 무조건 대시보드 표시 */}
      {garminSession ? (
        <GarminDashboard
          profile={garminSession.profile}
          activities={garminSession.activities}
          onLogout={handleGarminLogout}
        />
      ) : (
        // Garmin 세션이 없을 때만 모드 선택
        inputMode === 'manual' ? (
          // 직접 입력 모드
          <>
            <div className="profile-inputs">
              <div className="input-group">
                <label>키 (cm):</label>
                <input
                  type="number"
                  value={userProfile.height || ''}
                  onChange={(e) => onProfileChange('height', Number(e.target.value))}
                  placeholder="170"
                />
              </div>
              <div className="input-group">
                <label>체중 (kg):</label>
                <input
                  type="number"
                  value={userProfile.weight || ''}
                  onChange={(e) => onProfileChange('weight', Number(e.target.value))}
                  placeholder="70"
                />
              </div>
              <div className="input-group">
                <label>나이:</label>
                <input
                  type="number"
                  value={userProfile.age || ''}
                  onChange={(e) => onProfileChange('age', Number(e.target.value))}
                  placeholder="30"
                />
              </div>
              <div className="input-group">
                <label>VO2Max:</label>
                <input
                  type="number"
                  value={userProfile.vo2max || ''}
                  onChange={(e) => onProfileChange('vo2max', Number(e.target.value))}
                  placeholder="45"
                />
              </div>
              <div className="input-group">
                <label>안정시 심박수 (bpm):</label>
                <input
                  type="number"
                  value={userProfile.restingHR || ''}
                  onChange={(e) => onProfileChange('restingHR', Number(e.target.value))}
                  placeholder="60"
                />
              </div>
            </div>

            {userProfile.bmi && userProfile.bmi > 0 && (
              <div className="calculated-values">
                <div className="calc-item">
                  <strong>BMI:</strong> {userProfile.bmi}
                  {userProfile.bmi < 18.5 && <span className="bmi-status"> (저체중)</span>}
                  {userProfile.bmi >= 18.5 && userProfile.bmi < 25 && <span className="bmi-status"> (정상)</span>}
                  {userProfile.bmi >= 25 && userProfile.bmi < 30 && <span className="bmi-status"> (과체중)</span>}
                  {userProfile.bmi >= 30 && <span className="bmi-status"> (비만)</span>}
                </div>
                {userProfile.maxHeartRate && (
                  <div className="calc-item">
                    <strong>최대 심박수:</strong> {userProfile.maxHeartRate}bpm
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          // Garmin 로그인 화면
          <GarminLogin onLoginSuccess={handleGarminLoginSuccess} />
        )
      )}

      {/* 안내 메시지 */}
      <div style={{
        marginTop: '15px',
        padding: '10px',
        background: '#f0f8ff',
        borderRadius: '5px',
        fontSize: '0.85em',
        color: '#555'
      }}>
        <strong>ℹ️ 세션 관리:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>프로필 정보는 쿠키에 자동 저장됩니다</li>
          <li>세션은 1시간 동안 유지됩니다</li>
          <li>만료 후 자동으로 삭제됩니다</li>
        </ul>
      </div>
    </div>
  );
}
