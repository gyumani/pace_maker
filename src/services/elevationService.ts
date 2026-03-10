import type { ElevationPoint, RoutePoint } from '../types/route';

/**
 * Elevation API Service
 * Open-Elevation API를 사용하여 고도 정보를 가져옵니다
 * Adapter Pattern: 외부 API를 내부 인터페이스에 맞게 변환
 * Singleton Pattern 적용
 */
class ElevationService {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://api.open-elevation.com/api/v1') {
    this.baseUrl = baseUrl;
  }

  /**
   * 단일 지점의 고도를 가져옵니다
   * @param point 좌표
   * @returns 고도 정보
   */
  async getElevation(point: RoutePoint): Promise<number> {
    const url = `${this.baseUrl}/lookup?locations=${point.lat},${point.lng}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Elevation API 오류: ${response.statusText}`);
      }
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        return data.results[0].elevation;
      }
      throw new Error('고도 정보를 가져올 수 없습니다');
    } catch (error) {
      console.error('고도 정보 조회 실패:', error);
      return 0; // 실패 시 0 반환
    }
  }

  /**
   * 여러 지점의 고도를 가져옵니다
   * @param points 좌표 배열
   * @returns 고도 정보 배열
   */
  async getElevations(points: RoutePoint[]): Promise<ElevationPoint[]> {
    if (points.length === 0) {
      return [];
    }

    // API 제한으로 인해 한 번에 최대 100개만 요청
    const chunkedPoints = this.chunkArray(points, 100);
    const results: ElevationPoint[] = [];

    for (const chunk of chunkedPoints) {
      const locations = chunk
        .map(point => `${point.lat},${point.lng}`)
        .join('|');

      const url = `${this.baseUrl}/lookup?locations=${locations}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.warn('고도 정보 조회 실패 (일부 구간)');
          continue;
        }
        const data = await response.json();

        if (data.results) {
          results.push(...data.results);
        }
      } catch (error) {
        console.error('고도 정보 조회 실패:', error);
      }
    }

    return results;
  }

  /**
   * 경로의 고도 프로필을 생성합니다
   * @param coordinates 경로 좌표 배열 [lng, lat]
   * @returns 고도 정보 배열
   */
  async getRouteElevationProfile(
    coordinates: [number, number][]
  ): Promise<ElevationPoint[]> {
    // 샘플링: 너무 많은 포인트가 있으면 간격을 두고 샘플링
    const maxPoints = 100;
    const sampledCoordinates = this.sampleCoordinates(coordinates, maxPoints);

    const points: RoutePoint[] = sampledCoordinates.map(coord => ({
      lat: coord[1],
      lng: coord[0]
    }));

    return this.getElevations(points);
  }

  /**
   * 배열을 청크로 나눕니다
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 좌표를 샘플링합니다
   */
  private sampleCoordinates(
    coordinates: [number, number][],
    maxPoints: number
  ): [number, number][] {
    if (coordinates.length <= maxPoints) {
      return coordinates;
    }

    const step = Math.floor(coordinates.length / maxPoints);
    const sampled: [number, number][] = [];

    for (let i = 0; i < coordinates.length; i += step) {
      sampled.push(coordinates[i]);
    }

    // 마지막 포인트는 항상 포함
    if (sampled[sampled.length - 1] !== coordinates[coordinates.length - 1]) {
      sampled.push(coordinates[coordinates.length - 1]);
    }

    return sampled;
  }

  /**
   * 고도를 포맷팅합니다
   * @param elevation 미터 단위 고도
   * @returns 포맷된 고도 문자열
   */
  formatElevation(elevation: number): string {
    return `${Math.round(elevation)} m`;
  }
}

// Singleton Pattern 적용
export const elevationService = new ElevationService();
