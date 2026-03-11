const { GarminConnect } = require('garmin-connect');

/**
 * Garmin Connect 클라이언트 생성 및 로그인
 * Factory Pattern 적용
 */
async function createGarminClient(email, password) {
  try {
    const client = new GarminConnect({
      username: email,
      password: password
    });

    await client.login();
    console.log('✅ Garmin Connect 로그인 성공:', email);
    return client;
  } catch (error) {
    console.error('❌ Garmin Connect 로그인 실패:', error.message);
    throw new Error(`Garmin 로그인 실패: ${error.message}`);
  }
}

/**
 * 사용자 프로필 정보 가져오기
 */
async function getUserProfile(email, password) {
  const client = await createGarminClient(email, password);

  try {
    // 사용자 프로필 정보
    const userProfile = await client.getUserProfile();

    // 사용자 설정 정보 (VO2Max, 체중, 키 등)
    const userSettings = await client.getUserSettings();

    // VO2Max 추출
    let vo2max = 0;
    if (userSettings?.userData?.vo2MaxRunning) {
      vo2max = userSettings.userData.vo2MaxRunning;
    }

    // 체중 추출 (그램 → kg 변환)
    let weight = 0;
    if (userSettings?.userData?.weight) {
      weight = Math.round(userSettings.userData.weight / 1000 * 10) / 10;
    }

    // 키 추출 (cm)
    let height = userSettings?.userData?.height || 0;

    // 심박수 데이터
    const heartRateData = await client.getHeartRate(new Date());
    let restingHR = heartRateData?.restingHeartRate || 60;

    // 나이 계산
    const birthDate = new Date(userSettings.userData.birthDate);
    const age = new Date().getFullYear() - birthDate.getFullYear();

    // 최대 심박수 계산 (220 - 나이)
    const maxHR = 220 - age;

    return {
      age,
      weight,
      height,
      vo2max,
      restingHR,
      maxHR,
      displayName: userProfile.fullName || userProfile.displayName || 'Garmin User',
      profileImageUrl: userProfile.profileImageUrlLarge || userProfile.profileImageUrlMedium
    };
  } catch (error) {
    console.error('프로필 정보 가져오기 실패:', error);
    throw new Error(`프로필 정보를 가져올 수 없습니다: ${error.message}`);
  }
}

/**
 * 시간을 분:초 형식으로 변환
 */
function formatTime(seconds) {
  if (!seconds || seconds === 0) return '0:00';

  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 속도(m/s)를 페이스(분:초/km)로 변환
 */
function calculatePace(speedMps) {
  if (!speedMps || speedMps === 0) return '0:00';

  const paceSecondsPerKm = 1000 / speedMps;
  const minutes = Math.floor(paceSecondsPerKm / 60);
  const seconds = Math.floor(paceSecondsPerKm % 60);

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * 최근 러닝 활동 가져오기
 */
async function getRecentActivities(email, password, limit = 10) {
  const client = await createGarminClient(email, password);

  try {
    // 최근 활동 가져오기 (러닝만 필터링)
    const activities = await client.getActivities(0, limit);

    const runningActivities = activities
      .filter(activity =>
        activity.activityType?.typeKey === 'running' ||
        activity.activityType?.typeId === 1
      )
      .slice(0, limit)
      .map(activity => ({
        activityId: activity.activityId.toString(),
        activityName: activity.activityName || '러닝',
        distance: (activity.distance / 1000).toFixed(2), // 미터 → km
        duration: formatTime(activity.duration),
        averagePace: calculatePace(activity.averageSpeed),
        elevationGain: Math.round(activity.elevationGain || 0),
        averageHR: Math.round(activity.averageHR || 0),
        maxHR: Math.round(activity.maxHR || 0),
        startTimeLocal: activity.startTimeLocal,
        calories: Math.round(activity.calories || 0)
      }));

    return runningActivities;
  } catch (error) {
    console.error('활동 데이터 가져오기 실패:', error);
    throw new Error(`활동 데이터를 가져올 수 없습니다: ${error.message}`);
  }
}

module.exports = {
  getUserProfile,
  getRecentActivities
};
