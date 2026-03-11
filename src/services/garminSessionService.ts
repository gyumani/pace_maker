/**
 * Garmin 세션 관리 서비스
 * Repository Pattern: Garmin 인증 정보 저장소
 */

import { cookieStorage } from '../utils/cookieStorage';
import type { GarminProfile, GarminActivity } from './garminApiService';

const GARMIN_SESSION_COOKIE = 'garmin_session';
const SESSION_DURATION = 60 * 60 * 1000; // 1시간

interface GarminSession {
  email: string;
  password: string; // ⚠️ 보안상 위험하지만 UX를 위해 저장 (1시간 만료)
  profile: GarminProfile;
  activities?: GarminActivity[];
  loginTime: number;
}

class GarminSessionService {
  /**
   * Garmin 세션 저장
   */
  saveSession(email: string, password: string, profile: GarminProfile, activities?: GarminActivity[]): void {
    const session: GarminSession = {
      email,
      password,
      profile,
      activities,
      loginTime: Date.now()
    };

    cookieStorage.set(GARMIN_SESSION_COOKIE, session, {
      expires: SESSION_DURATION,
      path: '/',
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production' // HTTPS에서만 전송
    });

    console.log('✅ Garmin 세션이 저장되었습니다 (1시간 유효)');
  }

  /**
   * Garmin 세션 로드
   */
  loadSession(): GarminSession | null {
    const session = cookieStorage.get<GarminSession>(GARMIN_SESSION_COOKIE);

    if (session) {
      // 세션 만료 확인 (1시간)
      const elapsed = Date.now() - session.loginTime;
      if (elapsed > SESSION_DURATION) {
        console.log('⚠️  Garmin 세션이 만료되었습니다');
        this.clearSession();
        return null;
      }

      console.log('✅ Garmin 세션을 불러왔습니다');
      return session;
    }

    console.log('ℹ️ 저장된 Garmin 세션이 없습니다');
    return null;
  }

  /**
   * Garmin 세션 삭제 (로그아웃)
   */
  clearSession(): void {
    cookieStorage.remove(GARMIN_SESSION_COOKIE);
    console.log('✅ Garmin 세션이 삭제되었습니다');
  }

  /**
   * 세션 존재 여부 확인
   */
  hasSession(): boolean {
    return cookieStorage.has(GARMIN_SESSION_COOKIE);
  }

  /**
   * 세션 정보 업데이트 (활동 내역 추가 등)
   */
  updateSession(updates: Partial<Omit<GarminSession, 'loginTime'>>): void {
    const session = this.loadSession();
    if (!session) {
      console.warn('⚠️  업데이트할 세션이 없습니다');
      return;
    }

    const updatedSession: GarminSession = {
      ...session,
      ...updates,
      loginTime: session.loginTime // 로그인 시간 유지
    };

    cookieStorage.set(GARMIN_SESSION_COOKIE, updatedSession, {
      expires: SESSION_DURATION - (Date.now() - session.loginTime), // 남은 시간만큼 설정
      path: '/',
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production'
    });

    console.log('✅ Garmin 세션이 업데이트되었습니다');
  }

  /**
   * 세션 남은 시간 (밀리초)
   */
  getRemainingTime(): number {
    const session = this.loadSession();
    if (!session) return 0;

    const elapsed = Date.now() - session.loginTime;
    const remaining = SESSION_DURATION - elapsed;

    return Math.max(0, remaining);
  }

  /**
   * 세션 남은 시간 (문자열)
   */
  getRemainingTimeString(): string {
    const remaining = this.getRemainingTime();
    if (remaining === 0) return '만료됨';

    const minutes = Math.floor(remaining / 60000);
    if (minutes < 1) return '1분 미만';
    if (minutes === 1) return '1분';
    return `${minutes}분`;
  }
}

// Singleton 인스턴스 export
export const garminSessionService = new GarminSessionService();

// 타입 export
export type { GarminSession };
