import type {
  RouteCalculationResult,
  RouteSegment,
  PaceStrategy,
  ElevationPoint
} from '../types/route';

export interface UserProfile {
  age: number;
  weight: number;
  height: number;
  restingHR: number;
  maxHR: number;
  vo2max: number;
}

/**
 * Pace Strategy Service
 * Strategy Pattern을 활용한 페이스 전략 계산 서비스
 *
 * 고도에 따른 페이스 조정:
 * - 평지: 기본 페이스
 * - 오르막: 페이스 감소 (더 느리게)
 * - 내리막: 페이스 증가 (더 빠르게)
 */
class PaceStrategyService {
  /**
   * 경로 기반 페이스 전략을 계산합니다
   * @param distanceMeters 총 거리 (미터)
   * @param elevationProfile 고도 프로필
   * @param userProfile 사용자 프로필
   * @param strategy 전략 타입 (best/average/worst)
   * @returns 계산된 경로 전략
   */
  calculateRouteStrategy(
    distanceMeters: number,
    elevationProfile: ElevationPoint[],
    userProfile: UserProfile,
    strategy: PaceStrategy
  ): RouteCalculationResult {
    const totalKm = Math.ceil(distanceMeters / 1000);
    const segments: RouteSegment[] = [];

    // 기본 페이스 설정 (전략별)
    const basePaceSeconds = this.getBasePace(userProfile, strategy);

    // km당 구간 생성
    for (let km = 1; km <= totalKm; km++) {
      const segmentElevationData = this.getSegmentElevation(
        km,
        totalKm,
        distanceMeters,
        elevationProfile
      );

      // 고도 변화에 따른 페이스 조정
      const adjustedPaceSeconds = this.adjustPaceForElevation(
        basePaceSeconds,
        segmentElevationData.elevationGain,
        segmentElevationData.elevationLoss,
        strategy
      );

      // 심박수 계산
      const heartRate = this.calculateHeartRate(
        userProfile,
        adjustedPaceSeconds,
        segmentElevationData.elevationGain
      );

      const intensity = this.getIntensityZone(heartRate, userProfile.maxHR);

      // 누적 시간 계산
      const cumulativeSeconds = segments.reduce((acc, seg) => acc + seg.paceSeconds, 0) + adjustedPaceSeconds;

      segments.push({
        km,
        elevation: segmentElevationData.elevation,
        elevationGain: segmentElevationData.elevationGain,
        elevationLoss: segmentElevationData.elevationLoss,
        pace: this.formatPace(adjustedPaceSeconds),
        paceSeconds: adjustedPaceSeconds,
        heartRate: Math.round(heartRate),
        intensity,
        cumulativeDistance: km,
        cumulativeTime: this.formatTime(cumulativeSeconds)
      });
    }

    // 전체 통계 계산
    const totalSeconds = segments.reduce((acc, seg) => acc + seg.paceSeconds, 0);
    const avgHeartRate = segments.reduce((acc, seg) => acc + seg.heartRate, 0) / segments.length;
    const totalElevationGain = segments.reduce((acc, seg) => acc + seg.elevationGain, 0);
    const totalElevationLoss = segments.reduce((acc, seg) => acc + seg.elevationLoss, 0);

    return {
      strategy,
      segments,
      totalDistance: distanceMeters / 1000,
      totalTime: this.formatTime(totalSeconds),
      avgPace: this.formatPace(totalSeconds / totalKm),
      avgHeartRate: Math.round(avgHeartRate),
      totalElevationGain,
      totalElevationLoss
    };
  }

  /**
   * 전략별 기본 페이스를 가져옵니다
   */
  private getBasePace(userProfile: UserProfile, strategy: PaceStrategy): number {
    // VO2Max 기반 기본 페이스 계산
    const { vo2max } = userProfile;

    // VO2Max에서 페이스 추정 (대략적인 공식)
    // VO2Max 50 = 약 5:00/km
    // VO2Max 60 = 약 4:10/km
    const basePaceMinutes = 10 - (vo2max / 10);
    const basePaceSeconds = basePaceMinutes * 60;

    // 전략별 조정
    switch (strategy) {
      case 'best':
        return basePaceSeconds; // 기본 페이스 (최적의 페이스)
      case 'average':
        return basePaceSeconds * 1.10; // 10% 느리게 (여유있는 페이스)
      case 'worst':
        return basePaceSeconds * 1.25; // 25% 느리게 (안전하고 편안한 페이스)
      default:
        return basePaceSeconds;
    }
  }

