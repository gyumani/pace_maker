import { useState } from 'react';
import { garminApiService, type GarminProfile } from '../services/garminApiService';

interface GarminConnectProps {
  onProfileFetched: (profile: GarminProfile) => void;
}

/**
 * Garmin Connect 연동 컴포넌트
 * Observer Pattern: 프로필 데이터를 가져온 후 부모 컴포넌트에 알림
 */
export default function GarminConnect({ onProfileFetched }: GarminConnectProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleFetchProfile = async () => {
    // 유효성 검사
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 서버 연결 확인
      const isHealthy = await garminApiService.checkHealth();
      if (!isHealthy) {
        throw new Error('백엔드 서버가 실행 중이 아닙니다. 서버를 먼저 시작해주세요.');
      }

      // 프로필 가져오기 (계정 정보 전달)
      const profile = await garminApiService.getUserProfile(email, password);

      // 부모 컴포넌트에 전달
      onProfileFetched(profile);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Garmin 데이터를 가져오는데 실패했습니다';
      setError(errorMessage);
      console.error('Garmin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '15px' }}>
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
        onClick={handleFetchProfile}
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
        <span>{loading ? '가져오는 중...' : 'Garmin에서 프로필 가져오기'}</span>
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

      {success && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          background: '#e6ffe6',
          border: '1px solid #44ff44',
          borderRadius: '5px',
          color: '#006600',
          fontSize: '0.9em'
        }}>
          ✅ Garmin 프로필을 성공적으로 가져왔습니다!
        </div>
      )}

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
          <li>Garmin Connect 계정 정보를 입력하면 프로필을 자동으로 가져옵니다</li>
          <li>VO2max, 심박수, 키, 체중, 나이가 자동으로 입력됩니다</li>
          <li>계정 정보는 서버에 저장되지 않으며, 요청 시에만 사용됩니다</li>
          <li>백엔드 서버가 실행 중이어야 사용 가능합니다 (localhost:3001)</li>
        </ul>
      </div>
    </div>
  );
}
