/**
 * Vercel Serverless Function: Garmin Profile
 * POST /api/garmin/profile
 */
const { getUserProfile } = require('../_lib/garmin');

module.exports = async (req, res) => {
  const startTime = Date.now();

  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    console.warn('⚠️ [Profile API] Method not allowed:', req.method);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    console.log('📍 [Profile API] 요청 시작:', {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    });

    const { email, password } = req.body;

    if (!email || !password) {
      console.warn('⚠️ [Profile API] 인증 정보 누락');
      return res.status(400).json({
        success: false,
        error: '이메일과 비밀번호를 입력해주세요'
      });
    }

    console.log('🔄 [Profile API] Garmin 로그인 시도:', email);
    const profile = await getUserProfile(email, password);

    const duration = Date.now() - startTime;
    console.log('✅ [Profile API] 성공:', {
      email,
      duration: `${duration}ms`,
      profileData: {
        age: profile.age,
        vo2max: profile.vo2max,
        weight: profile.weight
      }
    });

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ [Profile API] 실패:', {
      error: error.message,
      duration: `${duration}ms`,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
