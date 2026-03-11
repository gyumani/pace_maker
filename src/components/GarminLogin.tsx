/**
 * Garmin 로그인 컴포넌트
 * Strategy Pattern: Garmin 인증 전략
 */

import { useState } from 'react';
import { garminApiService, type GarminProfile, type GarminActivity } from '../services/garminApiService';
import { garminSessionService } from '../services/garminSessionService';

interface GarminLoginProps {
  onLoginSuccess: (profile: GarminProfile, activities?: GarminActivity[]) => void;
}

export default function GarminLogin({ onLoginSuccess }: GarminLoginProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    // 유효성 검사
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 서버 연결 확인
      const isHealthy = await garminApiService.checkHealth();
      if (!isHealthy) {
        throw new Error('백엔드 서버가 실행 중이 아닙니다. 서버를 먼저 시작해주세요.');
      }

      // 프로필 가져오기
      const profile = await garminApiService.getUserProfile(email, password);

      // 최근 활동 가져오기 (선택사항)
      let activities: GarminActivity[] | undefined;
      try {
        activities = await garminApiService.getRecentActivities(email, password, 5);
      } catch (e) {
        console.warn('활동 데이터를 가져오지 못했습니다:', e);
        // 활동 데이터가 없어도 로그인은 성공
      }

      // 세션 저장
      garminSessionService.saveSession(email, password, profile, activities);

      // 부모 컴포넌트에 전달
      onLoginSuccess(profile, activities);

      console.log('✅ Garmin 로그인 성공');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Garmin 로그인에 실패했습니다';
      setError(errorMessage);
      console.error('Garmin login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* 보안 경고 */}
      <div style={{
        padding: '10px',
        background: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '5px',
        marginBottom: '15px',
        fontSize: '0.85em',
        color: '#856404'
      }}>
        <strong>⚠️ 보안 안내:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>로그인 정보는 1시간 동안만 저장됩니다</li>
          <li>만료 후 자동으로 삭제됩니다</li>
          <li>개인 기기에서만 사용하세요</li>
        </ul>
      </div>

      {/* Garmin 계정 정보 입력 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '10px',
        marginBottom: '10px'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', fontWeight: 'bold' }}>
            Garmin 이메일
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleLogin();
              }
            }}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.95em'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', fontWeight: 'bold' }}>
            Garmin 비밀번호
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleLogin();
              }
            }}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.95em'
            }}
          />
        </div>
      </div>

      <button
        onClick={handleLogin}
        disabled={loading || !email || !password}
        className="btn btn-primary"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          position: 'relative',
          opacity: (!email || !password) && !loading ? 0.6 : 1
        }}
      >
        <span style={{ fontSize: '1.2em' }}>⌚</span>
        <span>{loading ? '로그인 중...' : 'Garmin 로그인'}</span>
      </button>

      {error && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          background: '#ffe6e6',
          border: '1px solid #ff4444',
          borderRadius: '5px',
          color: '#cc0000',
          fontSize: '0.9em'
        }}>
          <strong>⚠️ 오류:</strong> {error}
          {error.includes('백엔드 서버') && (
            <div style={{ marginTop: '8px', fontSize: '0.85em', color: '#666' }}>
              <strong>해결 방법:</strong>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                <li>터미널에서 <code>cd server && npm install</code> 실행</li>
                <li><code>npm start</code>로 서버 시작</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 안내 메시지 */}
      <div style={{
        marginTop: '10px',
        padding: '10px',
        background: '#f0f8ff',
        borderRadius: '5px',
        fontSize: '0.85em',
        color: '#555'
      }}>
        <strong>ℹ️ 안내:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>Garmin Connect 계정으로 로그인합니다</li>
          <li>프로필 정보와 최근 활동을 가져옵니다</li>
          <li>백엔드 서버가 실행 중이어야 합니다 (localhost:3001)</li>
        </ul>
      </div>
    </div>
  );
}
