/**
 * 프로필 저장소 서비스
 * Strategy Pattern: 프로필 저장 전략 (쿠키)
 */

import { cookieStorage } from '../utils/cookieStorage';
import type { UserProfile } from '../types/profile';

const PROFILE_COOKIE_NAME = 'user_profile';
const SESSION_DURATION = 60 * 60 * 1000; // 1시간 (밀리초)

class ProfileStorageService {
  /**
   * 프로필을 쿠키에 저장 (1시간 만료)
   */
  saveProfile(profile: UserProfile): void {
    cookieStorage.set(PROFILE_COOKIE_NAME, profile, {
      expires: SESSION_DURATION,
      path: '/',
      sameSite: 'Lax'
    });

    console.log('✅ 프로필이 쿠키에 저장되었습니다 (1시간 유효)');
  }

  /**
   * 쿠키에서 프로필 불러오기
   */
  loadProfile(): UserProfile | null {
    const profile = cookieStorage.get<UserProfile>(PROFILE_COOKIE_NAME);

    if (profile) {
      console.log('✅ 쿠키에서 프로필을 불러왔습니다');
      return profile;
    }

    console.log('ℹ️ 저장된 프로필이 없습니다');
    return null;
  }

  /**
   * 프로필 삭제 (로그아웃)
   */
  clearProfile(): void {
    cookieStorage.remove(PROFILE_COOKIE_NAME);
    console.log('✅ 프로필이 삭제되었습니다');
  }

  /**
   * 저장된 프로필 존재 여부 확인
   */
  hasProfile(): boolean {
    return cookieStorage.has(PROFILE_COOKIE_NAME);
  }

  /**
   * 세션 남은 시간 확인 (밀리초)
   * 쿠키는 만료 시간을 직접 조회할 수 없으므로 대략적인 추정
   */
  getSessionInfo(): { hasSession: boolean; message: string } {
    const hasSession = this.hasProfile();

    if (!hasSession) {
      return {
        hasSession: false,
        message: '저장된 세션이 없습니다'
      };
    }

    return {
      hasSession: true,
      message: '프로필 세션이 활성화되어 있습니다 (최대 1시간 유효)'
    };
  }
}

// Singleton 인스턴스 export
export const profileStorageService = new ProfileStorageService();
