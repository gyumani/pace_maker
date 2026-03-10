export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RoutePoint extends Coordinates {
  name?: string;
  elevation?: number;
}

export interface RouteGeometry {
  coordinates: [number, number][];
  type: string;
}

export interface RouteLeg {
  distance: number;
  duration: number;
  steps: RouteStep[];
}

export interface RouteStep {
  distance: number;
  duration: number;
  geometry: RouteGeometry;
  name: string;
  mode: string;
}

export interface OSRMRoute {
  distance: number;
  duration: number;
  geometry: RouteGeometry;
  legs: RouteLeg[];
}

export interface OSRMResponse {
  code: string;
  routes: OSRMRoute[];
  waypoints: Array<{
    location: [number, number];
    name: string;
  }>;
}

// Strategy Pattern: 이동 수단별 전략
export type TransportMode = 'driving' | 'walking' | 'cycling';

export interface TransportModeConfig {
  name: string;
  icon: string;
  color: string;
}

export interface ElevationPoint {
  latitude: number;
  longitude: number;
  elevation: number;
}

// Pace Strategy 관련 타입
export type PaceStrategy = 'best' | 'average' | 'worst';

export interface RouteSegment {
  km: number;
  elevation: number;
  elevationGain: number;
  elevationLoss: number;
  pace: string; // MM:SS 형식
  paceSeconds: number;
  heartRate: number;
  intensity: string;
  cumulativeDistance: number;
  cumulativeTime: string;
}

export interface RouteCalculationResult {
  strategy: PaceStrategy;
  segments: RouteSegment[];
  totalDistance: number;
  totalTime: string;
  avgPace: string;
  avgHeartRate: number;
  totalElevationGain: number;
  totalElevationLoss: number;
}
