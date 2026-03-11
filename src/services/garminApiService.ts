/**
 * Garmin Connect API Service
 * 백엔드 서버와 통신하여 Garmin 데이터를 가져오는 서비스
 * Adapter Pattern: Garmin API를 애플리케이션에 맞게 변환
 */

// 프로덕션(Vercel)에서는 상대 경로, 개발 환경에서는 localhost 사용
const API_BASE_URL = process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');

export interface GarminProfile {
  age: number;
  weight: number;
  height: number;
  vo2max: number;
  restingHR: number;
  maxHR: number;
  displayName?: string;
  profileImageUrl?: string;
}

export interface GarminActivity {
  activityId: string;
  activityName: string;
  distance: string;
  duration: string;
  averagePace: string;
  elevationGain: number;
  averageHR: number;
  maxHR: number;
  startTimeLocal: string;
  calories: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}

class GarminApiService {
  /**
   * 서버 헬스 체크
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      return data.status === 'ok';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Garmin 로그인 테스트
   */
  async testLogin(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/garmin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data: ApiResponse<any> = await response.json();
      return data.success;
    } catch (error) {
      console.error('Login test failed:', error);
      throw new Error('서버 연결에 실패했습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
    }
  }

  /**
   * 사용자 프로필 가져오기
   */
  async getUserProfile(email: string, password: string): Promise<GarminProfile> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/garmin/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('프로필을 가져오는데 실패했습니다');
      }

      const data: ApiResponse<GarminProfile> = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || '프로필 데이터가 없습니다');
      }

      return data.data;
    } catch (error) {
      console.error('Get profile failed:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('프로필을 가져오는 중 오류가 발생했습니다');
    }
  }

  /**
   * 최근 러닝 활동 가져오기
   */
  async getRecentActivities(email: string, password: string, limit: number = 10): Promise<GarminActivity[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/garmin/activities?limit=${limit}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        }
      );

      if (!response.ok) {
        throw new Error('활동 데이터를 가져오는데 실패했습니다');
      }

      const data: ApiResponse<GarminActivity[]> = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || '활동 데이터가 없습니다');
      }

      return data.data;
    } catch (error) {
      console.error('Get activities failed:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('활동 데이터를 가져오는 중 오류가 발생했습니다');
    }
  }
}

// Singleton 인스턴스 export
export const garminApiService = new GarminApiService();
