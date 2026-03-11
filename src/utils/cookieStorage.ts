/**
 * 쿠키 스토리지 유틸리티
 * Repository Pattern: 데이터 저장소 추상화
 */

interface CookieOptions {
  expires?: Date | number; // Date 객체 또는 만료까지 시간(밀리초)
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

class CookieStorage {
  /**
   * 쿠키 설정
   * @param name 쿠키 이름
   * @param value 쿠키 값 (객체는 JSON으로 변환됨)
   * @param options 쿠키 옵션
   */
  set(name: string, value: any, options: CookieOptions = {}): void {
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(
      typeof value === 'object' ? JSON.stringify(value) : value
    )}`;

    // 만료 시간 설정
    if (options.expires) {
      const expiresDate = options.expires instanceof Date
        ? options.expires
        : new Date(Date.now() + options.expires);
      cookieString += `; expires=${expiresDate.toUTCString()}`;
    }

    // Path 설정 (기본값: /)
    cookieString += `; path=${options.path || '/'}`;

    // Domain 설정
    if (options.domain) {
      cookieString += `; domain=${options.domain}`;
    }

    // Secure 설정
    if (options.secure) {
      cookieString += '; secure';
    }

    // SameSite 설정
    if (options.sameSite) {
      cookieString += `; samesite=${options.sameSite}`;
    }

    document.cookie = cookieString;
  }

  /**
   * 쿠키 가져오기
   * @param name 쿠키 이름
   * @returns 쿠키 값 (JSON은 자동 파싱)
   */
  get<T = string>(name: string): T | null {
    const nameEQ = encodeURIComponent(name) + '=';
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        const value = decodeURIComponent(cookie.substring(nameEQ.length));

        // JSON 파싱 시도
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as unknown as T;
        }
      }
    }

    return null;
  }

  /**
   * 쿠키 삭제
   * @param name 쿠키 이름
   * @param options 쿠키 옵션 (path, domain)
   */
  remove(name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
    this.set(name, '', {
      ...options,
      expires: new Date(0) // 과거 날짜로 설정하여 즉시 삭제
    });
  }

  /**
   * 쿠키 존재 여부 확인
   * @param name 쿠키 이름
   */
  has(name: string): boolean {
    return this.get(name) !== null;
  }

  /**
   * 모든 쿠키 삭제
   */
  clear(): void {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const name = cookie.split('=')[0].trim();
      this.remove(name);
    }
  }
}

// Singleton 인스턴스 export
export const cookieStorage = new CookieStorage();

// 타입 export
export type { CookieOptions };