  /**
   * 구간의 고도 정보를 가져옵니다
   */
  private getSegmentElevation(
    currentKm: number,
    totalKm: number,
    totalMeters: number,
    elevationProfile: ElevationPoint[]
  ): {
    elevation: number;
    elevationGain: number;
    elevationLoss: number;
  } {
    if (elevationProfile.length === 0) {
      return { elevation: 0, elevationGain: 0, elevationLoss: 0 };
    }

    // 구간의 시작/끝 인덱스 계산
    const startRatio = (currentKm - 1) / totalKm;
    const endRatio = Math.min(currentKm / totalKm, 1);

    const startIdx = Math.floor(startRatio * elevationProfile.length);
    const endIdx = Math.min(
      Math.floor(endRatio * elevationProfile.length),
      elevationProfile.length - 1
    );

    // 구간 내 고도 데이터
    const segmentElevations = elevationProfile.slice(startIdx, endIdx + 1);

    if (segmentElevations.length === 0) {
      return { elevation: 0, elevationGain: 0, elevationLoss: 0 };
    }

    // 평균 고도
    const avgElevation = segmentElevations.reduce((acc, point) => acc + point.elevation, 0) / segmentElevations.length;

    // 고도 gain/loss 계산
    let elevationGain = 0;
    let elevationLoss = 0;

    for (let i = 1; i < segmentElevations.length; i++) {
      const diff = segmentElevations[i].elevation - segmentElevations[i - 1].elevation;
      if (diff > 0) {
        elevationGain += diff;
      } else {
        elevationLoss += Math.abs(diff);
      }
    }

    return {
      elevation: Math.round(avgElevation),
      elevationGain: Math.round(elevationGain),
      elevationLoss: Math.round(elevationLoss)
    };
  }

  /**
   * 고도 변화에 따라 페이스를 조정합니다
   */
  private adjustPaceForElevation(
    basePaceSeconds: number,
    elevationGain: number,
    elevationLoss: number,
    strategy: PaceStrategy
  ): number {
    // 고도 gain/loss에 따른 페이스 조정 계수
    // 오르막 10m = 약 3-5초 추가
    // 내리막 10m = 약 1-2초 감소

    let adjustmentFactor = 1.0;

    // 전략별 조정 강도
    const strategyMultiplier = strategy === 'best' ? 1.0 : strategy === 'worst' ? 1.3 : 1.1;

    // 오르막 영향 (더 느리게)
    if (elevationGain > 0) {
      const gainAdjustment = (elevationGain / 10) * 4 * strategyMultiplier; // 10m당 4초
      adjustmentFactor += gainAdjustment / basePaceSeconds;
    }

    // 내리막 영향 (더 빠르게)
    if (elevationLoss > 0) {
      const lossAdjustment = (elevationLoss / 10) * 1.5 * strategyMultiplier; // 10m당 1.5초
      adjustmentFactor -= lossAdjustment / basePaceSeconds;
    }

    // 최소/최대 제한
    adjustmentFactor = Math.max(0.7, Math.min(1.5, adjustmentFactor));

    return basePaceSeconds * adjustmentFactor;
  }

  /**
   * 심박수를 계산합니다
   */
  private calculateHeartRate(
    userProfile: UserProfile,
    paceSeconds: number,
    elevationGain: number
  ): number {
    const { maxHR, restingHR } = userProfile;

    // Karvonen 공식 기반
    const hrReserve = maxHR - restingHR;

    // 페이스에 따른 강도 계산 (대략적)
    // 빠른 페이스 (4:00/km) = 85% intensity
    // 느린 페이스 (6:00/km) = 65% intensity
    const paceMinutes = paceSeconds / 60;
    let intensity = 1.0 - ((paceMinutes - 4.0) / 10); // 4분 기준으로 정규화
    intensity = Math.max(0.5, Math.min(0.95, intensity)); // 50-95% 범위

    // 고도 gain에 따른 추가 강도 (오르막은 심박수 증가)
    const elevationIntensityBoost = Math.min(elevationGain / 50, 0.1); // 최대 10% 증가
    intensity = Math.min(0.95, intensity + elevationIntensityBoost);

    // Karvonen 공식 적용
    const targetHR = restingHR + (hrReserve * intensity);

    return targetHR;
  }

  /**
   * 강도 구역을 계산합니다
   */
  private getIntensityZone(heartRate: number, maxHR: number): string {
    const percentage = (heartRate / maxHR) * 100;

    if (percentage < 60) return 'Zone 1 (회복)';
    if (percentage < 70) return 'Zone 2 (유산소)';
    if (percentage < 80) return 'Zone 3 (템포)';
    if (percentage < 90) return 'Zone 4 (역치)';
    return 'Zone 5 (최대)';
  }

  /**
   * 페이스를 MM:SS 형식으로 포맷팅합니다
   */
  private formatPace(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * 시간을 HH:MM:SS 또는 MM:SS 형식으로 포맷팅합니다
   */
  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

// Singleton Pattern 적용
export const paceStrategyService = new PaceStrategyService();
