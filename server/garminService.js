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
 * @param {string} email - Garmin 이메일
 * @param {string} password - Garmin 비밀번호
 * @returns {Promise<Object>} 프로필 정보 (age, weight, height, vo2max, restingHR, maxHR)
 */
async function getUserProfile(email, password) {
  const client = await createGarminClient(email, password);

  try {
    // 기본 프로필 정보
    const userSettings = await client.getUserSettings();
    const userProfile = await client.getUserProfile();

    console.log('=== Garmin 프로필 데이터 수집 시작 ===');

    // VO2Max (userSettings.userData.vo2MaxRunning)
    let vo2max = 0;
    if (userSettings && userSettings.userData && userSettings.userData.vo2MaxRunning) {
      vo2max = userSettings.userData.vo2MaxRunning;
      console.log(`✅ VO2Max: ${vo2max}`);
    } else {
      console.warn('⚠️  VO2Max 데이터를 찾을 수 없습니다');
    }

    // 체중 (그램을 kg로 변환)
    let weight = 0;
    if (userSettings && userSettings.userData && userSettings.userData.weight) {
      weight = Math.round(userSettings.userData.weight / 1000 * 10) / 10; // 그램 → kg, 소수점 1자리
      console.log(`✅ 체중: ${weight}kg`);
    } else {
      console.warn('⚠️  체중 데이터를 찾을 수 없습니다');
    }

    // 키 (cm)
    let height = 0;
    if (userSettings && userSettings.userData && userSettings.userData.height) {
      height = userSettings.userData.height;
      console.log(`✅ 키: ${height}cm`);
    } else {
      console.warn('⚠️  키 데이터를 찾을 수 없습니다');
    }

    // 안정시 심박수
    let restingHR = 60; // 기본값
    try {
      const heartRateData = await client.getHeartRate(new Date());
      if (heartRateData && heartRateData.restingHeartRate) {
        restingHR = heartRateData.restingHeartRate;
        console.log(`✅ 안정시 심박수: ${restingHR}bpm`);
      } else {
        console.warn(`⚠️  안정시 심박수를 찾을 수 없습니다 (기본값: ${restingHR}bpm 사용)`);
      }
    } catch (e) {
      console.warn(`⚠️  안정시 심박수 가져오기 실패: ${e.message} (기본값: ${restingHR}bpm 사용)`);
    }

    // 나이 계산 (userSettings.userData.birthDate)
    let age = 0;
    if (userSettings && userSettings.userData && userSettings.userData.birthDate) {
      const birthDate = new Date(userSettings.userData.birthDate);
      age = new Date().getFullYear() - birthDate.getFullYear();
      console.log(`✅ 나이: ${age}세`);
    } else if (userProfile && userProfile.birthDate) {
      const birthDate = new Date(userProfile.birthDate);
      age = new Date().getFullYear() - birthDate.getFullYear();
      console.log(`✅ 나이: ${age}세 (userProfile에서 추출)`);
    } else {
      console.warn('⚠️  생년월일 데이터를 찾을 수 없습니다');
    }

    // 최대 심박수 (220 - 나이)
    const maxHR = age > 0 ? 220 - age : 0;
    if (maxHR > 0) {
      console.log(`✅ 최대 심박수: ${maxHR}bpm`);
    }

    const profileData = {
      age,
      weight,
      height,
      vo2max,
      restingHR,
      maxHR,
      displayName: userProfile.fullName || userProfile.displayName || '',
      profileImageUrl: userProfile.profileImageUrlLarge || ''
    };

    console.log('=== 최종 프로필 데이터 ===');
    console.log(JSON.stringify(profileData, null, 2));
    console.log('============================');

    return profileData;
  } catch (error) {
    console.error('❌ 프로필 가져오기 실패:', error.message);
    throw new Error(`프로필 가져오기 실패: ${error.message}`);
  }
}

/**
 * 최근 활동 가져오기
 * @param {string} email - Garmin 이메일
 * @param {string} password - Garmin 비밀번호
 * @param {number} limit - 가져올 활동 개수
 * @returns {Promise<Array>} 활동 목록
 */
async function getRecentActivities(email, password, limit = 10) {
  const client = await createGarminClient(email, password);

  try {
    const activities = await client.getActivities(0, limit);

    // 러닝 활동만 필터링하고 필요한 정보만 추출
    return activities
      .filter(activity => activity.activityType && activity.activityType.typeKey === 'running')
      .map(activity => ({
        activityId: activity.activityId,
        activityName: activity.activityName,
        distance: activity.distance ? (activity.distance / 1000).toFixed(2) : 0, // km
        duration: activity.duration ? formatDuration(activity.duration) : '0:00',
        averagePace: activity.averageSpeed ? calculatePace(activity.averageSpeed) : '0:00',
        elevationGain: activity.elevationGain || 0,
        averageHR: activity.averageHR || 0,
        maxHR: activity.maxHR || 0,
        startTimeLocal: activity.startTimeLocal,
        calories: activity.calories || 0
      }));
  } catch (error) {
    console.error('❌ 활동 가져오기 실패:', error.message);
    throw new Error(`활동 가져오기 실패: ${error.message}`);
  }
}

/**
 * 초를 MM:SS 형식으로 변환
 */
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
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

module.exports = {
  getUserProfile,
  getRecentActivities
};
