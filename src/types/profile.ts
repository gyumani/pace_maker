/**
 * 사용자 프로필 타입 정의
 */

export interface UserProfile {
  height: number;
  weight: number;
  age: number;
  vo2max: number;
  bmi?: number;
  maxHeartRate?: number;
  restingHR?: number;
}
