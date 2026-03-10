import type { OSRMResponse, RoutePoint, TransportMode } from '../types/route';

/**
 * OSRM API Service
 * Strategy Pattern을 활용한 라우팅 서비스
 * Singleton Pattern 적용
 */
class OSRMService {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://router.project-osrm.org') {
    this.baseUrl = baseUrl;
  }

  /**
   * 두 지점 간의 경로를 계산합니다
   * @param start 출발지 좌표
   * @param end 도착지 좌표
   * @param mode 이동 수단
   * @returns OSRM API 응답
   */
  async getRoute(
    start: RoutePoint,
    end: RoutePoint,
    mode: TransportMode = 'walking'
  ): Promise<OSRMResponse> {
    const coordinates = `${start.lng},${start.lat};${end.lng},${end.lat}`;
    const url = `${this.baseUrl}/route/v1/${mode}/${coordinates}?overview=full&geometries=geojson&steps=true`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OSRM API 오류: ${response.statusText}`);
      }
      const data: OSRMResponse = await response.json();
      return data;
    } catch (error) {
      console.error('경로 계산 실패:', error);
      throw error;
    }
  }

  /**
   * 여러 지점을 경유하는 경로를 계산합니다
   * @param points 경유 지점 배열
   * @param mode 이동 수단
   * @returns OSRM API 응답
   */
  async getRouteWithWaypoints(
    points: RoutePoint[],
    mode: TransportMode = 'walking'
  ): Promise<OSRMResponse> {
    if (points.length < 2) {
      throw new Error('최소 2개 이상의 지점이 필요합니다');
    }

    const coordinates = points
      .map(point => `${point.lng},${point.lat}`)
      .join(';');

    const url = `${this.baseUrl}/route/v1/${mode}/${coordinates}?overview=full&geometries=geojson&steps=true`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OSRM API 오류: ${response.statusText}`);
      }
      const data: OSRMResponse = await response.json();
      return data;
    } catch (error) {
      console.error('경로 계산 실패:', error);
      throw error;
    }
  }

  /**
   * 거리를 포맷팅합니다
   * @param meters 미터 단위 거리
   * @returns 포맷된 거리 문자열
   */
  formatDistance(meters: number): string {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
  }

  /**
   * 시간을 포맷팅합니다
   * @param seconds 초 단위 시간
   * @returns 포맷된 시간 문자열
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    }
    return `${minutes}분`;
  }
}

// Singleton Pattern 적용
export const osrmService = new OSRMService();
